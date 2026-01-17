import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Star,
  User,
  Users,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface TeacherInfo {
  id: string;
  name: string;
  status: string;
  subscriptionStatus?: string;
}

interface TeacherContent {
  id: string;
  type: "course" | "lesson" | "composition";
  title: string;
  description?: string;
  createdAt: any;
  status?: string;
}

interface BatchStudent {
  id: string;
  name: string;
  joinedDate?: any;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    lessonsCompleted: 0,
    practiceStreak: 0,
    generatedTracks: 0,
    therapySessionsCompleted: 0,
    horoscopeMusicGenerated: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [allocationStatus, setAllocationStatus] = useState<string>("");
  const [teacherContent, setTeacherContent] = useState<TeacherContent[]>([]);
  const [batchStudents, setBatchStudents] = useState<BatchStudent[]>([]);
  const [isLoadingAllocation, setIsLoadingAllocation] = useState(false);

  useEffect(() => {
    // Check if user is student
    if (!user || user.role !== "student") {
      setLocation("/dashboard");
      return;
    }

    fetchStats();
    fetchAllocationInfo();
    // Try auto-allocation on login if not allocated
    tryAutoAllocation();
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

  const fetchAllocationInfo = async () => {
    if (!user?.id) return;

    try {
      // Get user document from Firestore to get allocation info
      const userRef = doc(db, "users", user.id);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const allocatedTeacherId = userData?.allocatedTeacherId;
        const allocationStatusValue = userData?.allocationStatus || "";

        setAllocationStatus(allocationStatusValue);

        if (allocatedTeacherId) {
          // Fetch teacher info
          const teacherRef = doc(db, "users", allocatedTeacherId);
          const teacherDoc = await getDoc(teacherRef);

          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            setTeacherInfo({
              id: allocatedTeacherId,
              name: teacherData?.name || userData?.allocatedTeacherName || "Unknown Teacher",
              status: "ALLOCATED",
              subscriptionStatus: teacherData?.subscriptionStatus,
            });

            // Fetch teacher's published content
            await fetchTeacherContent(allocatedTeacherId);

            // Fetch batch students (students allocated to same teacher)
            await fetchBatchStudents(allocatedTeacherId);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching allocation info:", error);
    }
  };

  const fetchTeacherContent = async (teacherId: string) => {
    try {
      const content: TeacherContent[] = [];

      // Fetch published courses
      // Note: Using only teacherId filter to avoid composite index requirement
      // We'll filter by status and sort in JavaScript
      const coursesQuery = query(
        collection(db, "courses"),
        where("teacherId", "==", teacherId)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      // Filter and sort courses in JavaScript to avoid composite index requirement
      const courses = coursesSnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            type: "course" as const,
            title: data.title || "Untitled Course",
            description: data.description,
            createdAt: data.createdAt,
            status: data.status,
          };
        })
        .filter((course) => course.status === "live" || course.status === "published")
        .sort((a, b) => {
          const aDate = a.createdAt?.toDate?.() || new Date(0);
          const bDate = b.createdAt?.toDate?.() || new Date(0);
          return bDate.getTime() - aDate.getTime();
        })
        .slice(0, 10);
      
      content.push(...courses);

      // Fetch lessons from all courses (simplified - could be optimized)
      const allCoursesQuery = query(
        collection(db, "courses"),
        where("teacherId", "==", teacherId)
      );
      const allCoursesSnapshot = await getDocs(allCoursesQuery);
      
      for (const courseDoc of allCoursesSnapshot.docs) {
        const courseData = courseDoc.data();
        if (courseData.modules && Array.isArray(courseData.modules)) {
          courseData.modules.forEach((module: any) => {
            if (module.lessons && Array.isArray(module.lessons)) {
              module.lessons.forEach((lesson: any) => {
                if (lesson.status === "published") {
                  content.push({
                    id: `${courseDoc.id}_${lesson.title}`,
                    type: "lesson",
                    title: lesson.title || "Untitled Lesson",
                    description: lesson.content,
                    createdAt: lesson.createdAt || courseData.createdAt,
                    status: lesson.status,
                  });
                }
              });
            }
          });
        }
      }

      // Sort by creation date (newest first)
      content.sort((a, b) => {
        const aDate = a.createdAt?.toDate?.() || new Date(0);
        const bDate = b.createdAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setTeacherContent(content.slice(0, 10)); // Limit to 10 most recent
    } catch (error) {
      console.error("Error fetching teacher content:", error);
    }
  };

  const fetchBatchStudents = async (teacherId: string) => {
    try {
      // Get all students allocated to this teacher
      const studentsQuery = query(
        collection(db, "users"),
        where("allocatedTeacherId", "==", teacherId),
        where("role", "==", "student")
      );
      const studentsSnapshot = await getDocs(studentsQuery);

      const students: BatchStudent[] = [];
      studentsSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        students.push({
          id: doc.id,
          name: data.name || "Student",
          joinedDate: data.allocationDate,
        });
      });

      // Sort by allocation date (newest first)
      students.sort((a, b) => {
        const aDate = a.joinedDate?.toDate?.() || new Date(0);
        const bDate = b.joinedDate?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setBatchStudents(students);
    } catch (error) {
      console.error("Error fetching batch students:", error);
    }
  };

  const tryAutoAllocation = async () => {
    if (!user?.id) return;

    try {
      // Get user document to check if allocation is needed
      const userRef = doc(db, "users", user.id);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const planId = userData?.planId;
      const subscriptionStatus = userData?.subscriptionStatus;
      const allocatedTeacherId = userData?.allocatedTeacherId;

      // Only try allocation if:
      // 1. Student has a plan
      // 2. Subscription is active or trial
      // 3. Not already allocated
      if (planId && 
          (subscriptionStatus === "active" || subscriptionStatus === "trial") &&
          !allocatedTeacherId) {
        
        setIsLoadingAllocation(true);
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();
        const response = await fetch("/api/student/auto-allocate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ planId }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh allocation info
            await fetchAllocationInfo();
            toast({
              title: "Teacher Assigned",
              description: `You've been assigned to ${result.teacherName}. You can now access teacher lessons and courses.`,
            });
          } else {
            // Set pending status
            setAllocationStatus("PENDING");
          }
        }
      }
    } catch (error) {
      console.error("Error trying auto-allocation:", error);
    } finally {
      setIsLoadingAllocation(false);
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

      {/* Allocated Teacher Card */}
      {teacherInfo || allocationStatus === "PENDING" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigned Teacher
            </CardTitle>
            <CardDescription>
              Your allocated music teacher information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocationStatus === "PENDING" ? (
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <div>
                  <p className="font-medium">Teacher allocation pending</p>
                  <p className="text-sm text-muted-foreground">
                    We will assign a teacher as soon as a slot is available.
                  </p>
                </div>
              </div>
            ) : teacherInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{teacherInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Status: {teacherInfo.status === "ALLOCATED" ? "Assigned" : teacherInfo.status}
                    </p>
                  </div>
                  <Badge variant={teacherInfo.subscriptionStatus === "active" || teacherInfo.subscriptionStatus === "trial" ? "default" : "secondary"}>
                    {teacherInfo.subscriptionStatus === "active" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : teacherInfo.subscriptionStatus === "trial" ? (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    ) : (
                      <AlertCircle className="h-3 w-3 mr-1" />
                    )}
                    {teacherInfo.subscriptionStatus === "active" ? "Active" : 
                     teacherInfo.subscriptionStatus === "trial" ? "Trial" : 
                     teacherInfo.subscriptionStatus === "inactive" ? "Inactive" : "Unknown"}
                  </Badge>
                </div>
                {teacherInfo.subscriptionStatus !== "active" && teacherInfo.subscriptionStatus !== "trial" && (
                  <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Your teacher's subscription is currently inactive. New content may be delayed.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Teacher's Published Content Feed */}
      {teacherInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              My Teacher's Content
            </CardTitle>
            <CardDescription>
              Latest courses, lessons, and content from your teacher
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teacherContent.length > 0 ? (
              <div className="space-y-3">
                {teacherContent.map((item, index) => {
                  const isNew = item.createdAt?.toDate?.() 
                    ? (Date.now() - item.createdAt.toDate().getTime()) < 7 * 24 * 60 * 60 * 1000 // 7 days
                    : false;
                  
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-shrink-0 mt-1">
                        {item.type === "course" ? (
                          <BookOpen className="h-5 w-5 text-blue-500" />
                        ) : item.type === "lesson" ? (
                          <FileText className="h-5 w-5 text-green-500" />
                        ) : (
                          <Music className="h-5 w-5 text-purple-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{item.title}</h4>
                          {isNew && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.type === "course" ? "Course" : item.type === "lesson" ? "Lesson" : "Composition"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Your teacher hasn't published content yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Batch Students List */}
      {teacherInfo && batchStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Students in My Batch
            </CardTitle>
            <CardDescription>
              Other students learning with the same teacher
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {batchStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      {student.joinedDate && (
                        <p className="text-xs text-muted-foreground">
                          Joined {student.joinedDate.toDate?.()?.toLocaleDateString() || "Recently"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

