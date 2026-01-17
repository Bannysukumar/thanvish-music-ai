import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Plus, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafetyDisclaimer } from "@/components/doctor/SafetyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";

interface Article {
  id: string;
  title: string;
  content: string;
  status: "draft" | "pending_approval" | "published" | "rejected";
  createdAt?: any;
}

export default function GuidanceArticles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isNew = location === "/dashboard/doctor/articles/new";
  const [isLoading, setIsLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "doctor" && !isNew) {
      fetchArticles();
    }
  }, [user, isNew]);

  const fetchArticles = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const articlesQuery = query(
        collection(db, "guidanceArticles"),
        where("doctorId", "==", user.id)
      );
      const querySnapshot = await getDocs(articlesQuery);
      const articlesData: Article[] = [];
      
      querySnapshot.forEach((doc) => {
        articlesData.push({
          id: doc.id,
          ...doc.data(),
        } as Article);
      });

      articlesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setArticles(articlesData);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast({
        title: "Error",
        description: "Failed to load articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.title || !formData.content) {
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
        description: "You need an active subscription to publish guidance articles",
        variant: "destructive",
      });
      return;
    }

    // Check for prohibited content
    const prohibitedTerms = ["cure", "guaranteed", "diagnose", "prescribe", "medical treatment"];
    const contentLower = formData.content.toLowerCase();
    const hasProhibitedContent = prohibitedTerms.some(term => contentLower.includes(term));

    if (hasProhibitedContent) {
      toast({
        title: "Prohibited Content",
        description: "Content cannot include medical claims, diagnoses, or prescriptions. Please revise your content.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const articleData = {
        title: formData.title,
        content: formData.content,
        doctorId: user.id,
        doctorName: user.name,
        disclaimer: "This content is for wellness and relaxation support only and is not a medical or psychiatric treatment.",
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "guidanceArticles"), articleData);

      toast({
        title: "Success",
        description: "Guidance article created successfully!",
      });

      setFormData({
        title: "",
        content: "",
      });

      setLocation("/dashboard/doctor/articles");
      fetchArticles();
    } catch (error: any) {
      console.error("Error creating article:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create article",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isNew) {
    return (
      <div className="space-y-6">
        <SafetyDisclaimer />
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/dashboard/doctor/articles")}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Publish Guidance Article</h1>
            <p className="text-muted-foreground mt-2">
              Share wellness-focused guidance content
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
                    Publishing guidance articles requires an active subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Article Information</CardTitle>
              <CardDescription>
                Create wellness-focused guidance content (no medical claims allowed)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Article Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., How to use music for better sleep"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your wellness guidance article here. Remember: no medical claims, diagnoses, or prescriptions."
                  rows={12}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Note: Content will be automatically checked for prohibited medical claims.
                </p>
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/doctor/articles")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLocked || isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Article
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

  if (isLoading && articles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafetyDisclaimer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Guidance Articles</h1>
          <p className="text-muted-foreground mt-2">
            Manage your wellness guidance content
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/doctor/articles/new")}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Publish Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Articles</CardTitle>
          <CardDescription>
            {articles.length} article{articles.length !== 1 ? "s" : ""} published
          </CardDescription>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No articles yet</p>
              <p className="text-sm mt-2">Create your first guidance article to share wellness content</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{article.title}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${
                        article.status === "published"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : article.status === "pending_approval"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : article.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}>
                        {article.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {article.content.substring(0, 200)}...
                    </p>
                    {article.status === "draft" && (
                      <div className="mt-4">
                        <Button
                          size="sm"
                          onClick={async () => {
                            // Check article publish limit before publishing
                            try {
                              if (!auth.currentUser) {
                                throw new Error("User not authenticated");
                              }
                              const token = await auth.currentUser.getIdToken();
                              const limitResponse = await fetch("/api/doctor/check-article-limit", {
                                headers: {
                                  Authorization: `Bearer ${token}`,
                                },
                              });

                              if (!limitResponse.ok) {
                                const errorData = await limitResponse.json();
                                toast({
                                  title: "Article Limit Reached",
                                  description: errorData.error || "You've reached your article publishing limit for this month. Upgrade your plan to publish more articles.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              const limitData = await limitResponse.json();
                              if (!limitData.canPublish) {
                                toast({
                                  title: "Article Limit Reached",
                                  description: limitData.error || "You've reached your article publishing limit for this month. Upgrade your plan to publish more articles.",
                                  variant: "destructive",
                                });
                                return;
                              }

                              // Update article status to published
                              await updateDoc(doc(db, "guidanceArticles", article.id), {
                                status: "published",
                                updatedAt: serverTimestamp(),
                              });

                              // Increment article count after successful publish
                              try {
                                if (auth.currentUser) {
                                  const token = await auth.currentUser.getIdToken();
                                  await fetch("/api/doctor/increment-article-count", {
                                    method: "POST",
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  });
                                }
                              } catch (error: any) {
                                console.error("Error incrementing article count:", error);
                                // Don't fail the publish if increment fails
                              }

                              toast({
                                title: "Success",
                                description: "Article published successfully!",
                              });

                              fetchArticles();
                            } catch (error: any) {
                              console.error("Error publishing article:", error);
                              toast({
                                title: "Error",
                                description: error.message || "Failed to publish article",
                                variant: "destructive",
                              });
                            }
                          }}
                          disabled={isLocked}
                        >
                          Publish
                        </Button>
                      </div>
                    )}
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

