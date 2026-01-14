import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

interface StudentSettings {
  practiceReminders?: boolean;
  lessonNotifications?: boolean;
  progressEmails?: boolean;
  dailyPracticeGoal?: number; // minutes
}

export default function StudentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<StudentSettings>({
    practiceReminders: true,
    lessonNotifications: true,
    progressEmails: false,
    dailyPracticeGoal: 30,
  });

  useEffect(() => {
    if (!user || user.role !== "student") {
      return;
    }

    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;

    try {
      const settingsDoc = await getDoc(doc(db, "studentSettings", user.id));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data() as StudentSettings);
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
      await setDoc(doc(db, "studentSettings", user.id), {
        ...settings,
        updatedAt: new Date(),
      });
      toast({
        title: "Settings saved",
        description: "Your student settings have been updated.",
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
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Student Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your learning preferences and notifications
        </p>
      </div>

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
              <Label htmlFor="practiceReminders">Practice Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded to practice your instrument daily
              </p>
            </div>
            <Switch
              id="practiceReminders"
              checked={settings.practiceReminders}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, practiceReminders: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="lessonNotifications">Lesson Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about new lessons and course updates
              </p>
            </div>
            <Switch
              id="lessonNotifications"
              checked={settings.lessonNotifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, lessonNotifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="progressEmails">Progress Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive weekly emails about your learning progress
              </p>
            </div>
            <Switch
              id="progressEmails"
              checked={settings.progressEmails}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, progressEmails: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Practice Goals</CardTitle>
          <CardDescription>
            Set your daily practice goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dailyPracticeGoal">Daily Practice Goal (minutes)</Label>
            <Input
              id="dailyPracticeGoal"
              type="number"
              min="5"
              max="120"
              value={settings.dailyPracticeGoal}
              onChange={(e) =>
                setSettings({ ...settings, dailyPracticeGoal: parseInt(e.target.value) || 30 })
              }
            />
            <p className="text-xs text-muted-foreground">
              Set a daily practice goal to track your progress
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
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

