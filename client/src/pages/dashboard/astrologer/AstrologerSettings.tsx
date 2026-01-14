import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface AstrologerSettings {
  bio?: string;
  specialization?: string;
  emailNotifications?: boolean;
  contentNotifications?: boolean;
  requestNotifications?: boolean;
}

export default function AstrologerSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<AstrologerSettings>({
    bio: "",
    specialization: "",
    emailNotifications: true,
    contentNotifications: true,
    requestNotifications: true,
  });

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      return;
    }

    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const settingsDoc = await getDoc(doc(db, "astrologerSettings", user.id));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as AstrologerSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);
      await setDoc(doc(db, "astrologerSettings", user.id), {
        ...settings,
        updatedAt: new Date(),
      });
      toast({
        title: "Settings saved",
        description: "Your astrologer settings have been updated.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
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
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AstrologyDisclaimer />

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Astrologer Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your profile information and notification preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your astrologer profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={settings.specialization || ""}
              onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
              placeholder="e.g., Vedic Astrology, Music Therapy Integration"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={settings.bio || ""}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              placeholder="Tell users about your expertise and approach..."
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Control when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your content and requests
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, emailNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="contentNotifications">Content Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your content is approved or needs review
              </p>
            </div>
            <Switch
              id="contentNotifications"
              checked={settings.contentNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, contentNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requestNotifications">Request Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when users submit questions or requests
              </p>
            </div>
            <Switch
              id="requestNotifications"
              checked={settings.requestNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, requestNotifications: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Lock className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

