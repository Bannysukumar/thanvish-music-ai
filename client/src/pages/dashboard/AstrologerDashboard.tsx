import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Star, 
  TrendingUp, 
  CheckCircle,
  Plus,
  BookOpen,
  FileEdit,
  BarChart3,
  Lock,
  AlertCircle,
  CheckCircle2,
  Users
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function AstrologerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalTemplates: 0,
    totalRasiRecommendations: 0,
    publishedPosts: 0,
    totalUsersUsingHoroscope: 0,
    mostUsedRasi: "N/A",
    pendingReview: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    // Check if user is astrologer
    if (!user || user.role !== "astrologer") {
      setLocation("/dashboard");
      return;
    }

    // Check subscription status
    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    
    setIsLocked(!subscriptionActive);

    // Check if astrologer is verified
    const checkVerification = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsVerified(userData.verifiedAstrologer === true);
        }
      } catch (error) {
        console.error("Error checking astrologer verification:", error);
      }
    };

    // Fetch astrologer stats
    const fetchStats = async () => {
      try {
        // Fetch total templates
        const templatesQuery = query(
          collection(db, "astroMusicTemplates"),
          where("astrologerId", "==", user.id)
        );
        const templatesSnapshot = await getDocs(templatesQuery);
        const totalTemplates = templatesSnapshot.size;

        // Fetch total rasi recommendations
        const recommendationsQuery = query(
          collection(db, "rasiRecommendations"),
          where("astrologerId", "==", user.id)
        );
        const recommendationsSnapshot = await getDocs(recommendationsQuery);
        const totalRasiRecommendations = recommendationsSnapshot.size;

        // Fetch published posts
        const postsQuery = query(
          collection(db, "horoscopeContentPosts"),
          where("astrologerId", "==", user.id),
          where("status", "==", "published")
        );
        const postsSnapshot = await getDocs(postsQuery);
        const publishedPosts = postsSnapshot.size;

        // Fetch pending review count
        let pendingReview = 0;
        templatesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "pending_approval") {
            pendingReview++;
          }
        });
        recommendationsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === "pending_approval") {
            pendingReview++;
          }
        });

        // Placeholder for aggregate stats (would need to be calculated from user data)
        const totalUsersUsingHoroscope = 0;
        const mostUsedRasi = "N/A";

        setStats({
          totalTemplates,
          totalRasiRecommendations,
          publishedPosts,
          totalUsersUsingHoroscope,
          mostUsedRasi,
          pendingReview,
        });
      } catch (error) {
        console.error("Error fetching astrologer stats:", error);
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
      <AstrologyDisclaimer />

      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          Astrologer Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLocked 
            ? "Your Astrologer role is active, but subscription is required to publish templates and recommendations. Contact admin or activate your plan."
            : "Welcome to the Astrologer Dashboard. Create rasi recommendations and horoscope music templates."}
        </p>
      </div>

      {/* Verification Banner */}
      {!isVerified && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                  Astrologer Verification Pending
                </h3>
                <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
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
                  Your Astrologer role is active, but subscription is required to publish templates and recommendations. Contact admin or activate your plan.
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
            <p className="text-xs text-muted-foreground">
              All templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rasi Recommendations</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRasiRecommendations}</div>
            <p className="text-xs text-muted-foreground">
              Recommendation sets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Posts</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
            <p className="text-xs text-muted-foreground">
              Content posts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users Using Horoscope</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsersUsingHoroscope}</div>
            <p className="text-xs text-muted-foreground">
              Total users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used Rasi</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-sm">{stats.mostUsedRasi}</div>
            <p className="text-xs text-muted-foreground">
              Popular rasi
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
            Common tasks for managing your horoscope content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/astrologer/templates/new")}
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
              onClick={() => setLocation("/dashboard/astrologer/recommendations/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Star className="h-5 w-5" />
              )}
              <span>Create Rasi Set</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/astrologer/posts/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <BookOpen className="h-5 w-5" />
              )}
              <span>Publish Post</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/astrologer/analytics")}
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
                      Verified Astrologer
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

