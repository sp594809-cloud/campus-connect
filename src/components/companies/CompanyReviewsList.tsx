import { Star, ThumbsUp, User } from 'lucide-react';
import type { CompanyReview } from '@/integrations/external/types';
import { format } from 'date-fns';

interface CompanyReviewsListProps {
  reviews: CompanyReview[];
  className?: string;
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalf && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-muted" />
      ))}
    </div>
  );
}

export function CompanyReviewsList({ reviews, className = '' }: CompanyReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-muted-foreground text-sm">No reviews yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {reviews.map((review) => (
        <article
          key={review.id}
          className="bg-card rounded-lg border border-border p-4"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <StarRating rating={review.rating} />
              <span className="text-sm font-medium">{review.rating.toFixed(1)}</span>
            </div>
            {review.date && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(review.date), 'MMM d, yyyy')}
              </span>
            )}
          </div>

          {review.title && (
            <h4 className="font-medium text-sm mb-2">{review.title}</h4>
          )}

          {review.role && (
            <div className="flex items-center gap-1 mb-3 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{review.role}</span>
            </div>
          )}

          {review.pros && (
            <div className="mb-2">
              <p className="text-xs font-medium text-green-600 dark:text-green-400">Pros</p>
              <p className="text-sm text-muted-foreground">{review.pros}</p>
            </div>
          )}

          {review.cons && (
            <div className="mb-2">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">Cons</p>
              <p className="text-sm text-muted-foreground">{review.cons}</p>
            </div>
          )}

          {review.advice && (
            <div className="mb-2">
              <p className="text-xs font-medium">Advice</p>
              <p className="text-sm text-muted-foreground">{review.advice}</p>
            </div>
          )}

          {review.helpfulCount !== undefined && review.helpfulCount > 0 && (
            <div className="flex items-center gap-1 mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              <span>{review.helpfulCount} found this helpful</span>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

export default CompanyReviewsList;