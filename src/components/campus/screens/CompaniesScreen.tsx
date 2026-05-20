import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Clock, AlertCircle } from 'lucide-react';
import { CompanySearch, CompanyNewsCard, CompanyReviewsList } from '@/components/companies';
import { useCompanyNewsPolling } from '@/hooks/useCompanyNewsPolling';
import { getAllCompanies, getCompanyReviews, type Company, type CompanyReview } from '@/integrations/external/companyApi';

export function CompaniesScreen() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [reviews, setReviews] = useState<CompanyReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [trendingCompanies, setTrendingCompanies] = useState<Company[]>([]);

  // Load trending companies on mount
  useEffect(() => {
    getAllCompanies().then(setTrendingCompanies).catch(console.error);
  }, []);

  // Polling hook for real-time news updates
  const {
    news,
    isLoading: newsLoading,
    isError: newsError,
    isFetching,
    lastUpdated,
    refetch,
  } = useCompanyNewsPolling({
    companyId: selectedCompany?.id,
    refreshIntervalMs: 3 * 60 * 1000, // 3 minutes
  });

  // Load reviews when company is selected
  useEffect(() => {
    if (!selectedCompany) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);
    getCompanyReviews(selectedCompany.id)
      .then((res) => setReviews(res.reviews))
      .catch(console.error)
      .finally(() => setReviewsLoading(false));
  }, [selectedCompany]);

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
  };

  const handleClearSelection = () => {
    setSelectedCompany(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Companies
        </h1>
        <p className="text-sm text-muted-foreground">
          Stay updated with company news and reviews
        </p>
      </div>

      {/* Search */}
      <CompanySearch
        onSelect={handleCompanySelect}
        placeholder="Search for a company..."
      />

      {/* Selected Company */}
      {selectedCompany && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {selectedCompany.logo && (
                <img
                  src={selectedCompany.logo}
                  alt={selectedCompany.name}
                  className="h-8 w-8 rounded-md object-contain bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <div>
                <h2 className="font-semibold">{selectedCompany.name}</h2>
                {selectedCompany.industry && (
                  <p className="text-xs text-muted-foreground">
                    {selectedCompany.industry}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-sm text-primary hover:underline"
            >
              Clear
            </button>
          </div>

          {/* Reviews Section */}
          <div className="bg-muted/30 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Reviews</h3>
            {reviewsLoading ? (
              <div className="text-center py-4 text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : (
              <CompanyReviewsList reviews={reviews} />
            )}
          </div>
        </div>
      )}

      {/* News Section - always show if no company selected or show filtered news */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">
            {selectedCompany ? `${selectedCompany.name} News` : 'Latest News'}
          </h3>
          {lastUpdated && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {newsError ? (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Failed to load news
            </p>
            <button
              onClick={() => refetch()}
              className="text-sm text-primary hover:underline mt-2"
            >
              Try again
            </button>
          </div>
        ) : newsLoading && !news.length ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid gap-3">
            {news.map((item) => (
              <CompanyNewsCard
                key={item.id}
                news={item}
                showCompany={!selectedCompany}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-lg">
            <p className="text-sm text-muted-foreground">No news available</p>
          </div>
        )}

        {/* Polling indicator */}
        {isFetching && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Updating...</span>
          </div>
        )}
      </div>

      {/* Trending Companies - show when no search/selection */}
      {!selectedCompany && (
        <div className="space-y-3">
          <h3 className="font-semibold">Trending Companies</h3>
          <div className="grid grid-cols-2 gap-2">
            {trendingCompanies.slice(0, 6).map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company)}
                className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                {company.logo && (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="h-8 w-8 rounded-md object-contain bg-background"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{company.name}</p>
                  {company.industry && (
                    <p className="text-xs text-muted-foreground truncate">
                      {company.industry}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default CompaniesScreen;