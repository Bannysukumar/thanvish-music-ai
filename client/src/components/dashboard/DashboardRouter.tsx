import { Switch, Route } from "wouter";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "./DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import Generator from "@/pages/Generator";
import DashboardLibrary from "@/pages/dashboard/DashboardLibrary";
import DashboardProfile from "@/pages/dashboard/DashboardProfile";
import DashboardUpgrade from "@/pages/dashboard/DashboardUpgrade";
import NotFound from "@/pages/not-found";

/**
 * DashboardRouter component - handles all dashboard routes
 */
export function DashboardRouter() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <Switch>
          <Route path="/dashboard" component={DashboardHome} />
          <Route path="/dashboard/generate" component={Generator} />
          <Route path="/dashboard/library" component={DashboardLibrary} />
          <Route path="/dashboard/profile" component={DashboardProfile} />
          <Route path="/dashboard/upgrade" component={DashboardUpgrade} />
          <Route component={NotFound} />
        </Switch>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

