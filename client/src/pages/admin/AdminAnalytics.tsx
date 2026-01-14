import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, CreditCard, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Analytics {
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  subscriptions: {
    total: number;
    active: number;
  };
  generations: {
    total: number;
    mostUsedInstruments: Array<{ name: string; count: number }>;
    byModule: Record<string, number>;
  };
}

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch analytics");

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights Dashboard</h1>
          <p className="text-muted-foreground mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Analytics & Insights Dashboard</h1>
          <p className="text-muted-foreground mt-2">No analytics data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Insights Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Platform-wide analytics, trends, and conversion metrics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.users.total}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.subscriptions.active}</div>
            <p className="text-xs text-muted-foreground">
              of {analytics.subscriptions.total} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.generations.total}</div>
            <p className="text-xs text-muted-foreground">AI music generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Instrument</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.generations.mostUsedInstruments[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.generations.mostUsedInstruments[0]?.count || 0} uses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users by Role</CardTitle>
            <CardDescription>
              Breakdown of users across all roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.users.byRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generation by Module</CardTitle>
            <CardDescription>
              Music generation usage by module type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.generations.byModule).map(([module, count]) => (
                <div key={module} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{module}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Most Used Instruments</CardTitle>
          <CardDescription>
            Top instruments used for music generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.generations.mostUsedInstruments.length > 0 ? (
            <div className="space-y-2">
              {analytics.generations.mostUsedInstruments.map((instrument, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm">{instrument.name}</span>
                  <span className="font-semibold">{instrument.count} uses</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No instrument usage data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

