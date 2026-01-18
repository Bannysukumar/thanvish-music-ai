import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Music, 
  Disc, 
  Eye, 
  EyeOff,
  Play,
  Heart,
  Upload,
  Plus,
  Users,
  FileText,
  BarChart3,
  Lock,
  AlertCircle,
  CheckCircle2,
  Crown,
  Calendar,
  Loader2,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState({
    totalTracks: 0,
    totalAlbums: 0,
    publicTracks: 0,
    subscriberOnlyTracks: 0,
    totalPlays: 0,
    totalSaves: 0,
    newRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  useEffect(() => {
    // Check if user is artist
    if (!user || user.role !== "artist") {
      setLocation("/dashboard");
      return;
    }

    // Check subscription status
    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    
    setIsLocked(!subscriptionActive);

    // Check if artist is verified
    const checkVerification = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setIsVerified(userData.verifiedArtist === true);
        }
      } catch (error) {
        console.error("Error checking artist verification:", error);
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

        const token = await currentUser.getIdToken(true); // Force refresh token
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

    // Fetch artist stats
    const fetchStats = async () => {
      try {
        // Fetch tracks
        const tracksQuery = query(
          collection(db, "tracks"),
          where("artistId", "==", user.id)
        );
        const tracksSnapshot = await getDocs(tracksQuery);
        
        let totalTracks = 0;
        let publicTracks = 0;
        let subscriberOnlyTracks = 0;
        let totalPlays = 0;
        let totalSaves = 0;

        tracksSnapshot.forEach((doc) => {
          const data = doc.data();
          totalTracks++;
          if (data.visibility === "public") publicTracks++;
          if (data.visibility === "subscribers") subscriberOnlyTracks++;
          totalPlays += data.plays || 0;
          totalSaves += data.saves || 0;
        });

        // Fetch albums
        const albumsQuery = query(
          collection(db, "albums"),
          where("artistId", "==", user.id)
        );
        const albumsSnapshot = await getDocs(albumsQuery);
        const totalAlbums = albumsSnapshot.size;

        // Fetch collaboration requests
        const collabRequestsQuery = query(
          collection(db, "collaborationRequests"),
          where("artistId", "==", user.id),
          where("status", "==", "pending")
        );
        const collabRequestsSnapshot = await getDocs(collabRequestsQuery);

        // Fetch licensing requests
        const licensingRequestsQuery = query(
          collection(db, "licensingRequests"),
          where("artistId", "==", user.id),
          where("status", "==", "pending")
        );
        const licensingRequestsSnapshot = await getDocs(licensingRequestsQuery);

        const newRequests = collabRequestsSnapshot.size + licensingRequestsSnapshot.size;

        setStats({
          totalTracks,
          totalAlbums,
          publicTracks,
          subscriberOnlyTracks,
          totalPlays,
          totalSaves,
          newRequests,
        });
      } catch (error) {
        console.error("Error fetching artist stats:", error);
      } finally {
        setIsLoading(false);
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
          Artist Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          {isLocked 
            ? "Your Artist role is active, but subscription is required to upload and publish tracks. Contact admin or activate your plan."
            : "Welcome to the Artist Dashboard. Upload tracks, manage albums, and handle collaboration requests."}
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
                  Artist Verification Pending
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Artist verification pending. Some publishing options may be limited until admin verification is complete.
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
                  Your Artist role is active, but subscription is required to upload and publish tracks. Contact admin or activate your plan.
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
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              All tracks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Albums</CardTitle>
            <Disc className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlbums}</div>
            <p className="text-xs text-muted-foreground">
              Published albums
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Public Tracks</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publicTracks}</div>
            <p className="text-xs text-muted-foreground">
              Publicly visible
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriber-Only</CardTitle>
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.subscriberOnlyTracks}</div>
            <p className="text-xs text-muted-foreground">
              Premium content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPlays.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All-time plays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Saves</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSaves.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              User saves
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newRequests}</div>
            <p className="text-xs text-muted-foreground">
              Pending requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your music library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/artist/upload")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
              <span>Upload Track</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/artist/albums/new")}
              disabled={isLocked}
            >
              {isLocked ? (
                <Lock className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
              <span>Create Album</span>
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/artist/requests")}
            >
              <FileText className="h-5 w-5" />
              <span>View Requests</span>
              {stats.newRequests > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {stats.newRequests}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              className="h-auto flex-col gap-2 py-6"
              onClick={() => setLocation("/dashboard/artist/analytics")}
            >
              <BarChart3 className="h-5 w-5" />
              <span>View Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Artist Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Artist Plan & Limits
          </CardTitle>
          <CardDescription>
            Your current plan details and upload/publish capacity
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
                      Billing: {subscriptionDetails.billingCycle === "monthly" ? "Monthly" : "Yearly"}
                    </p>
                  </div>
                  {(subscriptionDetails.subscriptionStatus === "expired" || !subscriptionDetails.planId) && (
                    <Button onClick={() => setLocation("/dashboard/upgrade")}>
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  )}
                </div>

                {subscriptionDetails.subscriptionEndDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">End Date:</span>
                    <span>{new Date(subscriptionDetails.subscriptionEndDate).toLocaleDateString()}</span>
                    {subscriptionDetails.daysRemaining !== null && (
                      <span className={`ml-2 ${subscriptionDetails.daysRemaining <= 7 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        ({subscriptionDetails.daysRemaining > 0 ? `${subscriptionDetails.daysRemaining} days remaining` : "Expired"})
                      </span>
                    )}
                  </div>
                )}

                {/* Daily Generations */}
                {subscriptionDetails.dailyLimit !== undefined && subscriptionDetails.dailyLimit > 0 && (
                  <div className="p-4 border rounded-lg space-y-4 mt-4">
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
                  <div className="p-4 border rounded-lg space-y-4 mt-4">
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

                {/* Track Upload Limits */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Track Uploads Today</span>
                    <span className="font-semibold">
                      {subscriptionDetails.trackUploadsUsedToday || 0} / {subscriptionDetails.maxTrackUploadsPerDay || 0}
                    </span>
                  </div>
                  <Progress 
                    value={subscriptionDetails.maxTrackUploadsPerDay > 0 
                      ? ((subscriptionDetails.trackUploadsUsedToday || 0) / subscriptionDetails.maxTrackUploadsPerDay) * 100 
                      : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining Today</span>
                    <span className="font-semibold">
                      {subscriptionDetails.trackUploadsRemainingToday || 0}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Track Uploads This Month</span>
                    <span className="font-semibold">
                      {subscriptionDetails.trackUploadsUsedThisMonth || 0} / {subscriptionDetails.maxTrackUploadsPerMonth || 0}
                    </span>
                  </div>
                  <Progress 
                    value={subscriptionDetails.maxTrackUploadsPerMonth > 0 
                      ? ((subscriptionDetails.trackUploadsUsedThisMonth || 0) / subscriptionDetails.maxTrackUploadsPerMonth) * 100 
                      : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining This Month</span>
                    <span className="font-semibold">
                      {subscriptionDetails.trackUploadsRemainingThisMonth || 0}
                    </span>
                  </div>
                </div>

                {/* Album Publish Limits */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Albums Published This Month</span>
                    <span className="font-semibold">
                      {subscriptionDetails.albumsPublishedThisMonth || 0} / {subscriptionDetails.maxAlbumsPublishedPerMonth || 0}
                    </span>
                  </div>
                  <Progress 
                    value={subscriptionDetails.maxAlbumsPublishedPerMonth > 0 
                      ? ((subscriptionDetails.albumsPublishedThisMonth || 0) / subscriptionDetails.maxAlbumsPublishedPerMonth) * 100 
                      : 0} 
                    className="h-2" 
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Remaining This Month</span>
                    <span className="font-semibold">
                      {subscriptionDetails.albumsPublishRemainingThisMonth || 0}
                    </span>
                  </div>
                </div>

                {/* Status Messages */}
                {subscriptionDetails.subscriptionStatus === "expired" && (
                  <div className="p-3 border rounded-lg bg-destructive/10">
                    <p className="text-sm text-destructive">
                      Your plan validity has ended. Please renew or upgrade to upload tracks.
                    </p>
                  </div>
                )}
                {subscriptionDetails.trackUploadsRemainingToday === 0 && subscriptionDetails.maxTrackUploadsPerDay > 0 && (
                  <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      You've reached today's track upload limit. Try again tomorrow or upgrade your plan.
                    </p>
                  </div>
                )}
                {subscriptionDetails.trackUploadsRemainingThisMonth === 0 && subscriptionDetails.maxTrackUploadsPerMonth > 0 && (
                  <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      You've reached this month's track upload limit. It will reset next month, or upgrade now.
                    </p>
                  </div>
                )}
                {subscriptionDetails.albumsPublishRemainingThisMonth === 0 && subscriptionDetails.maxAlbumsPublishedPerMonth > 0 && (
                  <div className="p-3 border rounded-lg bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      You've reached your album publish limit for this plan. Upgrade to publish more albums.
                    </p>
                  </div>
                )}
              </div>
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

