import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Save, 
  Sun, 
  Moon, 
  Crown, 
  Shield, 
  Download, 
  Settings,
  Music,
  TrendingUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getSavedCompositions } from "@/lib/compositionStorage";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";

/**
 * DashboardProfile component - user profile page with enhanced features
 */
export default function DashboardProfile() {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [compositionsCount, setCompositionsCount] = useState(0);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // Load user stats
  useEffect(() => {
    const compositions = getSavedCompositions();
    setCompositionsCount(compositions.length);
  }, []);

  /**
   * Handle profile update
   */
  const handleSaveProfile = () => {
    // In a real app, this would update the user profile via API
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  /**
   * Handle upgrade account
   */
  const handleUpgrade = () => {
    setLocation("/dashboard/upgrade");
  };

  /**
   * Handle export data
   */
  const handleExportData = () => {
    const compositions = getSavedCompositions();
    const dataStr = JSON.stringify(compositions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thanvish-music-library-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your library data has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information, preferences, and settings
        </p>
      </div>

      {/* Account Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compositions</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compositionsCount}</div>
            <p className="text-xs text-muted-foreground">Total saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Type</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.isGuest ? "Free" : "Pro"}
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.isGuest ? "Upgrade available" : "Premium member"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Unlimited</div>
            <p className="text-xs text-muted-foreground">Cloud storage</p>
          </CardContent>
        </Card>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your profile details and personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={user?.isGuest}
              />
            </div>
            {user?.isGuest && (
              <p className="text-xs text-muted-foreground">
                Sign up to edit your profile
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                className="pl-10"
                disabled={true}
              />
            </div>
            {user?.isGuest && (
              <p className="text-xs text-muted-foreground">
                Sign up to add an email address
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveProfile} disabled={user?.isGuest}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account Status & Upgrade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your current account type and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">
                  {user?.isGuest ? "Free Account" : "Pro Account"}
                </p>
                {!user?.isGuest && (
                  <Badge variant="default" className="ml-2">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {user?.isGuest 
                  ? "Limited features. Upgrade to unlock premium features."
                  : "Full access to all premium features and unlimited generations."
                }
              </p>
            </div>
            {user?.isGuest && (
              <Button onClick={handleUpgrade} className="ml-4">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade Account
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">Storage</p>
              <p className="text-sm text-muted-foreground">Unlimited</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Generations</p>
              <p className="text-sm text-muted-foreground">
                {user?.isGuest ? "Limited" : "Unlimited"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Audio Quality</p>
              <p className="text-sm text-muted-foreground">
                {user?.isGuest ? "Standard" : "High Quality"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Support</p>
              <p className="text-sm text-muted-foreground">
                {user?.isGuest ? "Community" : "Priority"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Configure your application preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your compositions
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled={user?.isGuest}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto-save Compositions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save generated compositions to library
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security & Privacy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
          <CardDescription>
            Manage your account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: Never
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={user?.isGuest}
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={user?.isGuest}>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export or manage your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Export Library Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your compositions as JSON
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled={user?.isGuest}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
}
