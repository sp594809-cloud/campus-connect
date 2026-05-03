import { Heart, MessageCircle, Pin, Share2, Sparkles } from "lucide-react";
import { Header } from "../Header";
import { findStudent, posts } from "@/data/mockData";
import { useState } from "react";
import { cn } from "@/lib/utils";
import networkBg from "@/assets/network-bg.jpg";

const filters = ["All Campus", "My Branch", "My Interests"] as const;

export const HomeScreen = () => {
  const [filter, setFilter] = useState<typeof filters[number]>("All Campus");
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  return (
    <div className="animate-fade-in-up">
      <Header title="Campus Feed" subtitle="What's happening today" showSearch />

      <div className="px-5 pt-4">
        <div
          className="relative rounded-3xl overflow-hidden p-5 text-primary-foreground shadow-glow"
          style={{
            backgroundImage: `linear-gradient(135deg, hsl(234 70% 22% / 0.85), hsl(264 75% 38% / 0.85)), url(${networkBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90">
            <Sparkles className="h-3.5 w-3.5" /> Today's pulse
          </div>
          <p className="mt-2 text-lg font-bold leading-snug">
            142 new connections were made on campus this week 🔥
          </p>
          <p className="text-sm opacity-80 mt-1">
            Tap Discover to find your next collab partner.
          </p>
        </div>
      </div>

      <div className="px-5 mt-5 flex gap-2 overflow-x-auto scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-smooth",
              filter === f
                ? "bg-foreground text-background"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3">
        {posts.map((post, i) => {
          const author = findStudent(post.authorId);
          const isLiked = liked[post.id];
          return (
            <article
              key={post.id}
              className={cn(
                "rounded-2xl bg-card p-4 shadow-soft border border-border/60 animate-fade-in-up",
                post.pinned && "border-accent/40 bg-gradient-card"
              )}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {post.pinned && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-accent mb-2 uppercase tracking-wider">
                  <Pin className="h-3 w-3" /> Pinned announcement
                </div>
              )}
              <div className="flex items-center gap-3">
                <img
                  src={author.avatar}
                  alt={author.name}
                  loading="lazy"
                  className="h-11 w-11 rounded-full object-cover ring-2 ring-background shadow-soft"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm truncate">{author.name}</p>
                    {author.placementStatus === "Placed" && (
                      <span className="text-[10px] bg-success/15 text-success font-bold px-1.5 py-0.5 rounded">
                        @ {author.company}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {author.branch} · {author.year} year · {post.timestamp}
                  </p>
                </div>
                {post.tag && (
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-accent-soft text-accent px-2 py-1 rounded-full">
                    {post.tag}
                  </span>
                )}
              </div>

              <p className="mt-3 text-[15px] leading-relaxed text-foreground">{post.content}</p>

              <div className="mt-4 flex items-center gap-1 text-muted-foreground">
                <button
                  onClick={() => setLiked((p) => ({ ...p, [post.id]: !p[post.id] }))}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-smooth",
                    isLiked ? "text-accent bg-accent-soft" : "hover:bg-secondary"
                  )}
                >
                  <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
                  {post.likes + (isLiked ? 1 : 0)}
                </button>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-secondary transition-smooth">
                  <MessageCircle className="h-4 w-4" /> {post.comments}
                </button>
                <button className="ml-auto p-1.5 rounded-full hover:bg-secondary transition-smooth" aria-label="Share">
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};