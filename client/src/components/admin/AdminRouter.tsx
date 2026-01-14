import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminContent from "@/pages/admin/AdminContent";
import AdminInstruments from "@/pages/admin/AdminInstruments";
import AdminGeneration from "@/pages/admin/AdminGeneration";
import AdminHoroscope from "@/pages/admin/AdminHoroscope";
import AdminTherapy from "@/pages/admin/AdminTherapy";
import AdminArtists from "@/pages/admin/AdminArtists";
import AdminEBooks from "@/pages/admin/AdminEBooks";
import AdminReports from "@/pages/admin/AdminReports";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSystem from "@/pages/admin/AdminSystem";
import AdminAccessControl from "@/pages/admin/AdminAccessControl";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminSecurity from "@/pages/admin/AdminSecurity";
import AdminAuditLogs from "@/pages/admin/AdminAuditLogs";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminCredits from "@/pages/admin/AdminCredits";
import AdminSettings from "@/pages/admin/AdminSettings";

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    const sessionId = localStorage.getItem("adminSession");
    if (!sessionId) {
      setLocation("/admin/login");
      return;
    }

    // Verify session
    fetch("/api/admin/verify", {
      headers: {
        Authorization: `Bearer ${sessionId}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          localStorage.removeItem("adminSession");
          setLocation("/admin/login");
        }
      })
      .catch(() => {
        localStorage.removeItem("adminSession");
        setLocation("/admin/login");
      });
  }, [setLocation]);

  return <>{children}</>;
}

export function AdminRouter() {
  return (
    <Switch>
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/users">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminUsers />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/subscriptions">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminSubscriptions />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/content">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminContent />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/instruments">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminInstruments />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/generation">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminGeneration />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/horoscope">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminHoroscope />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/therapy">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminTherapy />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/artists">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminArtists />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/ebooks">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminEBooks />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminReports />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminAnalytics />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/system">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminSystem />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/access-control">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminAccessControl />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/notifications">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminNotifications />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/security">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminSecurity />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/logs">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminLogs />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/audit-logs">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminAuditLogs />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/credits">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminCredits />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedAdminRoute>
          <AdminLayout>
            <AdminSettings />
          </AdminLayout>
        </ProtectedAdminRoute>
      </Route>
      <Route path="/admin">
        {() => {
          const [_, setLocation] = useLocation();
          useEffect(() => {
            const sessionId = localStorage.getItem("adminSession");
            if (sessionId) {
              setLocation("/admin/dashboard");
            } else {
              setLocation("/admin/login");
            }
          }, [setLocation]);
          return null;
        }}
      </Route>
    </Switch>
  );
}

