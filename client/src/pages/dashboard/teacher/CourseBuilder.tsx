import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  getDoc,
  doc, 
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  FileText,
  Loader2,
  Eye,
  EyeOff,
  Globe
} from "lucide-react";

interface Lesson {
  id?: string;
  title: string;
  type: "video" | "text" | "practice" | "quiz";
  content: string;
  videoUrl?: string;
  attachments?: string[];
  order: number;
}

interface Module {
  id?: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

interface Course {
  id?: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  language: string;
  thumbnailUrl?: string;
  modules: Module[];
  status: "draft" | "pending" | "live" | "rejected";
  rejectionReason?: string;
  createdAt?: any;
  updatedAt?: any;
  teacherId: string;
}

const CATEGORIES = [
  "Instrument",
  "Vocals",
  "Theory",
  "Rhythm",
  "Composition",
  "Technique",
  "Other"
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Sanskrit",
  "Other"
];

export default function CourseBuilder() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    
    // Always fetch courses first
    fetchCourses();
    
    // Check if we're on the /new route and auto-open create form
    if (location === "/dashboard/teacher/courses/new") {
      const newCourse: Course = {
        title: "",
        description: "",
        category: "",
        difficulty: "beginner",
        language: "",
        modules: [],
        status: "draft",
        teacherId: user.id,
      };
      setEditingCourse(newCourse);
      setIsCreating(true);
    }
  }, [user, setLocation, location]);

  const fetchCourses = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const coursesRef = collection(db, "courses");
      // Fetch without orderBy to avoid index requirement (sort in memory instead)
      const q = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const querySnapshot = await getDocs(q);
      const coursesData: Course[] = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, ...doc.data() } as Course);
      });
      // Sort by createdAt in memory (newest first)
      coursesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const bTime = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return bTime - aTime;
      });
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCourse = () => {
    const newCourse: Course = {
      title: "",
      description: "",
      category: "",
      difficulty: "beginner",
      language: "",
      modules: [],
      status: "draft",
      teacherId: user!.id,
    };
    setEditingCourse(newCourse);
    setIsCreating(true);
  };

  const handleSaveCourse = async () => {
    if (!editingCourse || !user?.id) return;

    // Validation
    if (!editingCourse.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Course title is required",
        variant: "destructive",
      });
      return;
    }

    if (!editingCourse.category) {
      toast({
        title: "Validation Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Count total lessons in the course
      const totalLessons = editingCourse.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
      
      // Check lesson limit before saving (for both create and update)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to save courses",
          variant: "destructive",
        });
        return;
      }
      const token = await currentUser.getIdToken();
      const lessonLimitResponse = await fetch("/api/teacher/check-lesson-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (lessonLimitResponse.ok) {
        const lessonLimitData = await lessonLimitResponse.json();
        // Calculate how many lessons this course will add/update
        if (editingCourse.id) {
          // For updates, we need to check if adding new lessons exceeds the limit
          // Get current course to compare
          const currentCourseRef = doc(db, "courses", editingCourse.id);
          const currentCourseSnap = await getDoc(currentCourseRef);
          if (currentCourseSnap.exists()) {
            const currentCourseData = currentCourseSnap.data();
            const currentLessons = currentCourseData.modules?.reduce((sum: number, module: any) => sum + (module.lessons?.length || 0), 0) || 0;
            const newLessons = totalLessons - currentLessons;
            if (newLessons > 0 && lessonLimitData.currentCount + newLessons > lessonLimitData.maxLessons) {
              toast({
                title: "Lesson Limit Reached",
                description: `Adding ${newLessons} lesson(s) would exceed your limit (${lessonLimitData.currentCount}/${lessonLimitData.maxLessons}). Please remove some lessons or upgrade your plan.`,
                variant: "destructive",
              });
              return;
            }
          }
        } else {
          // For new courses, check if total lessons exceed limit
          if (totalLessons > lessonLimitData.remaining) {
            toast({
              title: "Lesson Limit Reached",
              description: `This course has ${totalLessons} lessons, but you only have ${lessonLimitData.remaining} remaining. Please reduce the number of lessons or upgrade your plan.`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      const courseData = {
        ...editingCourse,
        updatedAt: serverTimestamp(),
      };

      if (editingCourse.id) {
        // Update existing course
        const courseRef = doc(db, "courses", editingCourse.id);
        await updateDoc(courseRef, courseData);
        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        // Create new course - check limit first
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast({
            title: "Error",
            description: "You must be logged in to create courses",
            variant: "destructive",
          });
          return;
        }
        const token = await currentUser.getIdToken();
        const limitResponse = await fetch("/api/teacher/check-course-limit", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!limitResponse.ok) {
          const errorData = await limitResponse.json();
          toast({
            title: "Course Limit Reached",
            description: errorData.error || "You have reached your course creation limit. Please upgrade your plan.",
            variant: "destructive",
          });
          return;
        }

        const limitData = await limitResponse.json();
        if (!limitData.canCreate) {
          toast({
            title: "Course Limit Reached",
            description: limitData.error || `You have reached your course limit (${limitData.currentCount}/${limitData.maxCourses}). Please upgrade your plan to create more courses.`,
            variant: "destructive",
          });
          return;
        }

        courseData.createdAt = serverTimestamp();
        await addDoc(collection(db, "courses"), courseData);
        toast({
          title: "Success",
          description: "Course created successfully",
        });
      }

      setEditingCourse(null);
      setIsCreating(false);
      // Navigate back to courses list
      if (location === "/dashboard/teacher/courses/new") {
        setLocation("/dashboard/teacher/courses");
      }
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete?.id) return;

    try {
      await deleteDoc(doc(db, "courses", courseToDelete.id));
      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      setCourseToDelete(null);
      setShowDeleteDialog(false);
      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const addModule = () => {
    if (!editingCourse) return;
    const newModule: Module = {
      title: `Module ${editingCourse.modules.length + 1}`,
      description: "",
      lessons: [],
      order: editingCourse.modules.length,
    };
    setEditingCourse({
      ...editingCourse,
      modules: [...editingCourse.modules, newModule],
    });
  };

  const updateModule = (moduleIndex: number, updates: Partial<Module>) => {
    if (!editingCourse) return;
    const updatedModules = [...editingCourse.modules];
    updatedModules[moduleIndex] = { ...updatedModules[moduleIndex], ...updates };
    setEditingCourse({ ...editingCourse, modules: updatedModules });
  };

  const deleteModule = (moduleIndex: number) => {
    if (!editingCourse) return;
    const updatedModules = editingCourse.modules.filter((_, i) => i !== moduleIndex);
    // Reorder modules
    updatedModules.forEach((m, i) => {
      m.order = i;
    });
    setEditingCourse({ ...editingCourse, modules: updatedModules });
  };

  const addLesson = async (moduleIndex: number) => {
    if (!editingCourse || !user?.id) return;
    
    // Check lesson limit before adding
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to add lessons",
          variant: "destructive",
        });
        return;
      }
      const token = await currentUser.getIdToken();
      const limitResponse = await fetch("/api/teacher/check-lesson-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Lesson Limit Reached",
          description: errorData.error || "You have reached your lesson creation limit. Please upgrade your plan.",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Lesson Limit Reached",
          description: limitData.error || `You have reached your lesson limit (${limitData.currentCount}/${limitData.maxLessons}). Please upgrade your plan to create more lessons.`,
          variant: "destructive",
        });
        return;
      }
    } catch (error) {
      console.error("Error checking lesson limit:", error);
      toast({
        title: "Error",
        description: "Failed to check lesson limit. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const module = editingCourse.modules[moduleIndex];
    const newLesson: Lesson = {
      title: `Lesson ${module.lessons.length + 1}`,
      type: "video",
      content: "",
      order: module.lessons.length,
    };
    updateModule(moduleIndex, {
      lessons: [...module.lessons, newLesson],
    });
  };

  const updateLesson = (moduleIndex: number, lessonIndex: number, updates: Partial<Lesson>) => {
    if (!editingCourse) return;
    const module = editingCourse.modules[moduleIndex];
    const updatedLessons = [...module.lessons];
    updatedLessons[lessonIndex] = { ...updatedLessons[lessonIndex], ...updates };
    updateModule(moduleIndex, { lessons: updatedLessons });
  };

  const deleteLesson = (moduleIndex: number, lessonIndex: number) => {
    if (!editingCourse) return;
    const module = editingCourse.modules[moduleIndex];
    const updatedLessons = module.lessons.filter((_, i) => i !== lessonIndex);
    // Reorder lessons
    updatedLessons.forEach((l, i) => {
      l.order = i;
    });
    updateModule(moduleIndex, { lessons: updatedLessons });
  };

  const toggleModuleExpansion = (courseId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(courseId)) {
      newExpanded.delete(courseId);
    } else {
      newExpanded.add(courseId);
    }
    setExpandedModules(newExpanded);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      live: "default",
      pending: "secondary",
      draft: "outline",
      rejected: "destructive",
    };
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (isCreating || editingCourse) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {editingCourse?.id ? "Edit Course" : "Create New Course"}
            </h1>
            <p className="text-muted-foreground mt-2">
              Build your course with modules and lessons
            </p>
          </div>
          <Button variant="outline" onClick={() => {
            setEditingCourse(null);
            setIsCreating(false);
            if (location === "/dashboard/teacher/courses/new") {
              setLocation("/dashboard/teacher/courses");
            }
          }}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Course Title *</Label>
              <Input
                value={editingCourse?.title || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse!, title: e.target.value })}
                placeholder="e.g., Introduction to Carnatic Music"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editingCourse?.description || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse!, description: e.target.value })}
                placeholder="Describe what students will learn in this course"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={editingCourse?.category || ""}
                  onValueChange={(value) => setEditingCourse({ ...editingCourse!, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={editingCourse?.difficulty || "beginner"}
                  onValueChange={(value: any) => setEditingCourse({ ...editingCourse!, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={editingCourse?.language || ""}
                  onValueChange={(value) => setEditingCourse({ ...editingCourse!, language: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Thumbnail URL (optional)</Label>
              <Input
                value={editingCourse?.thumbnailUrl || ""}
                onChange={(e) => setEditingCourse({ ...editingCourse!, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Course Modules</CardTitle>
                <CardDescription>
                  Organize your course into modules with lessons
                </CardDescription>
              </div>
              <Button onClick={addModule}>
                <Plus className="h-4 w-4 mr-2" />
                Add Module
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingCourse?.modules.map((module, moduleIndex) => (
              <Card key={moduleIndex} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(moduleIndex, { title: e.target.value })}
                        placeholder="Module title"
                        className="font-semibold"
                      />
                      <Textarea
                        value={module.description}
                        onChange={(e) => updateModule(moduleIndex, { description: e.target.value })}
                        placeholder="Module description"
                        rows={2}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteModule(moduleIndex)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Lessons</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addLesson(moduleIndex)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Lesson
                      </Button>
                    </div>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lessonIndex} className="flex items-start gap-2 p-3 border rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Input
                            value={lesson.title}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, { title: e.target.value })}
                            placeholder="Lesson title"
                          />
                          <Select
                            value={lesson.type}
                            onValueChange={(value: any) => updateLesson(moduleIndex, lessonIndex, { type: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="video">Video Lesson</SelectItem>
                              <SelectItem value="text">Text Lesson</SelectItem>
                              <SelectItem value="practice">Practice Assignment</SelectItem>
                              <SelectItem value="quiz">Quiz</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            value={lesson.content}
                            onChange={(e) => updateLesson(moduleIndex, lessonIndex, { content: e.target.value })}
                            placeholder="Lesson content or description"
                            rows={2}
                          />
                          {lesson.type === "video" && (
                            <Input
                              value={lesson.videoUrl || ""}
                              onChange={(e) => updateLesson(moduleIndex, lessonIndex, { videoUrl: e.target.value })}
                              placeholder="Video URL or file link"
                            />
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteLesson(moduleIndex, lessonIndex)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
            {editingCourse?.modules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No modules yet. Click "Add Module" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => {
            setEditingCourse(null);
            setIsCreating(false);
          }}>
            Cancel
          </Button>
          <Button onClick={handleSaveCourse}>
            <Save className="h-4 w-4 mr-2" />
            Save Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage your educational courses
          </p>
        </div>
        <Button onClick={handleCreateCourse}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Course
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first course to start teaching
              </p>
              <Button onClick={handleCreateCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Course
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle>{course.title || "Untitled Course"}</CardTitle>
                      {getStatusBadge(course.status)}
                    </div>
                    <CardDescription className="mt-2">
                      {course.description || "No description"}
                    </CardDescription>
                    <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <span>Category: {course.category}</span>
                      <span>Difficulty: {course.difficulty}</span>
                      <span>Language: {course.language}</span>
                      <span>Modules: {course.modules.length}</span>
                      <span>Lessons: {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {course.status !== "live" && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => {
                          try {
                            const courseRef = doc(db, "courses", course.id);
                            await updateDoc(courseRef, {
                              status: "live",
                              updatedAt: serverTimestamp(),
                            });
                            toast({
                              title: "Success",
                              description: "Course published! Students can now see and enroll in it.",
                            });
                            fetchCourses();
                          } catch (error) {
                            console.error("Error publishing course:", error);
                            toast({
                              title: "Error",
                              description: "Failed to publish course",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCourse(course);
                        setIsCreating(true);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCourseToDelete(course);
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {course.modules.length > 0 && (
                <CardContent>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleModuleExpansion(course.id!)}
                    className="w-full justify-start"
                  >
                    {expandedModules.has(course.id!) ? (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    )}
                    {expandedModules.has(course.id!) ? "Hide" : "Show"} Modules
                  </Button>
                  {expandedModules.has(course.id!) && (
                    <div className="mt-4 space-y-2">
                      {course.modules.map((module, idx) => (
                        <div key={idx} className="p-3 border rounded-lg">
                          <div className="font-medium">{module.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {module.lessons.length} lesson{module.lessons.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

