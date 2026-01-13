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
      {/* Admin routes */}
      <Route path="/admin" component={AdminRouter} />
      <Route path="/admin/login" component={AdminRouter} />
      <Route path="/admin/dashboard" component={AdminRouter} />
      <Route path="/admin/users" component={AdminRouter} />
      <Route path="/admin/logs" component={AdminRouter} />
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
      <Route path="/dashboard/horoscope" component={DashboardRouter} />
      <Route path="/dashboard/music-therapy" component={DashboardRouter} />
      <Route path="/dashboard/profile" component={DashboardRouter} />
      <Route path="/dashboard/upgrade" component={DashboardRouter} />

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
