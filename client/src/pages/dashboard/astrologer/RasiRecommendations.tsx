import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Star, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from "firebase/firestore";

// 12 Rasis (Zodiac signs)
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

const ELEMENTS = ["Fire", "Earth", "Air", "Water"];

const TEMPO_OPTIONS = ["Slow", "Medium", "Ambient", "Fast"];

interface RasiRecommendation {
  id?: string;
  rasiName: string;
  elementVibe: string;
  emotionalToneKeywords: string;
  recommendedInstruments: string[];
  recommendedTempo: string;
  recommendedStyleTags: string[];
  avoidSuggestions?: string;
  status: "draft" | "pending_approval" | "live" | "rejected";
  astrologerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function RasiRecommendations() {
  const { user } = useAuth();
  const [, params] = useRoute("/dashboard/astrologer/recommendations/:id");
  const [, setLocation] = useLocation();
  const [recommendations, setRecommendations] = useState<RasiRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<RasiRecommendation>>({
    rasiName: "",
    elementVibe: "",
    emotionalToneKeywords: "",
    recommendedInstruments: [],
    recommendedTempo: "",
    recommendedStyleTags: [],
    avoidSuggestions: "",
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

    fetchRecommendations();
  }, [user, setLocation]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "rasiRecommendations"),
        where("astrologerId", "==", user.id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as RasiRecommendation[];
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isLocked) return;

    try {
      setIsCreating(true);
      const recommendationData: Omit<RasiRecommendation, "id"> = {
        rasiName: formData.rasiName!,
        elementVibe: formData.elementVibe!,
        emotionalToneKeywords: formData.emotionalToneKeywords!,
        recommendedInstruments: formData.recommendedInstruments || [],
        recommendedTempo: formData.recommendedTempo!,
        recommendedStyleTags: formData.recommendedStyleTags || [],
        avoidSuggestions: formData.avoidSuggestions,
        status: "draft",
        astrologerId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addDoc(collection(db, "rasiRecommendations"), recommendationData);
      
      // Reset form
      setFormData({
        rasiName: "",
        elementVibe: "",
        emotionalToneKeywords: "",
        recommendedInstruments: [],
        recommendedTempo: "",
        recommendedStyleTags: [],
        avoidSuggestions: "",
        status: "draft",
      });
      
      fetchRecommendations();
      setLocation("/dashboard/astrologer/recommendations");
    } catch (error) {
      console.error("Error creating recommendation:", error);
      alert("Failed to create recommendation. Please try again.");
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
            {isEditPage ? "Edit Rasi Recommendation" : "Create Rasi Recommendation"}
          </h1>
          <p className="text-muted-foreground mt-2">
            Create recommendation sets for specific rasis to guide users in their horoscope music selection.
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
                    Subscription is required to create and publish recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Recommendation Details</CardTitle>
            <CardDescription>
              Define recommendations for a specific rasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="rasiName">Rasi Name *</Label>
                <Select
                  value={formData.rasiName}
                  onValueChange={(value) => setFormData({ ...formData, rasiName: value })}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a rasi" />
                  </SelectTrigger>
                  <SelectContent>
                    {RASIS.map((rasi) => (
                      <SelectItem key={rasi} value={rasi}>
                        {rasi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="elementVibe">Element Vibe *</Label>
                <Input
                  id="elementVibe"
                  value={formData.elementVibe}
                  onChange={(e) => setFormData({ ...formData, elementVibe: e.target.value })}
                  placeholder="e.g., Fire style descriptor"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotionalToneKeywords">Emotional Tone Keywords *</Label>
                <Textarea
                  id="emotionalToneKeywords"
                  value={formData.emotionalToneKeywords}
                  onChange={(e) => setFormData({ ...formData, emotionalToneKeywords: e.target.value })}
                  placeholder="e.g., confident, energetic, bold"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendedTempo">Recommended Tempo *</Label>
                <Select
                  value={formData.recommendedTempo}
                  onValueChange={(value) => setFormData({ ...formData, recommendedTempo: value })}
                  disabled={isLocked}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tempo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPO_OPTIONS.map((tempo) => (
                      <SelectItem key={tempo} value={tempo}>
                        {tempo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendedInstruments">Recommended Instruments</Label>
                <Input
                  id="recommendedInstruments"
                  value={formData.recommendedInstruments?.join(", ") || ""}
                  onChange={(e) => {
                    const instruments = e.target.value.split(",").map((i) => i.trim()).filter(Boolean);
                    setFormData({ ...formData, recommendedInstruments: instruments });
                  }}
                  placeholder="e.g., Flute, Sitar, Tabla (comma-separated)"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="recommendedStyleTags">Recommended Style Tags</Label>
                <Input
                  id="recommendedStyleTags"
                  value={formData.recommendedStyleTags?.join(", ") || ""}
                  onChange={(e) => {
                    const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                    setFormData({ ...formData, recommendedStyleTags: tags });
                  }}
                  placeholder="e.g., celestial, devotional, classical fusion (comma-separated)"
                  disabled={isLocked}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avoidSuggestions">Avoid Suggestions (Optional)</Label>
                <Textarea
                  id="avoidSuggestions"
                  value={formData.avoidSuggestions || ""}
                  onChange={(e) => setFormData({ ...formData, avoidSuggestions: e.target.value })}
                  placeholder="e.g., avoid intense percussion for sleep sessions"
                  disabled={isLocked}
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLocked || isCreating}>
                  {isCreating ? "Creating..." : "Save as Draft"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/astrologer/recommendations")}
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Rasi Recommendations</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage recommendation sets for each rasi to guide users in their horoscope music selection.
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/astrologer/recommendations/new")}
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
              Create Recommendation
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
                  Subscription is required to create and publish recommendations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first rasi recommendation set to get started.
              </p>
              <Button
                onClick={() => setLocation("/dashboard/astrologer/recommendations/new")}
                disabled={isLocked}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Recommendation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <Card key={rec.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{rec.rasiName}</CardTitle>
                  {getStatusBadge(rec.status)}
                </div>
                <CardDescription>{rec.elementVibe}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Tempo:</span> {rec.recommendedTempo}
                  </div>
                  <div>
                    <span className="font-medium">Instruments:</span>{" "}
                    {rec.recommendedInstruments?.join(", ") || "None"}
                  </div>
                  <div>
                    <span className="font-medium">Styles:</span>{" "}
                    {rec.recommendedStyleTags?.join(", ") || "None"}
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => setLocation(`/dashboard/astrologer/recommendations/${rec.id}`)}
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

