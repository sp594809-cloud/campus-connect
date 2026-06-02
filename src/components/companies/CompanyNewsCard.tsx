import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight, Bookmark, Share2, ExternalLink } from 'lucide-react';
import type { CompanyNews } from '@/integrations/external/types';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface CompanyNewsCardProps {
  news: CompanyNews;
  className?: string;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
}

// Get company emoji/symbol
const getCompanySymbol = (name: string) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('google')) return '🔵';
  if (lowerName.includes('microsoft')) return '⬜';
  if (lowerName.includes('amazon')) return '🟠';
  if (lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('meta')) return '📱';
  if (lowerName.includes('tcs')) return '🟦';
  if (lowerName.includes('infosys')) return '🟩';
  return '🏢';
};

export function CompanyNewsCard({ news, className = '', isBookmarked: propBookmarked, onToggleBookmark }: CompanyNewsCardProps) {
  const navigate = useNavigate();
  const [localBookmarked, setLocalBookmarked] = useState(false);
  
  // Connect to prop or fall back to local storage
  const isBookmarked = propBookmarked !== undefined ? propBookmarked : localBookmarked;

  useEffect(() => {
    if (propBookmarked === undefined) {
      const saved = localStorage.getItem(`bookmark_news_${news.id}`);
      setLocalBookmarked(!!saved);
    }
  }, [news.id, propBookmarked]);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onToggleBookmark) {
      onToggleBookmark();
    } else {
      const nextState = !localBookmarked;
      setLocalBookmarked(nextState);
      if (nextState) {
        localStorage.setItem(`bookmark_news_${news.id}`, JSON.stringify(news));
        toast.success(`Bookmarked article: "${news.title.substring(0, 30)}..."`);
      } else {
        localStorage.removeItem(`bookmark_news_${news.id}`);
        toast.info('Removed from bookmarks');
      }
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shareUrl = news.url || window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard! 🚀', {
      description: 'You can now share this recruitment intel with others.',
    });
  };

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true });
  } catch {
    timeAgo = 'recently';
  }

  // Parse urgency from title
  const isUrgent = news.title?.toLowerCase().includes('deadline') || 
    news.title?.toLowerCase().includes('closing') ||
    news.title?.toLowerCase().includes('ends') ||
    news.title?.toLowerCase().includes('apply');

  return (
    <article className={`group relative transition-smooth ${className}`}>
      {/* Glow highlight behind card on hover */}
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-primary/30 to-accent/30 opacity-0 group-hover:opacity-100 blur-sm transition duration-500" />
      
      {/* Premium Glassmorphic card */}
      <div className="relative glass-card hover:bg-card/85 rounded-2xl p-5 hover:shadow-glow transition-smooth border border-border/60">
        
        {/* Top row: Logo + Status + Bookmark & Share */}
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {/* Company Logo with beautiful gradient border */}
            <div className="relative flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-purple-900 to-accent p-[1.5px] shadow-sm">
              <div className="h-full w-full rounded-[10px] flex items-center justify-center bg-card text-lg">
                <span>{getCompanySymbol(news.companyName)}</span>
              </div>
            </div>

            <div>
              <p className="text-[13px] text-muted-foreground font-semibold uppercase tracking-wider">
                {news.companyName}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUrgent ? 'bg-destructive' : 'bg-success'} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isUrgent ? 'bg-destructive' : 'bg-success'}`} />
                </span>
                <span className={`text-[11px] font-semibold ${isUrgent ? 'text-destructive' : 'text-success'}`}>
                  {isUrgent ? 'URGENT ALERT' : 'LIVE FEED'}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              title="Share Link"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-smooth"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleBookmark}
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Article'}
              className={`h-8 w-8 rounded-lg flex items-center justify-center transition-smooth ${
                isBookmarked 
                  ? 'text-accent bg-accent-soft/80' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
              }`}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-accent' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content: Headline + Summary */}
        <div className="space-y-2 cursor-pointer" onClick={() => navigate(`/companies/${encodeURIComponent(news.companyName || '')}`, { replace: true })}>
          <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-accent transition-smooth line-clamp-2">
            {news.title}
          </h3>
          {news.description && (
            <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {news.description}
            </p>
          )}
        </div>

        {/* Bottom: Divider + Metadata */}
        <div className="mt-4 pt-3.5 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Tag Badge */}
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
              🎓 Eligibility: 7+ CGPA
            </div>
            
            {news.source && (
              <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
                via {news.source}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-medium">
              {timeAgo}
            </span>
            <button
              onClick={() => navigate(`/companies/${encodeURIComponent(news.companyName || '')}`, { replace: true })}
              className="inline-flex items-center gap-1 text-xs font-bold text-accent group-hover:translate-x-0.5 transition-smooth"
            >
              Details
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
