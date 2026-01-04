import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
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

