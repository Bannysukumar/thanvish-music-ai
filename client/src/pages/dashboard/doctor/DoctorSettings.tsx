import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { SafetyDisclaimer } from "@/components/doctor/SafetyDisclaimer";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface DoctorSettings {
  displayName: string;
  bio: string;
  specialization?: string;
  notifications: {
    programFeedback: boolean;
    articleApprovals: boolean;
    newEnrollments: boolean;
  };
}

export default function DoctorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<DoctorSettings>({
    displayName: "",
    bio: "",
    specialization: "",
    notifications: {
      programFeedback: true,
      articleApprovals: true,
      newEnrollments: false,
    },
  });

  useEffect(() => {
    if (user && user.role === "doctor") {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const settingsRef = doc(db, "doctorSettings", user.id);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSettings({
          displayName: data.displayName || user.name || "",
          bio: data.bio || "",
          specialization: data.specialization || "",
          notifications: {
            programFeedback: data.notifications?.programFeedback !== false,
            articleApprovals: data.notifications?.articleApprovals !== false,
            newEnrollments: data.notifications?.newEnrollments || false,
          },
        });
      } else {
        setSettings((prev) => ({
          ...prev,
          displayName: user.name || "",
        }));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const settingsRef = doc(db, "doctorSettings", user.id);
      await setDoc(
        settingsRef,
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast({
        title: "Success",
        description: "Settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SafetyDisclaimer />
      
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Doctor Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your doctor profile and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public doctor profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="Your doctor name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization (Optional)</Label>
            <Input
              id="specialization"
              value={settings.specialization}
              onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
              placeholder="e.g., Music Therapy, Wellness Counseling"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.bio}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Program Feedback</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when users provide feedback on your programs
              </p>
            </div>
            <Switch
              checked={settings.notifications.programFeedback}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, programFeedback: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Article Approvals</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your articles are approved or rejected
              </p>
            </div>
            <Switch
              checked={settings.notifications.articleApprovals}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, articleApprovals: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Enrollments</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when users enroll in your programs
              </p>
            </div>
            <Switch
              checked={settings.notifications.newEnrollments}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, newEnrollments: checked }
              })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

