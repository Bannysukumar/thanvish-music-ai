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

interface ArtistSettings {
  displayName: string;
  bio: string;
  website: string;
  socialLinks: {
    instagram: string;
    youtube: string;
    spotify: string;
  };
  notifications: {
    collaborationRequests: boolean;
    licensingRequests: boolean;
    newFollowers: boolean;
  };
}

export default function ArtistSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ArtistSettings>({
    displayName: "",
    bio: "",
    website: "",
    socialLinks: {
      instagram: "",
      youtube: "",
      spotify: "",
    },
    notifications: {
      collaborationRequests: true,
      licensingRequests: true,
      newFollowers: false,
    },
  });

  useEffect(() => {
    if (user && user.role === "artist") {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const settingsRef = doc(db, "artistSettings", user.id);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setSettings({
          displayName: data.displayName || user.name || "",
          bio: data.bio || "",
          website: data.website || "",
          socialLinks: {
            instagram: data.socialLinks?.instagram || "",
            youtube: data.socialLinks?.youtube || "",
            spotify: data.socialLinks?.spotify || "",
          },
          notifications: {
            collaborationRequests: data.notifications?.collaborationRequests !== false,
            licensingRequests: data.notifications?.licensingRequests !== false,
            newFollowers: data.notifications?.newFollowers || false,
          },
        });
      } else {
        // Initialize with user's name
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
      const settingsRef = doc(db, "artistSettings", user.id);
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
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Artist Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your artist profile and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your public artist profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={settings.displayName}
              onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
              placeholder="Your artist name"
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

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Connect your social media profiles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instagram">Instagram</Label>
            <Input
              id="instagram"
              value={settings.socialLinks.instagram}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, instagram: e.target.value }
              })}
              placeholder="@yourusername"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="youtube">YouTube</Label>
            <Input
              id="youtube"
              value={settings.socialLinks.youtube}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, youtube: e.target.value }
              })}
              placeholder="Channel URL"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="spotify">Spotify</Label>
            <Input
              id="spotify"
              value={settings.socialLinks.spotify}
              onChange={(e) => setSettings({
                ...settings,
                socialLinks: { ...settings.socialLinks, spotify: e.target.value }
              })}
              placeholder="Artist profile URL"
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
              <Label>Collaboration Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone requests a collaboration
              </p>
            </div>
            <Switch
              checked={settings.notifications.collaborationRequests}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, collaborationRequests: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Licensing Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about commercial licensing inquiries
              </p>
            </div>
            <Switch
              checked={settings.notifications.licensingRequests}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, licensingRequests: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Followers</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when someone follows your profile
              </p>
            </div>
            <Switch
              checked={settings.notifications.newFollowers}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, newFollowers: checked }
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
