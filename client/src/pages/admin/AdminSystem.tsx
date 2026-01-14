import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Wrench, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemSettings {
  modules: {
    educationalMusic: boolean;
    instrumentalEducation: boolean;
    musicGeneration: boolean;
    musicHoroscope: boolean;
    musicTherapy: boolean;
    artistLibrary: boolean;
    musicEBooks: boolean;
  };
  maintenanceMode: boolean;
  aiGenerationEnabled: boolean;
}

export default function AdminSystem() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/system-settings", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch settings");

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch system settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      setIsSaving(true);

      const response = await fetch("/api/admin/system-settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      const newSettings = { ...settings, ...updates } as SystemSettings;
      setSettings(newSettings);

      toast({
        title: "Success",
        description: "System settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleModuleToggle = (module: keyof SystemSettings["modules"], enabled: boolean) => {
    if (!settings) return;
    updateSettings({
      modules: {
        ...settings.modules,
        [module]: enabled,
      },
    });
  };

  const handleMaintenanceToggle = (enabled: boolean) => {
    updateSettings({ maintenanceMode: enabled });
  };

  const handleAIGenerationToggle = (enabled: boolean) => {
    updateSettings({ aiGenerationEnabled: enabled });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-2">Loading settings...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground mt-2">Failed to load settings</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">System Settings</h1>
        <p className="text-muted-foreground mt-2">
          Global controls, feature flags, and platform-wide settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module Control</CardTitle>
          <CardDescription>
            Enable or disable modules globally
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="educationalMusic">Educational Music</Label>
              <p className="text-sm text-muted-foreground">Enable/disable educational music module</p>
            </div>
            <Switch
              id="educationalMusic"
              checked={settings.modules.educationalMusic}
              onCheckedChange={(checked) => handleModuleToggle("educationalMusic", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="instrumentalEducation">Instrumental Education</Label>
              <p className="text-sm text-muted-foreground">Enable/disable instrumental education module</p>
            </div>
            <Switch
              id="instrumentalEducation"
              checked={settings.modules.instrumentalEducation}
              onCheckedChange={(checked) => handleModuleToggle("instrumentalEducation", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="musicGeneration">Music Generation</Label>
              <p className="text-sm text-muted-foreground">Enable/disable AI music generation</p>
            </div>
            <Switch
              id="musicGeneration"
              checked={settings.modules.musicGeneration}
              onCheckedChange={(checked) => handleModuleToggle("musicGeneration", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="musicHoroscope">Music Horoscope</Label>
              <p className="text-sm text-muted-foreground">Enable/disable horoscope music module</p>
            </div>
            <Switch
              id="musicHoroscope"
              checked={settings.modules.musicHoroscope}
              onCheckedChange={(checked) => handleModuleToggle("musicHoroscope", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="musicTherapy">Music Therapy</Label>
              <p className="text-sm text-muted-foreground">Enable/disable therapy module</p>
            </div>
            <Switch
              id="musicTherapy"
              checked={settings.modules.musicTherapy}
              onCheckedChange={(checked) => handleModuleToggle("musicTherapy", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="artistLibrary">Artist Library</Label>
              <p className="text-sm text-muted-foreground">Enable/disable artist library</p>
            </div>
            <Switch
              id="artistLibrary"
              checked={settings.modules.artistLibrary}
              onCheckedChange={(checked) => handleModuleToggle("artistLibrary", checked)}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="musicEBooks">Music E-Books</Label>
              <p className="text-sm text-muted-foreground">Enable/disable e-books module</p>
            </div>
            <Switch
              id="musicEBooks"
              checked={settings.modules.musicEBooks}
              onCheckedChange={(checked) => handleModuleToggle("musicEBooks", checked)}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Control maintenance mode and default limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
            </div>
            <Switch
              id="maintenanceMode"
              checked={settings.maintenanceMode}
              onCheckedChange={handleMaintenanceToggle}
              disabled={isSaving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="aiGenerationEnabled">AI Generation Enabled</Label>
              <p className="text-sm text-muted-foreground">Global toggle for AI music generation</p>
            </div>
            <Switch
              id="aiGenerationEnabled"
              checked={settings.aiGenerationEnabled}
              onCheckedChange={handleAIGenerationToggle}
              disabled={isSaving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Texts</CardTitle>
          <CardDescription>
            Manage terms, privacy policy, and disclaimers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Legal Management</h3>
            <p className="text-muted-foreground">
              Legal text management coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

