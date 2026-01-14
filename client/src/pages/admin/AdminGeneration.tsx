import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, AlertCircle } from "lucide-react";

export default function AdminGeneration() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Music Generation Control</h1>
        <p className="text-muted-foreground mt-2">
          Control AI generation globally, set limits per role, and monitor usage
        </p>
      </div>

      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                Global AI Generation Control
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                Enable or disable AI generation globally. When disabled, all users will see a maintenance message.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>
            Control AI generation at the platform level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="globalEnabled">AI Generation Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Toggle AI music generation on/off globally
              </p>
            </div>
            <Switch id="globalEnabled" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Pause AI generation during maintenance
              </p>
            </div>
            <Switch id="maintenanceMode" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usage Limits by Role</CardTitle>
          <CardDescription>
            Set daily and monthly generation limits per role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Role-Based Limits</h3>
            <p className="text-muted-foreground">
              Configure generation limits per role coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Analytics & Insights</CardTitle>
          <CardDescription>
            View generation statistics and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Generation analytics coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

