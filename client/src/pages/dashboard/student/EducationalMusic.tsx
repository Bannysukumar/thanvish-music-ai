import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Play, Heart, Clock, Lock, Loader2, AlertCircle, CheckCircle, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface Course {
  id: string;
  title: string;
  description?: string;
  teacherName?: string;
  teacherId?: string;
  thumbnailUrl?: string;
  lessonCount?: number;
  status: string;
  price?: number;
  roleUnlockOnPurchase?: string;
  dashboardRedirectRole?: string;
}

export default function EducationalMusic() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);
  const [purchasingCourseId, setPurchasingCourseId] = useState<string | null>(null);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [purchasedCourseIds, setPurchasedCourseIds] = useState<Set<string>>(new Set());
  const [paymentsEnabled, setPaymentsEnabled] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }

    fetchCourses();
    fetchEnrollments();
    fetchPurchasedCourses();
    checkPaymentsEnabled();
  }, [user]);

  const checkPaymentsEnabled = async () => {
    try {
      const response = await fetch("/api/payments/razorpay-key");
      if (response.ok) {
        const data = await response.json();
        setPaymentsEnabled(data.enabled === true);
      }
    } catch (error) {
      console.error("Error checking payments status:", error);
    }
  };

  const fetchPurchasedCourses = async () => {
    if (!user?.id) return;
    
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const token = await currentUser.getIdToken();
      const response = await fetch("/api/user/subscription-details", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const purchased = data.purchasedCourses || [];
        setPurchasedCourseIds(new Set(purchased));
      }
    } catch (error) {
      console.error("Error fetching purchased courses:", error);
    }
  };

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

  const handlePurchaseCourse = async (course: Course) => {
    if (!user?.id || !auth.currentUser) {
      toast({
        title: "Error",
        description: "Please login to purchase courses",
        variant: "destructive",
      });
      return;
    }

    if (purchasedCourseIds.has(course.id) || enrolledCourseIds.has(course.id)) {
      toast({
        title: "Already Purchased",
        description: "You already have access to this course",
      });
      return;
    }

    if (!paymentsEnabled) {
      toast({
        title: "Payments Disabled",
        description: "Payments are currently disabled. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setPurchasingCourseId(course.id);

    try {
      const token = await auth.currentUser.getIdToken();

      // Create payment order
      const orderResponse = await fetch("/api/payments/create-course-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          courseId: course.id,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || "Failed to create payment order");
      }

      const orderData = await orderResponse.json();

      // Get Razorpay key
      const keyResponse = await fetch("/api/payments/razorpay-key");
      if (!keyResponse.ok) {
        throw new Error("Failed to get Razorpay key");
      }
      const keyData = await keyResponse.json();
      if (!keyData.keyId) {
        throw new Error("Razorpay is not configured");
      }

      // Initialize Razorpay checkout
      const options = {
        key: keyData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Thanvish Music AI",
        description: `Course: ${course.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/payments/verify-course", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                paymentId: orderData.paymentId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Payment verification failed");
            }

            const verifyData = await verifyResponse.json();

            toast({
              title: "Success",
              description: verifyData.message || "Payment successful! Course access activated.",
            });

            // Update purchased courses
            setPurchasedCourseIds((prev) => new Set([...prev, course.id]));

            // Handle role unlock and redirect
            if (verifyData.roleUnlocked && verifyData.dashboardRedirectRole) {
              setTimeout(() => {
                // Redirect to the unlocked role's dashboard
                const roleDashboardMap: Record<string, string> = {
                  music_teacher: "/dashboard/teacher",
                  artist: "/dashboard/artist",
                  music_director: "/dashboard/director",
                  doctor: "/dashboard/doctor",
                  astrologer: "/dashboard/astrologer",
                };
                const redirectPath = roleDashboardMap[verifyData.dashboardRedirectRole] || "/dashboard";
                window.location.href = redirectPath;
              }, 2000);
            } else {
              // Refresh to show course access
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          } catch (error: any) {
            console.error("Payment verification error:", error);
            toast({
              title: "Payment Verification Failed",
              description: error.message || "Failed to verify payment. Please contact support.",
              variant: "destructive",
            });
          } finally {
            setPurchasingCourseId(null);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#6366f1",
        },
        modal: {
          ondismiss: function() {
            setPurchasingCourseId(null);
            toast({
              title: "Payment Cancelled",
              description: "Payment not completed. No changes were made.",
              variant: "default",
            });
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Payment failed or cancelled. No changes were made.",
        variant: "destructive",
      });
      setPurchasingCourseId(null);
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
                {course.price !== undefined && course.price > 0 && (
                  <div className="mb-4">
                    <div className="text-2xl font-bold">₹{course.price.toFixed(2)}</div>
                    {course.roleUnlockOnPurchase && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Unlocks: {course.roleUnlockOnPurchase}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  {enrolledCourseIds.has(course.id) || purchasedCourseIds.has(course.id) ? (
                    <Button className="flex-1" variant="outline" disabled>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {purchasedCourseIds.has(course.id) ? "Purchased" : "Enrolled"}
                    </Button>
                  ) : course.price !== undefined && course.price > 0 ? (
                    <Button 
                      className="flex-1" 
                      variant="default"
                      onClick={() => handlePurchaseCourse(course)}
                      disabled={!paymentsEnabled || purchasingCourseId === course.id}
                    >
                      {purchasingCourseId === course.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Buy Course
                        </>
                      )}
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

