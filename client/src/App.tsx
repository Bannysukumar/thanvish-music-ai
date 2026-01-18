import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { SplashScreen } from "@/components/SplashScreen";
import { AuthProvider } from "@/contexts/AuthContext";
import { HoroscopeProvider } from "@/contexts/HoroscopeContext";
import { DashboardRouter } from "@/components/dashboard/DashboardRouter";
import { AdminRouter } from "@/components/admin/AdminRouter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Vision from "@/pages/Vision";
import Learn from "@/pages/Learn";
import LearnModuleDetail from "@/pages/LearnModuleDetail";
import MusicTherapy from "@/pages/MusicTherapy";
import Blog from "@/pages/Blog";
import BlogPostDetail from "@/pages/BlogPostDetail";
import TeamMembers from "@/pages/TeamMembers";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";

function PublicRouter() {
  return (
    <Layout>
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/vision" component={Vision} />
      <Route path="/learn/:id" component={LearnModuleDetail} />
      <Route path="/learn" component={Learn} />
      <Route path="/music-therapy" component={MusicTherapy} />
      <Route path="/blog/:id" component={BlogPostDetail} />
      <Route path="/blog" component={Blog} />
      <Route path="/team" component={TeamMembers} />
      <Route path="/contact" component={Contact} />
      <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin routes - Master Admin Panel */}
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/login" component={AdminRouter} />
      <Route path="/admin/dashboard" component={AdminRouter} />
      <Route path="/admin/users" component={AdminRouter} />
      <Route path="/admin/subscriptions" component={AdminRouter} />
      <Route path="/admin/content" component={AdminRouter} />
      <Route path="/admin/instruments" component={AdminRouter} />
      <Route path="/admin/generation" component={AdminRouter} />
      <Route path="/admin/horoscope" component={AdminRouter} />
      <Route path="/admin/therapy" component={AdminRouter} />
      <Route path="/admin/artists" component={AdminRouter} />
      <Route path="/admin/ebooks" component={AdminRouter} />
      <Route path="/admin/reports" component={AdminRouter} />
      <Route path="/admin/analytics" component={AdminRouter} />
      <Route path="/admin/system" component={AdminRouter} />
      <Route path="/admin/access-control" component={AdminRouter} />
      <Route path="/admin/role-menu-management" component={AdminRouter} />
      <Route path="/admin/notifications" component={AdminRouter} />
      <Route path="/admin/security" component={AdminRouter} />
      <Route path="/admin/logs" component={AdminRouter} />
      <Route path="/admin/audit-logs" component={AdminRouter} />
      <Route path="/admin/credits" component={AdminRouter} />
      <Route path="/admin/settings" component={AdminRouter} />

      {/* Onboarding route - protected */}
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>

      {/* Protected dashboard routes - all dashboard paths */}
      <Route path="/dashboard" component={DashboardRouter} />
      <Route path="/dashboard/generate" component={DashboardRouter} />
      <Route path="/dashboard/library" component={DashboardRouter} />
      <Route path="/dashboard/browse-music" component={DashboardRouter} />
      <Route path="/dashboard/horoscope" component={DashboardRouter} />
      <Route path="/dashboard/music-therapy" component={DashboardRouter} />
      <Route path="/dashboard/profile" component={DashboardRouter} />
      <Route path="/dashboard/upgrade" component={DashboardRouter} />
      {/* Teacher routes - more specific routes first */}
      <Route path="/dashboard/teacher/courses/new" component={DashboardRouter} />
      <Route path="/dashboard/teacher/courses" component={DashboardRouter} />
      <Route path="/dashboard/teacher/lessons/upload" component={DashboardRouter} />
      <Route path="/dashboard/teacher/lessons" component={DashboardRouter} />
      <Route path="/dashboard/teacher/students" component={DashboardRouter} />
      <Route path="/dashboard/teacher/earnings" component={DashboardRouter} />
      <Route path="/dashboard/teacher/settings" component={DashboardRouter} />
      <Route path="/dashboard/teacher/analytics" component={DashboardRouter} />
      <Route path="/dashboard/teacher" component={DashboardRouter} />
      {/* Artist routes - more specific routes first */}
      <Route path="/dashboard/artist/upload" component={DashboardRouter} />
      <Route path="/dashboard/artist/albums/new" component={DashboardRouter} />
      <Route path="/dashboard/artist/albums" component={DashboardRouter} />
      <Route path="/dashboard/artist/requests" component={DashboardRouter} />
      <Route path="/dashboard/artist/licensing" component={DashboardRouter} />
      <Route path="/dashboard/artist/analytics" component={DashboardRouter} />
      <Route path="/dashboard/artist/settings" component={DashboardRouter} />
      <Route path="/dashboard/artist/library" component={DashboardRouter} />
      <Route path="/dashboard/artist" component={DashboardRouter} />
      {/* Director routes - more specific routes first */}
      <Route path="/dashboard/director/projects/new" component={DashboardRouter} />
      <Route path="/dashboard/director/projects/:id" component={DashboardRouter} />
      <Route path="/dashboard/director/projects" component={DashboardRouter} />
      <Route path="/dashboard/director/discovery" component={DashboardRouter} />
      <Route path="/dashboard/director/shortlists" component={DashboardRouter} />
      <Route path="/dashboard/director/requests" component={DashboardRouter} />
      <Route path="/dashboard/director/approvals" component={DashboardRouter} />
      <Route path="/dashboard/director/settings" component={DashboardRouter} />
      <Route path="/dashboard/director/analytics" component={DashboardRouter} />
      <Route path="/dashboard/director" component={DashboardRouter} />
      {/* Doctor routes - more specific routes first */}
      <Route path="/dashboard/doctor/programs/new" component={DashboardRouter} />
      <Route path="/dashboard/doctor/programs/:id" component={DashboardRouter} />
      <Route path="/dashboard/doctor/programs" component={DashboardRouter} />
      <Route path="/dashboard/doctor/templates/new" component={DashboardRouter} />
      <Route path="/dashboard/doctor/templates/:id" component={DashboardRouter} />
      <Route path="/dashboard/doctor/templates" component={DashboardRouter} />
      <Route path="/dashboard/doctor/articles/new" component={DashboardRouter} />
      <Route path="/dashboard/doctor/articles/:id" component={DashboardRouter} />
      <Route path="/dashboard/doctor/articles" component={DashboardRouter} />
      <Route path="/dashboard/doctor/analytics" component={DashboardRouter} />
      <Route path="/dashboard/doctor/settings" component={DashboardRouter} />
      <Route path="/dashboard/doctor" component={DashboardRouter} />
      {/* Astrologer routes - more specific routes first */}
      <Route path="/dashboard/astrologer/templates/new" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/templates/:id" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/templates" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/recommendations/new" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/recommendations/:id" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/recommendations" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/posts/new" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/posts/:id" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/posts" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/clients" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/readings" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/requests" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/analytics" component={DashboardRouter} />
      <Route path="/dashboard/astrologer/settings" component={DashboardRouter} />
      <Route path="/dashboard/astrologer" component={DashboardRouter} />
      {/* Student routes */}
      <Route path="/dashboard/student/courses" component={DashboardRouter} />
      <Route path="/dashboard/student/lessons" component={DashboardRouter} />
      <Route path="/dashboard/student/progress" component={DashboardRouter} />
      <Route path="/dashboard/student/educational-music" component={DashboardRouter} />
      <Route path="/dashboard/student/instrumental-education" component={DashboardRouter} />
      <Route path="/dashboard/student/practice" component={DashboardRouter} />
      <Route path="/dashboard/student/ebooks" component={DashboardRouter} />
      <Route path="/dashboard/student/saved" component={DashboardRouter} />
      <Route path="/dashboard/student/settings" component={DashboardRouter} />
      <Route path="/dashboard/student" component={DashboardRouter} />

      {/* Public routes with Layout */}
      <Route component={PublicRouter} />
    </Switch>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HoroscopeProvider>
          <TooltipProvider>
            {showSplash ? (
              <SplashScreen onComplete={() => setShowSplash(false)} />
            ) : (
                <Router />
            )}
            <Toaster />
          </TooltipProvider>
        </HoroscopeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
