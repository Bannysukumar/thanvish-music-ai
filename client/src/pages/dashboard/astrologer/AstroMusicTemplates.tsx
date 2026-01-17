import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, FileEdit, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, addDoc, updateDoc, doc } from "firebase/firestore";

const RASIS = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
];

const INTENT_CATEGORIES = [
  "identity/cosmic theme",
  "confidence/energy",
  "calm/spiritual",
  "love/connection",
  "focus/clarity",
];

interface AstroMusicTemplate {
  id?: string;
  templateName: string;
  targetRasis: string[];
  intentCategory: string;
  moodKeywords: string[];
  instrumentPreferences: string[];
  tempoPreferences: string[];
  lyricalStylePreference?: string;
  cosmicImageryPhrases: string[];
  status: "draft" | "pending_approval" | "live" | "rejected";
  astrologerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function AstroMusicTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/dashboard/astrologer/templates/:id");
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useState<AstroMusicTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<AstroMusicTemplate>>({
    templateName: "",
    targetRasis: [],
    intentCategory: "",
    moodKeywords: [],
    instrumentPreferences: [],
    tempoPreferences: [],
    lyricalStylePreference: "",
    cosmicImageryPhrases: [],
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

    fetchTemplates();
  }, [user, setLocation]);

  const fetchTemplates = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "astroMusicTemplates"),
        where("astrologerId", "==", user.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AstroMusicTemplate[];
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isLocked) return;

    // Check template limit before creating
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
      const limitResponse = await fetch("/api/astrologer/check-template-limit", {
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

    try {
      setIsCreating(true);
      const templateData: Omit<AstroMusicTemplate, "id"> = {
        templateName: formData.templateName!,
        targetRasis: formData.targetRasis || [],
        intentCategory: formData.intentCategory!,
        moodKeywords: formData.moodKeywords || [],
        instrumentPreferences: formData.instrumentPreferences || [],
        tempoPreferences: formData.tempoPreferences || [],
        lyricalStylePreference: formData.lyricalStylePreference,
        cosmicImageryPhrases: formData.cosmicImageryPhrases || [],
        status: "draft",
        astrologerId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "astroMusicTemplates"), templateData);
      
      // Increment template count after successful creation
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/astrologer/increment-template-count", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
      
      // Reset form
      setFormData({
        templateName: "",
        targetRasis: [],
        intentCategory: "",
        moodKeywords: [],
        instrumentPreferences: [],
        tempoPreferences: [],
        lyricalStylePreference: "",
        cosmicImageryPhrases: [],
        status: "draft",
      });
      
      fetchTemplates();
      setLocation("/dashboard/astrologer/templates");
      
      toast({
        title: "Success",
        description: "Template created successfully",
      });
    } catch (error) {
      console.error("Error creating template:", error);
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <Badge variant="default">Live</Badge>;
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
            {isEditPage ? "Edit Astro Music Template" : "Create Astro Music Template"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Create templates that generate consistent high-quality prompts for horoscope music generation.
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
                    Subscription is required to create and publish templates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Define a template for generating horoscope music prompts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="templateName">Template Name *</Label>
                <Input
                  id="templateName"
                  value={formData.templateName}
                  onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                  placeholder="e.g., Kumbha Calm Cosmic"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Rasi(s) *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border rounded-md p-4">
                  {RASIS.map((rasi) => (
                    <div key={rasi} className="flex items-center space-x-2">
                      <Checkbox
                        id={rasi}
                        checked={formData.targetRasis?.includes(rasi)}
                        onCheckedChange={(checked) => {
                          const current = formData.targetRasis || [];
                          if (checked) {
                            setFormData({ ...formData, targetRasis: [...current, rasi] });
                          } else {
                            setFormData({ ...formData, targetRasis: current.filter((r) => r !== rasi) });
                          }
                        }}
                        disabled={isLocked}
                      />
                      <Label htmlFor={rasi} className="text-sm font-normal cursor-pointer">
                        {rasi}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="intentCategory">Intent Category *</Label>
                <Select
                  value={formData.intentCategory}
                  onValueChange={(value) => setFormData({ ...formData, intentCategory: value })}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select intent category" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTENT_CATEGORIES.map((intent) => (
                      <SelectItem key={intent} value={intent}>
                        {intent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moodKeywords">Mood Keywords</Label>
                <Input
                  id="moodKeywords"
                  value={formData.moodKeywords?.join(", ") || ""}
                  onChange={(e) => {
                    const keywords = e.target.value.split(",").map((k) => k.trim()).filter(Boolean);
                    setFormData({ ...formData, moodKeywords: keywords });
                  }}
                  placeholder="e.g., serene, mystical, uplifting (comma-separated)"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instrumentPreferences">Instrument Preferences</Label>
                <Input
                  id="instrumentPreferences"
                  value={formData.instrumentPreferences?.join(", ") || ""}
                  onChange={(e) => {
                    const instruments = e.target.value.split(",").map((i) => i.trim()).filter(Boolean);
                    setFormData({ ...formData, instrumentPreferences: instruments });
                  }}
                  placeholder="e.g., Flute, Sitar, Veena (comma-separated)"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tempoPreferences">Tempo Preferences</Label>
                <Input
                  id="tempoPreferences"
                  value={formData.tempoPreferences?.join(", ") || ""}
                  onChange={(e) => {
                    const tempos = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                    setFormData({ ...formData, tempoPreferences: tempos });
                  }}
                  placeholder="e.g., slow, medium, ambient (comma-separated)"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lyricalStylePreference">Lyrical Style Preference (Optional)</Label>
                <Input
                  id="lyricalStylePreference"
                  value={formData.lyricalStylePreference || ""}
                  onChange={(e) => setFormData({ ...formData, lyricalStylePreference: e.target.value })}
                  placeholder="e.g., Sanskrit mantras, instrumental only"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cosmicImageryPhrases">Cosmic Imagery Phrases</Label>
                <Textarea
                  id="cosmicImageryPhrases"
                  value={formData.cosmicImageryPhrases?.join(", ") || ""}
                  onChange={(e) => {
                    const phrases = e.target.value.split(",").map((p) => p.trim()).filter(Boolean);
                    setFormData({ ...formData, cosmicImageryPhrases: phrases });
                  }}
                  placeholder="e.g., starlit sky, cosmic harmony, celestial vibrations (comma-separated)"
                  disabled={isLocked}
                />
                <p className="text-xs text-muted-foreground">
                  Symbolic phrases only - not predictive
                </p>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLocked || isCreating}>
                  {isCreating ? "Creating..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/astrologer/templates")}
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Astro Music Templates</h1>
          <p className="text-muted-foreground mt-2">
            Create templates that generate consistent high-quality prompts for horoscope music generation.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/astrologer/templates/new")}
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
              Create Template
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
                  Subscription is required to create and publish templates.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first astro music template to get started.
              </p>
              <Button
                onClick={() => setLocation("/dashboard/astrologer/templates/new")}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.templateName}</CardTitle>
                  {getStatusBadge(template.status)}
                </div>
                <CardDescription>{template.intentCategory}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Target Rasis:</span> {template.targetRasis?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Moods:</span>{" "}
                    {template.moodKeywords?.join(", ") || "None"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setLocation(`/dashboard/astrologer/templates/${template.id}`)}
                >
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

