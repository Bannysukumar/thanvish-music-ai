import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Disc, Plus, ArrowLeft, Lock, Loader2, X, Music, MoreVertical, Edit, Eye, EyeOff } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, storage, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface Track {
  id: string;
  title: string;
  genre: string;
  duration: string;
}

interface Album {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  visibility: "private" | "public" | "subscribers";
  trackIds: string[];
  tracks?: Track[];
  status: "draft" | "live";
  createdAt?: any;
}

export default function Albums() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isNew = location === "/dashboard/artist/albums/new";
  
  const [albums, setAlbums] = useState<Album[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "private" as "private" | "public" | "subscribers",
    selectedTrackIds: [] as string[],
  });
  
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "artist" && !isNew) {
      fetchAlbums();
    }
    if (user && user.role === "artist" && isNew) {
      fetchTracks();
    }
  }, [user, isNew]);

  const fetchTracks = async () => {
    if (!user) return;

    try {
      const tracksQuery = query(
        collection(db, "tracks"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(tracksQuery);
      const tracksData: Track[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        tracksData.push({
          id: doc.id,
          title: data.title,
          genre: data.genre,
          duration: data.duration || "0:00",
        });
      });

      setTracks(tracksData);
    } catch (error) {
      console.error("Error fetching tracks:", error);
      toast({
        title: "Error",
        description: "Failed to load tracks",
        variant: "destructive",
      });
    }
  };

  const fetchAlbums = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const albumsQuery = query(
        collection(db, "albums"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(albumsQuery);
      const albumsData: Album[] = [];
      
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const trackIds = data.trackIds || [];
        
        // Fetch track details
        const tracksData: Track[] = [];
        for (const trackId of trackIds) {
          try {
            const trackDoc = await getDoc(doc(db, "tracks", trackId));
            if (trackDoc.exists()) {
              const trackData = trackDoc.data();
              tracksData.push({
                id: trackDoc.id,
                title: trackData.title,
                genre: trackData.genre,
                duration: trackData.duration || "0:00",
              });
            }
          } catch (error) {
            console.error(`Error fetching track ${trackId}:`, error);
          }
        }

        albumsData.push({
          id: docSnap.id,
          name: data.name,
          description: data.description || "",
          coverUrl: data.coverUrl,
          visibility: data.visibility,
          trackIds,
          tracks: tracksData,
          status: data.status || "draft",
          createdAt: data.createdAt,
        });
      }

      // Sort by creation date (newest first)
      albumsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setAlbums(albumsData);
    } catch (error) {
      console.error("Error fetching albums:", error);
      toast({
        title: "Error",
        description: "Failed to load albums",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (albumId: string, newStatus: "draft" | "live") => {
    try {
      await updateDoc(doc(db, "albums", albumId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Album status updated",
      });
      fetchAlbums();
    } catch (error) {
      console.error("Error updating album status:", error);
      toast({
        title: "Error",
        description: "Failed to update album status",
        variant: "destructive",
      });
    }
  };

  const handleVisibilityChange = async (albumId: string, newVisibility: "private" | "public" | "subscribers") => {
    try {
      await updateDoc(doc(db, "albums", albumId), {
        visibility: newVisibility,
        updatedAt: serverTimestamp(),
      });
      toast({
        title: "Success",
        description: "Album visibility updated",
      });
      fetchAlbums();
    } catch (error) {
      console.error("Error updating album visibility:", error);
      toast({
        title: "Error",
        description: "Failed to update album visibility",
        variant: "destructive",
      });
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const handleTrackToggle = (trackId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTrackIds: prev.selectedTrackIds.includes(trackId)
        ? prev.selectedTrackIds.filter((id) => id !== trackId)
        : [...prev.selectedTrackIds, trackId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.name || formData.selectedTrackIds.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in album name and select at least one track",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to create albums",
        variant: "destructive",
      });
      return;
    }

    // Check album publish limits before proceeding
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/artist/check-album-publish-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Publish Limit Reached",
          description: errorData.error || "You've reached your album publish limit",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canPublish) {
        toast({
          title: "Publish Limit Reached",
          description: limitData.error || "You've reached your album publish limit",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking publish limits:", error);
      toast({
        title: "Error",
        description: "Failed to check publish limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      let coverUrl = null;

      // Upload cover image if provided
      if (coverFile) {
        const coverRef = ref(storage, `album-covers/${user.id}/${Date.now()}_${coverFile.name}`);
        const coverUploadTask = uploadBytesResumable(coverRef, coverFile);
        
        coverUrl = await new Promise<string>((resolve, reject) => {
          coverUploadTask.on(
            "state_changed",
            null,
            reject,
            async () => {
              const url = await getDownloadURL(coverUploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      }

      // Create album in Firestore
      const albumData = {
        name: formData.name,
        description: formData.description || "",
        coverUrl,
        visibility: formData.visibility,
        trackIds: formData.selectedTrackIds,
        artistId: user.id,
        artistName: user.name,
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "albums"), albumData);

      // Increment album publish counter
      try {
        if (!auth.currentUser) {
          throw new Error("User not authenticated");
        }
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/artist/increment-album-publish", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Error incrementing album publish count:", error);
        // Don't fail the album creation if counter increment fails
      }

      toast({
        title: "Success",
        description: "Album created successfully!",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        visibility: "private",
        selectedTrackIds: [],
      });
      setCoverFile(null);
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";

      // Redirect to albums list
      setLocation("/dashboard/artist/albums");
      fetchAlbums();
    } catch (error: any) {
      console.error("Error creating album:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create album",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isNew) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/artist/albums")}
            disabled={isUploading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Create Album</h1>
            <p className="text-muted-foreground mt-2">
              Create a new album and add tracks
            </p>
          </div>
        </div>

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
                    Creating albums requires an active subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Album Information</CardTitle>
              <CardDescription>
                Provide details about your album
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Album Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Classical Collection Vol. 1"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLocked || isUploading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your album..."
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLocked || isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover">Cover Image</Label>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  disabled={isLocked || isUploading}
                  className="hidden"
                  id="cover-file"
                />
                {coverPreview ? (
                  <div className="space-y-2">
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                        if (coverInputRef.current) coverInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLocked || isUploading}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Select Cover Image
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility *</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "private" | "public" | "subscribers") =>
                    setFormData({ ...formData, visibility: value })
                  }
                  disabled={isLocked || isUploading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="subscribers">Subscribers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label>Select Tracks *</Label>
                {tracks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border rounded-lg">
                    <Music className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tracks available</p>
                    <p className="text-xs mt-1">Upload tracks first to add them to albums</p>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-2">
                    {tracks.map((track) => (
                      <div
                        key={track.id}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded"
                      >
                        <Checkbox
                          id={`track-${track.id}`}
                          checked={formData.selectedTrackIds.includes(track.id)}
                          onCheckedChange={() => handleTrackToggle(track.id)}
                          disabled={isLocked || isUploading}
                        />
                        <Label
                          htmlFor={`track-${track.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{track.title}</span>
                            <span className="text-sm text-muted-foreground">
                              {track.genre} • {track.duration}
                            </span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
                {formData.selectedTrackIds.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.selectedTrackIds.length} track{formData.selectedTrackIds.length !== 1 ? "s" : ""} selected
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/artist/albums")}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLocked || isUploading || formData.selectedTrackIds.length === 0}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Album
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading albums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Albums</h1>
          <p className="text-muted-foreground mt-2">
            Manage your music albums
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/artist/albums/new")}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Album
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Albums</CardTitle>
          <CardDescription>
            {albums.length} album{albums.length !== 1 ? "s" : ""} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {albums.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Disc className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No albums yet</p>
              <p className="text-sm mt-2">Create your first album to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {albums.map((album) => (
                <Card key={album.id} className="overflow-hidden">
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
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold flex-1">{album.name}</h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {album.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(album.id, "live")}
                            >
                              Publish (Make Live)
                            </DropdownMenuItem>
                          )}
                          {album.status === "live" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(album.id, "draft")}
                            >
                              Unpublish
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleVisibilityChange(album.id, "public")}
                            disabled={album.visibility === "public"}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Set to Public
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVisibilityChange(album.id, "private")}
                            disabled={album.visibility === "private"}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Set to Private
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleVisibilityChange(album.id, "subscribers")}
                            disabled={album.visibility === "subscribers"}
                          >
                            <Lock className="h-4 w-4 mr-2" />
                            Set to Subscribers Only
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {album.description || "No description"}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{album.tracks?.length || 0} tracks</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded ${
                          album.status === "live"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}>
                          {album.status}
                        </span>
                        {album.visibility === "public" ? (
                          <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Public
                          </span>
                        ) : album.visibility === "subscribers" ? (
                          <span className="px-2 py-1 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            Subscribers
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                            Private
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
