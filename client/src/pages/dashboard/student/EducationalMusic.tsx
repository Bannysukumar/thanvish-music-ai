import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Play, Heart, Clock, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  title: string;
  description?: string;
  teacherName?: string;
  teacherId?: string;
  thumbnailUrl?: string;
  lessonCount?: number;
  status: string;
}

export default function EducationalMusic() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }

    fetchCourses();
    fetchEnrollments();
  }, [user]);

  const fetchEnrollments = async () => {
    if (!user?.id) return;
    
    try {
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.id)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const enrolledIds = new Set<string>();
      enrollmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.courseId) {
          enrolledIds.add(data.courseId);
        }
      });
      setEnrolledCourseIds(enrolledIds);
    } catch (error) {
      console.error("Error fetching enrollments:", error);
    }
  };

  const fetchCourses = async () => {
    try {
      // Fetch live courses that students can enroll in
      const q = query(
        collection(db, "courses"),
        where("status", "==", "live"),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(data);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async (course: Course) => {
    if (!user?.id || !auth.currentUser) {
      toast({
        title: "Error",
        description: "Please login to enroll in courses",
        variant: "destructive",
      });
      return;
    }

    if (enrolledCourseIds.has(course.id)) {
      toast({
        title: "Already Enrolled",
        description: "You are already enrolled in this course",
      });
      return;
    }

    setEnrollingCourseId(course.id);

    try {
      const token = await auth.currentUser.getIdToken();
      
      // Get teacherId from course - use from course data if available, otherwise fetch
      let teacherId = course.teacherId || "";
      if (!teacherId) {
        const courseDocRef = doc(db, "courses", course.id);
        const courseDoc = await getDoc(courseDocRef);
        if (courseDoc.exists()) {
          teacherId = courseDoc.data().teacherId || "";
        }
      }

      if (!teacherId) {
        throw new Error("Course teacher not found");
      }

      const response = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
          teacherId: teacherId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to enroll in course");
      }

      toast({
        title: "Success",
        description: "Successfully enrolled in course!",
      });

      // Update enrolled courses
      setEnrolledCourseIds((prev) => new Set([...prev, course.id]));
      
      // Refresh enrollments
      fetchEnrollments();
    } catch (error: any) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course. The teacher may have reached their student limit.",
        variant: "destructive",
      });
    } finally {
      setEnrollingCourseId(null);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Educational Music</h1>
        <p className="text-muted-foreground mt-2">
          Browse and learn from music lessons and courses
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search courses, lessons, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No courses match your search." : "No courses are available at the moment."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <Badge variant="default">Live</Badge>
                </div>
                <CardDescription>{course.teacherName || "Music Teacher"}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {course.description || "Learn music with this comprehensive course"}
                </p>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessonCount || 0} lessons</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {enrolledCourseIds.has(course.id) ? (
                    <Button className="flex-1" variant="outline" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Enrolled
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1" 
                      variant="default"
                      onClick={() => handleEnroll(course)}
                      disabled={enrollingCourseId === course.id}
                    >
                      {enrollingCourseId === course.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enrolling...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Enroll
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="outline" size="icon">
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

