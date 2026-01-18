import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Library, Trash2, Search, Music2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy, Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { EnhancedAudioPlayer } from "@/components/music/EnhancedAudioPlayer";
import { SocialInteractions } from "@/components/music/SocialInteractions";
import { ChatDialog } from "@/components/chat/ChatDialog";

/**
 * Generated music data structure from Firestore
 */
interface GeneratedMusic {
  id: string;
  taskId: string;
  compositionId: string;
  title: string;
  raga: string;
  tala: string;
  instruments: string[];
  tempo: number;
  mood: string;
  description?: string;
  audioUrl: string;
  originalAudioUrl?: string;
  allAudioUrls?: string[];
  generatedBy: {
    userId: string;
    role: string;
    name?: string;
    email?: string;
  };
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * DashboardLibrary component - user's music library page
 * Fetches from Firestore and prevents downloads
 */
export default function DashboardLibrary() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [compositions, setCompositions] = useState<GeneratedMusic[]>([]);
  const [filteredCompositions, setFilteredCompositions] = useState<GeneratedMusic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [chatUserName, setChatUserName] = useState<string | null>(null);
  const [trackStats, setTrackStats] = useState<Map<string, any>>(new Map());

  // Load compositions from Firestore on mount
  useEffect(() => {
    if (user?.id) {
      loadCompositions();
    }
  }, [user]);

  // Filter compositions based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = compositions.filter(
        (comp) =>
          comp.title.toLowerCase().includes(lowerQuery) ||
          comp.raga.toLowerCase().includes(lowerQuery) ||
          comp.tala.toLowerCase().includes(lowerQuery) ||
          comp.mood.toLowerCase().includes(lowerQuery) ||
          comp.description?.toLowerCase().includes(lowerQuery) ||
          comp.instruments.some((inst) => inst.toLowerCase().includes(lowerQuery))
      );
      setFilteredCompositions(filtered);
    } else {
      setFilteredCompositions(compositions);
    }
  }, [searchQuery, compositions]);

  /**
   * Load all generated music from Firestore
   * Excludes Exclusive users' music and respects privacy settings
   */
  const loadCompositions = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      
      // Use API endpoint for proper filtering (excludes Exclusive, enforces privacy)
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/library/tracks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const musicData: GeneratedMusic[] = (data.tracks || []).map((track: any) => ({
          id: track.id,
          ...track,
          createdAt: track.createdAt?.toDate ? track.createdAt.toDate() : new Date(track.createdAt),
          updatedAt: track.updatedAt?.toDate ? track.updatedAt.toDate() : new Date(track.updatedAt),
        }));

        setCompositions(musicData);
        setFilteredCompositions(musicData);
        
        // Load stats for each track
        loadTrackStats(musicData.map(t => t.id));
      } else {
        // Fallback to direct Firestore query
        const musicQuery = query(
          collection(db, "generatedMusic"),
          where("generatedBy.role", "!=", "exclusive"),
          orderBy("generatedBy.role"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(musicQuery);
        const musicData: GeneratedMusic[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          musicData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as GeneratedMusic);
        });

        setCompositions(musicData);
        setFilteredCompositions(musicData);
        loadTrackStats(musicData.map(t => t.id));
      }
    } catch (error) {
      console.error("Error loading compositions:", error);
      toast({
        title: "Error",
        description: "Failed to load your music library.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load social stats (likes, ratings, comments) for tracks
   */
  const loadTrackStats = async (trackIds: string[]) => {
    if (!user || trackIds.length === 0) return;

    try {
      const statsMap = new Map<string, any>();

      // Load stats for each track
      for (const trackId of trackIds) {
        try {
          // Load user's like status
          const userLikeQuery = query(
            collection(db, "trackLikes"),
            where("trackId", "==", trackId),
            where("userId", "==", user.id)
          );
          const userLikeSnapshot = await getDocs(userLikeQuery);
          const userLiked = !userLikeSnapshot.empty;

          // Load all likes
          const allLikesQuery = query(
            collection(db, "trackLikes"),
            where("trackId", "==", trackId)
          );
          const allLikesSnapshot = await getDocs(allLikesQuery);

          // Load user's rating
          const userRatingQuery = query(
            collection(db, "trackRatings"),
            where("trackId", "==", trackId),
            where("userId", "==", user.id)
          );
          const userRatingSnapshot = await getDocs(userRatingQuery);
          const userRating = userRatingSnapshot.empty ? 0 : userRatingSnapshot.docs[0].data().rating;

          // Load all ratings
          const allRatingsQuery = query(
            collection(db, "trackRatings"),
            where("trackId", "==", trackId)
          );
          const allRatingsSnapshot = await getDocs(allRatingsQuery);
          let totalRating = 0;
          allRatingsSnapshot.forEach((doc) => {
            totalRating += doc.data().rating;
          });
          const averageRating =
            allRatingsSnapshot.size > 0 ? totalRating / allRatingsSnapshot.size : 0;

          // Load comments count
          const commentsQuery = query(
            collection(db, "trackComments"),
            where("trackId", "==", trackId)
          );
          const commentsSnapshot = await getDocs(commentsQuery);

          statsMap.set(trackId, {
            likesCount: allLikesSnapshot.size,
            userLiked,
            userRating,
            averageRating,
            ratingsCount: allRatingsSnapshot.size,
            commentsCount: commentsSnapshot.size,
          });
        } catch (error) {
          console.error(`Error loading stats for track ${trackId}:`, error);
          // Set default stats if error
          statsMap.set(trackId, {
            likesCount: 0,
            userLiked: false,
            userRating: 0,
            averageRating: 0,
            ratingsCount: 0,
            commentsCount: 0,
          });
        }
      }

      setTrackStats(statsMap);
    } catch (error) {
      console.error("Error loading track stats:", error);
    }
  };

  /**
   * Handle delete composition
   */
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this composition?")) return;

    try {
      await deleteDoc(doc(db, "generatedMusic", id));
      // Remove from local state
      setCompositions(compositions.filter((comp) => comp.id !== id));
      setFilteredCompositions(filteredCompositions.filter((comp) => comp.id !== id));
      toast({
        title: "Composition deleted",
        description: "The composition has been removed from your library.",
      });
    } catch (error) {
      console.error("Error deleting composition:", error);
      toast({
        title: "Error",
        description: "Failed to delete composition.",
        variant: "destructive",
      });
    }
  };

  const handlePlay = (trackId: string) => {
    setPlayingId(trackId);
  };

  const handlePause = () => {
    setPlayingId(null);
  };

  const handleChatClick = (ownerId: string, ownerName?: string) => {
    setChatUserId(ownerId);
    setChatUserName(ownerName);
    setChatOpen(true);
  };

  /**
   * Prevent right-click download
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  /**
   * Get role badge color
   */
  const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
    switch (role) {
      case "music_teacher":
        return "default";
      case "artist":
        return "secondary";
      case "music_director":
        return "outline";
      default:
        return "default";
    }
  };

  /**
   * Format role name for display
   */
  const formatRoleName = (role: string): string => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const displayCompositions = filteredCompositions;

  return (
    <div className="space-y-6" onContextMenu={handleContextMenu}>
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">My Library</h1>
        <p className="text-muted-foreground mt-2">
          Your saved compositions and generated music ({displayCompositions.length} {displayCompositions.length === 1 ? "composition" : "compositions"})
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your library by title, raga, tala, mood, or instruments..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Library content */}
      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-muted-foreground">Loading your library...</span>
          </CardContent>
        </Card>
      ) : displayCompositions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              {searchQuery
                ? "No compositions found matching your search."
                : "Generate and save your first composition to start building your music library"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/generate">
                <Button>
                  <Music2 className="mr-2 h-4 w-4" />
                  Go to Generator
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCompositions.map((composition) => (
            <Card key={composition.id} className="flex flex-col" onContextMenu={handleContextMenu}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg line-clamp-1 flex-1">{composition.title}</CardTitle>
                  <Badge variant={getRoleBadgeVariant(composition.generatedBy.role)} className="shrink-0">
                    <User className="w-3 h-3 mr-1" />
                    {formatRoleName(composition.generatedBy.role)}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {composition.description || `${composition.raga} in ${composition.tala}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {/* Composition details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raga:</span>
                    <span className="font-medium capitalize">{composition.raga}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tala:</span>
                    <span className="font-medium capitalize">{composition.tala}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mood:</span>
                    <span className="font-medium">{composition.mood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo:</span>
                    <span className="font-medium">{composition.tempo} BPM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Instruments: </span>
                    <span className="font-medium text-xs">
                      {composition.instruments.join(", ")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created: {format(composition.createdAt instanceof Date ? composition.createdAt : composition.createdAt.toDate(), "MMM d, yyyy")}
                  </div>
                </div>

                {/* Enhanced Audio Player */}
                <div className="pt-2">
                  <EnhancedAudioPlayer
                    audioUrl={composition.audioUrl}
                    trackId={composition.id}
                    onPlay={() => handlePlay(composition.id)}
                    onPause={handlePause}
                    onEnded={handlePause}
                  />
                </div>

                {/* Social Interactions */}
                <div className="pt-2 border-t">
                  <SocialInteractions
                    trackId={composition.id}
                    ownerId={composition.generatedBy.userId}
                    ownerName={composition.generatedBy.name}
                    initialLikes={trackStats.get(composition.id)?.likesCount || 0}
                    initialUserLiked={trackStats.get(composition.id)?.userLiked || false}
                    initialRating={trackStats.get(composition.id)?.userRating || 0}
                    initialAverageRating={trackStats.get(composition.id)?.averageRating || 0}
                    initialRatingsCount={trackStats.get(composition.id)?.ratingsCount || 0}
                    initialCommentsCount={trackStats.get(composition.id)?.commentsCount || 0}
                    onChatClick={() =>
                      handleChatClick(
                        composition.generatedBy.userId,
                        composition.generatedBy.name
                      )
                    }
                  />
                </div>

                {/* Delete Button */}
                {composition.generatedBy.userId === user?.id && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(composition.id)}
                      className="w-full text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chat Dialog */}
      {chatUserId && (
        <ChatDialog
          open={chatOpen}
          onOpenChange={setChatOpen}
          otherUserId={chatUserId}
          otherUserName={chatUserName || undefined}
        />
      )}
    </div>
  );
}
