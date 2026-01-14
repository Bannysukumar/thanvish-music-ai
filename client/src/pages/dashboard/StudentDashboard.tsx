import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap, 
  BookOpen, 
  Music, 
  Sparkles,
  Heart,
  FileText,
  Play,
  Clock,
  TrendingUp,
  Star
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    lessonsCompleted: 0,
    practiceStreak: 0,
    generatedTracks: 0,
    therapySessionsCompleted: 0,
    horoscopeMusicGenerated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is student
    if (!user || user.role !== "student") {
      setLocation("/dashboard");
      return;
    }

    fetchStats();
  }, [user, setLocation]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch courses enrolled
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.id)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const coursesEnrolled = enrollmentsSnapshot.size;

      // Placeholder for other stats (would need to be calculated from user activity)
      setStats({
        coursesEnrolled,
        lessonsCompleted: 0,
        practiceStreak: 0,
        generatedTracks: 0,
        therapySessionsCompleted: 0,
        horoscopeMusicGenerated: 0,
      });
    } catch (error) {
      console.error("Error fetching student stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          Student Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Welcome to your Student Dashboard. Learn music, practice instruments, and explore personalized music.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coursesEnrolled}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lessonsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Completed lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Practice Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.practiceStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generated Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.generatedTracks}</div>
            <p className="text-xs text-muted-foreground">
              Music created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Therapy Sessions</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.therapySessionsCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Sessions completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horoscope Music</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.horoscopeMusicGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Horoscope tracks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Start learning, practicing, or creating music
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/student/educational-music")}
            >
              <BookOpen className="h-5 w-5" />
              <span>Continue Learning</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/student/practice")}
            >
              <Play className="h-5 w-5" />
              <span>Start Practice</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/generate")}
            >
              <Music className="h-5 w-5" />
              <span>Generate Music</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/music-therapy")}
            >
              <Heart className="h-5 w-5" />
              <span>Start Therapy</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/horoscope")}
            >
              <Sparkles className="h-5 w-5" />
              <span>Horoscope Music</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your recent learning and music creation activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity yet. Start learning to see your progress here!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

