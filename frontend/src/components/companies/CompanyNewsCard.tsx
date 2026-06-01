import { useState } from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';
import type { CompanyNews } from '@/integrations/external/types';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface CompanyNewsCardProps {
  news: CompanyNews;
  className?: string;
}

function sourceHost(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

function faviconFor(url: string): string {
  const host = sourceHost(url);
  return host ? `https://www.google.com/s2/favicons?sz=64&domain=${host}` : '';
}

export function CompanyNewsCard({ news, className = '' }: CompanyNewsCardProps) {
  const [imgOk, setImgOk] = useState(Boolean(news.imageUrl));
  const [faviconOk, setFaviconOk] = useState(true);
  const host = sourceHost(news.url);
  let timeAgo = '';
  try { timeAgo = formatDistanceToNow(new Date(news.publishedAt), { addSuffix: true }); } catch {}

  const isUrgent = /deadline|closing|ends|last\s+date/i.test(news.title || '');

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'group block rounded-2xl bg-card border border-border overflow-hidden shadow-card hover:shadow-pop hover:-translate-y-0.5 transition-smooth press-scale',
        className,
      )}
    >
      {imgOk && news.imageUrl && (
        <div className="aspect-video w-full bg-muted overflow-hidden">
          <img
            src={news.imageUrl}
            alt=""
            loading="lazy"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover group-hover:scale-[1.03] transition-smooth"
          />
        </div>
      )}

      <div className="p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {faviconOk && host ? (
              <img
                src={faviconFor(news.url)}
                alt=""
                onError={() => setFaviconOk(false)}
                className="h-4 w-4 rounded-sm"
              />
            ) : (
              <span className="h-4 w-4 rounded-sm bg-secondary" aria-hidden />
            )}
            <span className="text-xs font-semibold text-muted-foreground truncate">
              {news.source || host || news.companyName}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground whitespace-nowrap tabular-nums">{timeAgo}</span>
        </div>

        <h3 className="font-semibold text-[15px] leading-snug text-foreground line-clamp-2 group-hover:text-accent transition-smooth">
          {news.title}
        </h3>

        {news.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{news.description}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          {isUrgent ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-destructive/10 text-destructive border border-destructive/30">
              <AlertTriangle className="h-3 w-3" /> Time-sensitive
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-accent-soft text-accent">
              {news.companyName}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent opacity-0 group-hover:opacity-100 transition-smooth">
            Open
            <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

export default CompanyNewsCard;