// Company News Types
export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  website?: string;
  description?: string;
}

export interface CompanyNews {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  source: string;
}

export interface CompanyReview {
  id: string;
  companyId: string;
  companyName: string;
  rating: number; // 1-5
  title?: string;
  pros?: string;
  cons?: string;
  advice?: string;
  author?: string;
  role?: string;
  date: string;
  helpfulCount?: number;
}

export interface CompanySearchResult {
  companies: Company[];
  totalResults: number;
}

export interface NewsSearchResult {
  articles: CompanyNews[];
  totalResults: number;
  nextPage?: number;
}

export interface ReviewsSearchResult {
  reviews: CompanyReview[];
  totalResults: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}