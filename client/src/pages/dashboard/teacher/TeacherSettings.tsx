import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { 
  Settings, 
  User, 
  Bell, 
  Lock, 
  Save,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface TeacherSettingsData {
  bio?: string;
  specialization?: string;
  experience?: string;
  website?: string;
  socialLinks?: {
    youtube?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  notifications?: {
    newEnrollment: boolean;
    courseApproval: boolean;
    studentMessage: boolean;
  };
  privacy?: {
    showEmail: boolean;
    showPhone: boolean;
  };
}

export default function TeacherSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<TeacherSettingsData>({
    bio: "",
    specialization: "",
    experience: "",
    website: "",
    socialLinks: {
      youtube: "",
      instagram: "",
      facebook: "",
      twitter: "",
    },
    notifications: {
      newEnrollment: true,
      courseApproval: true,
      studentMessage: true,
    },
    privacy: {
      showEmail: false,
      showPhone: false,
    },
  });

  useEffect(() => {
    if (!user || user.role !== "music_teacher") {
      setLocation("/dashboard");
      return;
    }
    fetchSettings();
  }, [user, setLocation]);

  const fetchSettings = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const settingsRef = doc(db, "teacherSettings", user.id);
      const settingsSnap = await getDoc(settingsRef);
      
      if (settingsSnap.exists()) {
        setSettings(settingsSnap.data() as TeacherSettingsData);
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
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const settingsRef = doc(db, "teacherSettings", user.id);
      await updateDoc(settingsRef, {
        ...settings,
        updatedAt: serverTimestamp(),
      });

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
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Teacher Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your teacher profile and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your teacher profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={settings.bio || ""}
              onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
              placeholder="Tell students about yourself and your teaching style..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Specialization</Label>
              <Input
                value={settings.specialization || ""}
                onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
                placeholder="e.g., Carnatic Vocal, Violin, Mridangam"
              />
            </div>

            <div className="space-y-2">
              <Label>Years of Experience</Label>
              <Input
                value={settings.experience || ""}
                onChange={(e) => setSettings({ ...settings, experience: e.target.value })}
                placeholder="e.g., 10+ years"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Website (optional)</Label>
            <Input
              value={settings.website || ""}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              placeholder="https://yourwebsite.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Social Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Add your social media profiles (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input
                value={settings.socialLinks?.youtube || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, youtube: e.target.value }
                })}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>

            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={settings.socialLinks?.instagram || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, instagram: e.target.value }
                })}
                placeholder="https://instagram.com/yourprofile"
              />
            </div>

            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={settings.socialLinks?.facebook || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div className="space-y-2">
              <Label>Twitter/X</Label>
              <Input
                value={settings.socialLinks?.twitter || ""}
                onChange={(e) => setSettings({
                  ...settings,
                  socialLinks: { ...settings.socialLinks, twitter: e.target.value }
                })}
                placeholder="https://twitter.com/yourhandle"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>New Student Enrollment</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when a student enrolls in your course
              </p>
            </div>
            <Switch
              checked={settings.notifications?.newEnrollment ?? true}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, newEnrollment: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Course Approval Status</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when your course is approved or rejected
              </p>
            </div>
            <Switch
              checked={settings.notifications?.courseApproval ?? true}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, courseApproval: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Student Messages</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when students send you messages
              </p>
            </div>
            <Switch
              checked={settings.notifications?.studentMessage ?? true}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, studentMessage: checked }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Control what information is visible to students
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Email Address</Label>
              <p className="text-sm text-muted-foreground">
                Allow students to see your email address
              </p>
            </div>
            <Switch
              checked={settings.privacy?.showEmail ?? false}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, showEmail: checked }
              })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Phone Number</Label>
              <p className="text-sm text-muted-foreground">
                Allow students to see your phone number
              </p>
            </div>
            <Switch
              checked={settings.privacy?.showPhone ?? false}
              onCheckedChange={(checked) => setSettings({
                ...settings,
                privacy: { ...settings.privacy, showPhone: checked }
              })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {user?.subscriptionStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>
              Your current subscription information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge
                  variant={
                    user.subscriptionStatus === "active" ? "default" :
                    user.subscriptionStatus === "trial" ? "secondary" :
                    "outline"
                  }
                  className="mb-2"
                >
                  {user.subscriptionStatus}
                </Badge>
                {user.subscriptionExpiresAt && (
                  <p className="text-sm text-muted-foreground">
                    Expires: {new Date(user.subscriptionExpiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              {user.subscriptionStatus !== "active" && (
                <Button onClick={() => setLocation("/dashboard/upgrade")}>
                  Activate Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

