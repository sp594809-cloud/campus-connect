import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, RefreshCw, Clock, AlertCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { CompanySearch, CompanyNewsCard } from '@/components/companies';
import { useCompanyNewsPolling } from '@/hooks/useCompanyNewsPolling';
import { getAllCompanies, type Company } from '@/integrations/external/companyApi';

// Live status updates for ticker
const LIVE_UPDATES = [
  { text: 'Microsoft window closes in 4 hours', status: 'urgent' },
  { text: 'Amazon shortlisted 12 seniors today', status: 'success' },
  { text: 'Google added 3 new internship roles', status: 'success' },
  { text: 'Meta opens summer applications', status: 'success' },
  { text: 'Goldman Sachs deadline tomorrow', status: 'urgent' },
  { text: 'Apple hiring for 5 new positions', status: 'success' },
  { text: 'Netflix interview schedule released', status: 'success' },
  { text: 'Tesla recruitment drive next week', status: 'neutral' },
];

export function CompaniesScreen() {
  const navigate = useNavigate();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [trendingCompanies, setTrendingCompanies] = useState<Company[]>([]);
  const [liveUpdateIndex, setLiveUpdateIndex] = useState(0);

  // Load trending companies
  useEffect(() => {
    getAllCompanies().then(setTrendingCompanies).catch(console.error);
  }, []);

  // Cycle through live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUpdateIndex((prev) => (prev + 1) % LIVE_UPDATES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Polling for news
  const {
    news,
    isLoading: newsLoading,
    isError: newsError,
    isFetching,
    lastUpdated,
    refetch,
  } = useCompanyNewsPolling({
    companyId: selectedCompany?.id,
    refreshIntervalMs: 3 * 60 * 1000,
  });

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'urgent':
        return 'text-red-500';
      case 'success':
        return 'text-green-500';
      default:
        return 'text-green-500';
    }
  };

  const currentUpdate = LIVE_UPDATES[liveUpdateIndex];

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Companies
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time recruitment intelligence terminal
        </p>
      </div>

      {/* Search */}
      <CompanySearch
        onSelect={handleCompanySelect}
        placeholder="Search companies..."
      />

      {/* Live Status Ticker Tape */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-black/30 border border-white/10 rounded-lg overflow-hidden">
        <div className="flex items-center gap-3 px-3 py-2 overflow-x-auto">
          {/* Pulsing dots */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-50 delay-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-25 delay-150" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          </div>
          
          {/* Active update text */}
          <span className={`text-xs font-medium whitespace-nowrap animate-pulse ${getStatusColor(currentUpdate?.status || 'neutral')}`}>
            {currentUpdate?.text || 'Loading...'}
          </span>
        </div>
      </div>

      {/* Selected Company Show Details */}
      {selectedCompany && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#1a1a2e] to-purple-600 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-lg">{selectedCompany.name}</h2>
                {selectedCompany.industry && (
                  <p className="text-xs text-muted-foreground">{selectedCompany.industry}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelectedCompany(null)}
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Clear ✕
            </button>
          </div>
        </div>
      )}

      {/* News Section with Split Layout */}
      {!newsError && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Main News Feed (70%) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                {selectedCompany ? `${selectedCompany.name} Feed` : 'Live Feed'}
              </h3>
              {lastUpdated && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{lastUpdated.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {newsLoading && !news.length ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 mx-auto animate-spin text-purple-500" />
              </div>
            ) : news.length > 0 ? (
              <div className="grid gap-3">
                {news.map((item) => (
                  <CompanyNewsCard key={item.id} news={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-white/5 rounded-lg">
                <p className="text-sm text-muted-foreground">No updates available</p>
              </div>
            )}

            {isFetching && (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>

          {/* Trending Sidebar (30%) */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </h3>
            <div className="space-y-2">
              {trendingCompanies.slice(0, 8).map((company, idx) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all text-left group"
                >
                  <span className="text-xs text-muted-foreground w-4">{idx + 1}</span>
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-purple-400 transition-colors">
                      {company.name}
                    </p>
                    {company.industry && (
                      <p className="text-xs text-muted-foreground truncate">
                        {company.industry}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-purple-400 transition-colors opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {newsError && (
        <div className="text-center py-12 bg-white/5 rounded-lg">
          <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-500" />
          <p className="text-sm mb-3">Feed unavailable</p>
          <button
            onClick={() => refetch()}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            Retry ↻
          </button>
        </div>
      )}
    </div>
  );
}

export default CompaniesScreen;