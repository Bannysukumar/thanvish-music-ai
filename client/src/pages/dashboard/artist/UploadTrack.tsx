import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Lock, Loader2, X } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, storage, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface TrackFormData {
  title: string;
  description: string;
  genre: string;
  mood: string;
  visibility: "private" | "public" | "subscribers";
  license: "personal" | "commercial" | "collaboration" | "all_rights";
  instruments: string[];
  credits: {
    singer?: string;
    composer?: string;
    lyricist?: string;
    producer?: string;
  };
}

export default function UploadTrack() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [formData, setFormData] = useState<TrackFormData>({
    title: "",
    description: "",
    genre: "",
    mood: "",
    visibility: "private",
    license: "all_rights",
    instruments: [],
    credits: {},
  });
  
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
    };
  }, [audioPreview, coverPreview]);

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast({
          title: "File too large",
          description: "Audio file must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      
      // Clean up previous preview URL if exists (prevent memory leaks)
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
      
      setAudioFile(file);
      // Create temporary blob URL for preview only (not stored in localStorage)
      const url = URL.createObjectURL(file);
      setAudioPreview(url);
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Cover image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      // Clean up previous preview URL if exists (prevent memory leaks)
      if (coverPreview) {
        URL.revokeObjectURL(coverPreview);
      }
      
      setCoverFile(file);
      // Create temporary blob URL for preview only (not stored in localStorage)
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !audioFile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to upload tracks",
        variant: "destructive",
      });
      return;
    }

    // Check track upload limits before proceeding
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/artist/check-track-upload-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Upload Limit Reached",
          description: errorData.error || "You've reached your track upload limit",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canUpload) {
        toast({
          title: "Upload Limit Reached",
          description: limitData.error || "You've reached your track upload limit",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking upload limits:", error);
      toast({
        title: "Error",
        description: "Failed to check upload limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Upload audio file
      const audioRef = ref(storage, `tracks/${user.id}/${Date.now()}_${audioFile.name}`);
      const audioUploadTask = uploadBytesResumable(audioRef, audioFile);
      
      // Track upload progress
      audioUploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 50; // Audio is 50% of total
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Audio upload error:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload audio file",
            variant: "destructive",
          });
          setIsUploading(false);
        },
        async () => {
          const audioUrl = await getDownloadURL(audioUploadTask.snapshot.ref);
          setUploadProgress(50);

          // Upload cover image if provided
          let coverUrl = null;
          if (coverFile) {
            const coverRef = ref(storage, `track-covers/${user.id}/${Date.now()}_${coverFile.name}`);
            const coverUploadTask = uploadBytesResumable(coverRef, coverFile);
            
            await new Promise<void>((resolve, reject) => {
              coverUploadTask.on(
                "state_changed",
                (snapshot) => {
                  const progress = 50 + (snapshot.bytesTransferred / snapshot.totalBytes) * 20; // Cover is 20% of total
                  setUploadProgress(progress);
                },
                reject,
                async () => {
                  coverUrl = await getDownloadURL(coverUploadTask.snapshot.ref);
                  resolve();
                }
              );
            });
          }

          setUploadProgress(70);

          // Get audio duration (simplified - in production, use audio API)
          const duration = "0:00"; // Placeholder

          // Save track metadata to Firestore
          const trackData = {
            title: formData.title,
            description: formData.description || "",
            genre: formData.genre,
            mood: formData.mood || "",
            visibility: formData.visibility,
            license: formData.license,
            instruments: formData.instruments,
            credits: formData.credits,
            audioUrl,
            coverUrl,
            duration,
            artistId: user.id,
            artistName: user.name,
            status: "draft", // Will be changed to "live" when published
            plays: 0,
            saves: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          setUploadProgress(85);

          await addDoc(collection(db, "tracks"), trackData);

          // Increment track upload counter
          try {
            if (!auth.currentUser) {
              throw new Error("User not authenticated");
            }
            const token = await auth.currentUser.getIdToken();
            await fetch("/api/artist/increment-track-upload", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
          } catch (error) {
            console.error("Error incrementing track upload count:", error);
            // Don't fail the upload if counter increment fails
          }

          setUploadProgress(100);

          toast({
            title: "Success",
            description: "Track uploaded successfully!",
          });

          // Reset form and clean up preview URLs
          setFormData({
            title: "",
            description: "",
            genre: "",
            mood: "",
            visibility: "private",
            license: "all_rights",
            instruments: [],
            credits: {},
          });
          
          // Clean up blob URLs to prevent memory leaks
          if (audioPreview) {
            URL.revokeObjectURL(audioPreview);
          }
          if (coverPreview) {
            URL.revokeObjectURL(coverPreview);
          }
          
          setAudioFile(null);
          setCoverFile(null);
          setAudioPreview(null);
          setCoverPreview(null);
          if (audioInputRef.current) audioInputRef.current.value = "";
          if (coverInputRef.current) coverInputRef.current.value = "";

          // Redirect to library
          setTimeout(() => {
            setLocation("/dashboard/artist/library");
          }, 1000);
        }
      );
    } catch (error: any) {
      console.error("Error uploading track:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload track",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/dashboard/artist")}
          disabled={isUploading}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Upload Track</h1>
          <p className="text-muted-foreground mt-2">
            Upload and publish your music tracks
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
                  Uploading tracks requires an active subscription. Please activate your plan to continue.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading track...</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Track Information</CardTitle>
            <CardDescription>
              Provide details about your track
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Track Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Morning Raga"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                disabled={isLocked || isUploading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your track..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLocked || isUploading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="genre">Genre *</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) => setFormData({ ...formData, genre: value })}
                  disabled={isLocked || isUploading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classical">Classical</SelectItem>
                    <SelectItem value="carnatic">Carnatic</SelectItem>
                    <SelectItem value="hindustani">Hindustani</SelectItem>
                    <SelectItem value="fusion">Fusion</SelectItem>
                    <SelectItem value="devotional">Devotional</SelectItem>
                    <SelectItem value="folk">Folk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mood">Mood</Label>
                <Select
                  value={formData.mood}
                  onValueChange={(value) => setFormData({ ...formData, mood: value })}
                  disabled={isLocked || isUploading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peaceful">Peaceful</SelectItem>
                    <SelectItem value="energetic">Energetic</SelectItem>
                    <SelectItem value="melancholic">Melancholic</SelectItem>
                    <SelectItem value="joyful">Joyful</SelectItem>
                    <SelectItem value="meditative">Meditative</SelectItem>
                    <SelectItem value="romantic">Romantic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Audio File *</Label>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={audioInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  disabled={isLocked || isUploading}
                  className="hidden"
                  id="audio-file"
                  required
                />
                {audioPreview ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{audioFile?.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Clean up blob URL before removing
                        if (audioPreview) {
                          URL.revokeObjectURL(audioPreview);
                        }
                        setAudioFile(null);
                        setAudioPreview(null);
                        if (audioInputRef.current) audioInputRef.current.value = "";
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Drag and drop your audio file here, or click to browse
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isLocked || isUploading}
                      onClick={() => audioInputRef.current?.click()}
                    >
                      Select File
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover">Cover Image (Optional)</Label>
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
                      // Clean up blob URL before removing
                      if (coverPreview) {
                        URL.revokeObjectURL(coverPreview);
                      }
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <SelectItem value="private">Private (Only you)</SelectItem>
                    <SelectItem value="public">Public (Everyone)</SelectItem>
                    <SelectItem value="subscribers">Subscribers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license">License *</Label>
                <Select
                  value={formData.license}
                  onValueChange={(value: "personal" | "commercial" | "collaboration" | "all_rights") =>
                    setFormData({ ...formData, license: value })
                  }
                  disabled={isLocked || isUploading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Use</SelectItem>
                    <SelectItem value="commercial">Commercial Use Allowed</SelectItem>
                    <SelectItem value="collaboration">Collaboration Open</SelectItem>
                    <SelectItem value="all_rights">All Rights Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/dashboard/artist")}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLocked || isUploading || !audioFile}>
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Track
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
