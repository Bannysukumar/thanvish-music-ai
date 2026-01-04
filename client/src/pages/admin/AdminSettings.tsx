import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, Save, Key, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminSettings() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const sessionId = localStorage.getItem("adminSession");
        if (!sessionId) return;

        const response = await fetch("/api/admin/settings/api-key", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setApiKey(data.apiKey || "");
          setHasApiKey(data.hasKey || false);
        }
      } catch (error) {
        console.error("Error fetching API key:", error);
        toast({
          title: "Error",
          description: "Failed to fetch API key",
          variant: "destructive",
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchApiKey();
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
