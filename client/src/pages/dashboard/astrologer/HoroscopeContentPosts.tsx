import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, BookOpen, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from "firebase/firestore";

interface HoroscopePost {
  id?: string;
  title: string;
  content: string;
  postType: "weekly_rasi_guidance" | "instrument_guide" | "meditation_themes" | "other";
  status: "draft" | "pending_approval" | "published" | "rejected";
  astrologerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function HoroscopeContentPosts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/dashboard/astrologer/posts/:id");
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<HoroscopePost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<HoroscopePost>>({
    title: "",
    content: "",
    postType: "weekly_rasi_guidance",
    status: "draft",
  });

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      setLocation("/dashboard");
      return;
    }

    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    setIsLocked(!subscriptionActive);

    fetchPosts();
  }, [user, setLocation]);

  const fetchPosts = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "horoscopeContentPosts"),
        where("astrologerId", "==", user.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HoroscopePost[];
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isLocked) return;

    try {
      setIsCreating(true);
      const postData: Omit<HoroscopePost, "id"> = {
        title: formData.title!,
        content: formData.content!,
        postType: formData.postType!,
        status: "draft",
        astrologerId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "horoscopeContentPosts"), postData);
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        postType: "weekly_rasi_guidance",
        status: "draft",
      });
      
      fetchPosts();
      setLocation("/dashboard/astrologer/posts");
      
      toast({
        title: "Success",
        description: "Post saved as draft",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handlePublish = async () => {
    if (!user || isLocked || !formData.title || !formData.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate content safety first
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const validationResponse = await fetch("/api/astrologer/validate-post-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: formData.content }),
      });

      if (!validationResponse.ok) {
        const errorData = await validationResponse.json();
        toast({
          title: "Content Validation Failed",
          description: errorData.error || "This post violates content guidelines (no guaranteed predictions or fear-based content). Please edit and try again.",
          variant: "destructive",
        });
        return;
      }

      const validationData = await validationResponse.json();
      if (!validationData.isValid) {
        toast({
          title: "Content Validation Failed",
          description: validationData.error || "This post violates content guidelines (no guaranteed predictions or fear-based content). Please edit and try again.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error validating content:", error);
      toast({
        title: "Error",
        description: "Failed to validate content. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check post publish limit
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/astrologer/check-post-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Post Publishing Limit Reached",
          description: errorData.error || "You've reached your horoscope post publishing limit for this month. Upgrade your plan to publish more posts.",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canPublish) {
        toast({
          title: "Post Publishing Limit Reached",
          description: limitData.error || "You've reached your horoscope post publishing limit for this month. Upgrade your plan to publish more posts.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking post limits:", error);
      toast({
        title: "Error",
        description: "Failed to check post limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating(true);
      const postData: Omit<HoroscopePost, "id"> = {
        title: formData.title!,
        content: formData.content!,
        postType: formData.postType!,
        status: "published",
        astrologerId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "horoscopeContentPosts"), postData);
      
      // Increment post count after successful publishing
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/astrologer/increment-post-count", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      // Reset form
      setFormData({
        title: "",
        content: "",
        postType: "weekly_rasi_guidance",
        status: "draft",
      });
      
      fetchPosts();
      setLocation("/dashboard/astrologer/posts");
      
      toast({
        title: "Success",
        description: "Post published successfully",
      });
    } catch (error) {
      console.error("Error publishing post:", error);
      toast({
        title: "Error",
        description: "Failed to publish post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">Published</Badge>;
      case "pending_approval":
        return <Badge variant="secondary">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isNewPage = window.location.pathname.includes("/new");
  const isEditPage = params?.id;

  if (isNewPage || isEditPage) {
    return (
      <div className="space-y-6">
        <AstrologyDisclaimer />
        
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            {isEditPage ? "Edit Content Post" : "Create Content Post"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Publish horoscope guidance posts. Remember: No guaranteed predictions, no fear-based content.
          </p>
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
                    Subscription is required to publish posts.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>
              Create a horoscope guidance post. Disclaimer will be automatically attached.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Post Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Weekly Rasi Music Guidance"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postType">Post Type *</Label>
                <select
                  id="postType"
                  value={formData.postType}
                  onChange={(e) => setFormData({ ...formData, postType: e.target.value as any })}
                  disabled={isLocked}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="weekly_rasi_guidance">Weekly Rasi Music Guidance</option>
                  <option value="instrument_guide">Best Instruments for Each Rasi</option>
                  <option value="meditation_themes">Meditation Themes for Moon Signs</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Write your horoscope guidance content here..."
                  rows={10}
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground">
                  Note: No guaranteed predictions, no fear-based content. Disclaimer will be automatically attached.
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" variant="outline" disabled={isLocked || isCreating}>
                  {isCreating ? "Saving..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  disabled={isLocked || isCreating || !formData.title || !formData.content}
                  onClick={handlePublish}
                >
                  {isCreating ? "Publishing..." : "Publish Post"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/astrologer/posts")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AstrologyDisclaimer />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Horoscope Content Posts</h1>
          <p className="text-muted-foreground mt-2">
            Publish horoscope guidance posts for users. Remember: No guaranteed predictions, no fear-based content.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/astrologer/posts/new")}
          disabled={isLocked}
        >
          {isLocked ? (
            <>
              <Lock className="h-4 w-4 mr-2" />
              Locked
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </>
          )}
        </Button>
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
                  Subscription is required to publish posts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first horoscope content post to get started.
              </p>
              <Button
                onClick={() => setLocation("/dashboard/astrologer/posts/new")}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{post.title}</CardTitle>
                  {getStatusBadge(post.status)}
                </div>
                <CardDescription>{post.postType}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {post.content}
                </p>
                <div className="flex gap-2">
                  {post.status === "draft" && (
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      disabled={isLocked}
                      onClick={async () => {
                        // Check post limit and validate content before publishing
                        try {
                          if (!auth.currentUser) {
                            toast({
                              title: "Error",
                              description: "Authentication required",
                              variant: "destructive",
                            });
                            return;
                          }

                          const token = await auth.currentUser.getIdToken();
                          
                          // Validate content
                          const validationResponse = await fetch("/api/astrologer/validate-post-content", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({ content: post.content }),
                          });

                          if (!validationResponse.ok) {
                            const errorData = await validationResponse.json();
                            toast({
                              title: "Content Validation Failed",
                              description: errorData.error || "This post violates content guidelines. Please edit and try again.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Check limit
                          const limitResponse = await fetch("/api/astrologer/check-post-limit", {
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });

                          if (!limitResponse.ok) {
                            const errorData = await limitResponse.json();
                            toast({
                              title: "Post Publishing Limit Reached",
                              description: errorData.error || "You've reached your horoscope post publishing limit for this month.",
                              variant: "destructive",
                            });
                            return;
                          }

                          const limitData = await limitResponse.json();
                          if (!limitData.canPublish) {
                            toast({
                              title: "Post Publishing Limit Reached",
                              description: limitData.error || "You've reached your horoscope post publishing limit for this month.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Update post status to published
                          await updateDoc(doc(db, "horoscopeContentPosts", post.id!), {
                            status: "published",
                            updatedAt: new Date(),
                          });

                          // Increment post count
                          await fetch("/api/astrologer/increment-post-count", {
                            method: "POST",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });

                          fetchPosts();
                          toast({
                            title: "Success",
                            description: "Post published successfully",
                          });
                        } catch (error: any) {
                          console.error("Error publishing post:", error);
                          toast({
                            title: "Error",
                            description: "Failed to publish post. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className={post.status === "draft" ? "flex-1" : "w-full"}
                    onClick={() => setLocation(`/dashboard/astrologer/posts/${post.id}`)}
                  >
                    {post.status === "draft" ? "Edit" : "View Details"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

