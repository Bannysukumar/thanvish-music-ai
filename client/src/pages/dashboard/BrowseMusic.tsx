import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Music, 
  Search, 
  Play, 
  Pause, 
  Heart, 
  User, 
  Disc, 
  Filter,
  Grid,
  List,
  Eye
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  doc,
  getDoc,
  updateDoc,
  increment
} from "firebase/firestore";

interface Track {
  id: string;
  title: string;
  artistName: string;
  artistId: string;
  genre: string;
  mood?: string;
  duration: string;
  audioUrl: string;
  coverUrl?: string;
  plays: number;
  saves: number;
  visibility: "private" | "public" | "subscribers";
  status: "draft" | "pending" | "live" | "rejected";
  createdAt?: any;
}

interface Album {
  id: string;
  name: string;
  description: string;
  artistName: string;
  artistId: string;
  coverUrl?: string;
  trackIds: string[];
  visibility: "private" | "public" | "subscribers";
  status: "draft" | "live";
  createdAt?: any;
}

export default function BrowseMusic() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"tracks" | "albums">("tracks");
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
  const [filteredAlbums, setFilteredAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [moodFilter, setMoodFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "popular" | "title">("newest");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);

  // Get unique genres and moods from tracks
  const genres = Array.from(new Set(tracks.map(t => t.genre))).sort();
  const moods = Array.from(new Set(tracks.filter(t => t.mood).map(t => t.mood!))).sort();

  useEffect(() => {
    if (user) {
      fetchTracks();
      fetchAlbums();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortContent();
  }, [searchQuery, genreFilter, moodFilter, sortBy, tracks, albums, viewMode]);

  const fetchTracks = async () => {
    try {
      setIsLoading(true);
      // Fetch only public live tracks
      const tracksQuery = query(
        collection(db, "tracks"),
        where("visibility", "==", "public"),
        where("status", "==", "live"),
        orderBy("createdAt", "desc"),
        limit(100)
      );
      
      const querySnapshot = await getDocs(tracksQuery);
      const tracksData: Track[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tracksData.push({
          id: doc.id,
          title: data.title,
          artistName: data.artistName || "Unknown Artist",
          artistId: data.artistId,
          genre: data.genre,
          mood: data.mood,
          duration: data.duration || "0:00",
          audioUrl: data.audioUrl,
          coverUrl: data.coverUrl,
          plays: data.plays || 0,
          saves: data.saves || 0,
          visibility: data.visibility,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      setTracks(tracksData);
    } catch (error: any) {
      console.error("Error fetching tracks:", error);
      
      // Check if it's an index building error
      if (error?.code === "failed-precondition" && error?.message?.includes("index is currently building")) {
        toast({
          title: "Index Building",
          description: "The search index is currently being built. Please wait a few minutes and refresh the page.",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load tracks. Please try again later.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      // Fetch only public live albums
      const albumsQuery = query(
        collection(db, "albums"),
        where("visibility", "==", "public"),
        where("status", "==", "live"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      
      const querySnapshot = await getDocs(albumsQuery);
      const albumsData: Album[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        albumsData.push({
          id: doc.id,
          name: data.name,
          description: data.description || "",
          artistName: data.artistName || "Unknown Artist",
          artistId: data.artistId,
          coverUrl: data.coverUrl,
          trackIds: data.trackIds || [],
          visibility: data.visibility,
          status: data.status,
          createdAt: data.createdAt,
        });
      });

      setAlbums(albumsData);
    } catch (error: any) {
      console.error("Error fetching albums:", error);
      
      // Check if it's an index building error
      if (error?.code === "failed-precondition" && error?.message?.includes("index is currently building")) {
        // Don't show toast for albums if tracks already showed it
        // The error will be handled by the UI state
      }
    }
  };

  const filterAndSortContent = () => {
    if (viewMode === "tracks") {
      let filtered = [...tracks];

      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (track) =>
            track.title.toLowerCase().includes(query) ||
            track.artistName.toLowerCase().includes(query) ||
            track.genre.toLowerCase().includes(query) ||
            (track.mood && track.mood.toLowerCase().includes(query))
        );
      }

      // Genre filter
      if (genreFilter !== "all") {
        filtered = filtered.filter((track) => track.genre === genreFilter);
      }

      // Mood filter
      if (moodFilter !== "all") {
        filtered = filtered.filter((track) => track.mood === moodFilter);
      }

      // Sort
      if (sortBy === "popular") {
        filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
      } else if (sortBy === "title") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // newest (default)
        filtered.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      }

      setFilteredTracks(filtered);
    } else {
      let filtered = [...albums];

      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (album) =>
            album.name.toLowerCase().includes(query) ||
            album.artistName.toLowerCase().includes(query) ||
            album.description.toLowerCase().includes(query)
        );
      }

      // Sort
      if (sortBy === "title") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        // newest (default)
        filtered.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });
      }

      setFilteredAlbums(filtered);
    }
  };

  const handlePlayPause = async (track: Track) => {
    // Stop current track if playing
    if (audioRef) {
      audioRef.pause();
      audioRef.currentTime = 0;
    }

    if (playingTrackId === track.id) {
      // Pause
      setPlayingTrackId(null);
      setAudioRef(null);
    } else {
      // Play new track
      const audio = new Audio(track.audioUrl);
      audio.play();
      setPlayingTrackId(track.id);
      setAudioRef(audio);

      // Increment play count
      try {
        await updateDoc(doc(db, "tracks", track.id), {
          plays: increment(1),
        });
        // Update local state
        setTracks((prev) =>
          prev.map((t) =>
            t.id === track.id ? { ...t, plays: (t.plays || 0) + 1 } : t
          )
        );
      } catch (error) {
        console.error("Error incrementing play count:", error);
      }

      // Handle audio end
      audio.onended = () => {
        setPlayingTrackId(null);
        setAudioRef(null);
      };
    }
  };

  // Check if we have an index building error
  const hasIndexError = tracks.length === 0 && albums.length === 0 && !isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading music...</p>
        </div>
      </div>
    );
  }

  if (hasIndexError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Browse Music</h1>
          <p className="text-muted-foreground mt-2">
            Discover and listen to music from talented artists
          </p>
        </div>
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Index Building in Progress</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The search index is currently being built. This usually takes 2-5 minutes.
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Once the index is ready, you'll be able to browse all public tracks and albums.
              </p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                <a 
                  href="https://console.firebase.google.com/project/thanvish-ai-52bd9/firestore/indexes" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Check index status →
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Browse Music</h1>
          <p className="text-muted-foreground mt-2">
            Discover and listen to music from talented artists
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "tracks" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("tracks")}
          >
            <Music className="h-4 w-4 mr-2" />
            Tracks
          </Button>
          <Button
            variant={viewMode === "albums" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("albums")}
          >
            <Disc className="h-4 w-4 mr-2" />
            Albums
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${viewMode} by title, artist, genre...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {viewMode === "tracks" && (
              <>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Genres" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={moodFilter} onValueChange={setMoodFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="All Moods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moods</SelectItem>
                    {moods.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="title">Title (A-Z)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setLayoutMode(layoutMode === "grid" ? "list" : "grid")}
            >
              {layoutMode === "grid" ? (
                <List className="h-4 w-4" />
              ) : (
                <Grid className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {viewMode === "tracks" ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {filteredTracks.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No tracks found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : layoutMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTracks.map((track) => (
                <Card key={track.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {track.coverUrl ? (
                    <div className="relative aspect-square">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => handlePlayPause(track)}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="relative aspect-square bg-muted flex items-center justify-center">
                      <Music className="h-16 w-16 text-muted-foreground" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="rounded-full"
                          onClick={() => handlePlayPause(track)}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="h-6 w-6" />
                          ) : (
                            <Play className="h-6 w-6" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{track.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {track.artistName}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {track.genre}
                      </Badge>
                      {track.mood && (
                        <Badge variant="secondary" className="text-xs">
                          {track.mood}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {track.plays.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {track.saves}
                      </div>
                      <span>{track.duration}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTracks.map((track) => (
                <Card key={track.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      {track.coverUrl ? (
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-16 h-16 rounded object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center">
                          <Music className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold">{track.title}</h3>
                        <p className="text-sm text-muted-foreground">{track.artistName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {track.genre}
                          </Badge>
                          {track.mood && (
                            <Badge variant="secondary" className="text-xs">
                              {track.mood}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground text-right">
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3" />
                            {track.plays.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Heart className="h-3 w-3" />
                            {track.saves}
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handlePlayPause(track)}
                        >
                          {playingTrackId === track.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {filteredAlbums.length} album{filteredAlbums.length !== 1 ? "s" : ""} found
            </p>
          </div>

          {filteredAlbums.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Disc className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No albums found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAlbums.map((album) => (
                <Card key={album.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {album.coverUrl ? (
                    <img
                      src={album.coverUrl}
                      alt={album.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted flex items-center justify-center">
                      <Disc className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                  <CardContent className="pt-4">
                    <h3 className="font-semibold mb-1 line-clamp-1">{album.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {album.artistName}
                    </p>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {album.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{album.trackIds.length} tracks</span>
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-3 w-3 mr-1" />
                        Public
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

