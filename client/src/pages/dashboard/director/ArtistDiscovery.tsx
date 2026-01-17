import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Music, User, Star, Eye, Filter, Send, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

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
  artistId?: string;
  genre: string;
  mood?: string;
  visibility: string;
}

interface Project {
  id: string;
  title: string;
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
  
  // Request modal states
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showLicensingModal, setShowLicensingModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  
  // Collaboration request form
  const [collabFormData, setCollabFormData] = useState({
    projectId: "",
    projectTitle: "",
    description: "",
    role: "",
    budgetRange: "",
    deadline: "",
  });
  
  // Licensing request form
  const [licensingFormData, setLicensingFormData] = useState({
    projectId: "",
    projectTitle: "",
    trackId: "",
    trackTitle: "",
    description: "",
    budgetRange: "",
    deadline: "",
  });

  useEffect(() => {
    if (user && user.role === "music_director") {
      // Only fetch on initial load, not on filter changes
      // Filter changes will be handled client-side
      if (artists.length === 0 && tracks.length === 0) {
        fetchArtists();
        fetchTracks();
      }
      // Fetch projects for request forms
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    if (!user) return;

    try {
      const projectsQuery = query(
        collection(db, "directorProjects"),
        where("directorId", "==", user.id)
      );
      const querySnapshot = await getDocs(projectsQuery);
      const projectsData: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          id: doc.id,
          title: data.title || "Untitled Project",
        });
      });

      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const checkDiscoveryLimit = async (): Promise<boolean> => {
    if (!auth.currentUser) {
      toast({
        title: "Error",
        description: "Authentication required",
        variant: "destructive",
      });
      return false;
    }

    try {
      const token = await auth.currentUser.getIdToken();
      const limitCheckResponse = await fetch("/api/director/check-discovery-limit", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!limitCheckResponse.ok) {
        // Check if response is JSON before parsing
        const contentType = limitCheckResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await limitCheckResponse.json();
          toast({
            title: "Discovery Limit Reached",
            description: errorData.error || "You've reached your artist discovery limit. Please upgrade your plan or try again later.",
            variant: "destructive",
          });
        } else {
          // Response is not JSON (likely HTML error page)
          const errorText = await limitCheckResponse.text();
          console.error("Non-JSON error response:", errorText);
          toast({
            title: "Error",
            description: "Failed to check discovery limits. Please try again later.",
            variant: "destructive",
          });
        }
        return false;
      }

      const limitData = await limitCheckResponse.json();
      if (!limitData.canDiscover) {
        toast({
          title: "Discovery Limit Reached",
          description: limitData.error || `You've reached your discovery limit (Daily: ${limitData.dailyRemaining}/${limitData.maxDailyDiscovery}, Monthly: ${limitData.monthlyRemaining}/${limitData.maxMonthlyDiscovery}). Please upgrade your plan or try again later.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error: any) {
      console.error("Error checking discovery limit:", error);
      toast({
        title: "Error",
        description: "Failed to check discovery limits",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleOpenCollabModal = (artist: Artist) => {
    setSelectedArtist(artist);
    setCollabFormData({
      projectId: "",
      projectTitle: "",
      description: "",
      role: "",
      budgetRange: "",
      deadline: "",
    });
    setShowCollabModal(true);
  };

  const handleOpenLicensingModal = (track: Track) => {
    setSelectedTrack(track);
    setLicensingFormData({
      projectId: "",
      projectTitle: "",
      trackId: track.id,
      trackTitle: track.title,
      description: "",
      budgetRange: "",
      deadline: "",
    });
    setShowLicensingModal(true);
  };

  const handleSendCollaborationRequest = async () => {
    if (!user || !selectedArtist) return;

    // Check subscription status
    if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trial") {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to send collaboration requests",
        variant: "destructive",
      });
      return;
    }

    if (!collabFormData.projectTitle && !collabFormData.projectId) {
      toast({
        title: "Error",
        description: "Please select or enter a project title",
        variant: "destructive",
      });
      return;
    }

    if (!collabFormData.description) {
      toast({
        title: "Error",
        description: "Please provide a description",
        variant: "destructive",
      });
      return;
    }

    setIsSendingRequest(true);

    try {
      // Get artist user document to get their email
      const artistDoc = await getDoc(doc(db, "users", selectedArtist.id));
      const artistData = artistDoc.data();

      const requestData = {
        directorId: user.id,
        directorName: user.name || "Music Director",
        directorEmail: user.email,
        artistId: selectedArtist.id,
        artistName: selectedArtist.name,
        projectTitle: collabFormData.projectId 
          ? projects.find(p => p.id === collabFormData.projectId)?.title || collabFormData.projectTitle
          : collabFormData.projectTitle,
        projectId: collabFormData.projectId || null,
        description: collabFormData.description,
        role: collabFormData.role || "Artist",
        budgetRange: collabFormData.budgetRange || null,
        deadline: collabFormData.deadline || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "collaborationRequests"), requestData);

      toast({
        title: "Success",
        description: `Collaboration request sent to ${selectedArtist.name}`,
      });

      setShowCollabModal(false);
      setSelectedArtist(null);
      setCollabFormData({
        projectId: "",
        projectTitle: "",
        description: "",
        role: "",
        budgetRange: "",
        deadline: "",
      });
    } catch (error: any) {
      console.error("Error sending collaboration request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send collaboration request",
        variant: "destructive",
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSendLicensingRequest = async () => {
    if (!user || !selectedTrack) return;

    // Check subscription status
    if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trial") {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to send licensing requests",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTrack.artistId) {
      toast({
        title: "Error",
        description: "Artist information not available for this track",
        variant: "destructive",
      });
      return;
    }

    if (!licensingFormData.projectTitle && !licensingFormData.projectId) {
      toast({
        title: "Error",
        description: "Please select or enter a project title",
        variant: "destructive",
      });
      return;
    }

    if (!licensingFormData.description) {
      toast({
        title: "Error",
        description: "Please provide a description",
        variant: "destructive",
      });
      return;
    }

    setIsSendingRequest(true);

    try {
      // Get artist user document
      const artistDoc = await getDoc(doc(db, "users", selectedTrack.artistId));
      const artistData = artistDoc.data();

      const requestData = {
        directorId: user.id,
        directorName: user.name || "Music Director",
        directorEmail: user.email,
        artistId: selectedTrack.artistId,
        artistName: selectedTrack.artistName,
        trackId: selectedTrack.id,
        trackTitle: selectedTrack.title,
        projectTitle: licensingFormData.projectId 
          ? projects.find(p => p.id === licensingFormData.projectId)?.title || licensingFormData.projectTitle
          : licensingFormData.projectTitle,
        projectId: licensingFormData.projectId || null,
        description: licensingFormData.description,
        budgetRange: licensingFormData.budgetRange || null,
        deadline: licensingFormData.deadline || null,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "licensingRequests"), requestData);

      toast({
        title: "Success",
        description: `Licensing request sent for "${selectedTrack.title}"`,
      });

      setShowLicensingModal(false);
      setSelectedTrack(null);
      setLicensingFormData({
        projectId: "",
        projectTitle: "",
        trackId: "",
        trackTitle: "",
        description: "",
        budgetRange: "",
        deadline: "",
      });
    } catch (error: any) {
      console.error("Error sending licensing request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send licensing request",
        variant: "destructive",
      });
    } finally {
      setIsSendingRequest(false);
    }
  };

  const fetchArtists = async () => {
    try {
      setIsLoading(true);
      
      // Check discovery limit before fetching
      const canDiscover = await checkDiscoveryLimit();
      if (!canDiscover) {
        setIsLoading(false);
        return;
      }
      
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
      
      // Increment discovery counter after successful fetch
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          await fetch("/api/director/increment-discovery", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error("Error incrementing discovery count:", error);
        }
      }
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
      // Check discovery limit before fetching
      const canDiscover = await checkDiscoveryLimit();
      if (!canDiscover) {
        return;
      }
      
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
          artistId: data.artistId,
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
      
      // Increment discovery counter after successful fetch
      if (auth.currentUser) {
        try {
          const token = await auth.currentUser.getIdToken();
          await fetch("/api/director/increment-discovery", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
        } catch (error) {
          console.error("Error incrementing discovery count:", error);
        }
      }
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
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCollabModal(artist);
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Request
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
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenLicensingModal(track);
                            }}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Request License
                          </Button>
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

      {/* Collaboration Request Modal */}
      <Dialog open={showCollabModal} onOpenChange={setShowCollabModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Collaboration Request</DialogTitle>
            <DialogDescription>
              Send a collaboration request to {selectedArtist?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="projectSelect">Project (Optional)</Label>
              <Select
                value={collabFormData.projectId}
                onValueChange={(value) => {
                  const project = projects.find(p => p.id === value);
                  setCollabFormData({
                    ...collabFormData,
                    projectId: value,
                    projectTitle: project?.title || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project or enter new one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Create New Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!collabFormData.projectId && (
              <div className="space-y-2">
                <Label htmlFor="projectTitle">Project Title *</Label>
                <Input
                  id="projectTitle"
                  value={collabFormData.projectTitle}
                  onChange={(e) => setCollabFormData({ ...collabFormData, projectTitle: e.target.value })}
                  placeholder="e.g., Film Score, Commercial Music"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={collabFormData.description}
                onChange={(e) => setCollabFormData({ ...collabFormData, description: e.target.value })}
                placeholder="Describe the collaboration opportunity, requirements, and expectations..."
                rows={5}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role Needed</Label>
              <Input
                id="role"
                value={collabFormData.role}
                onChange={(e) => setCollabFormData({ ...collabFormData, role: e.target.value })}
                placeholder="e.g., Composer, Performer, Producer"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="budgetRange">Budget Range (Optional)</Label>
                <Input
                  id="budgetRange"
                  value={collabFormData.budgetRange}
                  onChange={(e) => setCollabFormData({ ...collabFormData, budgetRange: e.target.value })}
                  placeholder="e.g., $500-$1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (Optional)</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={collabFormData.deadline}
                  onChange={(e) => setCollabFormData({ ...collabFormData, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollabModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendCollaborationRequest} disabled={isSendingRequest}>
              {isSendingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Licensing Request Modal */}
      <Dialog open={showLicensingModal} onOpenChange={setShowLicensingModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Track License</DialogTitle>
            <DialogDescription>
              Request licensing for "{selectedTrack?.title}" by {selectedTrack?.artistName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Track: {selectedTrack?.title}</p>
              <p className="text-xs text-muted-foreground">Artist: {selectedTrack?.artistName}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licensingProjectSelect">Project (Optional)</Label>
              <Select
                value={licensingFormData.projectId}
                onValueChange={(value) => {
                  const project = projects.find(p => p.id === value);
                  setLicensingFormData({
                    ...licensingFormData,
                    projectId: value,
                    projectTitle: project?.title || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project or enter new one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Create New Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!licensingFormData.projectId && (
              <div className="space-y-2">
                <Label htmlFor="licensingProjectTitle">Project Title *</Label>
                <Input
                  id="licensingProjectTitle"
                  value={licensingFormData.projectTitle}
                  onChange={(e) => setLicensingFormData({ ...licensingFormData, projectTitle: e.target.value })}
                  placeholder="e.g., Film Score, Commercial Music"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="licensingDescription">Description *</Label>
              <Textarea
                id="licensingDescription"
                value={licensingFormData.description}
                onChange={(e) => setLicensingFormData({ ...licensingFormData, description: e.target.value })}
                placeholder="Describe how you plan to use this track, the intended use case, and any specific requirements..."
                rows={5}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="licensingBudgetRange">Budget Range (Optional)</Label>
                <Input
                  id="licensingBudgetRange"
                  value={licensingFormData.budgetRange}
                  onChange={(e) => setLicensingFormData({ ...licensingFormData, budgetRange: e.target.value })}
                  placeholder="e.g., $500-$1000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="licensingDeadline">Deadline (Optional)</Label>
                <Input
                  id="licensingDeadline"
                  type="date"
                  value={licensingFormData.deadline}
                  onChange={(e) => setLicensingFormData({ ...licensingFormData, deadline: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLicensingModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendLicensingRequest} disabled={isSendingRequest}>
              {isSendingRequest ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

