import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import CampusApp from "./pages/CampusApp.tsx";
import StudentOnboarding from "./pages/StudentOnboarding.tsx";
import StudentProfile from "./pages/StudentProfile.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import InterviewExperiences from "./pages/InterviewExperiences.tsx";
import InterviewPostFlow from "./pages/InterviewPostFlow.tsx";
import InterviewExperienceDetail from "./pages/InterviewExperienceDetail.tsx";
import InterviewCompare from "./pages/InterviewCompare.tsx";
import MentorDirectory from "./pages/MentorDirectory.tsx";
import Karma from "./pages/Karma.tsx";
import Passport from "./pages/Passport.tsx";
import RecruiterDashboard from "./pages/RecruiterDashboard.tsx";
import RecruiterStudentDetail from "./pages/RecruiterStudentDetail.tsx";
import { Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
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
            <Route path="/passport/:slug" element={<Passport />} />
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/student/:id" element={<RecruiterStudentDetail />} />
            <Route path="/app" element={<Navigate to="/campus" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
