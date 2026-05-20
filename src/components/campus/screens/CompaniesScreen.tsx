import { useEffect, useMemo, useState } from "react";
import { Newspaper, Sparkles, RefreshCw, ExternalLink, Filter, Loader2, AlertCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

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
  const { profile } = useAuth();
  const branch = profile?.branch || "Other";
  const branchLabel = BRANCH_LABEL[branch] ?? "Your Field";
  const [filter, setFilter] = useState<FilterKey>("all");

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
    // Interleave: branch-heavy with AI sprinkled
    const merged: Article[] = [];
    const max = Math.max(branchA.length, aiA.length);
    for (let i = 0; i < max; i++) {
      if (branchA[i]) merged.push(branchA[i]);
      if (i % 3 === 1 && aiA[Math.floor(i / 3)]) merged.push(aiA[Math.floor(i / 3)]);
    }
    return merged;
  }, [data, filter]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="pb-24">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-3xl px-4 pt-4 pb-6 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
            </span>
            Live market pulse
          </div>
          <h1 className="mt-2 text-2xl font-bold leading-tight">
            {branchLabel} <span className="opacity-80">News</span>
          </h1>
          <p className="mt-1 text-sm opacity-80">
            Trending updates tailored to your branch · AI insights for everyone
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="px-4 mt-4 flex items-center gap-2">
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
                "px-3 py-1.5 rounded-full transition-smooth",
                filter === t.k
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-secondary-foreground hover:bg-background/60",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {lastUpdated && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        )}
        <button
          onClick={() => refetch()}
          aria-label="Refresh"
          className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-card border border-border hover:bg-secondary transition-smooth"
        >
          <RefreshCw className={cn("h-4 w-4 text-foreground", isFetching && "animate-spin")} />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 mt-4 space-y-3">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-secondary/60 animate-pulse" />
            ))}
          </div>
        )}

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
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <Newspaper className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No fresh stories right now. Pull to refresh in a bit.</p>
          </div>
        )}

        {!isLoading && articles.map((a) => <NewsCard key={a.id} article={a} />)}
      </div>
    </div>
  );
}

function NewsCard({ article }: { article: Article }) {
  const isAI = article.category === "ai";
  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  } catch {
    timeAgo = "";
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl bg-card border border-border p-4 shadow-soft hover:shadow-elevated hover:-translate-y-0.5 transition-smooth"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
            isAI
              ? "bg-accent-soft text-accent"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {isAI ? <Sparkles className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
          {isAI ? "AI · For everyone" : "For your branch"}
        </span>
        <span className="text-[11px] text-muted-foreground">{timeAgo}</span>
      </div>

      <h3 className="font-semibold text-[15px] leading-snug text-foreground group-hover:text-accent transition-smooth line-clamp-2">
        {article.title}
      </h3>

      {article.snippet && (
        <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{article.snippet}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground truncate max-w-[60%]">
          {article.source}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
          Read on source
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </a>
  );
}

export default CompaniesScreen;
