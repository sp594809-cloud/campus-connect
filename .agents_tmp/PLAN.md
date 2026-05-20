# 1. OBJECTIVE
Create a real-time company news and reviews feature that allows students to search and view up-to-date company information from external APIs, integrated into the Campus Connect platform.

# 2. CONTEXT SUMMARY
- **Platform**: Campus Connect (React + TypeScript + Vite)
- **Tech Stack**: React, TypeScript, Supabase, Firebase, React Router, TanStack Query
- **Data Sources**: 
  - News API (e.g., NewsAPI.org or similar) for company news
  - External review APIs (Glassdoor/Indeed style aggregators) for company reviews
- **Real-time**: Auto-refresh polling every 3-5 minutes for live updates
- **Integration**: New dedicated screen in Campus app as a tab (e.g., "Companies" tab) or integrated into Discover screen via navigation
- **Search**: Company-wise search functionality

# 3. APPROACH OVERVIEW
Create a new "Companies" tab in the CampusApp with:
- Search bar for company search
- Auto-refreshing news feed grouped by company
- Company reviews section from external APIs
- Polling mechanism for real-time updates (every 3-5 minutes)

This approach is selected because:
- Keeps the feature modular and reusable
- Aligns with existing CampusApp tab structure (Home, Discover, Communities, Events, etc.)
- External APIs ensure fresh, up-to-date content without manual updates
- Company-wise grouping matches student/research needs

# 4. IMPLEMENTATION STEPS

**Step 1: Set up API integration and types**
- Goal: Create API client and TypeScript interfaces for company news/reviews
- Method: 
  - Add required API keys to environment variables
  - Create `src/integrations/external/companyApi.ts` for news API calls
  - Create `src/integrations/external/reviewsApi.ts` for review API calls
  - Define TypeScript interfaces: `Company`, `CompanyNews`, `CompanyReview`
- Reference: New files in `src/integrations/external/`

**Step 2: Create real-time polling hook**
- Goal: Enable auto-refresh for real-time updates
- Method:
  - Create custom hook `useCompanyNewsPolling.ts` using TanStack Query's polling
  - Configurable refresh interval (default 3 minutes)
  - Handle loading states and error fallbacks
- Reference: New file in `src/hooks/`

**Step 3: Build Company search component**
- Goal: Allow students to search for specific companies
- Method:
  - Create `CompanySearch.tsx` component with search input
  - Debounced search to avoid excessive API calls
  - Display search results in a dropdown/list
- Reference: New component in `src/components/companies/`

**Step 4: Build Company news card component**
- Goal: Display news articles grouped by company
- Method:
  - Create `CompanyNewsCard.tsx` component
  - Show company logo, headline, publication date, source
  - Link to full article
- Reference: New component in `src/components/companies/`

**Step 5: Build Company reviews component**
- Goal: Display company reviews from external APIs
- Method:
  - Create `CompanyReviewsList.tsx` component
  - Show review ratings, summary, date
  - Handle empty states
- Reference: New component in `src/components/companies/`

**Step 6: Create Companies screen page**
- Goal: Main screen displaying company news and reviews with search
- Method:
  - Create `CompaniesScreen.tsx` in `src/components/campus/screens/`
  - Combine search, news feed, and reviews in unified UI
  - Wire up polling for real-time updates
- Reference: New file in `src/components/campus/screens/`

**Step 7: Add "Companies" tab to CampusApp**
- Goal: Integrate the Companies screen into navigation
- Method:
  - Update `CampusApp.tsx` to include "companies" Tab type
  - Add BottomNav option for "companies" tab with icon
  - Wire up navigation to CompaniesScreen
- Reference: `src/pages/CampusApp.tsx`, `src/components/campus/BottomNav.tsx`

**Step 8: Add routing for company detail**
- Goal: Allow viewing detail for a specific company
- Method:
  - Add route `/companies/:name` for company detail view
  - Create `CompanyDetailScreen.tsx` with full news/reviews for that company
- Reference: New file, update `App.tsx` routes

# 5. TESTING AND VALIDATION
- **Search functionality**: Type company name → results appear in dropdown within 500ms
- **Real-time updates**: News automatically refreshes every 3-5 minutes without user action
- **Display**: News cards show company logo, headline, date, source correctly
- **Reviews**: Company reviews display with ratings and summaries
- **Navigation**: Companies tab appears in Campus app bottom navigation
- **Error handling**: Graceful fallback when API fails (show cached data or empty state)
- **Performance**: Initial load under 2 seconds, smooth scrolling
