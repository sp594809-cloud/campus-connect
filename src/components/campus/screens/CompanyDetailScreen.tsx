import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, ArrowLeft, ExternalLink, Globe, Clock, AlertCircle } from 'lucide-react';
import { CompanyNewsCard, CompanyReviewsList } from '@/components/companies';
import { useCompanyNewsPolling } from '@/hooks/useCompanyNewsPolling';
import {
  getCompanyByName,
  getCompanyReviews,
  getCompanyRating,
  type Company,
  type CompanyReview,
} from '@/integrations/external/companyApi';
import { Star } from 'lucide-react';

export function CompanyDetailScreen() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load company data
  useEffect(() => {
    if (!name) {
      setError('Company not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all([
      getCompanyByName(name),
      getCompanyRating(name),
      getCompanyReviews(name).then((res) => res.reviews),
    ])
      .then(([companyData, ratingData, reviewsData]) => {
        if (!companyData) {
          setError('Company not found');
          return;
        }
        setCompany(companyData);
        setRating(ratingData);
        setReviews(reviewsData);
      })
      .catch((err) => {
        console.error(err);
        setError('Failed to load company data');
      })
      .finally(() => setLoading(false));
  }, [name]);

  // Polling hook for news (filtered by company)
  const {
    news,
    isLoading: newsLoading,
    isError: newsError,
    lastUpdated,
    refetch,
  } = useCompanyNewsPolling({
    companyId: company?.id,
    refreshIntervalMs: 3 * 60 * 1000,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="font-medium">{error || 'Company not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold">{company.name}</h1>
      </div>

      {/* Company Info */}
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-start gap-4">
          {company.logo && (
            <img
              src={company.logo}
              alt={company.name}
              className="h-16 w-16 rounded-lg object-contain bg-muted"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{company.name}</h2>
              {rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{rating.toFixed(1)}</span>
                </div>
              )}
            </div>
            {company.industry && (
              <p className="text-sm text-muted-foreground">{company.industry}</p>
            )}
            {company.description && (
              <p className="text-sm text-muted-foreground">{company.description}</p>
            )}
          </div>
        </div>
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-4 text-sm text-primary hover:underline"
          >
            <Globe className="h-4 w-4" />
            Visit website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Reviews Section */}
      <div className="space-y-3">
        <h3 className="font-semibold">Employee Reviews ({reviews.length})</h3>
        <CompanyReviewsList reviews={reviews} />
      </div>

      {/* News Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Latest News</h3>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {newsError ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Failed to load news</p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary hover:underline mt-2"
            >
              Try again
            </button>
          </div>
        ) : newsLoading ? (
          <div className="text-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid gap-3">
            {news.map((item) => (
              <CompanyNewsCard key={item.id} news={item} showCompany={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">No news available</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyDetailScreen;