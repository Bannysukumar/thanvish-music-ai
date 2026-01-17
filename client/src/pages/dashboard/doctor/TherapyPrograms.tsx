import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, ArrowLeft, Lock, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafetyDisclaimer } from "@/components/doctor/SafetyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";

interface Program {
  id: string;
  title: string;
  wellnessGoal: string;
  targetAudience: string;
  durationPlan: string;
  status: "draft" | "pending_approval" | "live" | "rejected";
  createdAt?: any;
}

export default function TherapyPrograms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isNew = location === "/dashboard/doctor/programs/new";
  const [isLoading, setIsLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    wellnessGoal: "",
    targetAudience: "",
    durationPlan: "",
    description: "",
  });
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "doctor" && !isNew) {
      fetchPrograms();
    }
  }, [user, isNew]);

  const fetchPrograms = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const programsQuery = query(
        collection(db, "therapyPrograms"),
        where("doctorId", "==", user.id)
      );
      const querySnapshot = await getDocs(programsQuery);
      const programsData: Program[] = [];
      
      querySnapshot.forEach((doc) => {
        programsData.push({
          id: doc.id,
          ...doc.data(),
        } as Program);
      });

      programsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setPrograms(programsData);
    } catch (error) {
      console.error("Error fetching programs:", error);
      toast({
        title: "Error",
        description: "Failed to load programs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !formData.title || !formData.wellnessGoal || !formData.durationPlan) {
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
        description: "You need an active subscription to create therapy programs",
        variant: "destructive",
      });
      return;
    }

    // Check program creation limit before proceeding
    try {
      if (!auth.currentUser) {
        throw new Error("User not authenticated");
      }
      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/doctor/check-program-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Program Limit Reached",
          description: errorData.error || "You've reached your program creation limit for this month. Upgrade your plan to create more programs.",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Program Limit Reached",
          description: limitData.error || "You've reached your program creation limit for this month. Upgrade your plan to create more programs.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking program limits:", error);
      toast({
        title: "Error",
        description: "Failed to check program limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const programData = {
        title: formData.title,
        wellnessGoal: formData.wellnessGoal,
        targetAudience: formData.targetAudience || "general",
        durationPlan: formData.durationPlan,
        description: formData.description || "",
        doctorId: user.id,
        doctorName: user.name,
        status: "draft",
        disclaimer: "This content is for wellness and relaxation support only and is not a medical or psychiatric treatment.",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "therapyPrograms"), programData);

      // Increment program count after successful creation
      try {
        if (auth.currentUser) {
          const token = await auth.currentUser.getIdToken();
          await fetch("/api/doctor/increment-program-count", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        }
      } catch (error: any) {
        console.error("Error incrementing program count:", error);
        // Don't fail the creation if increment fails
      }

      toast({
        title: "Success",
        description: "Therapy program created successfully!",
      });

      setFormData({
        title: "",
        wellnessGoal: "",
        targetAudience: "",
        durationPlan: "",
        description: "",
      });

      setLocation("/dashboard/doctor/programs");
      fetchPrograms();
    } catch (error: any) {
      console.error("Error creating program:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create program",
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
            onClick={() => setLocation("/dashboard/doctor/programs")}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold">Create Therapy Program</h1>
            <p className="text-muted-foreground mt-2">
              Create a wellness-focused music therapy program
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
                    Creating therapy programs requires an active subscription.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Therapy Program Information</CardTitle>
              <CardDescription>
                Provide details about your wellness program
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Program Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., 7-Day Stress Relief Program"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  disabled={isLocked || isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wellnessGoal">Wellness Goal *</Label>
                <Select
                  value={formData.wellnessGoal}
                  onValueChange={(value) => setFormData({ ...formData, wellnessGoal: value })}
                  disabled={isLocked || isLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select wellness goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stress_relief">Stress Relief</SelectItem>
                    <SelectItem value="sleep">Sleep</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="anxiety_calming">Anxiety Calming</SelectItem>
                    <SelectItem value="meditation">Meditation</SelectItem>
                    <SelectItem value="confidence">Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}
                  disabled={isLocked || isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="working_professionals">Working Professionals</SelectItem>
                    <SelectItem value="seniors">Seniors</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationPlan">Duration Plan *</Label>
                <Select
                  value={formData.durationPlan}
                  onValueChange={(value) => setFormData({ ...formData, durationPlan: value })}
                  disabled={isLocked || isLoading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your therapy program..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLocked || isLoading}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard/doctor/programs")}
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
                      Create Program
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

  if (isLoading && programs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading programs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafetyDisclaimer />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Therapy Programs</h1>
          <p className="text-muted-foreground mt-2">
            Manage your wellness music therapy programs
          </p>
        </div>
        <Button
          onClick={() => setLocation("/dashboard/doctor/programs/new")}
          disabled={isLocked}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Program
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Programs</CardTitle>
          <CardDescription>
            {programs.length} program{programs.length !== 1 ? "s" : ""} total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No programs yet</p>
              <p className="text-sm mt-2">Create your first therapy program to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {programs.map((program) => (
                <Card key={program.id} className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{program.title}</CardTitle>
                      <span className={`text-xs px-2 py-1 rounded ${
                        program.status === "live"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : program.status === "pending_approval"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : program.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}>
                        {program.status}
                      </span>
                    </div>
                    <CardDescription className="capitalize">{program.wellnessGoal.replace("_", " ")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Duration: {program.durationPlan} days</span>
                      <span>•</span>
                      <span className="capitalize">{program.targetAudience.replace("_", " ")}</span>
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

