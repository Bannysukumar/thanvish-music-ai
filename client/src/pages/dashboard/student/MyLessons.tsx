import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Play, CheckCircle, Lock, Loader2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
  id: string;
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  title: string;
  content?: string;
  status: string;
  isCompleted: boolean;
  order: number;
  moduleOrder: number;
}

export default function MyLessons() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [enrollments, setEnrollments] = useState<Map<string, any>>(new Map()); // courseId -> enrollment data
  const { toast } = useToast();

  // Parse URL parameters whenever location changes or URL key changes
  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }

    // Use window.location.search for reliable query string parsing
    // This works even if wouter's location doesn't include query string
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("course");
    const lessonId = params.get("lesson");
    
    console.log(`[URL Parse] location=${location}, window.location.search=${window.location.search}, courseId=${courseId}, lessonId=${lessonId}`);
    
    if (courseId) {
      setSelectedCourseId(courseId);
    } else {
      setSelectedCourseId(null);
    }
    if (lessonId) {
      setSelectedLessonId(lessonId);
    } else {
      setSelectedLessonId(null);
      setSelectedLesson(null);
    }
  }, [user, location]);


  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }
    fetchLessons();
  }, [user, selectedCourseId, selectedLessonId]);

  // Sync selectedLesson when lessons are loaded and selectedLessonId is set
  useEffect(() => {
    if (selectedLessonId && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === selectedLessonId);
      console.log(`[useEffect] Syncing lesson: selectedLessonId=${selectedLessonId}, found=${!!lesson}, currentSelectedLesson=${!!selectedLesson}, lessons.length=${lessons.length}`);
      if (lesson && !selectedLesson) {
        console.log(`[useEffect] Setting selected lesson:`, lesson.title);
        setSelectedLesson(lesson);
      }
    }
  }, [lessons, selectedLessonId, selectedLesson]);

  const handleMarkAsCompleted = async () => {
    const currentLesson = selectedLesson || (selectedLessonId ? lessons.find(l => l.id === selectedLessonId) : null);
    if (!user?.id || !currentLesson || !currentLesson.courseId) {
      toast({
        title: "Error",
        description: "Unable to mark lesson as completed. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    const courseId = currentLesson.courseId;

    setIsMarkingComplete(true);
    try {
      // Get enrollment for this course
      const enrollment = enrollments.get(courseId);
      if (!enrollment) {
        toast({
          title: "Error",
          description: "Enrollment not found for this course.",
          variant: "destructive",
        });
        setIsMarkingComplete(false);
        return;
      }

      // Get course to calculate total lessons
      const courseDoc = await getDoc(doc(db, "courses", courseId));
      if (!courseDoc.exists()) {
        toast({
          title: "Error",
          description: "Course not found.",
          variant: "destructive",
        });
        setIsMarkingComplete(false);
        return;
      }

      const courseData = courseDoc.data();
      
      // Calculate total lessons in course
      let totalLessons = 0;
      if (courseData.modules && Array.isArray(courseData.modules)) {
        courseData.modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            totalLessons += module.lessons.length;
          }
        });
      }

      // Get current completed lessons list (or initialize)
      const completedLessons = enrollment.completedLessons || [];
      const lessonId = currentLesson.id;

      // Check if already completed
      if (completedLessons.includes(lessonId)) {
        toast({
          title: "Already Completed",
          description: "This lesson is already marked as completed.",
        });
        setIsMarkingComplete(false);
        return;
      }

      // Add lesson to completed list
      const updatedCompletedLessons = [...completedLessons, lessonId];
      const newLessonsCompleted = updatedCompletedLessons.length;
      const newProgress = totalLessons > 0 ? Math.round((newLessonsCompleted / totalLessons) * 100) : 0;

      // Update enrollment in Firestore
      const enrollmentRef = doc(db, "enrollments", enrollment.id);
      await updateDoc(enrollmentRef, {
        lessonsCompleted: newLessonsCompleted,
        progress: newProgress,
        completedLessons: updatedCompletedLessons,
        lastActiveAt: serverTimestamp(),
      });

      // Update local state
      const updatedLesson = { ...currentLesson, isCompleted: true };
      setSelectedLesson(updatedLesson);
      setLessons(lessons.map(l => l.id === currentLesson.id ? updatedLesson : l));

      // Update enrollments map
      const updatedEnrollment = {
        ...enrollment,
        lessonsCompleted: newLessonsCompleted,
        progress: newProgress,
        completedLessons: updatedCompletedLessons,
      };
      setEnrollments(new Map(enrollments.set(courseId, updatedEnrollment)));

      toast({
        title: "Lesson Completed!",
        description: `Great job! You've completed ${newLessonsCompleted} of ${totalLessons} lessons in this course.`,
      });
    } catch (error: any) {
      console.error("Error marking lesson as completed:", error);
      toast({
        title: "Error",
        description: "Failed to mark lesson as completed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsMarkingComplete(false);
    }
  };

  const fetchLessons = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      // Fetch enrollments
      const enrollmentsQuery = query(
        collection(db, "enrollments"),
        where("studentId", "==", user.id)
      );
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);

      const allLessons: Lesson[] = [];
      const courseIds = new Set<string>();
      const enrollmentsMap = new Map<string, any>();

      // Get enrolled course IDs and store enrollment data
      enrollmentsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.courseId) {
          courseIds.add(data.courseId);
          enrollmentsMap.set(data.courseId, { id: doc.id, ...data });
        }
      });

      setEnrollments(enrollmentsMap);

      // If a specific course is selected, only fetch lessons from that course
      const coursesToFetch = selectedCourseId
        ? [selectedCourseId]
        : Array.from(courseIds);

      // Fetch lessons from enrolled courses
      for (const courseId of coursesToFetch) {
        if (!courseIds.has(courseId) && selectedCourseId !== courseId) continue;

        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          const courseData = courseDoc.data();

          if (courseData.modules && Array.isArray(courseData.modules)) {
            courseData.modules.forEach((module: any, moduleIndex: number) => {
              if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach((lesson: any, lessonIndex: number) => {
                  // Show all lessons from enrolled courses (don't filter by status)
                  // If student is enrolled, they should see all lessons
                  allLessons.push({
                    id: `${courseId}_${moduleIndex}_${lessonIndex}`,
                    courseId,
                    courseTitle: courseData.title || "Untitled Course",
                    moduleTitle: module.title || "Module",
                    title: lesson.title || "Untitled Lesson",
                    content: lesson.content,
                    status: lesson.status || "published", // Default to published if no status
                    isCompleted: false, // Would need to track this separately
                    order: lessonIndex,
                    moduleOrder: moduleIndex,
                  });
                });
              }
            });
          }
        }
      }

      // Sort by course, then module, then lesson order
      allLessons.sort((a, b) => {
        if (a.courseId !== b.courseId) {
          return a.courseTitle.localeCompare(b.courseTitle);
        }
        if (a.moduleOrder !== b.moduleOrder) {
          return a.moduleOrder - b.moduleOrder;
        }
        return a.order - b.order;
      });

      setLessons(allLessons);
      console.log(`Fetched ${allLessons.length} lessons from ${coursesToFetch.length} course(s)`);
      console.log(`All lesson IDs:`, allLessons.map(l => l.id));
      
      // If a lesson is selected in URL, find and set it
      if (selectedLessonId) {
        console.log(`Looking for lesson with ID: ${selectedLessonId}`);
        const lesson = allLessons.find(l => l.id === selectedLessonId);
        console.log(`Lesson found:`, !!lesson, lesson ? { id: lesson.id, title: lesson.title } : null);
        if (lesson) {
          setSelectedLesson(lesson);
          console.log(`Set selected lesson:`, lesson.title);
        } else {
          console.warn(`Lesson with ID ${selectedLessonId} not found in fetched lessons`);
        }
      }
    } catch (error) {
      console.error("Error fetching lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLessons = lessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.courseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lesson.moduleTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group lessons by course
  const lessonsByCourse = filteredLessons.reduce((acc, lesson) => {
    if (!acc[lesson.courseId]) {
      acc[lesson.courseId] = {
        courseTitle: lesson.courseTitle,
        lessons: [],
      };
    }
    acc[lesson.courseId].lessons.push(lesson);
    return acc;
  }, {} as Record<string, { courseTitle: string; lessons: Lesson[] }>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  // Show lesson viewer if a lesson is selected
  // Also check if we need to find the lesson from the lessons array
  const currentSelectedLesson = selectedLesson || (selectedLessonId ? lessons.find(l => l.id === selectedLessonId) : null);
  
  console.log(`[Render] selectedLessonId=${selectedLessonId}, selectedLesson=${!!selectedLesson}, currentSelectedLesson=${!!currentSelectedLesson}, lessons.length=${lessons.length}`);
  if (selectedLessonId && lessons.length > 0) {
    console.log(`[Render] Looking for lesson ${selectedLessonId} in:`, lessons.map(l => l.id));
  }
  
  if (currentSelectedLesson) {
    console.log(`[Render] Showing lesson viewer for:`, currentSelectedLesson.title);
    
    // Ensure we have the latest completion status from enrollments
    const enrollment = enrollments.get(currentSelectedLesson.courseId);
    const completedLessons = enrollment?.completedLessons || [];
    const isActuallyCompleted = completedLessons.includes(currentSelectedLesson.id);
    
    // Update lesson if completion status changed
    if (currentSelectedLesson.isCompleted !== isActuallyCompleted) {
      const updatedLesson = { ...currentSelectedLesson, isCompleted: isActuallyCompleted };
      setSelectedLesson(updatedLesson);
    }
    return (
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedLesson(null);
              setSelectedLessonId(null);
              setLocation("/dashboard/student/lessons" + (selectedCourseId ? `?course=${selectedCourseId}` : ""));
            }}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lessons
          </Button>
          <h1 className="text-3xl font-bold">{currentSelectedLesson.title}</h1>
          <p className="text-muted-foreground mt-2">
            {currentSelectedLesson.courseTitle} • {currentSelectedLesson.moduleTitle}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lesson Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSelectedLesson.content ? (
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap">{currentSelectedLesson.content}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No content available for this lesson. The teacher hasn't added content yet.</p>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleMarkAsCompleted}
                disabled={isMarkingComplete || currentSelectedLesson.isCompleted}
              >
                {isMarkingComplete ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : currentSelectedLesson.isCompleted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Lessons</h1>
          <p className="text-muted-foreground mt-2">
            Continue learning from your enrolled courses
          </p>
        </div>
        {selectedCourseId && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCourseId(null);
              setLocation("/dashboard/student/lessons");
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Lessons
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search lessons..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lessons List */}
      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No lessons available</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery
                ? "No lessons match your search"
                : "Enroll in courses to access lessons"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setLocation("/dashboard/student/educational-music")}>
                Browse Courses
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(lessonsByCourse).map(([courseId, { courseTitle, lessons: courseLessons }]) => (
            <Card key={courseId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {courseTitle}
                </CardTitle>
                <CardDescription>
                  {courseLessons.length} lesson{courseLessons.length !== 1 ? "s" : ""} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {courseLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <div className="flex-shrink-0 mt-1">
                          {lesson.isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <Play className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            {lesson.isCompleted && (
                              <Badge variant="outline" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {lesson.moduleTitle}
                          </p>
                          {lesson.content && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {lesson.content}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Update state immediately and navigate to lesson view
                          setSelectedCourseId(courseId);
                          setSelectedLessonId(lesson.id);
                          setSelectedLesson(lesson);
                          setLocation(`/dashboard/student/lessons?course=${courseId}&lesson=${lesson.id}`);
                        }}
                      >
                        {lesson.isCompleted ? "Review" : "Start"}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

