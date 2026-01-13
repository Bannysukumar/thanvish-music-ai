import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "./DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import Generator from "@/pages/Generator";
import DashboardLibrary from "@/pages/dashboard/DashboardLibrary";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import DashboardUpgrade from "@/pages/dashboard/DashboardUpgrade";
import HoroscopeProfile from "@/pages/dashboard/HoroscopeProfile";
import MusicTherapyDashboard from "@/pages/dashboard/MusicTherapyDashboard";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

/**
 * Component to check onboarding status and redirect if needed
 */
function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!user || user.isGuest) {
        setIsChecking(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Only redirect if onboardingCompleted is explicitly false (new signup)
          // Allow access if it's undefined (existing users) or true (completed onboarding)
          if (userData.onboardingCompleted === false) {
            setLocation("/onboarding");
            return;
          }
        } else {
          // User document doesn't exist - this shouldn't happen but redirect just in case
          setLocation("/onboarding");
          return;
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [user, setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * DashboardRouter component - handles all dashboard routes
 */
export function DashboardRouter() {
  return (
    <ProtectedRoute>
      <OnboardingCheck>
        <DashboardLayout>
          <Switch>
            <Route path="/dashboard" component={DashboardHome} />
            <Route path="/dashboard/generate" component={Generator} />
            <Route path="/dashboard/library" component={DashboardLibrary} />
            <Route path="/dashboard/horoscope" component={HoroscopeProfile} />
            <Route path="/dashboard/music-therapy" component={MusicTherapyDashboard} />
            <Route path="/dashboard/profile" component={DashboardProfile} />
            <Route path="/dashboard/upgrade" component={DashboardUpgrade} />
            <Route component={NotFound} />
          </Switch>
        </DashboardLayout>
      </OnboardingCheck>
    </ProtectedRoute>
  );
}

