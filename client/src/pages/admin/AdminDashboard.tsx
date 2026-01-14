import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Music, 
  Settings, 
  Activity, 
  CreditCard, 
  GraduationCap,
  TrendingUp,
  Shield,
  BarChart3,
  FileText,
  Sparkles,
  Heart,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock
} from "lucide-react";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCompositions: 0,
    activeUsers: 0,
    apiConfigured: false,
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalTeachers: 0,
    totalArtists: 0,
    totalDirectors: 0,
    totalDoctors: 0,
    totalAstrologers: 0,
    totalStudents: 0,
    pendingApprovals: 0,
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

        // Fetch pending content for approvals count
        let pendingCount = 0;
        try {
          const pendingRes = await fetch("/api/admin/content/pending?type=course", {
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          });
          if (pendingRes.ok) {
            const pendingData = await pendingRes.json();
            pendingCount += (pendingData.items || []).length;
          }

          const pendingLessonsRes = await fetch("/api/admin/content/pending?type=lesson", {
            headers: {
              Authorization: `Bearer ${sessionId}`,
            },
          });
          if (pendingLessonsRes.ok) {
            const pendingLessonsData = await pendingLessonsRes.json();
            pendingCount += (pendingLessonsData.items || []).length;
          }
        } catch (error) {
          console.error("Error fetching pending content:", error);
        }

        const roleCounts = {
          music_teacher: allUsers.filter((u: any) => u.role === "music_teacher").length,
          artist: allUsers.filter((u: any) => u.role === "artist").length,
          music_director: allUsers.filter((u: any) => u.role === "music_director").length,
          doctor: allUsers.filter((u: any) => u.role === "doctor").length,
          astrologer: allUsers.filter((u: any) => u.role === "astrologer").length,
          student: allUsers.filter((u: any) => u.role === "student").length,
        };

        const activeSubs = allUsers.filter(
          (u: any) => u.subscriptionStatus === "active" || u.subscriptionStatus === "trial"
        ).length;

        setStats({
          totalUsers: allUsers.length,
          totalCompositions: compositions.length || 0,
          activeUsers: allUsers.filter((u: any) => !u.isBlocked && u.isActive).length,
          apiConfigured: settingsData.hasKey || false,
          totalSubscriptions: allUsers.filter((u: any) => u.subscriptionStatus).length,
          activeSubscriptions: activeSubs,
          totalTeachers: roleCounts.music_teacher,
          totalArtists: roleCounts.artist,
          totalDirectors: roleCounts.music_director,
          totalDoctors: roleCounts.doctor,
          totalAstrologers: roleCounts.astrologer,
          totalStudents: roleCounts.student,
          pendingApprovals: pendingCount,
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
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalSubscriptions} total
            </p>
          </CardContent>
        </Card>

        <Card className={stats.pendingApprovals > 0 ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            {stats.pendingApprovals > 0 ? (
              <AlertCircle className="h-4 w-4 text-amber-600" />
            ) : (
              <FileText className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApprovals > 0 ? (
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs"
                  onClick={() => setLocation("/admin/content")}
                >
                  Review now →
                </Button>
              ) : (
                "Awaiting review"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Users by Role</CardTitle>
          <CardDescription>
            Breakdown of users across all roles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <GraduationCap className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalTeachers}</div>
              <p className="text-xs text-muted-foreground">Teachers</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Music className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalArtists}</div>
              <p className="text-xs text-muted-foreground">Artists</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalDirectors}</div>
              <p className="text-xs text-muted-foreground">Directors</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Heart className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalDoctors}</div>
              <p className="text-xs text-muted-foreground">Doctors</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Sparkles className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.totalAstrologers}</div>
              <p className="text-xs text-muted-foreground">Astrologers</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/users")}
            >
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">User & Role Management</div>
                <div className="text-xs text-muted-foreground">Manage users and assign roles</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/subscriptions")}
            >
              <CreditCard className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Subscriptions</div>
                <div className="text-xs text-muted-foreground">Manage plans and payments</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/instruments")}
            >
              <Music className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Instruments</div>
                <div className="text-xs text-muted-foreground">Manage instrument library</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Analytics</div>
                <div className="text-xs text-muted-foreground">View platform insights</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/reports")}
            >
              <Shield className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Reports & Safety</div>
                <div className="text-xs text-muted-foreground">Handle complaints and safety</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6 justify-start items-start"
              onClick={() => setLocation("/admin/system")}
            >
              <Settings className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">System Settings</div>
                <div className="text-xs text-muted-foreground">Global controls and flags</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

