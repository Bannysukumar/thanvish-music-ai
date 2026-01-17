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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  getDoc,
  serverTimestamp,
  orderBy 
} from "firebase/firestore";
import { 
  Users, 
  Search, 
  BookOpen, 
  CheckCircle,
  Clock,
  MessageSquare,
  Loader2,
  User as UserIcon,
  Calendar
} from "lucide-react";
import { format } from "date-fns";

interface StudentEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  enrolledAt: any;
  progress: number; // percentage
  lessonsCompleted: number;
  totalLessons: number;
  lastActiveAt: any;
  notes?: string;
}

interface StudentDetail {
  id: string;
  name: string;
  email: string;
  enrollments: StudentEnrollment[];
  lastActiveAt: any;
  totalCourses: number;
  totalLessonsCompleted: number;
}

export default function StudentManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [students, setStudents] = useState<StudentDetail[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState<StudentEnrollment | null>(null);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    fetchStudents();
  }, [user, setLocation]);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery]);

  const fetchStudents = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Fetch all courses for this teacher
      const coursesRef = collection(db, "courses");
      const coursesQuery = query(
        coursesRef,
        where("teacherId", "==", user.id)
      );
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const courseIds: string[] = [];
      const courseMap = new Map<string, string>();
      
      coursesSnapshot.forEach((doc) => {
        courseIds.push(doc.id);
        courseMap.set(doc.id, doc.data().title || "Untitled Course");
      });

      if (courseIds.length === 0) {
        setStudents([]);
        setIsLoading(false);
        return;
      }

      // Fetch enrollments for these courses in batches (Firestore 'in' limit is 10)
      const enrollmentsRef = collection(db, "enrollments");
      const allEnrollments: any[] = [];
      
      try {
        // Fetch enrollments in batches
        for (let i = 0; i < courseIds.length; i += 10) {
          const batch = courseIds.slice(i, i + 10);
          const enrollmentsQuery = query(
            enrollmentsRef,
            where("courseId", "in", batch)
          );
          
          try {
            const batchSnapshot = await getDocs(enrollmentsQuery);
            batchSnapshot.forEach((enrollmentDoc) => {
              allEnrollments.push({
                id: enrollmentDoc.id,
                ...enrollmentDoc.data(),
              });
            });
          } catch (error) {
            console.error(`Error fetching enrollments for batch ${i}:`, error);
          }
        }
      } catch (error) {
        console.error("Error fetching enrollments:", error);
        setStudents([]);
        setIsLoading(false);
        return;
      }

      if (allEnrollments.length === 0) {
        console.log("No enrollments found");
        setStudents([]);
        setIsLoading(false);
        return;
      }

      console.log(`Found ${allEnrollments.length} enrollments`);

      // Get unique student IDs
      const uniqueStudentIds = new Set<string>();
      allEnrollments.forEach((enrollment) => {
        if (enrollment.studentId) {
          uniqueStudentIds.add(enrollment.studentId);
        }
      });

      console.log(`Found ${uniqueStudentIds.size} unique students`);

      // Fetch all student details first (await all promises)
      const studentMap = new Map<string, StudentDetail>();
      const studentFetchPromises = Array.from(uniqueStudentIds).map(async (studentId) => {
        try {
          const studentDoc = await getDoc(doc(db, "users", studentId));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            studentMap.set(studentId, {
              id: studentId,
              name: studentData.name || "Unknown Student",
              email: studentData.email || "",
              enrollments: [],
              lastActiveAt: studentData.lastSignIn || null,
              totalCourses: 0,
              totalLessonsCompleted: 0,
            });
          }
        } catch (error) {
          console.error(`Error fetching student ${studentId}:`, error);
        }
      });

      // Wait for all student details to be fetched
      await Promise.all(studentFetchPromises);

      console.log(`Fetched ${studentMap.size} student details`);

      // Now process enrollments with student data available
      allEnrollments.forEach((enrollmentData) => {
        const studentId = enrollmentData.studentId;
        const courseId = enrollmentData.courseId;
        
        const student = studentMap.get(studentId);
        if (student) {
          const enrollment: StudentEnrollment = {
            id: enrollmentData.id,
            studentId,
            studentName: student.name,
            studentEmail: student.email,
            courseId,
            courseTitle: courseMap.get(courseId) || "Unknown Course",
            enrolledAt: enrollmentData.enrolledAt,
            progress: enrollmentData.progress || 0,
            lessonsCompleted: enrollmentData.lessonsCompleted || 0,
            totalLessons: enrollmentData.totalLessons || 0,
            lastActiveAt: enrollmentData.lastActiveAt || enrollmentData.enrolledAt,
            notes: enrollmentData.notes,
          };
          student.enrollments.push(enrollment);
          student.totalCourses = student.enrollments.length;
          student.totalLessonsCompleted += enrollment.lessonsCompleted;
        } else {
          console.warn(`Student ${studentId} not found in studentMap`);
        }
      });

      // Convert map to array
      const studentsArray = Array.from(studentMap.values());
      studentsArray.sort((a, b) => {
        const aDate = a.lastActiveAt?.toDate?.() || new Date(0);
        const bDate = b.lastActiveAt?.toDate?.() || new Date(0);
        return bDate.getTime() - aDate.getTime();
      });

      setStudents(studentsArray);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query) ||
          student.enrollments.some((e) => e.courseTitle.toLowerCase().includes(query))
      );
    }

    setFilteredStudents(filtered);
  };

  const handleSaveNotes = async () => {
    if (!selectedEnrollment) return;

    setSavingNotes(true);
    try {
      const enrollmentRef = doc(db, "enrollments", selectedEnrollment.id);
      await updateDoc(enrollmentRef, {
        notes,
        notesUpdatedAt: serverTimestamp(),
      });

      // Update local state
      setStudents((prev) =>
        prev.map((student) => {
          if (student.id === selectedEnrollment.studentId) {
            return {
              ...student,
              enrollments: student.enrollments.map((e) =>
                e.id === selectedEnrollment.id ? { ...e, notes } : e
              ),
            };
          }
          return student;
        })
      );

      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
      setShowNotesDialog(false);
      setSelectedEnrollment(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const openNotesDialog = (student: StudentDetail, enrollment: StudentEnrollment) => {
    setSelectedStudent(student);
    setSelectedEnrollment(enrollment);
    setNotes(enrollment.notes || "");
    setShowNotesDialog(true);
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
        <h1 className="text-3xl font-bold">My Students</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your enrolled students
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students by name, email, or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">
                {students.length === 0 ? "No students yet" : "No students match your search"}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0
                  ? "Students will appear here once they enroll in your courses"
                  : "Try adjusting your search query"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>{student.name}</CardTitle>
                        <CardDescription>{student.email}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        {student.totalCourses} course{student.totalCourses !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" />
                        {student.totalLessonsCompleted} lessons completed
                      </span>
                      {student.lastActiveAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Last active: {format(
                            student.lastActiveAt.toDate?.() || new Date(student.lastActiveAt),
                            "MMM d, yyyy"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Enrolled Courses</h4>
                    <div className="space-y-2">
                      {student.enrollments.map((enrollment) => (
                        <div
                          key={enrollment.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{enrollment.courseTitle}</div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span>
                                Progress: {enrollment.progress}%
                              </span>
                              <span>
                                {enrollment.lessonsCompleted} / {enrollment.totalLessons} lessons
                              </span>
                              {enrollment.enrolledAt && (
                                <span>
                                  Enrolled: {format(
                                    enrollment.enrolledAt.toDate?.() || new Date(enrollment.enrolledAt),
                                    "MMM d, yyyy"
                                  )}
                                </span>
                              )}
                            </div>
                            <div className="mt-2">
                              <div className="w-full bg-secondary rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${enrollment.progress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openNotesDialog(student, enrollment)}
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {enrollment.notes ? "View Notes" : "Add Notes"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Notes</DialogTitle>
            <DialogDescription>
              Add notes or feedback for {selectedStudent?.name} regarding their enrollment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedEnrollment && (
              <div>
                <Label>Course</Label>
                <p className="text-sm font-medium">
                  {selectedEnrollment.courseTitle}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes / Feedback</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your notes or feedback here..."
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNotesDialog(false);
                setSelectedEnrollment(null);
                setSelectedStudent(null);
              }}
              disabled={savingNotes}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotes}
              disabled={savingNotes}
            >
              {savingNotes ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Notes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

