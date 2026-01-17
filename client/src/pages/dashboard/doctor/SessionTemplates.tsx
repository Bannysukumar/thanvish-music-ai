import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileEdit, Plus, ArrowLeft, Lock, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafetyDisclaimer } from "@/components/doctor/SafetyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

interface Template {
  id: string;
  name: string;
  intendedEffect: string;
  tempoStyle: string;
  createdAt?: any;
}

export default function SessionTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isNew = location === "/dashboard/doctor/templates/new";
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    intendedEffect: "",
    tempoStyle: "",
    instrumentGuidance: "",
    preSessionText: "",
    promptKeywords: "",
  });
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "doctor" && !isNew) {
      fetchTemplates();
    }
  }, [user, isNew]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const templatesQuery = query(
        collection(db, "sessionTemplates"),
        where("doctorId", "==", user.id)
      );
      const querySnapshot = await getDocs(templatesQuery);
      const templatesData: Template[] = [];
      
      querySnapshot.forEach((doc) => {
        templatesData.push({
          id: doc.id,
          ...doc.data(),
        } as Template);
      });

      templatesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setTemplates(templatesData);
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.name || !formData.intendedEffect) {
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
        description: "You need an active subscription to create session templates",
        variant: "destructive",
      });
      return;
    }

    // Check template creation limit before proceeding
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/doctor/check-template-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Template Limit Reached",
          description: errorData.error || "You've reached your template creation limit for this month. Upgrade your plan to create more templates.",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Template Limit Reached",
          description: limitData.error || "You've reached your template creation limit for this month. Upgrade your plan to create more templates.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking template limits:", error);
      toast({
        title: "Error",
        description: "Failed to check template limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const templateData = {
        name: formData.name,
        intendedEffect: formData.intendedEffect,
        tempoStyle: formData.tempoStyle || "",
        instrumentGuidance: formData.instrumentGuidance || "",
        preSessionText: formData.preSessionText || "",
        promptKeywords: formData.promptKeywords || "",
        doctorId: user.id,
        doctorName: user.name,
        safetyNote: "This content is for wellness and relaxation support only and is not a medical or psychiatric treatment.",
        status: "draft",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "sessionTemplates"), templateData);

      // Increment template count after successful creation
      try {
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          await fetch("/api/doctor/increment-template-count", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (error: any) {
        console.error("Error incrementing template count:", error);
        // Don't fail the creation if increment fails
      }

      toast({
        title: "Success",
        description: "Session template created successfully!",
      });

      setFormData({
        name: "",
        intendedEffect: "",
        tempoStyle: "",
        instrumentGuidance: "",
        preSessionText: "",
        promptKeywords: "",
      });

      setLocation("/dashboard/doctor/templates");
      fetchTemplates();
    } catch (error: any) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create template",
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
            onClick={() => setLocation("/dashboard/doctor/templates")}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Create Session Template</h1>
            <p className="text-muted-foreground mt-2">
              Create a reusable session template for therapy programs
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
                    Creating session templates requires an active subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Template Information</CardTitle>
              <CardDescription>
                Define a reusable session template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Calm Breathing Session"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intendedEffect">Intended Effect *</Label>
                <Select
                  value={formData.intendedEffect}
                  onValueChange={(value) => setFormData({ ...formData, intendedEffect: value })}
                  disabled={isLocked || isLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intended effect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="calm">Calm</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="grounding">Grounding</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempoStyle">Recommended Tempo Style</Label>
                <Select
                  value={formData.tempoStyle}
                  onValueChange={(value) => setFormData({ ...formData, tempoStyle: value })}
                  disabled={isLocked || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tempo style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow</SelectItem>
                    <SelectItem value="ambient">Ambient</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrumentGuidance">Instrument Guidance (Optional)</Label>
                <Input
                  id="instrumentGuidance"
                  placeholder="e.g., Flute, Sitar"
                  value={formData.instrumentGuidance}
                  onChange={(e) => setFormData({ ...formData, instrumentGuidance: e.target.value })}
                  disabled={isLocked || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preSessionText">Pre-Session Text (Breathing Guidance)</Label>
                <Textarea
                  id="preSessionText"
                  placeholder="Guidance text for users before the session..."
                  rows={4}
                  value={formData.preSessionText}
                  onChange={(e) => setFormData({ ...formData, preSessionText: e.target.value })}
                  disabled={isLocked || isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promptKeywords">Suggested Prompt Keywords (for AI generation)</Label>
                <Input
                  id="promptKeywords"
                  placeholder="e.g., peaceful, meditative, calming"
                  value={formData.promptKeywords}
                  onChange={(e) => setFormData({ ...formData, promptKeywords: e.target.value })}
                  disabled={isLocked || isLoading}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/doctor/templates")}
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
                      Create Template
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

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafetyDisclaimer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Session Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage reusable session templates for your therapy programs
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/doctor/templates/new")}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            {templates.length} template{templates.length !== 1 ? "s" : ""} created
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileEdit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No templates yet</p>
              <p className="text-sm mt-2">Create your first session template to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="capitalize">{template.intendedEffect}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground capitalize">
                      Tempo: {template.tempoStyle || "Not specified"}
                    </p>
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

