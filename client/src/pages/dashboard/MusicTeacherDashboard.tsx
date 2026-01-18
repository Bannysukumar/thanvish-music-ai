import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Users, 
  DollarSign, 
  FileText, 
  Plus, 
  Upload, 
  BarChart3,
  Lock,
  AlertCircle,
  Calendar,
  Clock,
  Loader2,
  Crown,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function MusicTeacherDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalLessons: 0,
    totalStudents: 0,
    thisMonthEarnings: 0,
    pendingReviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    // Check if user is music teacher
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }

    // Check subscription status
    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    
    setIsLocked(!subscriptionActive);

    // Fetch teacher stats
    const fetchStats = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all courses for this teacher
        const coursesRef = collection(db, "courses");
        const coursesQuery = query(
          coursesRef,
          where("teacherId", "==", user.id)
        );
        const coursesSnapshot = await getDocs(coursesQuery);
        
        let totalCourses = 0;
        let totalLessons = 0;
        let pendingReviews = 0;
        const courseIds: string[] = [];
        
        coursesSnapshot.forEach((courseDoc) => {
          const courseData = courseDoc.data();
          totalCourses++;
          courseIds.push(courseDoc.id);
          
          // Count lessons in all modules
          if (courseData.modules && Array.isArray(courseData.modules)) {
            courseData.modules.forEach((module: any) => {
              if (module.lessons && Array.isArray(module.lessons)) {
                totalLessons += module.lessons.length;
              }
            });
          }
          
          // Count pending reviews
          if (courseData.status === "pending") {
            pendingReviews++;
          }
        });

        // Fetch enrollments to count unique students
        let totalStudents = 0;
        const uniqueStudentIds = new Set<string>();
        
        if (courseIds.length > 0) {
          // Fetch enrollments in batches (Firestore 'in' limit is 10)
          for (let i = 0; i < courseIds.length; i += 10) {
            const batch = courseIds.slice(i, i + 10);
            const enrollmentsRef = collection(db, "enrollments");
            const enrollmentsQuery = query(
              enrollmentsRef,
              where("courseId", "in", batch)
            );
            
            try {
              const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
              enrollmentsSnapshot.forEach((enrollmentDoc) => {
                const enrollmentData = enrollmentDoc.data();
                if (enrollmentData.studentId) {
                  uniqueStudentIds.add(enrollmentData.studentId);
                }
              });
            } catch (error) {
              // If enrollments collection doesn't exist yet, that's okay
              console.log("No enrollments found for batch");
            }
          }
        }
        
        totalStudents = uniqueStudentIds.size;

        // Calculate this month earnings (placeholder - would need payment/earnings collection)
        // For now, we'll use a simple calculation or set to 0
        const thisMonthEarnings = 0; // TODO: Implement earnings calculation from payments/enrollments

        setStats({
          totalCourses,
          totalLessons,
          totalStudents,
          thisMonthEarnings,
          pendingReviews,
        });
      } catch (error) {
        console.error("Error fetching teacher stats:", error);
        // Set defaults on error
        setStats({
          totalCourses: 0,
          totalLessons: 0,
          totalStudents: 0,
          thisMonthEarnings: 0,
          pendingReviews: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();

    // Fetch subscription details
    const fetchSubscriptionDetails = async () => {
      if (!user || user.isGuest) {
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setIsLoadingSubscription(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch("/api/user/subscription-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionDetails(data);
        } else {
          // Even if there's an error, try to get basic info from response
          try {
            const errorData = await response.json();
            console.error("Error fetching subscription details:", errorData);
            // Set minimal subscription details to show "No plan" message
            setSubscriptionDetails(null);
          } catch (parseError) {
            console.error("Error parsing subscription details error:", parseError);
            setSubscriptionDetails(null);
          }
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
        setSubscriptionDetails(null);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscriptionDetails();
  }, [user, setLocation]);

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
          Music Teacher Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLocked 
            ? "Your Teacher role is active, but subscription is required to publish courses. Contact admin or activate your plan."
            : "Welcome to the Music Teacher Dashboard. Create courses, manage students, and publish lessons."}
        </p>
      </div>

      {/* Locked State Banner */}
      {isLocked && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Subscription Required
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Your Teacher role is active, but subscription is required to publish courses. Contact admin or activate your plan.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  onClick={() => setLocation("/dashboard/upgrade")}
                >
                  Activate Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Published courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Lessons created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Students enrolled in your courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Revenue this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Reviews Card */}
      {stats.pendingReviews > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Pending Reviews
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  You have {stats.pendingReviews} course{stats.pendingReviews !== 1 ? "s" : ""} waiting for admin approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your teaching content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/teacher/courses/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span>Create New Course</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/teacher/lessons/upload")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span>Upload Lesson</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/teacher/students")}
            >
              <Users className="h-5 w-5" />
              <span>View Students</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/teacher/analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Plan Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Teacher Plan Status
          </CardTitle>
          <CardDescription>
            Your current plan details and student allocation capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSubscription ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptionDetails ? (
            <>
              {/* Plan Info */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{subscriptionDetails.planName || "No Plan"}</p>
                      <Badge 
                        variant={
                          subscriptionDetails.subscriptionStatus === "active" ? "default" :
                          subscriptionDetails.subscriptionStatus === "trial" ? "secondary" :
                          subscriptionDetails.subscriptionStatus === "expired" ? "destructive" :
                          "outline"
                        }
                      >
                        {subscriptionDetails.subscriptionStatus?.toUpperCase() || "INACTIVE"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Billing: {subscriptionDetails.billingCycle === "monthly" ? "Monthly" : "Yearly"}
                    </p>
                  </div>
                  {(subscriptionDetails.subscriptionStatus === "expired" || !subscriptionDetails.planId) && (
                    <Button onClick={() => setLocation("/dashboard/upgrade")}>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  )}
                </div>

                {/* Validity Information */}
                {subscriptionDetails.subscriptionEndDate && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End Date:</span>
                      <span>{new Date(subscriptionDetails.subscriptionEndDate).toLocaleDateString()}</span>
                    </div>
                    {subscriptionDetails.daysRemaining !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className={subscriptionDetails.daysRemaining <= 7 ? "text-destructive font-semibold" : ""}>
                          {subscriptionDetails.daysRemaining} days
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {subscriptionDetails.subscriptionStatus === "expired" && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <p className="text-sm text-destructive">
                        Your plan validity has ended. Renew/upgrade to manage students.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Daily Generations */}
              {subscriptionDetails.dailyLimit !== undefined && subscriptionDetails.dailyLimit > 0 && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Daily Generations
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Music generation limit for today
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Used / Limit</span>
                      <span className="font-semibold">
                        {subscriptionDetails.dailyUsed || 0} / {subscriptionDetails.dailyLimit}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionDetails.dailyLimit > 0 
                        ? ((subscriptionDetails.dailyUsed || 0) / subscriptionDetails.dailyLimit) * 100 
                        : 0} 
                      className="h-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-semibold">
                        {subscriptionDetails.dailyRemaining || 0} generations
                      </span>
                    </div>
                    {subscriptionDetails.dailyRemaining === 0 && subscriptionDetails.dailyLimit > 0 && (
                      <p className="text-xs text-destructive">
                        Daily limit reached. Limit resets at midnight.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Monthly Generations */}
              {subscriptionDetails.monthlyLimit !== undefined && subscriptionDetails.monthlyLimit > 0 && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      Monthly Generations
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Music generation limit for this month
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Used / Limit</span>
                      <span className="font-semibold">
                        {subscriptionDetails.monthlyUsed || 0} / {subscriptionDetails.monthlyLimit}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionDetails.monthlyLimit > 0 
                        ? ((subscriptionDetails.monthlyUsed || 0) / subscriptionDetails.monthlyLimit) * 100 
                        : 0} 
                      className="h-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-semibold">
                        {subscriptionDetails.monthlyRemaining || 0} generations
                      </span>
                    </div>
                    {subscriptionDetails.monthlyRemaining === 0 && subscriptionDetails.monthlyLimit > 0 && (
                      <p className="text-xs text-destructive">
                        Monthly limit reached. Limit resets on the 1st of next month.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Student Allocation */}
              {subscriptionDetails.teacherMaxStudents !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <div>
                    <h3 className="font-semibold text-sm">Students Allocated</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Students automatically assigned to you from student plans (different from enrolled students)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Used / Limit</span>
                      <span className="font-semibold">
                        {subscriptionDetails.studentsAllocatedCount || 0} / {subscriptionDetails.teacherMaxStudents}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionDetails.teacherMaxStudents > 0 
                        ? ((subscriptionDetails.studentsAllocatedCount || 0) / subscriptionDetails.teacherMaxStudents) * 100 
                        : 0} 
                      className="h-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-semibold">
                        {subscriptionDetails.studentsAllocatedRemaining || 0} slots
                      </span>
                    </div>
                    {subscriptionDetails.studentsAllocatedRemaining === 0 && subscriptionDetails.teacherMaxStudents > 0 && (
                      <p className="text-xs text-destructive">
                        Student limit reached. Upgrade your plan to add more students.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                No subscription plan assigned. Please contact support.
              </p>
              <Button onClick={() => setLocation("/dashboard/upgrade")} className="mt-4">
                <Crown className="mr-2 h-4 w-4" />
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

