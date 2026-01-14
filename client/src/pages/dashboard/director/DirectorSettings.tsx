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
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

interface DirectorSettings {
  displayName: string;
  bio: string;
  company?: string;
  website: string;
  notifications: {
    requestResponses: boolean;
    newDeliveries: boolean;
    projectUpdates: boolean;
  };
}

export default function DirectorSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<DirectorSettings>({
    displayName: "",
    bio: "",
    company: "",
    website: "",
    notifications: {
      requestResponses: true,
      newDeliveries: true,
      projectUpdates: false,
    },
  });

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const settingsRef = doc(db, "directorSettings", user.id);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSettings({
          displayName: data.displayName || user.name || "",
          bio: data.bio || "",
          company: data.company || "",
          website: data.website || "",
          notifications: {
            requestResponses: data.notifications?.requestResponses !== false,
            newDeliveries: data.notifications?.newDeliveries !== false,
            projectUpdates: data.notifications?.projectUpdates || false,
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
      const settingsRef = doc(db, "directorSettings", user.id);
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
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Director Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your director profile and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public director profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="Your director name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company / Studio</Label>
            <Input
              id="company"
              value={settings.company}
              onChange={(e) => setSettings({ ...settings, company: e.target.value })}
              placeholder="Your company or studio name"
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

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={settings.website}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              placeholder="https://yourwebsite.com"
              type="url"
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
              <Label>Request Responses</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when artists respond to your requests
              </p>
            </div>
            <Switch
              checked={settings.notifications.requestResponses}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, requestResponses: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Deliveries</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when artists submit new deliveries
              </p>
            </div>
            <Switch
              checked={settings.notifications.newDeliveries}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, newDeliveries: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Project Updates</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about project-related updates
              </p>
            </div>
            <Switch
              checked={settings.notifications.projectUpdates}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, projectUpdates: checked }
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

