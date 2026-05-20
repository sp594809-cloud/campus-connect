import type {
  Company,
  CompanyNews,
  CompanyReview,
  CompanySearchResult,
  NewsSearchResult,
  ReviewsSearchResult,
} from './types';

// Environment variables for API keys
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_KEY;
const NEWS_API_BASE_URL = import.meta.env.VITE_NEWS_API_BASE_URL || 'https://newsapi.org/v2';
const REVIEW_API_KEY = import.meta.env.VITE_REVIEW_API_KEY;

// Mock data for demo purposes - in production, replace with actual API calls
const MOCK_COMPANIES: Company[] = [
  { id: '1', name: 'Google', logo: 'https://logo.clearbit.com/google.com', industry: 'Technology', website: 'https://google.com' },
  { id: '2', name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com', industry: 'Technology', website: 'https://microsoft.com' },
  { id: '3', name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com', industry: 'E-commerce', website: 'https://amazon.com' },
  { id: '4', name: 'Apple', logo: 'https://logo.clearbit.com/apple.com', industry: 'Technology', website: 'https://apple.com' },
  { id: '5', name: 'Meta', logo: 'https://logo.clearbit.com/meta.com', industry: 'Technology', website: 'https://meta.com' },
  { id: '6', name: 'Netflix', logo: 'https://logo.clearbit.com/netflix.com', industry: 'Entertainment', website: 'https://netflix.com' },
  { id: '7', name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', industry: 'Automotive', website: 'https://tesla.com' },
  { id: '8', name: 'Goldman Sachs', logo: 'https://logo.clearbit.com/goldmansachs.com', industry: 'Finance', website: 'https://goldmansachs.com' },
];

const MOCK_NEWS: CompanyNews[] = [
  {
    id: '1',
    companyId: '1',
    companyName: 'Google',
    title: 'Google Announces New AI Features for Search',
    description: 'Google is rolling out new AI-powered features to improve search results and user experience.',
    url: 'https://example.com/news/1',
    imageUrl: 'https://picsum.photos/seed/news1/400/200',
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    source: 'TechNews',
  },
  {
    id: '2',
    companyId: '2',
    companyName: 'Microsoft',
    title: 'Microsoft Cloud Revenue Hits Record High',
    description: 'Microsoft Azure continues to grow with strong enterprise adoption.',
    url: 'https://example.com/news/2',
    imageUrl: 'https://picsum.photos/seed/news2/400/200',
    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    source: 'CloudWeekly',
  },
  {
    id: '3',
    companyId: '3',
    companyName: 'Amazon',
    title: 'Amazon Expands Same-Day Delivery to More Cities',
    description: 'Amazon announces expansion of same-day delivery service to 15 new metropolitan areas.',
    url: 'https://example.com/news/3',
    imageUrl: 'https://picsum.photos/seed/news3/400/200',
    publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    source: 'RetailToday',
  },
  {
    id: '4',
    companyId: '4',
    companyName: 'Apple',
    title: 'Apple Unveils New MacBook Line with M4 Chip',
    description: 'Apple announces next generation MacBooks featuring the new M4 processor.',
    url: 'https://example.com/news/4',
    imageUrl: 'https://picsum.photos/seed/news4/400/200',
    publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    source: 'AppleInsider',
  },
  {
    id: '5',
    companyId: '5',
    companyName: 'Meta',
    title: 'Meta Launches New VR Headset for Enterprise',
    description: 'Meta introduces Quest Pro for business applications and collaboration.',
    url: 'https://example.com/news/5',
    imageUrl: 'https://picsum.photos/seed/news5/400/200',
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    source: 'VRFocus',
  },
  {
    id: '6',
    companyId: '1',
    companyName: 'Google',
    title: 'Google Waymo Expands Autonomous Ride Service',
    description: 'Waymo service now available in three new major cities.',
    url: 'https://example.com/news/6',
    imageUrl: 'https://picsum.photos/seed/news6/400/200',
    publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    source: 'AutoTech',
  },
  {
    id: '7',
    companyId: '7',
    companyName: 'Tesla',
    title: 'Tesla Cybertruck Deliveries Begin',
    description: 'Tesla starts delivering the long-awaited Cybertruck to customers.',
    url: 'https://example.com/news/7',
    imageUrl: 'https://picsum.photos/seed/news7/400/200',
    publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    source: 'EVNews',
  },
  {
    id: '8',
    companyId: '8',
    companyName: 'Goldman Sachs',
    title: 'Goldman Sachs Reports Strong Q4 Earnings',
    description: 'Goldman Sachs beats expectations with record quarterly profits.',
    url: 'https://example.com/news/8',
    imageUrl: 'https://picsum.photos/seed/news8/400/200',
    publishedAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    source: 'FinanceWire',
  },
];

const MOCK_REVIEWS: CompanyReview[] = [
  {
    id: '1',
    companyId: '1',
    companyName: 'Google',
    rating: 4.5,
    title: 'Great work-life balance',
    pros: 'Excellent benefits, smart coworkers, meaningful work',
    cons: 'Can be bureaucratic at times',
    advice: 'Focus on impact and results rather than process',
    role: 'Software Engineer',
    date: '2024-01-15',
    helpfulCount: 234,
  },
  {
    id: '2',
    companyId: '1',
    companyName: 'Google',
    rating: 4.0,
    title: 'Good place to grow',
    pros: 'Learning opportunities, great culture',
    cons: 'Performance reviews can be stressful',
    role: 'Product Manager',
    date: '2024-01-10',
    helpfulCount: 156,
  },
  {
    id: '3',
    companyId: '2',
    companyName: 'Microsoft',
    rating: 4.2,
    title: 'Inclusive and supportive',
    pros: 'Work-life balance, inclusive culture, good pay',
    cons: 'Some teams have heavy workloads',
    advice: 'Choose your team wisely',
    role: 'Data Scientist',
    date: '2024-01-12',
    helpfulCount: 189,
  },
  {
    id: '4',
    companyId: '3',
    companyName: 'Amazon',
    rating: 3.5,
    title: 'Fast-paced environment',
    pros: 'Great learning opportunities, career growth, fast节奏',
    cons: 'High pressure, work-life balance challenges',
    role: 'Software Development Engineer',
    date: '2024-01-08',
    helpfulCount: 312,
  },
  {
    id: '5',
    companyId: '4',
    companyName: 'Apple',
    rating: 4.3,
    title: 'Innovative culture',
    pros: 'Cutting-edge work, brilliant peers, prestige',
    cons: 'SECrets culture can be limiting',
    role: 'Hardware Engineer',
    date: '2024-01-05',
    helpfulCount: 245,
  },
  {
    id: '6',
    companyId: '5',
    companyName: 'Meta',
    rating: 3.8,
    title: 'Learn fast or sink',
    pros: 'Fast growth, great perks, smart people',
    cons: 'Uncertainty due to layoffs, high pressure',
    role: 'Frontend Developer',
    date: '2024-01-02',
    helpfulCount: 178,
  },
  {
    id: '7',
    companyId: '7',
    companyName: 'Tesla',
    rating: 3.9,
    title: 'Mission-driven work',
    pros: 'Meaningful mission, fast-paced, innovative',
    cons: 'Long hours, intense culture',
    advice: 'Be ready for a demanding environment',
    role: 'Controls Engineer',
    date: '2023-12-28',
    helpfulCount: 156,
  },
  {
    id: '8',
    companyId: '8',
    companyName: 'Goldman Sachs',
    rating: 4.0,
    title: 'Prestigious but demanding',
    pros: 'Great compensation, learning, prestige',
    cons: 'Very demanding hours',
    role: 'Analyst',
    date: '2023-12-25',
    helpfulCount: 134,
  },
];

// Search companies
export async function searchCompanies(query: string): Promise<CompanySearchResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  const normalizedQuery = query.toLowerCase().trim();
  const companies = MOCK_COMPANIES.filter((c) =>
    c.name.toLowerCase().includes(normalizedQuery) ||
    c.industry?.toLowerCase().includes(normalizedQuery)
  );

  return {
    companies: companies.length > 0 ? companies : MOCK_COMPANIES.slice(0, 4),
    totalResults: companies.length || MOCK_COMPANIES.length,
  };
}

// Get company by name
export async function getCompanyByName(name: string): Promise<Company | null> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_COMPANIES.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
}

// Get news for a company
export async function getCompanyNews(
  companyId?: string,
  page: number = 1
): Promise<NewsSearchResult> {
  await new Promise((resolve) => setTimeout(resolve, 400));

  let articles = MOCK_NEWS;
  if (companyId) {
    articles = MOCK_NEWS.filter((n) => n.companyId === companyId);
  }

  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const pagedArticles = articles.slice(start, start + pageSize);

  return {
    articles: pagedArticles,
    totalResults: articles.length,
    nextPage: start + pageSize < articles.length ? page + 1 : undefined,
  };
}

// Get all latest news (grouped by company)
export async function getLatestNews(): Promise<CompanyNews[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return [...MOCK_NEWS].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

// Get reviews for a company
export async function getCompanyReviews(
  companyId: string,
  page: number = 1
): Promise<ReviewsSearchResult> {
  await new Promise((resolve) => setTimeout(resolve, 350));

  const reviews = MOCK_REVIEWS.filter((r) => r.companyId === companyId);
  const pageSize = 5;
  const start = (page - 1) * pageSize;
  const pagedReviews = reviews.slice(start, start + pageSize);

  return {
    reviews: pagedReviews,
    totalResults: reviews.length,
  };
}

// Get average rating for a company
export async function getCompanyRating(companyId: string): Promise<number> {
  const reviews = MOCK_REVIEWS.filter((r) => r.companyId === companyId);
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

// Get all companies
export async function getAllCompanies(): Promise<Company[]> {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return MOCK_COMPANIES;
}