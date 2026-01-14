import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, FolderOpen, FileText, CheckCircle, TrendingUp, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function DirectorAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalRequests: 0,
    acceptedRequests: 0,
    completedProjects: 0,
    acceptanceRate: 0,
    completionRate: 0,
  });

  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch projects
      const projectsQuery = query(
        collection(db, "directorProjects"),
        where("directorId", "==", user.id)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const totalProjects = projectsSnapshot.size;
      
      const completedProjects = projectsSnapshot.docs.filter(
        (doc) => doc.data().status === "completed"
      ).length;

      // Fetch collaboration requests
      const collabRequestsQuery = query(
        collection(db, "collaborationRequests"),
        where("directorId", "==", user.id)
      );
      const collabRequestsSnapshot = await getDocs(collabRequestsQuery);
      
      // Fetch licensing requests
      const licensingRequestsQuery = query(
        collection(db, "licensingRequests"),
        where("directorId", "==", user.id)
      );
      const licensingRequestsSnapshot = await getDocs(licensingRequestsQuery);

      const totalRequests = collabRequestsSnapshot.size + licensingRequestsSnapshot.size;
      
      const acceptedCollab = collabRequestsSnapshot.docs.filter(
        (doc) => doc.data().status === "accepted"
      ).length;
      const approvedLicensing = licensingRequestsSnapshot.docs.filter(
        (doc) => doc.data().status === "approved"
      ).length;
      const acceptedRequests = acceptedCollab + approvedLicensing;

      const acceptanceRate = totalRequests > 0 
        ? (acceptedRequests / totalRequests) * 100 
        : 0;
      
      const completionRate = totalProjects > 0
        ? (completedProjects / totalProjects) * 100
        : 0;

      setStats({
        totalProjects,
        totalRequests,
        acceptedRequests,
        completedProjects,
        acceptanceRate,
        completionRate,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your project and request performance
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLocked && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Full Analytics Unlocked
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Upgrade to access detailed analytics and insights.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.location.href = "/dashboard/upgrade"}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground">
              Requests sent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptedRequests}</div>
            <p className="text-xs text-muted-foreground">
              Accepted by artists
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">
              Finished projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Request acceptance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Project completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Track performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics charts will appear here</p>
              <p className="text-sm mt-2">Detailed charts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

