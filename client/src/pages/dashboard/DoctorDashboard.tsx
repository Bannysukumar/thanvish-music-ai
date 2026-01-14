import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  Plus,
  BookOpen,
  FileEdit,
  BarChart3,
  Lock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { SafetyDisclaimer } from "@/components/doctor/SafetyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalPrograms: 0,
    activePrograms: 0,
    totalSessionsStarted: 0,
    positiveFeedbackRate: 0,
    pendingReview: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if user is doctor
    if (!user || user.role !== "doctor") {
      setLocation("/dashboard");
      return;
    }

    // Check subscription status
    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    
    setIsLocked(!subscriptionActive);

    // Check if doctor is verified
    const checkVerification = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsVerified(userData.verifiedDoctor === true);
        }
      } catch (error) {
        console.error("Error checking doctor verification:", error);
      }
    };

    // Fetch doctor stats
    const fetchStats = async () => {
      try {
        // Fetch total programs
        const programsQuery = query(
          collection(db, "therapyPrograms"),
          where("doctorId", "==", user.id)
        );
        const programsSnapshot = await getDocs(programsQuery);
        const totalPrograms = programsSnapshot.size;

        // Count active programs
        let activePrograms = 0;
        programsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "live") {
            activePrograms++;
          }
        });

        // Fetch session starts (aggregate from user sessions)
        // This would need to be aggregated from user session data
        const totalSessionsStarted = 0; // Placeholder

        // Fetch feedback data (aggregate)
        const positiveFeedbackRate = 0; // Placeholder

        // Fetch pending review count
        let pendingReview = 0;
        programsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "pending_approval") {
            pendingReview++;
          }
        });

        setStats({
          totalPrograms,
          activePrograms,
          totalSessionsStarted,
          positiveFeedbackRate,
          pendingReview,
        });
      } catch (error) {
        console.error("Error fetching doctor stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkVerification();
    fetchStats();
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
      {/* Mandatory Safety Disclaimer */}
      <SafetyDisclaimer />

      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          Doctor Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLocked 
            ? "Your Doctor role is active, but subscription is required to publish therapy programs. Contact admin or activate your plan."
            : "Welcome to the Doctor Dashboard. Create wellness music programs and session templates."}
        </p>
      </div>

      {/* Verification Banner */}
      {!isVerified && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Doctor Verification Pending
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Verification pending. Some features may be limited until admin verification is complete.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
                  Your Doctor role is active, but subscription is required to publish therapy programs. Contact admin or activate your plan.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrograms}</div>
            <p className="text-xs text-muted-foreground">
              All programs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePrograms}</div>
            <p className="text-xs text-muted-foreground">
              Currently live
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions Started</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessionsStarted}</div>
            <p className="text-xs text-muted-foreground">
              Total sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.positiveFeedbackRate}%</div>
            <p className="text-xs text-muted-foreground">
              Feedback rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReview}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your therapy programs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/doctor/programs/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span>Create Program</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/doctor/templates/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <FileEdit className="h-5 w-5" />
              )}
              <span>Create Template</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/doctor/articles/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
              <span>Publish Guidance</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/doctor/analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {user.subscriptionStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Current subscription information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      user.subscriptionStatus === "active" ? "default" :
                      user.subscriptionStatus === "trial" ? "secondary" :
                      "outline"
                    }
                  >
                    {user.subscriptionStatus}
                  </Badge>
                  {user.subscriptionExpiresAt && (
                    <span className="text-sm text-muted-foreground">
                      Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                    </span>
                  )}
                  {isVerified && (
                    <Badge variant="default" className="ml-2">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verified Doctor
                    </Badge>
                  )}
                </div>
              </div>
              {isLocked && (
                <Button onClick={() => setLocation("/dashboard/upgrade")}>
                  Activate Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

