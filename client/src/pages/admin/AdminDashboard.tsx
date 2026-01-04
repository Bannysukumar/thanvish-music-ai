import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Music, Settings, Activity } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompositions: 0,
    activeUsers: 0,
    apiConfigured: false,
  });

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const sessionId = localStorage.getItem("adminSession");
        if (!sessionId) return;

        // Fetch users count
        const usersRes = await fetch("/api/admin/users", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
        const usersData = await usersRes.json();
        const allUsers = usersData.users || [];
        
        // Fetch compositions count
        const compositionsRes = await fetch("/api/compositions");
        const compositions = await compositionsRes.json();

        // Check API key status
        const settingsRes = await fetch("/api/admin/settings/api-key", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
        const settingsData = await settingsRes.json();

        setStats({
          totalUsers: allUsers.length,
          totalCompositions: compositions.length || 0,
          activeUsers: allUsers.filter((u: any) => !u.isBlocked && u.isActive).length,
          apiConfigured: settingsData.hasKey || false,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your application settings and users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compositions</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompositions}</div>
            <p className="text-xs text-muted-foreground">
              Total generated
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Status</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.apiConfigured ? "✓" : "✗"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.apiConfigured ? "Configured" : "Not configured"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-muted-foreground">
                View and manage all registered users. Block or deactivate users as needed.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">API Settings</h3>
              <p className="text-sm text-muted-foreground">
                Update API keys and configure application settings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

