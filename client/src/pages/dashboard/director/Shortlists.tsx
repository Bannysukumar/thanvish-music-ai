import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Star, Lock, Loader2, X, Music, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Shortlist {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  projectName?: string;
  artists: string[];
  tracks: string[];
  notes?: string;
  createdAt?: any;
}

export default function Shortlists() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    projectId: "",
  });
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchShortlists();
    }
  }, [user]);

  const fetchShortlists = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const shortlistsQuery = query(
        collection(db, "shortlists"),
        where("directorId", "==", user.id)
      );
      const querySnapshot = await getDocs(shortlistsQuery);
      const shortlistsData: Shortlist[] = [];
      
      querySnapshot.forEach((doc) => {
        shortlistsData.push({
          id: doc.id,
          ...doc.data(),
        } as Shortlist);
      });

      // Sort by creation date (newest first)
      shortlistsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setShortlists(shortlistsData);
    } catch (error) {
      console.error("Error fetching shortlists:", error);
      toast({
        title: "Error",
        description: "Failed to load shortlists",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.name) {
      toast({
        title: "Error",
        description: "Please provide a shortlist name",
        variant: "destructive",
      });
      return;
    }

    if (isLocked) {
      toast({
        title: "Subscription Required",
        description: "You need an active subscription to create shortlists",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Check shortlist limit before creating
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const limitCheckResponse = await fetch("/api/director/check-shortlist-limit", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!limitCheckResponse.ok) {
        const errorData = await limitCheckResponse.json();
        toast({
          title: "Shortlist Limit Reached",
          description: errorData.error || "Cannot create more shortlists. Please upgrade your plan.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const limitData = await limitCheckResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Shortlist Limit Reached",
          description: limitData.error || `You've reached your shortlist creation limit (${limitData.maxShortlists} per month). Please upgrade your plan or wait until next month.`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const shortlistData = {
        name: formData.name,
        description: formData.description || "",
        projectId: formData.projectId || null,
        directorId: user.id,
        artists: [],
        tracks: [],
        notes: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "shortlists"), shortlistData);
      
      // Increment shortlist creation counter
      try {
        await fetch("/api/director/increment-shortlist-count", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Error incrementing shortlist count:", error);
      }

      toast({
        title: "Success",
        description: "Shortlist created successfully!",
      });

      setFormData({ name: "", description: "", projectId: "" });
      setShowCreateForm(false);
      fetchShortlists();
    } catch (error: any) {
      console.error("Error creating shortlist:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create shortlist",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (shortlistId: string) => {
    if (!confirm("Are you sure you want to delete this shortlist?")) return;

    try {
      await deleteDoc(doc(db, "shortlists", shortlistId));
      toast({
        title: "Success",
        description: "Shortlist deleted successfully",
      });
      fetchShortlists();
    } catch (error) {
      console.error("Error deleting shortlist:", error);
      toast({
        title: "Error",
        description: "Failed to delete shortlist",
        variant: "destructive",
      });
    }
  };

  if (isLoading && shortlists.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading shortlists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Shortlists</h1>
          <p className="text-muted-foreground mt-2">
            Organize artists and tracks for your projects
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Shortlist
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Shortlist</CardTitle>
            <CardDescription>
              Create a shortlist to organize artists and tracks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Shortlist Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Project X - Vocals"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Optional description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLocked || isLoading}
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={isLocked || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormData({ name: "", description: "", projectId: "" });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Your Shortlists</CardTitle>
          <CardDescription>
            {shortlists.length} shortlist{shortlists.length !== 1 ? "s" : ""} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shortlists.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No shortlists yet</p>
              <p className="text-sm mt-2">Create your first shortlist to organize artists and tracks</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shortlists.map((shortlist) => (
                <Card key={shortlist.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{shortlist.name}</h3>
                          {shortlist.projectName && (
                            <Badge variant="outline">{shortlist.projectName}</Badge>
                          )}
                        </div>
                        {shortlist.description && (
                          <p className="text-sm text-muted-foreground mb-2">{shortlist.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {shortlist.artists?.length || 0} artists
                          </span>
                          <span className="flex items-center gap-1">
                            <Music className="h-3 w-3" />
                            {shortlist.tracks?.length || 0} tracks
                          </span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <X className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setLocation(`/dashboard/director/shortlists/${shortlist.id}`)}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(shortlist.id)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

