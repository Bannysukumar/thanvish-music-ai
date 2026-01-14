import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardAccess {
  role: string;
  enabled: boolean;
  menuItems: string[];
  customRedirect?: string;
}

export default function AdminAccessControl() {
  const { toast } = useToast();
  const [accessConfig, setAccessConfig] = useState<DashboardAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const roles = [
    { value: "student", label: "Student" },
    { value: "music_teacher", label: "Music Teacher" },
    { value: "artist", label: "Artist" },
    { value: "music_director", label: "Music Director" },
    { value: "doctor", label: "Doctor" },
    { value: "astrologer", label: "Astrologer" },
  ];

  useEffect(() => {
    fetchAccessConfig();
  }, []);

  const fetchAccessConfig = async () => {
    try {
      // Placeholder - would fetch from API
      setAccessConfig(
        roles.map(role => ({
          role: role.value,
          enabled: true,
          menuItems: [],
        }))
      );
    } catch (error) {
      console.error("Error fetching access config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = (role: string, enabled: boolean) => {
    setAccessConfig(prev =>
      prev.map(config =>
        config.role === role ? { ...config, enabled } : config
      )
    );
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Placeholder - would save via API
      toast({
        title: "Success",
        description: "Dashboard access control updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update access control",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Access Control</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Access Control</h1>
          <p className="text-muted-foreground mt-2">
            Configure which roles see which dashboards and menu items
          </p>
        </div>
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

      <Card>
        <CardHeader>
          <CardTitle>Role-Based Dashboard Access</CardTitle>
          <CardDescription>
            Enable or disable dashboard access for each role
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accessConfig.map((config) => {
            const roleInfo = roles.find(r => r.value === config.role);
            return (
              <div
                key={config.role}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`role-${config.role}`} className="text-base font-semibold">
                      {roleInfo?.label || config.role}
                    </Label>
                    <Badge variant={config.enabled ? "default" : "secondary"}>
                      {config.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.enabled
                      ? "Users with this role can access their dashboard"
                      : "Dashboard access is disabled for this role"}
                  </p>
                </div>
                <Switch
                  id={`role-${config.role}`}
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleToggleRole(config.role, checked)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Temporary Access Overrides</CardTitle>
          <CardDescription>
            Grant temporary access for testing purposes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Temporary Access</h3>
            <p className="text-muted-foreground">
              Temporary access override functionality coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

