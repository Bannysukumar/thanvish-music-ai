import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { 
  BarChart3, 
  TrendingUp, 
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";

interface AnalyticsData {
  totalCourses: number;
  totalLessons: number;
  totalStudents: number;
  totalEnrollments: number;
  averageCompletionRate: number;
  coursesByStatus: {
    draft: number;
    pending: number;
    live: number;
    rejected: number;
  };
}

export default function Analytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalCourses: 0,
    totalLessons: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    averageCompletionRate: 0,
    coursesByStatus: {
      draft: 0,
      pending: 0,
      live: 0,
      rejected: 0,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    fetchAnalytics();
  }, [user, setLocation, timeRange]);

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch courses
      const coursesRef = collection(db, "courses");
      const coursesQuery = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      
      let totalCourses = 0;
      let totalLessons = 0;
      const coursesByStatus = {
        draft: 0,
        pending: 0,
        live: 0,
        rejected: 0,
      };

      coursesSnapshot.forEach((doc) => {
        const courseData = doc.data();
        totalCourses++;
        const status = courseData.status || "draft";
        if (status in coursesByStatus) {
          coursesByStatus[status as keyof typeof coursesByStatus]++;
        }
        
        // Count lessons
        if (courseData.modules && Array.isArray(courseData.modules)) {
          courseData.modules.forEach((module: any) => {
            if (module.lessons && Array.isArray(module.lessons)) {
              totalLessons += module.lessons.length;
            }
          });
        }
      });

      // Fetch enrollments
      const courseIds: string[] = [];
      coursesSnapshot.forEach((doc) => {
        courseIds.push(doc.id);
      });

      let totalEnrollments = 0;
      let totalCompletion = 0;
      let enrollmentCount = 0;

      if (courseIds.length > 0) {
        try {
          const enrollmentsRef = collection(db, "enrollments");
          const enrollmentsQuery = query(
            enrollmentsRef,
            where("courseId", "in", courseIds.slice(0, 10))
          );
          const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
          
          enrollmentsSnapshot.forEach((doc) => {
            const enrollmentData = doc.data();
            totalEnrollments++;
            enrollmentCount++;
            totalCompletion += enrollmentData.progress || 0;
          });
        } catch (error) {
          console.log("No enrollments found");
        }
      }

      // Get unique students
      const uniqueStudents = new Set<string>();
      try {
        const enrollmentsRef = collection(db, "enrollments");
        const enrollmentsQuery = query(
          enrollmentsRef,
          where("courseId", "in", courseIds.slice(0, 10))
        );
        const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
        enrollmentsSnapshot.forEach((doc) => {
          uniqueStudents.add(doc.data().studentId);
        });
      } catch (error) {
        // Ignore
      }

      const averageCompletionRate = enrollmentCount > 0 
        ? totalCompletion / enrollmentCount 
        : 0;

      setAnalytics({
        totalCourses,
        totalLessons,
        totalStudents: uniqueStudents.size,
        totalEnrollments,
        averageCompletionRate,
        coursesByStatus,
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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your teaching performance and student engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Published courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Lessons created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Unique students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageCompletionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Course completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Course Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Course Status Breakdown</CardTitle>
          <CardDescription>
            Distribution of your courses by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{analytics.coursesByStatus.draft}</div>
              <div className="text-sm text-muted-foreground mt-1">Draft</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{analytics.coursesByStatus.pending}</div>
              <div className="text-sm text-muted-foreground mt-1">Pending</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.coursesByStatus.live}</div>
              <div className="text-sm text-muted-foreground mt-1">Live</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analytics.coursesByStatus.rejected}</div>
              <div className="text-sm text-muted-foreground mt-1">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enrollment Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Statistics</CardTitle>
          <CardDescription>
            Student enrollment and engagement metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Total Enrollments</div>
                  <div className="text-2xl font-bold mt-1">{analytics.totalEnrollments}</div>
                </div>
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">Average Completion</div>
                  <div className="text-2xl font-bold mt-1">{analytics.averageCompletionRate.toFixed(1)}%</div>
                </div>
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                Analytics Information
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                Analytics are calculated based on your courses, lessons, and student enrollments. 
                Data is updated in real-time as students enroll and complete your courses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

