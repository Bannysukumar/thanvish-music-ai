import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Music, User, Star, Eye, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface Artist {
  id: string;
  name: string;
  bio?: string;
  genre?: string;
  verified?: boolean;
}

interface Track {
  id: string;
  title: string;
  artistName: string;
  genre: string;
  mood?: string;
  visibility: string;
}

export default function ArtistDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"artists" | "tracks">("artists");
  const [genreFilter, setGenreFilter] = useState("all");
  const [moodFilter, setMoodFilter] = useState("all");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchArtists();
      fetchTracks();
    }
  }, [user, genreFilter, moodFilter]);

  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      // Fetch users with artist role
      const usersQuery = query(
        collection(db, "users"),
        where("role", "==", "artist"),
        limit(50)
      );
      const querySnapshot = await getDocs(usersQuery);
      const artistsData: Artist[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        artistsData.push({
          id: doc.id,
          name: data.name || "Unknown Artist",
          bio: data.bio,
          genre: data.genre,
          verified: data.verifiedArtist || false,
        });
      });

      // Apply filters
      let filtered = artistsData;
      if (genreFilter !== "all") {
        filtered = filtered.filter((artist) => artist.genre === genreFilter);
      }

      setArtists(filtered);
    } catch (error) {
      console.error("Error fetching artists:", error);
      toast({
        title: "Error",
        description: "Failed to load artists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      // Fetch public tracks
      const tracksQuery = query(
        collection(db, "tracks"),
        where("visibility", "==", "public"),
        where("status", "==", "live"),
        limit(50)
      );
      const querySnapshot = await getDocs(tracksQuery);
      const tracksData: Track[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tracksData.push({
          id: doc.id,
          title: data.title,
          artistName: data.artistName || "Unknown",
          genre: data.genre,
          mood: data.mood,
          visibility: data.visibility,
        });
      });

      // Apply filters
      let filtered = tracksData;
      if (genreFilter !== "all") {
        filtered = filtered.filter((track) => track.genre === genreFilter);
      }
      if (moodFilter !== "all") {
        filtered = filtered.filter((track) => track.mood === moodFilter);
      }

      setTracks(filtered);
    } catch (error) {
      console.error("Error fetching tracks:", error);
    }
  };

  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTracks = tracks.filter((track) =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artistName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Artist Discovery</h1>
        <p className="text-muted-foreground mt-2">
          Browse and discover artists and tracks for your projects
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search artists or tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={viewMode} onValueChange={(value: "artists" | "tracks") => setViewMode(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="artists">Artists</SelectItem>
                  <SelectItem value="tracks">Tracks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-4">
              <Select value={genreFilter} onValueChange={setGenreFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Genres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genres</SelectItem>
                  <SelectItem value="classical">Classical</SelectItem>
                  <SelectItem value="carnatic">Carnatic</SelectItem>
                  <SelectItem value="hindustani">Hindustani</SelectItem>
                  <SelectItem value="fusion">Fusion</SelectItem>
                </SelectContent>
              </Select>
              {viewMode === "tracks" && (
                <Select value={moodFilter} onValueChange={setMoodFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Moods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moods</SelectItem>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="joyful">Joyful</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {viewMode === "artists" ? (
        <Card>
          <CardHeader>
            <CardTitle>Artists</CardTitle>
            <CardDescription>
              {filteredArtists.length} artist{filteredArtists.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredArtists.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No artists found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredArtists.map((artist) => (
                  <Card key={artist.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{artist.name}</h3>
                            {artist.verified && (
                              <Badge variant="default" className="text-xs">
                                Verified
                              </Badge>
                            )}
                          </div>
                          {artist.genre && (
                            <p className="text-sm text-muted-foreground mt-1 capitalize">{artist.genre}</p>
                          )}
                          {artist.bio && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{artist.bio}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tracks</CardTitle>
            <CardDescription>
              {filteredTracks.length} track{filteredTracks.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredTracks.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tracks found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTracks.map((track) => (
                  <Card key={track.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{track.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span>{track.artistName}</span>
                            <span>•</span>
                            <span className="capitalize">{track.genre}</span>
                            {track.mood && (
                              <>
                                <span>•</span>
                                <span className="capitalize">{track.mood}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

