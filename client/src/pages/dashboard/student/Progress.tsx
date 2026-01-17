import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, TrendingUp, Award, Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { format } from "date-fns";

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  teacherName?: string;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  enrolledAt: any;
  lastActiveAt?: any;
}

export default function StudentProgress() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [overallStats, setOverallStats] = useState({
    totalCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageProgress: 0,
  });

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }
    fetchProgress();
  }, [user]);

  const fetchProgress = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch enrollments
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.id)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const courseProgressList: CourseProgress[] = [];

      for (const enrollmentDoc of enrollmentsSnapshot.docs) {
        const enrollmentData = enrollmentDoc.data();
        const courseId = enrollmentData.courseId;

        // Fetch course details
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();

          // Calculate total lessons
          let totalLessons = 0;
          if (courseData.modules && Array.isArray(courseData.modules)) {
            courseData.modules.forEach((module: any) => {
              if (module.lessons && Array.isArray(module.lessons)) {
                totalLessons += module.lessons.length;
              }
            });
          }

          // Fetch teacher name
          let teacherName = "Unknown Teacher";
          if (courseData.teacherId) {
            try {
              const teacherDoc = await getDoc(doc(db, "users", courseData.teacherId));
              if (teacherDoc.exists()) {
                teacherName = teacherDoc.data().name || teacherName;
              }
            } catch (error) {
              console.error("Error fetching teacher:", error);
            }
          }

          courseProgressList.push({
            courseId,
            courseTitle: courseData.title || "Untitled Course",
            teacherName,
            progress: enrollmentData.progress || 0,
            lessonsCompleted: enrollmentData.lessonsCompleted || 0,
            totalLessons,
            enrolledAt: enrollmentData.enrolledAt,
            lastActiveAt: enrollmentData.lastActiveAt || enrollmentData.enrolledAt,
          });
        }
      }

      // Calculate overall stats
      const totalCourses = courseProgressList.length;
      const totalLessons = courseProgressList.reduce((sum, course) => sum + course.totalLessons, 0);
      const completedLessons = courseProgressList.reduce(
        (sum, course) => sum + course.lessonsCompleted,
        0
      );
      const averageProgress =
        totalCourses > 0
          ? courseProgressList.reduce((sum, course) => sum + course.progress, 0) / totalCourses
          : 0;

      setOverallStats({
        totalCourses,
        totalLessons,
        completedLessons,
        averageProgress,
      });

      // Sort by progress (highest first)
      courseProgressList.sort((a, b) => b.progress - a.progress);
      setCourses(courseProgressList);
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Progress</h1>
        <p className="text-muted-foreground mt-2">
          Track your learning journey and achievements
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.completedLessons} / {overallStats.totalLessons}
            </div>
            <p className="text-xs text-muted-foreground">Total lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(overallStats.averageProgress)}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallStats.totalLessons > 0
                ? Math.round((overallStats.completedLessons / overallStats.totalLessons) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">Lessons completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Progress Details */}
      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No progress yet</h3>
            <p className="text-muted-foreground text-center">
              Enroll in courses and start learning to see your progress here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Course Progress</h2>
          {courses.map((course) => (
            <Card key={course.courseId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.courseTitle}</CardTitle>
                    <CardDescription className="mt-1">
                      {course.teacherName && <span>By {course.teacherName}</span>}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={course.progress === 100 ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {course.progress === 100 ? "Completed" : `${Math.round(course.progress)}%`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {course.lessonsCompleted} / {course.totalLessons} lessons
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {course.enrolledAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Enrolled{" "}
                        {course.enrolledAt.toDate
                          ? format(course.enrolledAt.toDate(), "MMM d, yyyy")
                          : "Recently"}
                      </span>
                    </div>
                  )}
                  {course.lastActiveAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        Last active{" "}
                        {course.lastActiveAt.toDate
                          ? format(course.lastActiveAt.toDate(), "MMM d, yyyy")
                          : "Recently"}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

