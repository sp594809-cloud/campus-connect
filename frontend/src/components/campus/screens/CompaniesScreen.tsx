import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Sparkles, RefreshCw, ArrowUpRight, AlertCircle, Clock, TrendingUp, Radio } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CompanySearch } from "@/components/companies";

type Article = {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: string;
  snippet: string;
  category: "branch" | "ai";
};

type BranchNewsResponse = {
  branch: string;
  branchArticles: Article[];
  aiArticles: Article[];
  fetchedAt: string;
};

const BRANCH_LABEL: Record<string, string> = {
  CSE: "Computer Science",
  IT: "Information Technology",
  ECE: "Electronics & Communication",
  ME: "Mechanical",
  EE: "Electrical",
  CE: "Civil",
  Other: "Engineering",
};

type FilterKey = "all" | "branch" | "ai";

export function CompaniesScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const branch = profile?.branch || "Other";
  const branchLabel = BRANCH_LABEL[branch] ?? "Your Field";
  const [filter, setFilter] = useState<FilterKey>("all");

  const handleCompanySelect = (company: { name: string }) => {
    navigate(`/companies/${encodeURIComponent(company.name)}`);
  };

  const { data, isLoading, isFetching, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["branch-news", branch],
    queryFn: async (): Promise<BranchNewsResponse> => {
      const { data, error } = await supabase.functions.invoke("branch-news", {
        body: { branch },
      });
      if (error) throw error;
      return data as BranchNewsResponse;
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const articles = useMemo(() => {
    const branchA = data?.branchArticles ?? [];
    const aiA = data?.aiArticles ?? [];
    if (filter === "branch") return branchA;
    if (filter === "ai") return aiA;
    const merged: Article[] = [];
    const max = Math.max(branchA.length, aiA.length);
    for (let i = 0; i < max; i++) {
      if (branchA[i]) merged.push(branchA[i]);
      if (i % 3 === 1 && aiA[Math.floor(i / 3)]) merged.push(aiA[Math.floor(i / 3)]);
    }
    return merged;
  }, [data, filter]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;
  const branchArticles = data?.branchArticles ?? [];
  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div className="pb-24 bg-gradient-subtle min-h-full">
      {/* Hero header — aligned with app's editorial style */}
      <header className="px-4 pt-5 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-card border border-border shadow-card text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            <Radio className="h-3 w-3" />
            Live pulse
          </div>
          <button
            onClick={() => refetch()}
            aria-label="Refresh news"
            className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-card border border-border hover:bg-secondary transition-smooth press-scale shadow-card"
          >
            <RefreshCw className={cn("h-4 w-4 text-foreground", isFetching && "animate-spin")} />
          </button>
        </div>
        <div>
          <h1 className="text-[28px] leading-[1.1] font-bold tracking-tight">
            {branchLabel} <span className="text-gradient-hero">News</span>
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Curated stories for your branch · AI signals for everyone
          </p>
        </div>

        <CompanySearch onSelect={handleCompanySelect} placeholder="Search companies..." />
      </header>

      {/* Filter chips + last-updated */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full bg-secondary p-1 text-xs font-semibold">
          {([
            { k: "all", label: "All" },
            { k: "branch", label: branch },
            { k: "ai", label: "AI" },
          ] as const).map((t) => (
            <button
              key={t.k}
              onClick={() => setFilter(t.k as FilterKey)}
              className={cn(
                "px-3 py-1.5 rounded-full transition-smooth press-scale",
                filter === t.k
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-secondary-foreground hover:bg-background/60",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {lastUpdated && (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground tabular-nums">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        )}
      </div>

      {/* Featured story */}
      {!isLoading && featured && (
        <div className="px-4 mb-5">
          <FeaturedCard article={featured} />
        </div>
      )}

      {/* Branch rail */}
      {(isLoading || branchArticles.length > 0) && (
        <section className="mb-5 space-y-2.5">
          <div className="px-4 flex items-center justify-between">
            <h2 className="text-[13px] font-bold flex items-center gap-1.5 uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Trending in {branch}
            </h2>
          </div>
          <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
            <div className="flex gap-3 px-4 pb-2">
              {isLoading && [0, 1, 2].map((i) => (
                <div key={i} className="h-28 w-56 shrink-0 rounded-2xl bg-secondary/60 animate-pulse" />
              ))}
              {!isLoading && branchArticles.slice(0, 8).map((a) => (
                <RailCard key={a.id} article={a} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Feed section header */}
      <div className="px-4 mb-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          Latest stories
        </h2>
        <span className="text-[11px] text-muted-foreground">{rest.length} updates</span>
      </div>

      {/* Feed */}
      <div className="px-4 space-y-2.5">
        {isLoading && [0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-secondary/60 animate-pulse" />
        ))}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Couldn't load latest news</p>
              <p className="text-xs text-muted-foreground mt-0.5">Check your connection and try again.</p>
              <button
                onClick={() => refetch()}
                className="mt-2 text-xs font-semibold text-accent hover:underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && articles.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm font-semibold">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No fresh stories right now. Check back soon.</p>
          </div>
        )}

        {!isLoading && rest.map((a) => <NewsRow key={a.id} article={a} />)}
      </div>
    </div>
  );
}

function sourceHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}
function faviconFor(url: string): string {
  const host = sourceHost(url);
  return host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}` : "";
}

function SourceChip({ url, source }: { url: string; source: string }) {
  const [ok, setOk] = useState(true);
  const host = sourceHost(url);
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      {ok && host ? (
        <img
          src={faviconFor(url)}
          alt=""
          onError={() => setOk(false)}
          className="h-3.5 w-3.5 rounded-sm shrink-0"
        />
      ) : (
        <span className="h-3.5 w-3.5 rounded-sm bg-secondary shrink-0" aria-hidden />
      )}
      <span className="text-[11px] font-semibold text-muted-foreground truncate">
        {source || host}
      </span>
    </span>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  const isAI = article.category === "ai";
  let timeAgo = "";
  try { timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }); } catch {}
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block rounded-3xl overflow-hidden bg-gradient-hero text-primary-foreground shadow-pop press-scale transition-smooth"
    >
      <div className="absolute inset-0 opacity-30 mix-blend-overlay pointer-events-none"
           style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(270 95% 70% / 0.8), transparent 50%), radial-gradient(circle at 80% 80%, hsl(222 80% 30% / 0.8), transparent 50%)" }} />
      <div className="relative p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider">
            {isAI ? <Sparkles className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
            {isAI ? "AI signal" : "Top story"}
          </span>
          <span className="text-[11px] opacity-80 tabular-nums">{timeAgo}</span>
        </div>
        <h2 className="text-[20px] font-bold leading-[1.2] tracking-tight line-clamp-3">
          {article.title}
        </h2>
        {article.snippet && (
          <p className="text-[13px] leading-snug opacity-85 line-clamp-2">{article.snippet}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] font-semibold opacity-90 truncate">{article.source}</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold">
            Read
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </a>
  );
}

function RailCard({ article }: { article: Article }) {
  let timeAgo = "";
  try { timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }); } catch {}
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="snap-start shrink-0 w-56 h-28 rounded-2xl p-3 bg-card border border-border shadow-card hover:shadow-pop press-scale transition-smooth flex flex-col justify-between group"
    >
      <SourceChip url={article.url} source={article.source} />
      <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 text-foreground group-hover:text-accent transition-smooth">
        {article.title}
      </h3>
      <span className="text-[10px] text-muted-foreground tabular-nums">{timeAgo}</span>
    </a>
  );
}

function NewsRow({ article }: { article: Article }) {
  const isAI = article.category === "ai";
  let timeAgo = "";
  try { timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true }); } catch {}

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex gap-3 rounded-2xl bg-card border border-border p-3.5 shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-smooth press-scale"
    >
      {/* Left accent bar */}
      <span
        className={cn(
          "absolute left-0 top-3.5 bottom-3.5 w-[3px] rounded-r-full",
          isAI ? "bg-accent" : "bg-primary",
        )}
        aria-hidden
      />
      <div className="flex-1 min-w-0 pl-1.5">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider",
              isAI ? "bg-accent-soft text-accent" : "bg-secondary text-secondary-foreground",
            )}
          >
            {isAI ? <Sparkles className="h-2.5 w-2.5" /> : null}
            {isAI ? "AI" : "Branch"}
          </span>
          <SourceChip url={article.url} source={article.source} />
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums shrink-0">{timeAgo}</span>
        </div>
        <h3 className="font-semibold text-[14px] leading-snug text-foreground group-hover:text-accent transition-smooth line-clamp-2">
          {article.title}
        </h3>
        {article.snippet && (
          <p className="mt-1 text-[12px] leading-snug text-muted-foreground line-clamp-2">{article.snippet}</p>
        )}
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0 self-start mt-1 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </a>
  );
}

export default CompaniesScreen;
