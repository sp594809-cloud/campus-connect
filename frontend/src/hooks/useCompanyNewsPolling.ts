import { useQuery } from '@tanstack/react-query';
import { getLatestNews, getCompanyNews, type CompanyNews } from '@/integrations/external/companyApi';

export interface UseCompanyNewsPollingOptions {
  companyId?: string;
  refreshIntervalMs?: number;
  enabled?: boolean;
}

export interface UseCompanyNewsPollingResult {
  news: CompanyNews[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  isFetching: boolean;
  lastUpdated: Date | null;
}

/**
 * Custom hook for polling company news at regular intervals
 * @param options - Configuration options for the polling
 * @returns News data with loading/error states and refetch function
 */
export function useCompanyNewsPolling(
  options: UseCompanyNewsPollingOptions = {}
): UseCompanyNewsPollingResult {
  const {
    companyId,
    refreshIntervalMs = 3 * 60 * 1000, // Default: 3 minutes
    enabled = true,
  } = options;

  const queryKey = companyId ? ['companyNews', companyId] : ['latestNews'];

  const queryFn = () => {
    if (companyId) {
      return getCompanyNews(companyId).then((res) => res.articles);
    }
    return getLatestNews();
  };

  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery({
    queryKey,
    queryFn,
    refetchInterval: refreshIntervalMs,
    refetchIntervalInBackground: true,
    enabled,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return {
    news: data || [],
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    isFetching,
    lastUpdated,
  };
}

export default useCompanyNewsPolling;