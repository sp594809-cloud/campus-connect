import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Newspaper, Sparkles, RefreshCw, ExternalLink, Filter, Loader2, AlertCircle, Clock, Building2, Bookmark, Share2, Search, Check, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { CompanySearch } from "@/components/companies";
import { toast } from "sonner";

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

type FilterKey = "all" | "branch" | "ai" | "bookmarks";

export function CompaniesScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const branch = profile?.branch || "Other";
  const branchLabel = BRANCH_LABEL[branch] ?? "Your Field";
  const [filter, setFilter] = useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<Article[]>([]);

  // Ticker Alert Items
  const tickerItems = useMemo(() => [
    { tag: "CSE SPECIAL", text: "Google Software Engineer hiring eligibility set at 7.5+ CGPA", bg: "bg-primary/10 text-primary dark:bg-primary/20", color: "text-primary-foreground" },
    { tag: "MICROSOFT", text: "Mock Coding Round opening this Friday at 4:00 PM IST", bg: "bg-accent-soft text-accent dark:bg-accent/20", color: "text-accent" },
    { tag: "AMAZON", text: "18 student profiles shortlisted for SDE Intern interviews", bg: "bg-warning/10 text-warning dark:bg-warning/20", color: "text-warning" },
    { tag: "CAMPUS STAT", text: "CSE placement rates hit 84% in Phase 1 recruitment", bg: "bg-success/10 text-success dark:bg-success/20", color: "text-success" },
    { tag: "PLACEMENT ALERT", text: "TCS & Infosys registration portals close in 3 days", bg: "bg-destructive/10 text-destructive dark:bg-destructive/20", color: "text-destructive" },
    { tag: "AI INSIGHT", text: "Vite + Supabase templates now preferred for CSE project rounds", bg: "bg-accent-soft text-accent dark:bg-accent/20", color: "text-accent" }
  ], []);

  const doubleTickerItems = useMemo(() => [...tickerItems, ...tickerItems], [tickerItems]);

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

  // Load bookmarks on mount & when filter changes
  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const list: Article[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith("bookmark_news_") || key.startsWith("bookmark_article_"))) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || "{}");
          if (item && item.id) {
            list.push({
              id: item.id,
              title: item.title,
              url: item.url || "#",
              source: item.source || item.companyName || "News Alert",
              publishedAt: item.publishedAt || new Date().toISOString(),
              snippet: item.snippet || item.description || "",
              category: item.category || "ai",
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    setBookmarks(list);
  };

  const toggleBookmark = (article: Article) => {
    const key = `bookmark_article_${article.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      localStorage.removeItem(key);
      toast.info("Removed from bookmarks");
    } else {
      localStorage.setItem(key, JSON.stringify({
        id: article.id,
        title: article.title,
        url: article.url,
        source: article.source,
        publishedAt: article.publishedAt,
        snippet: article.snippet,
        category: article.category
      }));
      toast.success(`Bookmarked article: "${article.title.substring(0, 30)}..."`);
    }
    loadBookmarks();
  };

  const filteredArticles = useMemo(() => {
    let list: Article[] = [];
    if (filter === "bookmarks") {
      list = bookmarks;
    } else {
      const branchA = data?.branchArticles ?? [];
      const aiA = data?.aiArticles ?? [];
      if (filter === "branch") {
        list = branchA;
      } else if (filter === "ai") {
        list = aiA;
      } else {
        // Interleave: branch-heavy with AI sprinkled
        const merged: Article[] = [];
        const max = Math.max(branchA.length, aiA.length);
        for (let i = 0; i < max; i++) {
          if (branchA[i]) merged.push(branchA[i]);
          if (i % 3 === 1 && aiA[Math.floor(i / 3)]) merged.push(aiA[Math.floor(i / 3)]);
        }
        list = merged;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          (a.snippet && a.snippet.toLowerCase().includes(query)) ||
          a.source.toLowerCase().includes(query)
      );
    }
    return list;
  }, [data, filter, bookmarks, searchQuery]);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  // Split featured (first) article out
  const { featuredArticle, remainingArticles } = useMemo(() => {
    if (filteredArticles.length === 0) {
      return { featuredArticle: null, remainingArticles: [] };
    }
    return {
      featuredArticle: searchQuery.trim() ? null : filteredArticles[0], // Only show hero when not actively searching
      remainingArticles: searchQuery.trim() ? filteredArticles : filteredArticles.slice(1)
    };
  }, [filteredArticles, searchQuery]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* CSS Animation for Marquee Ticker */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Ticker Tape */}
      <div className="w-full bg-primary/5 dark:bg-accent-soft/5 backdrop-blur-md border-y border-border/60 py-2 overflow-hidden relative shadow-sm">
        <div className="flex w-max animate-[marquee_35s_linear_infinite] gap-8 hover:[animation-play-state:paused] cursor-pointer">
          {doubleTickerItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${item.bg}`}>
                {item.tag}
              </span>
              <span className="font-semibold text-foreground">{item.text}</span>
              <span className="text-muted-foreground/40 font-light mx-2">•</span>
            </div>
          ))}
        </div>
      </div>

      {/* Header Panel */}
      <div className="px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Recruitment Hub
          </h1>
          <p className="text-sm text-muted-foreground">
            Real-time hiring alerts, analytics, & news terminal
          </p>
        </div>
        
        {/* Sync status indicator */}
        <div className="flex items-center gap-2 self-start md:self-auto text-xs bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-full font-semibold">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          Live Terminal Online
        </div>
      </div>

      {/* Search Input for Companies */}
      <div className="px-4">
        <div className="glass-card p-1.5 rounded-2xl border border-border/80 shadow-soft">
          <CompanySearch
            onSelect={handleCompanySelect}
            placeholder="Search core companies database..."
          />
        </div>
      </div>

      {/* News Operations Dashboard */}
      <div className="px-4 mt-6">
        <div className="glass-card rounded-2xl border border-border/60 p-4 space-y-4">
          
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
            <div>
              <h2 className="text-base font-bold flex items-center gap-1.5">
                <Newspaper className="h-4.5 w-4.5 text-accent" />
                Latest News & Alerts
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Targeted alerts for {branchLabel} & general campus bulletins
              </p>
            </div>

            {/* Sync Timestamp & Action */}
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Synced {formatDistanceToNow(lastUpdated, { addSuffix: true })}
                </span>
              )}
              <button
                onClick={() => refetch()}
                aria-label="Refresh news"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 border border-border/60 transition-smooth"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-foreground", isFetching && "animate-spin")} />
              </button>
            </div>
          </div>

          {/* Controls Bar: Filters & Search bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sliding Custom Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-secondary p-1 text-xs font-semibold self-start shadow-inner">
              {([
                { k: "all", label: "All Feed" },
                { k: "branch", label: branch },
                { k: "ai", label: "AI Insights" },
                { k: "bookmarks", label: "Bookmarks" },
              ] as const).map((t) => (
                <button
                  key={t.k}
                  onClick={() => setFilter(t.k as FilterKey)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg transition-smooth",
                    filter === t.k
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-secondary-foreground hover:bg-background/60",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Local Search bar for news */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search headlines or snippets..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-secondary text-foreground focus:outline-none focus:ring-1.5 focus:ring-accent border border-border/60 transition-smooth"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main News feed grid */}
      <div className="px-4 space-y-4">
        {isLoading && (
          <div className="space-y-4">
            <div className="h-56 rounded-2xl bg-secondary/40 animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-secondary/40 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 flex items-start gap-3 shadow-soft">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-sm">Communication Failure</p>
              <p className="text-xs text-muted-foreground mt-0.5">Could not establish secure tunnel to recruitment service.</p>
              <button
                onClick={() => refetch()}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold transition-smooth"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {!isLoading && !isError && filteredArticles.length === 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-10 text-center shadow-soft">
            <Newspaper className="h-10 w-10 mx-auto text-muted-foreground mb-3 animate-pulse" />
            <p className="text-sm font-bold text-foreground">No matches found</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {filter === "bookmarks" 
                ? "You haven't bookmarked any articles yet. Select the bookmark icon on any card to save it here."
                : "No fresh stories matched your filter criteria. Try adjusting your search query."}
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="space-y-5">
            {/* HERO breaking story card */}
            {featuredArticle && (
              <HeroFeaturedCard 
                article={featuredArticle} 
                isBookmarked={bookmarks.some(b => b.id === featuredArticle.id)}
                onToggleBookmark={() => toggleBookmark(featuredArticle)}
              />
            )}

            {/* General Grid layout */}
            {remainingArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {remainingArticles.map((a) => (
                  <NewsCard 
                    key={a.id} 
                    article={a} 
                    isBookmarked={bookmarks.some(b => b.id === a.id)}
                    onToggleBookmark={() => toggleBookmark(a)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* Redesigned Hero Featured Card Component */
function HeroFeaturedCard({ 
  article, 
  isBookmarked, 
  onToggleBookmark 
}: { 
  article: Article; 
  isBookmarked: boolean; 
  onToggleBookmark: () => void; 
}) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(article.url);
    toast.success("Featured link copied to clipboard! 🚀", {
      description: "Intel is ready to share."
    });
  };

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  } catch {
    timeAgo = "recently";
  }

  return (
    <div className="group relative transition-smooth">
      {/* Dynamic glowing outline */}
      <div className="absolute -inset-[1.5px] rounded-2xl bg-gradient-to-r from-primary via-purple-700 to-accent opacity-80 group-hover:opacity-100 blur-[2px] transition duration-500 shadow-glow" />
      
      <div className="relative rounded-2xl overflow-hidden bg-card/90 dark:bg-card/75 backdrop-blur-xl border border-white/10 hover:shadow-elevated transition-smooth p-6">
        
        {/* Dynamic decorative backdrop radial glow */}
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-[50px] pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-destructive to-orange-500 text-white shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
              Breaking Announcement
            </span>
            <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
              • Featured
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              title="Share Featured"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/70 transition-smooth"
            >
              <Share2 className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={onToggleBookmark}
              title={isBookmarked ? "Remove Bookmark" : "Bookmark Featured"}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-smooth ${
                isBookmarked 
                  ? "text-accent bg-accent-soft/80" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <Bookmark className={`h-4.5 w-4.5 ${isBookmarked ? "fill-accent" : ""}`} />
            </button>
          </div>
        </div>

        {/* Headline and text info */}
        <div className="space-y-3 mt-2">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-accent transition-smooth leading-tight">
            {article.title}
          </h2>
          
          {article.snippet && (
            <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-3xl">
              {article.snippet}
            </p>
          )}
        </div>

        {/* Footers */}
        <div className="mt-6 pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold bg-accent-soft text-accent border border-accent/20">
              ⚡ Intelligence Hub
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              via {article.source}
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-xs text-muted-foreground font-medium">
              {timeAgo}
            </span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-xs shadow-soft hover:opacity-95 hover:shadow-glow transition-smooth"
            >
              Read full coverage
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Redesigned standard News Card Component */
function NewsCard({ 
  article, 
  isBookmarked, 
  onToggleBookmark 
}: { 
  article: Article; 
  isBookmarked: boolean; 
  onToggleBookmark: () => void; 
}) {
  const isAI = article.category === "ai";
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(article.url);
    toast.success("Link copied to clipboard! 🚀", {
      description: "Intel is ready to share."
    });
  };

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
  } catch {
    timeAgo = "recently";
  }

  return (
    <div className="group relative transition-smooth">
      {/* Subtle hover blur glow */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/10 to-accent/15 opacity-0 group-hover:opacity-100 blur-sm transition duration-500" />
      
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block rounded-2xl glass-card hover:bg-card/85 p-5 hover:shadow-glow hover:-translate-y-0.5 transition-smooth border border-border/60 h-full flex flex-col justify-between"
      >
        <div>
          {/* Badge & actions */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                isAI
                  ? "bg-accent-soft text-accent border border-accent/20"
                  : "bg-secondary text-secondary-foreground border border-border/80",
              )}
            >
              {isAI ? <Sparkles className="h-3 w-3" /> : <Filter className="h-3 w-3" />}
              {isAI ? "AI Insights" : "Branch Alert"}
            </span>
            
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleShare}
                title="Share Link"
                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-smooth"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onToggleBookmark();
                }}
                title={isBookmarked ? "Remove Bookmark" : "Bookmark Article"}
                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-smooth ${
                  isBookmarked 
                    ? "text-accent bg-accent-soft/80" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-accent" : ""}`} />
              </button>
            </div>
          </div>

          <h3 className="font-bold text-[15px] leading-snug text-foreground group-hover:text-accent transition-smooth line-clamp-2">
            {article.title}
          </h3>

          {article.snippet && (
            <p className="mt-2 text-xs text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {article.snippet}
            </p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground truncate max-w-[60%]">
            {article.source}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-accent">
              Read
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

export default CompaniesScreen;
