// Edge function: fetches branch-relevant news + common AI news from publisher RSS/Atom feeds.
// Uses direct publisher URLs (no Google News redirects).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
  category: "branch" | "ai";
  imageUrl?: string;
};

// Each branch maps to a list of publisher RSS/Atom feeds with DIRECT article URLs.
const BRANCH_FEEDS: Record<string, string[]> = {
  CSE: [
    "https://hnrss.org/frontpage",
    "https://techcrunch.com/feed/",
  ],
  IT: [
    "https://hnrss.org/frontpage",
    "https://techcrunch.com/feed/",
  ],
  ECE: [
    "https://spectrum.ieee.org/feeds/feed.rss",
    "https://www.allaboutcircuits.com/rss/news/",
  ],
  ME: [
    "https://www.engineering.com/rss.xml",
    "https://spectrum.ieee.org/feeds/topic/robotics.rss",
  ],
  EE: [
    "https://spectrum.ieee.org/feeds/feed.rss",
    "https://www.allaboutcircuits.com/rss/news/",
  ],
  CE: [
    "https://www.constructiondive.com/feeds/news/",
    "https://www.engineering.com/rss.xml",
  ],
  Other: [
    "https://spectrum.ieee.org/feeds/feed.rss",
    "https://techcrunch.com/feed/",
  ],
};

// Always-on AI feeds for everyone.
const AI_FEEDS: string[] = [
  "https://venturebeat.com/category/ai/feed/",
  "https://hnrss.org/newest?q=AI",
];

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  if (!m) return "";
  return m[1].replace(/<!\[CDATA\[(.*?)\]\]>/s, "$1");
}

function hostnameOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

// Extract a direct link from either RSS <item> or Atom <entry>.
function extractLink(block: string): string {
  // RSS 2.0: <link>https://...</link>
  const rss = block.match(/<link>([\s\S]*?)<\/link>/i);
  if (rss && rss[1].trim() && !rss[1].includes("<")) return stripHtml(rss[1]);
  // Atom: <link href="https://..." .../>
  const atom = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return atom[1];
  return "";
}

async function fetchFeed(feedUrl: string, category: Article["category"]): Promise<Article[]> {
  try {
    const res = await fetch(feedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CampusConnectBot/1.0)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
    });
    if (!res.ok) {
      console.warn(`[branch-news] feed ${feedUrl} returned ${res.status}`);
      return [];
    }
    const xml = await res.text();
    // Support both RSS <item> and Atom <entry>
    const blocks =
      xml.match(/<item[\s\S]*?<\/item>/g) ??
      xml.match(/<entry[\s\S]*?<\/entry>/g) ??
      [];
    const host = hostnameOf(feedUrl);
    return blocks.slice(0, 10).map((block, i) => {
      const title = stripHtml(pick(block, "title"));
      const link = extractLink(block);
      const pubDate =
        stripHtml(pick(block, "pubDate")) ||
        stripHtml(pick(block, "published")) ||
        stripHtml(pick(block, "updated"));
      const description =
        stripHtml(pick(block, "description")) ||
        stripHtml(pick(block, "summary")) ||
        stripHtml(pick(block, "content"));
      let publishedAt = new Date().toISOString();
      if (pubDate) {
        const d = new Date(pubDate);
        if (!isNaN(d.getTime())) publishedAt = d.toISOString();
      }
      return {
        id: `${category}-${host}-${i}-${link.slice(-24)}`,
        title,
        url: link,
        source: hostnameOf(link) || host,
        publishedAt,
        snippet: description.slice(0, 240),
        category,
      } as Article;
    }).filter((a) => a.title && a.url && a.url.startsWith("http"));
  } catch (e) {
    console.error(`[branch-news] fetch failed for ${feedUrl}:`, e);
    return [];
  }
}

async function fetchFeeds(feeds: string[], category: Article["category"]): Promise<Article[]> {
  const results = await Promise.all(feeds.map((f) => fetchFeed(f, category)));
  const merged = results.flat();
  // Sort newest first.
  merged.sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt));
  // Dedupe by URL.
  const seen = new Set<string>();
  return merged.filter((a) => {
    if (seen.has(a.url)) return false;
    seen.add(a.url);
    return true;
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { branch } = await req.json().catch(() => ({ branch: "Other" }));
    const key = (branch && BRANCH_FEEDS[branch]) ? branch : "Other";

    const [branchArticles, aiArticles] = await Promise.all([
      fetchFeeds(BRANCH_FEEDS[key], "branch"),
      fetchFeeds(AI_FEEDS, "ai"),
    ]);

    return new Response(
      JSON.stringify({
        branch: key,
        branchArticles: branchArticles.slice(0, 15),
        aiArticles: aiArticles.slice(0, 8),
        fetchedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[branch-news] error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
