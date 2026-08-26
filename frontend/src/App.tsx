import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Navigate } from "react-router-dom";
import { LazyLoadingFallback } from "./components/LazyLoadingFallback";
import { LazyErrorBoundary } from "./components/LazyErrorBoundary";

// Code-split heavy authenticated routes — keeps initial bundle small.
const CampusApp = lazy(() => import("./pages/CampusApp.tsx"));
const StudentOnboarding = lazy(() => import("./pages/StudentOnboarding.tsx"));
const StudentProfile = lazy(() => import("./pages/StudentProfile.tsx"));
const UserProfile = lazy(() => import("./pages/UserProfile.tsx"));
const InterviewExperiences = lazy(() => import("./pages/InterviewExperiences.tsx"));
const InterviewPostFlow = lazy(() => import("./pages/InterviewPostFlow.tsx"));
const InterviewExperienceDetail = lazy(() => import("./pages/InterviewExperienceDetail.tsx"));
const InterviewCompare = lazy(() => import("./pages/InterviewCompare.tsx"));
const MentorDirectory = lazy(() => import("./pages/MentorDirectory.tsx"));
const Karma = lazy(() => import("./pages/Karma.tsx"));
const CompanyDetailScreen = lazy(() => import("./components/campus/screens/CompanyDetailScreen.tsx"));
const AdminModeration = lazy(() => import("./pages/AdminModeration.tsx"));
const Banned = lazy(() => import("./pages/Banned.tsx"));
const CoursePython = lazy(() => import("./pages/CoursePython.tsx"));
const CoursePythonModule = lazy(() => import("./pages/CoursePythonModule.tsx"));
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: { retry: 0 },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <LazyErrorBoundary>
              <Suspense fallback={<LazyLoadingFallback />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<StudentOnboarding />} />
                  <Route path="/campus" element={<CampusApp />} />
                  <Route path="/me" element={<StudentProfile />} />
                  <Route path="/u/:id" element={<UserProfile />} />
                  <Route path="/interview" element={<InterviewExperiences />} />
                  <Route path="/interview/new" element={<InterviewPostFlow />} />
                  <Route path="/interview/compare" element={<InterviewCompare />} />
                  <Route path="/interview/:id" element={<InterviewExperienceDetail />} />
                  <Route path="/mentors" element={<MentorDirectory />} />
                  <Route path="/karma" element={<Karma />} />
                  <Route path="/companies/:name" element={<CompanyDetailScreen />} />
                  <Route path="/admin/moderation" element={<AdminModeration />} />
                  <Route path="/banned" element={<Banned />} />
                  <Route path="/course/python" element={<CoursePython />} />
                  <Route path="/course/python/:moduleId" element={<CoursePythonModule />} />
                  <Route path="/app" element={<Navigate to="/campus" replace />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </LazyErrorBoundary>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
