import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Search, Eye, EyeOff, Play, Heart, MoreVertical, Edit, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Track {
  id: string;
  title: string;
  genre: string;
  mood?: string;
  visibility: "private" | "public" | "subscribers";
  plays: number;
  saves: number;
  duration: string;
  status: "draft" | "pending" | "live" | "rejected";
  audioUrl?: string;
  coverUrl?: string;
  createdAt?: any;
}

export default function ArtistLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");

  useEffect(() => {
    if (user && user.role === "artist") {
      fetchTracks();
    }
  }, [user]);

  useEffect(() => {
    filterTracks();
  }, [searchQuery, statusFilter, visibilityFilter, tracks]);

  const fetchTracks = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const tracksQuery = query(
        collection(db, "tracks"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(tracksQuery);
      const tracksData: Track[] = [];
      
      querySnapshot.forEach((doc) => {
        tracksData.push({
          id: doc.id,
          ...doc.data(),
        } as Track);
      });

      // Sort by creation date (newest first)
      tracksData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setTracks(tracksData);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterTracks = () => {
    let filtered = [...tracks];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (track) =>
          track.title.toLowerCase().includes(query) ||
          track.genre.toLowerCase().includes(query) ||
          (track.mood && track.mood.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((track) => track.status === statusFilter);
    }

    // Visibility filter
    if (visibilityFilter !== "all") {
      filtered = filtered.filter((track) => track.visibility === visibilityFilter);
    }

    setFilteredTracks(filtered);
  };

  const handleDeleteTrack = async (trackId: string) => {
    if (!confirm("Are you sure you want to delete this track?")) return;

    try {
      await deleteDoc(doc(db, "tracks", trackId));
      toast({
        title: "Success",
        description: "Track deleted successfully",
      });
      fetchTracks();
    } catch (error) {
      console.error("Error deleting track:", error);
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (trackId: string, newStatus: "draft" | "pending" | "live") => {
    try {
      await updateDoc(doc(db, "tracks", trackId), {
        status: newStatus,
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: "Track status updated",
      });
      fetchTracks();
    } catch (error) {
      console.error("Error updating track status:", error);
      toast({
        title: "Error",
        description: "Failed to update track status",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = async (trackId: string, newVisibility: "private" | "public" | "subscribers") => {
    try {
      await updateDoc(doc(db, "tracks", trackId), {
        visibility: newVisibility,
        updatedAt: new Date(),
      });
      toast({
        title: "Success",
        description: "Track visibility updated",
      });
      fetchTracks();
    } catch (error) {
      console.error("Error updating track visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update track visibility",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">My Library</h1>
        <p className="text-muted-foreground mt-2">
          Manage your tracks and albums
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks by title, genre, or mood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="All Visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Visibility</SelectItem>
                <SelectItem value="private">Private</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="subscribers">Subscribers Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tracks List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tracks</CardTitle>
          <CardDescription>
            {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""} found
            {filteredTracks.length !== tracks.length && ` (${tracks.length} total)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTracks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {tracks.length === 0
                  ? "No tracks yet"
                  : "No tracks match your filters"}
              </p>
              <p className="text-sm mt-2">
                {tracks.length === 0
                  ? "Upload your first track to get started"
                  : "Try adjusting your search or filters"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {track.coverUrl ? (
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Music className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{track.title}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          track.status === "live"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : track.status === "pending"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : track.status === "rejected"
                            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}>
                          {track.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span>{track.genre}</span>
                        {track.mood && (
                          <>
                            <span>•</span>
                            <span>{track.mood}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>{track.duration || "0:00"}</span>
                        <span>•</span>
                        {track.visibility === "public" ? (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            Public
                          </span>
                        ) : track.visibility === "subscribers" ? (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Subscribers Only
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <EyeOff className="h-3 w-3" />
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {track.plays.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Heart className="h-3 w-3" />
                        {track.saves}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {track.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(track.id, "pending")}
                          >
                            Submit for Review
                          </DropdownMenuItem>
                        )}
                        {track.status === "pending" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(track.id, "live")}
                            >
                              Publish (Make Live)
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(track.id, "draft")}
                            >
                              Move to Draft
                            </DropdownMenuItem>
                          </>
                        )}
                        {track.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(track.id, "pending")}
                          >
                            Submit for Review
                          </DropdownMenuItem>
                        )}
                        {track.status === "live" && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(track.id, "draft")}
                          >
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleVisibilityChange(track.id, "public")}
                          disabled={track.visibility === "public"}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Set to Public
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleVisibilityChange(track.id, "private")}
                          disabled={track.visibility === "private"}
                        >
                          <EyeOff className="h-4 w-4 mr-2" />
                          Set to Private
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleVisibilityChange(track.id, "subscribers")}
                          disabled={track.visibility === "subscribers"}
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          Set to Subscribers Only
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTrack(track.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
