import { ExternalLink, Building2, Clock } from 'lucide-react';
import type { CompanyNews } from '@/integrations/external/types';
import { formatDistanceToNow } from 'date-fns';

interface CompanyNewsCardProps {
  news: CompanyNews;
  showCompany?: boolean;
  className?: string;
}

export function CompanyNewsCard({
  news,
  showCompany = true,
  className = '',
}: CompanyNewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true });

  return (
    <article
      className={`bg-card rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        {news.imageUrl && (
          <div className="aspect-video bg-muted overflow-hidden">
            <img
              src={news.imageUrl}
              alt={news.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
        <div className="p-4">
          {showCompany && news.companyName && (
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-3 w-3 text-primary" />
              <span className="text-xs font-medium text-primary">
                {news.companyName}
              </span>
            </div>
          )}
          <h3 className="font-semibold text-sm line-clamp-2 mb-2 hover:text-primary transition-colors">
            {news.title}
          </h3>
          {news.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
              {news.description}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              {news.source}
              <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}

export default CompanyNewsCard;