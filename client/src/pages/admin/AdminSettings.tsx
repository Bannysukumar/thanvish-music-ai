import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Save, Key, AlertCircle, CheckCircle2, Info, Mail, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function AdminSettings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  // SMTP settings state
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [hasSmtpConfig, setHasSmtpConfig] = useState(false);

  // Guest mode state
  const [guestModeEnabled, setGuestModeEnabled] = useState(false);
  const [isSavingGuestMode, setIsSavingGuestMode] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const sessionId = localStorage.getItem("adminSession");
        if (!sessionId) return;

        // Fetch API key
        const apiKeyResponse = await fetch("/api/admin/settings/api-key", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });

        if (apiKeyResponse.ok) {
          const apiKeyData = await apiKeyResponse.json();
          setApiKey(apiKeyData.apiKey || "");
          setHasApiKey(apiKeyData.hasKey || false);
        }

        // Fetch SMTP settings
        const smtpResponse = await fetch("/api/admin/settings/smtp", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });

        if (smtpResponse.ok) {
          const smtpData = await smtpResponse.json();
          setSmtpHost(smtpData.smtpHost || "");
          setSmtpPort(smtpData.smtpPort || "587");
          setSmtpUser(smtpData.smtpUser || "");
          setSmtpPassword(""); // Don't show masked password, user needs to enter new one or leave blank
          setSmtpFrom(smtpData.smtpFrom || "");
          setHasSmtpConfig(smtpData.hasConfig || false);
        }

        // Fetch guest mode setting
        const guestModeResponse = await fetch("/api/admin/settings/guest-mode", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });

        if (guestModeResponse.ok) {
          const guestModeData = await guestModeResponse.json();
          setGuestModeEnabled(guestModeData.enabled || false);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
          title: "Error",
          description: "Failed to fetch settings",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Error",
        description: "API key cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/settings/api-key", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update API key");
      }

      setHasApiKey(true);
      toast({
        title: "Success",
        description: "API key updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update API key",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSmtp = async () => {
    if (!smtpHost.trim() || !smtpUser.trim() || !smtpPassword.trim()) {
      toast({
        title: "Error",
        description: "SMTP Host, User, and Password are required",
        variant: "destructive",
      });
      return;
    }

    setIsSavingSmtp(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/settings/smtp", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          smtpHost: smtpHost.trim(),
          smtpPort: smtpPort.trim() || "587",
          smtpUser: smtpUser.trim(),
          smtpPassword: smtpPassword.trim(),
          smtpFrom: smtpFrom.trim() || smtpUser.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update SMTP settings");
      }

      setHasSmtpConfig(true);
      setSmtpPassword(""); // Clear password field after save
      toast({
        title: "Success",
        description: "SMTP settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update SMTP settings",
        variant: "destructive",
      });
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const handleToggleGuestMode = async (enabled: boolean) => {
    setIsSavingGuestMode(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/settings/guest-mode", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enabled }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update guest mode setting");
      }

      setGuestModeEnabled(enabled);
      toast({
        title: "Success",
        description: `Guest mode ${enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update guest mode setting",
        variant: "destructive",
      });
      // Revert the toggle on error
      setGuestModeEnabled(!enabled);
    } finally {
      setIsSavingGuestMode(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage application configuration and API keys
        </p>
      </div>

      {/* API Configuration Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">API Configuration</CardTitle>
              <CardDescription className="mt-1">
                Configure the API.box API key for music generation
              </CardDescription>
            </div>
            {hasApiKey && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Configured</span>
              </div>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* API Key Input Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="api-key" className="text-base font-medium">
                  API.box API Key
                </Label>
                {!hasApiKey && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Required
                  </span>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="relative flex items-center">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API.box API key"
                    disabled={isLoading}
                    className="pr-11 h-11 text-base font-mono"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 h-11 w-11 hover:bg-transparent rounded-l-none"
                    onClick={() => setShowApiKey(!showApiKey)}
                    disabled={isLoading}
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>

                <Button 
                  onClick={handleSave} 
                  disabled={isLoading || !apiKey.trim()}
                  className="w-full sm:w-auto"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save API Key
                    </>
                  )}
                </Button>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How it works</AlertTitle>
                <AlertDescription className="mt-2">
                  The API key is securely stored in your server's <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">.env</code> file and will be used for all music generation requests. 
                  Keep your API key secure and never share it publicly.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SMTP Email Configuration Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Email Configuration</CardTitle>
              <CardDescription className="mt-1">
                Configure SMTP settings for sending OTP verification emails
              </CardDescription>
            </div>
            {hasSmtpConfig && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Configured</span>
              </div>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* SMTP Host */}
              <div className="space-y-2">
                <Label htmlFor="smtp-host" className="text-base font-medium">
                  SMTP Host <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="smtp-host"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  disabled={isSavingSmtp}
                />
              </div>

              {/* SMTP Port */}
              <div className="space-y-2">
                <Label htmlFor="smtp-port" className="text-base font-medium">
                  SMTP Port
                </Label>
                <Input
                  id="smtp-port"
                  type="number"
                  placeholder="587"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  disabled={isSavingSmtp}
                />
              </div>
            </div>

            {/* SMTP User */}
            <div className="space-y-2">
              <Label htmlFor="smtp-user" className="text-base font-medium">
                SMTP User (Email) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="smtp-user"
                type="email"
                placeholder="your-email@gmail.com"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                disabled={isSavingSmtp}
              />
            </div>

            {/* SMTP Password */}
            <div className="space-y-2">
              <Label htmlFor="smtp-password" className="text-base font-medium">
                SMTP Password (App Password) <span className="text-destructive">*</span>
              </Label>
              <div className="relative flex items-center">
                <Input
                  id="smtp-password"
                  type={showSmtpPassword ? "text" : "password"}
                  placeholder="Enter your SMTP password or app password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  disabled={isSavingSmtp}
                  className="pr-11 h-11 text-base font-mono"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 h-11 w-11 hover:bg-transparent rounded-l-none"
                  onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                  disabled={isSavingSmtp}
                  aria-label={showSmtpPassword ? "Hide password" : "Show password"}
                >
                  {showSmtpPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {/* SMTP From */}
            <div className="space-y-2">
              <Label htmlFor="smtp-from" className="text-base font-medium">
                From Email Address
              </Label>
              <Input
                id="smtp-from"
                type="email"
                placeholder="noreply@thanvish.com"
                value={smtpFrom}
                onChange={(e) => setSmtpFrom(e.target.value)}
                disabled={isSavingSmtp}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use SMTP User email as From address
              </p>
            </div>

            <Button
              onClick={handleSaveSmtp}
              disabled={isSavingSmtp || !smtpHost.trim() || !smtpUser.trim() || !smtpPassword.trim()}
              className="w-full sm:w-auto"
              size="lg"
            >
              {isSavingSmtp ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save SMTP Settings
                </>
              )}
            </Button>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>SMTP Configuration</AlertTitle>
              <AlertDescription className="mt-2">
                These settings are stored in your server's <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">.env</code> file.
                For Gmail, use an App Password (not your regular password). The settings will be used for sending OTP verification emails to users during account creation.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Guest Mode Configuration Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Guest Mode</CardTitle>
              <CardDescription className="mt-1">
                Enable or disable guest user access to the platform
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {guestModeEnabled ? (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Enabled</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">Disabled</span>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="guest-mode" className="text-base font-medium">
                  Allow Guest Access
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, users can access the platform without creating an account
                </p>
              </div>
              <Switch
                id="guest-mode"
                checked={guestModeEnabled}
                onCheckedChange={handleToggleGuestMode}
                disabled={isSavingGuestMode}
              />
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About Guest Mode</AlertTitle>
              <AlertDescription className="mt-2">
                When guest mode is enabled, users can continue without signing up. Guest users have limited access and cannot save their compositions permanently. 
                When disabled, users must create an account to access the platform.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Environment Configuration</CardTitle>
              <CardDescription className="mt-1">
                View current environment variable settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  API_BOX_BASE_URL
                </Label>
                <div className="p-3 rounded-md bg-muted/50 border font-mono text-sm">
                  {import.meta.env.VITE_API_BOX_BASE_URL || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  API_BOX_MODEL
                </Label>
                <div className="p-3 rounded-md bg-muted/50 border font-mono text-sm">
                  {import.meta.env.VITE_API_BOX_MODEL || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Note</AlertTitle>
              <AlertDescription className="mt-2">
                These environment variables are read-only and managed through your server configuration. 
                To modify them, update your <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">.env</code> file on the server.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
