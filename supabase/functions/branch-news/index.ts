// Edge function: fetches branch-relevant news + common AI news from Google News RSS.
// No external API key required.

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

const BRANCH_QUERIES: Record<string, string> = {
  CSE: "software engineering OR computer science hiring OR placements India",
  IT: "information technology OR software developer hiring India",
  ECE: "electronics communication engineering hiring India",
  ME: "mechanical engineering hiring OR placements India",
  EE: "electrical engineering hiring OR placements India",
  CE: "civil engineering construction hiring India",
  Other: "engineering students placements India",
};

const AI_QUERY = "artificial intelligence";

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

async function fetchRss(query: string, category: Article["category"]): Promise<Article[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 CampusConnect/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
    return items.slice(0, 20).map((item, i) => {
      const title = stripHtml(pick(item, "title"));
      const link = stripHtml(pick(item, "link"));
      const pubDate = stripHtml(pick(item, "pubDate"));
      const description = stripHtml(pick(item, "description"));
      const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
      const source = sourceMatch ? stripHtml(sourceMatch[1]) : "Google News";
      return {
        id: `${category}-${i}-${link.slice(-32)}`,
        title,
        url: link,
        source,
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        snippet: description.slice(0, 240),
        category,
      } as Article;
    });
  } catch (e) {
    console.error("[branch-news] RSS fetch failed:", e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { branch } = await req.json().catch(() => ({ branch: "Other" }));
    const key = (branch && BRANCH_QUERIES[branch]) ? branch : "Other";
    const branchQuery = BRANCH_QUERIES[key];

    const [branchArticles, aiArticles] = await Promise.all([
      fetchRss(branchQuery, "branch"),
      fetchRss(AI_QUERY, "ai"),
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
