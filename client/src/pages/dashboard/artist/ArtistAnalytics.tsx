import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Play, Heart, TrendingUp, Lock, Music } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface TrackStats {
  id: string;
  title: string;
  plays: number;
  saves: number;
}

export default function ArtistAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("30");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPlays: 0,
    totalSaves: 0,
    totalTracks: 0,
    topTrack: null as TrackStats | null,
    tracks: [] as TrackStats[],
  });

  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "artist") {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const tracksQuery = query(
        collection(db, "tracks"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(tracksQuery);
      
      const tracksData: TrackStats[] = [];
      let totalPlays = 0;
      let totalSaves = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const plays = data.plays || 0;
        const saves = data.saves || 0;
        
        totalPlays += plays;
        totalSaves += saves;

        tracksData.push({
          id: doc.id,
          title: data.title,
          plays,
          saves,
        });
      });

      // Sort by plays to find top track
      tracksData.sort((a, b) => b.plays - a.plays);
      const topTrack = tracksData.length > 0 ? tracksData[0] : null;

      setStats({
        totalPlays,
        totalSaves,
        totalTracks: tracksData.length,
        topTrack,
        tracks: tracksData.slice(0, 10), // Top 10 tracks
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Track your music performance and engagement
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLocked && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Full Analytics Unlocked
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Upgrade to access detailed analytics and insights.
                </p>
                <Button
                  variant="outline"
                  className="mt-3"
                  onClick={() => window.location.href = "/dashboard/upgrade"}
                >
                  Upgrade Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTracks}</div>
            <p className="text-xs text-muted-foreground">
              Published tracks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Track</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.topTrack ? stats.topTrack.title.substring(0, 15) + (stats.topTrack.title.length > 15 ? "..." : "") : "-"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.topTrack ? `${stats.topTrack.plays.toLocaleString()} plays` : "No tracks yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Tracks */}
      {stats.tracks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Tracks</CardTitle>
            <CardDescription>
              Your most played tracks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{track.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Play className="h-3 w-3" />
                          {track.plays.toLocaleString()} plays
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {track.saves.toLocaleString()} saves
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Track performance over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics charts will appear here</p>
              <p className="text-sm mt-2">Detailed charts coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
