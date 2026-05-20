import { useNavigate } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import type { CompanyNews } from '@/integrations/external/types';
import { formatDistanceToNow } from 'date-fns';

interface CompanyNewsCardProps {
  news: CompanyNews;
  className?: string;
}

// Simulated live status based on content
const getUrgencyStatus = () => {
  const hours = Math.floor(Math.random() * 12);
  if (hours < 1) {
    return `🟢 ${Math.floor(Math.random() * 60)} mins ago`;
  } else if (hours < 24) {
    return `🟢 ${hours} hours ago`;
  } else {
    return `🟢 ${Math.floor(hours / 24)} days ago`;
  }
};

// Get company emoji/symbol
const getCompanySymbol = (name: string) => {
  const lowerName = name?.toLowerCase() || '';
  if (lowerName.includes('google')) return '🔍';
  if (lowerName.includes('microsoft')) return '💠';
  if (lowerName.includes('amazon')) return '📦';
  if (lowerName.includes('apple')) return '🍎';
  if (lowerName.includes('meta')) return '📘';
  if (lowerName.includes('tesla')) return '⚡';
  if (lowerName.includes('goldman')) return '💰';
  if (lowerName.includes('netflix')) return '🎬';
  return '🏢';
};

export function CompanyNewsCard({ news, className = '' }: CompanyNewsCardProps) {
  const navigate = useNavigate();
  const timeAgo = formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true });
  const statusColor = 'text-green-500'; // Default to green for live
  
  // Parse urgency from title
  const isUrgent = news.title?.toLowerCase().includes('deadline') || 
    news.title?.toLowerCase().includes('closing') ||
    news.title?.toLowerCase().includes('ends');

  return (
    <article className={`group relative ${className}`}>
      {/* Glassmorphic card */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-3 hover:bg-white/15 transition-all duration-200">
        {/* Top row: Logo + Status */}
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Company Logo with gradient frame */}
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a1a2e] to-purple-600" />
            <div className="relative h-10 w-10 rounded-full border-2 border-white/60 flex items-center justify-center overflow-hidden bg-[#1a1a2e]">
              <span className="text-lg">{getCompanySymbol(news.companyName)}</span>
            </div>
          </div>

          {/* Live Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isUrgent ? 'bg-red-500' : 'bg-green-500'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isUrgent ? 'bg-red-500' : 'bg-green-500'}`} />
            </span>
            <span className={isUrgent ? 'text-red-500' : statusColor}>{timeAgo}</span>
          </div>
        </div>

        {/* Content: Headline + Summary */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground font-medium truncate">
            {news.companyName}
          </p>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-purple-400 transition-colors">
            {news.title}
          </h3>
          {news.description && (
            <p className="text-xs text-muted-foreground/80 line-clamp-2">
              {news.description}
            </p>
          )}
        </div>

        {/* Bottom: Divider + Metadata */}
        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
          {/* Tag Badge */}
          <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
            🎓 Eligibility: 7+ CGPA
          </div>

          {/* View Details Button */}
          <button
            onClick={() => navigate(`/companies/${encodeURIComponent(news.companyName || '')}`, { replace: true })}
            className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-semibold bg-gradient-to-r from-[#1a1a2e] to-purple-600 text-white hover:from-purple-600 hover:to-[#1a1a2e] transition-all duration-200"
          >
            View Details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default CompanyNewsCard;