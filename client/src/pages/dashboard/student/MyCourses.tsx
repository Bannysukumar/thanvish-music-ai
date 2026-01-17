import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Search, Play, Clock, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useLocation } from "wouter";

interface EnrolledCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseDescription?: string;
  teacherName?: string;
  teacherId?: string;
  thumbnailUrl?: string;
  enrolledAt: any;
  progress: number;
  lessonsCompleted: number;
  totalLessons: number;
  status?: string;
}

export default function MyCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }
    fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch enrollments
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.id)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const enrolledCourses: EnrolledCourse[] = [];

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

          // Fetch teacher name if available
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

          enrolledCourses.push({
            id: enrollmentDoc.id,
            courseId,
            courseTitle: courseData.title || "Untitled Course",
            courseDescription: courseData.description,
            teacherName,
            teacherId: courseData.teacherId,
            thumbnailUrl: courseData.thumbnailUrl,
            enrolledAt: enrollmentData.enrolledAt,
            progress: enrollmentData.progress || 0,
            lessonsCompleted: enrollmentData.lessonsCompleted || 0,
            totalLessons,
            status: courseData.status,
          });
        }
      }

      // Sort by enrollment date (newest first)
      enrolledCourses.sort((a, b) => {
        const aDate = a.enrolledAt?.toDate?.() || new Date(0);
        const bDate = b.enrolledAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setCourses(enrolledCourses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.teacherName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-2">
          View and continue your enrolled courses
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses enrolled</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "No courses match your search"
                : "Start learning by enrolling in courses from the Educational Music page"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setLocation("/dashboard/student/educational-music")}>
                Browse Courses
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              {course.thumbnailUrl && (
                <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                  <img
                    src={course.thumbnailUrl}
                    alt={course.courseTitle}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{course.courseTitle}</CardTitle>
                  {course.status === "live" && (
                    <Badge variant="default">Active</Badge>
                  )}
                </div>
                <CardDescription>
                  {course.teacherName && (
                    <span className="block mt-1">By {course.teacherName}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {course.courseDescription && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {course.courseDescription}
                  </p>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {course.lessonsCompleted} / {course.totalLessons} lessons
                    </span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{Math.round(course.progress)}% complete</span>
                    {course.enrolledAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Enrolled {course.enrolledAt.toDate?.().toLocaleDateString() || "Recently"}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setLocation(`/dashboard/student/lessons?course=${course.courseId}`)}
                >
                  Continue Learning
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

