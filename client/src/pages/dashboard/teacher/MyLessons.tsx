import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  deleteDoc,
  orderBy 
} from "firebase/firestore";
import { 
  FileText, 
  Video, 
  BookOpen, 
  HelpCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  type: "video" | "text" | "practice" | "quiz";
  content: string;
  videoUrl?: string;
  courseId: string;
  courseTitle: string;
  moduleTitle: string;
  status: "draft" | "published";
  createdAt: any;
  updatedAt: any;
}

export default function MyLessons() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    fetchLessons();
    fetchCourses();
  }, [user, setLocation]);

  useEffect(() => {
    filterLessons();
  }, [lessons, searchQuery, typeFilter, statusFilter, courseFilter]);

  const fetchCourses = async () => {
    if (!user?.id) return;
    
    try {
      const coursesRef = collection(db, "courses");
      const q = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const querySnapshot = await getDocs(q);
      const coursesData: Array<{ id: string; title: string }> = [];
      querySnapshot.forEach((doc) => {
        coursesData.push({ id: doc.id, title: doc.data().title });
      });
      setCourses(coursesData);
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  };

  const fetchLessons = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch all courses for this teacher
      const coursesRef = collection(db, "courses");
      const q = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const coursesSnapshot = await getDocs(q);
      
      const allLessons: Lesson[] = [];
      
      // Extract lessons from all courses
      coursesSnapshot.forEach((courseDoc) => {
        const courseData = courseDoc.data();
        const courseId = courseDoc.id;
        const courseTitle = courseData.title || "Untitled Course";
        
        if (courseData.modules && Array.isArray(courseData.modules)) {
          courseData.modules.forEach((module: any, moduleIndex: number) => {
            if (module.lessons && Array.isArray(module.lessons)) {
              module.lessons.forEach((lesson: any, lessonIndex: number) => {
                allLessons.push({
                  id: `${courseId}_${moduleIndex}_${lessonIndex}`,
                  title: lesson.title || "Untitled Lesson",
                  type: lesson.type || "video",
                  content: lesson.content || "",
                  videoUrl: lesson.videoUrl,
                  courseId,
                  courseTitle,
                  moduleTitle: module.title || `Module ${moduleIndex + 1}`,
                  status: courseData.status === "live" ? "published" : "draft",
                  createdAt: courseData.createdAt,
                  updatedAt: courseData.updatedAt,
                });
              });
            }
          });
        }
      });

      // Sort by course title, then module, then lesson order
      allLessons.sort((a, b) => {
        if (a.courseTitle !== b.courseTitle) {
          return a.courseTitle.localeCompare(b.courseTitle);
        }
        if (a.moduleTitle !== b.moduleTitle) {
          return a.moduleTitle.localeCompare(b.moduleTitle);
        }
        return 0;
      });

      setLessons(allLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load lessons",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterLessons = () => {
    let filtered = [...lessons];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(query) ||
          lesson.courseTitle.toLowerCase().includes(query) ||
          lesson.moduleTitle.toLowerCase().includes(query) ||
          lesson.content.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((lesson) => lesson.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((lesson) => lesson.status === statusFilter);
    }

    // Course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter((lesson) => lesson.courseId === courseFilter);
    }

    setFilteredLessons(filtered);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "practice":
        return <BookOpen className="h-4 w-4" />;
      case "quiz":
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
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
      <div>
        <h1 className="text-3xl font-bold">My Lessons</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all your lessons across courses
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lessons Table */}
      {filteredLessons.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {lessons.length === 0 ? "No lessons yet" : "No lessons match your filters"}
              </h3>
              <p className="text-muted-foreground">
                {lessons.length === 0
                  ? "Create a course and add lessons to get started"
                  : "Try adjusting your search or filters"}
              </p>
              {lessons.length === 0 && (
                <Button
                  className="mt-4"
                  onClick={() => setLocation("/dashboard/teacher/courses")}
                >
                  Create Your First Course
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              Lessons ({filteredLessons.length} of {lessons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lesson</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLessons.map((lesson) => (
                    <TableRow key={lesson.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(lesson.type)}
                          {lesson.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(lesson.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{lesson.courseTitle}</TableCell>
                      <TableCell>{lesson.moduleTitle}</TableCell>
                      <TableCell>
                        <Badge
                          variant={lesson.status === "published" ? "default" : "secondary"}
                        >
                          {lesson.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/dashboard/teacher/courses`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

