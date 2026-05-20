import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, Loader2, X } from 'lucide-react';
import { searchCompanies, type Company } from '@/integrations/external/companyApi';

interface CompanySearchProps {
  onSelect?: (company: Company) => void;
  placeholder?: string;
  className?: string;
}

export function CompanySearch({
  onSelect,
  placeholder = 'Search companies...',
  className = '',
}: CompanySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Query
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['companySearch', debouncedQuery],
    queryFn: () => searchCompanies(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelect = useCallback(
    (company: Company) => {
      onSelect?.(company);
      setQuery(company.name);
      setIsOpen(false);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }, []);

  // Click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = data?.companies || [];
  const showResults = isOpen && (results.length > 0 || isLoading || isFetching);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Terminal-style search input */}
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center pointer-events-none">
          <Search className="h-4 w-4 text-purple-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-10 bg-black/40 border border-white/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all font-mono"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isFetching && (
          <div className="absolute right-10 top-0 bottom-0 w-6 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-purple-400" />
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg shadow-2xl max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-white/60 text-sm font-mono">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              Scanning...
            </div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((company) => (
                <li key={company.id}>
                  <button
                    onClick={() => handleSelect(company)}
                    className="w-full px-3 py-2 flex items-center gap-3 text-left hover:bg-purple-500/20 transition-colors group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#1a1a2e] to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-purple-300">
                        {company.name}
                      </p>
                      {company.industry && (
                        <p className="text-xs text-white/50 truncate">{company.industry}</p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-white/40 text-sm font-mono">
              No matches found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CompanySearch;