import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  FileText, 
  Users, 
  CheckCircle,
  Star,
  Plus,
  Search,
  MessageSquare,
  BarChart3,
  Lock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { Loader2, Crown, Calendar } from "lucide-react";

export default function MusicDirectorDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingRequests: 0,
    newResponses: 0,
    deliveriesPending: 0,
    shortlistedArtists: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    // Check if user is music director
    if (!user || user.role !== "music_director") {
      setLocation("/dashboard");
      return;
    }

    // Check subscription status
    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    
    setIsLocked(!subscriptionActive);

    // Check if director is verified
    const checkVerification = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsVerified(userData.verifiedDirector === true);
        }
      } catch (error) {
        console.error("Error checking director verification:", error);
      }
    };

    // Fetch director stats
    const fetchStats = async () => {
      try {
        // Fetch active projects
        const projectsQuery = query(
          collection(db, "directorProjects"),
          where("directorId", "==", user.id),
          where("status", "in", ["live", "in_progress", "review"])
        );
        const projectsSnapshot = await getDocs(projectsQuery);
        const activeProjects = projectsSnapshot.size;

        // Fetch pending collaboration requests
        const collabRequestsQuery = query(
          collection(db, "collaborationRequests"),
          where("directorId", "==", user.id),
          where("status", "in", ["sent", "seen", "negotiation"])
        );
        const collabRequestsSnapshot = await getDocs(collabRequestsQuery);

        // Fetch pending licensing requests
        const licensingRequestsQuery = query(
          collection(db, "licensingRequests"),
          where("directorId", "==", user.id),
          where("status", "in", ["sent", "seen", "negotiation"])
        );
        const licensingRequestsSnapshot = await getDocs(licensingRequestsQuery);

        const pendingRequests = collabRequestsSnapshot.size + licensingRequestsSnapshot.size;

        // Fetch accepted requests (new responses)
        const acceptedCollabQuery = query(
          collection(db, "collaborationRequests"),
          where("directorId", "==", user.id),
          where("status", "==", "accepted")
        );
        const acceptedCollabSnapshot = await getDocs(acceptedCollabQuery);

        const acceptedLicensingQuery = query(
          collection(db, "licensingRequests"),
          where("directorId", "==", user.id),
          where("status", "==", "approved")
        );
        const acceptedLicensingSnapshot = await getDocs(acceptedLicensingQuery);

        const newResponses = acceptedCollabSnapshot.size + acceptedLicensingSnapshot.size;

        // Fetch deliveries pending review
        const deliveriesQuery = query(
          collection(db, "deliveries"),
          where("directorId", "==", user.id),
          where("status", "==", "pending_review")
        );
        const deliveriesSnapshot = await getDocs(deliveriesQuery);
        const deliveriesPending = deliveriesSnapshot.size;

        // Fetch shortlisted artists count
        const shortlistsQuery = query(
          collection(db, "shortlists"),
          where("directorId", "==", user.id)
        );
        const shortlistsSnapshot = await getDocs(shortlistsQuery);
        
        let shortlistedArtists = 0;
        for (const shortlistDoc of shortlistsSnapshot.docs) {
          const data = shortlistDoc.data();
          shortlistedArtists += (data.artists?.length || 0) + (data.tracks?.length || 0);
        }

        setStats({
          activeProjects,
          pendingRequests,
          newResponses,
          deliveriesPending,
          shortlistedArtists,
        });
      } catch (error) {
        console.error("Error fetching director stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch subscription details
    const fetchSubscriptionDetails = async () => {
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
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    checkVerification();
    fetchStats();
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
          Music Director Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLocked 
            ? "Your Music Director role is active, but subscription is required to create projects and send requests. Contact admin or activate your plan."
            : "Welcome to the Music Director Dashboard. Create projects, shortlist artists, and manage collaborations."}
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
                  Director Verification Pending
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Director verification pending. Some project features may be limited until admin verification is complete.
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
                  Your Music Director role is active, but subscription is required to create projects and send requests. Contact admin or activate your plan.
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
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingRequests}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Responses</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newResponses}</div>
            <p className="text-xs text-muted-foreground">
              Accepted requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveriesPending}</div>
            <p className="text-xs text-muted-foreground">
              Deliveries to review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.shortlistedArtists}</div>
            <p className="text-xs text-muted-foreground">
              Artists & tracks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/director/projects/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span>Create Project</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/director/discovery")}
            >
              <Search className="h-5 w-5" />
              <span>Browse Artists</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/director/approvals")}
            >
              <CheckCircle className="h-5 w-5" />
              <span>Pending Approvals</span>
              {stats.deliveriesPending > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.deliveriesPending}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/director/requests")}
            >
              <FileText className="h-5 w-5" />
              <span>View Requests</span>
              {stats.pendingRequests > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.pendingRequests}
                </Badge>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Director Plan & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Director Plan & Limits
          </CardTitle>
          <CardDescription>
            Your current plan details and project/discovery capacity
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
                      {isVerified && (
                        <Badge variant="default">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Billing: {subscriptionDetails.billingCycle === "monthly" ? "Monthly" : subscriptionDetails.billingCycle === "yearly" ? "Yearly" : "N/A"}
                    </p>
                  </div>
                  {(subscriptionDetails.subscriptionStatus === "expired" || !subscriptionDetails.planId) && (
                    <Button onClick={() => setLocation("/dashboard/upgrade")} size="sm">
                      Upgrade Plan
                    </Button>
                  )}
                </div>
                
                {/* Validity */}
                {subscriptionDetails.directorPlanExpiryDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Valid until:</span>
                    <span className="font-medium">
                      {new Date(subscriptionDetails.directorPlanExpiryDate).toLocaleDateString()}
                    </span>
                    {new Date(subscriptionDetails.directorPlanExpiryDate) < new Date() && (
                      <Badge variant="destructive" className="ml-2">Expired</Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Active Projects Limit */}
              {subscriptionDetails.maxActiveProjects !== undefined && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Active Projects</span>
                    <span className="font-semibold">
                      {subscriptionDetails.activeProjectsCount || 0} / {subscriptionDetails.maxActiveProjects || 0}
                    </span>
                  </div>
                  <Progress 
                    value={subscriptionDetails.maxActiveProjects > 0 
                      ? ((subscriptionDetails.activeProjectsCount || 0) / subscriptionDetails.maxActiveProjects) * 100 
                      : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-semibold ${(subscriptionDetails.projectsRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                      {subscriptionDetails.projectsRemaining || 0}
                    </span>
                  </div>
                  {subscriptionDetails.projectsRemaining === 0 && subscriptionDetails.maxActiveProjects > 0 && (
                    <p className="text-xs text-destructive mt-2">
                      Project limit reached. Complete or archive existing projects, or upgrade your plan.
                    </p>
                  )}
                </div>
              )}

              {/* Artist Discovery Limits */}
              {subscriptionDetails.artistDiscoveryPerDay !== undefined && (
                <div className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Artist Discovery Usage</h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Today</span>
                      <span className="font-semibold">
                        {subscriptionDetails.artistDiscoveryUsedToday || 0} / {subscriptionDetails.artistDiscoveryPerDay || 0}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionDetails.artistDiscoveryPerDay > 0 
                        ? ((subscriptionDetails.artistDiscoveryUsedToday || 0) / subscriptionDetails.artistDiscoveryPerDay) * 100 
                        : 0} 
                      className="h-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining Today</span>
                      <span className={`font-semibold ${(subscriptionDetails.discoveryRemainingToday || 0) === 0 ? "text-destructive" : ""}`}>
                        {subscriptionDetails.discoveryRemainingToday || 0}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">This Month</span>
                      <span className="font-semibold">
                        {subscriptionDetails.artistDiscoveryUsedThisMonth || 0} / {subscriptionDetails.artistDiscoveryPerMonth || 0}
                      </span>
                    </div>
                    <Progress 
                      value={subscriptionDetails.artistDiscoveryPerMonth > 0 
                        ? ((subscriptionDetails.artistDiscoveryUsedThisMonth || 0) / subscriptionDetails.artistDiscoveryPerMonth) * 100 
                        : 0} 
                      className="h-2" 
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Remaining This Month</span>
                      <span className={`font-semibold ${(subscriptionDetails.discoveryRemainingMonth || 0) === 0 ? "text-destructive" : ""}`}>
                        {subscriptionDetails.discoveryRemainingMonth || 0}
                      </span>
                    </div>
                  </div>

                  {(subscriptionDetails.discoveryRemainingToday === 0 || subscriptionDetails.discoveryRemainingMonth === 0) && (
                    <p className="text-xs text-destructive mt-2">
                      Discovery limit reached. Please upgrade your plan or try again later.
                    </p>
                  )}
                </div>
              )}

              {/* Shortlist Creation Limit */}
              {subscriptionDetails.maxShortlistsCreatePerMonth !== undefined && (
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Shortlists Created This Month</span>
                    <span className="font-semibold">
                      {subscriptionDetails.shortlistsCreatedThisMonth || 0} / {subscriptionDetails.maxShortlistsCreatePerMonth || 0}
                    </span>
                  </div>
                  <Progress 
                    value={subscriptionDetails.maxShortlistsCreatePerMonth > 0 
                      ? ((subscriptionDetails.shortlistsCreatedThisMonth || 0) / subscriptionDetails.maxShortlistsCreatePerMonth) * 100 
                      : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining This Month</span>
                    <span className={`font-semibold ${(subscriptionDetails.shortlistsRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                      {subscriptionDetails.shortlistsRemaining || 0}
                    </span>
                  </div>
                  {subscriptionDetails.shortlistsRemaining === 0 && subscriptionDetails.maxShortlistsCreatePerMonth > 0 && (
                    <p className="text-xs text-destructive mt-2">
                      Shortlist creation limit reached. Please upgrade your plan or wait until next month.
                    </p>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {subscriptionDetails.subscriptionStatus === "expired" && (
                <div className="p-4 border border-destructive rounded-lg bg-destructive/10">
                  <p className="text-sm text-destructive font-semibold">
                    Your plan validity has ended. Please upgrade to continue using director features.
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No subscription plan found</p>
              <Button onClick={() => setLocation("/dashboard/upgrade")} className="mt-4" size="sm">
                View Plans
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

