import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Settings,
  Coins,
  Menu,
  X,
  LogOut,
  FileText,
  CreditCard,
  Shield,
  Music,
  BookOpen,
  Sparkles,
  Heart,
  GraduationCap,
  BarChart3,
  AlertTriangle,
  Bell,
  Database,
  Wrench,
  FileCheck,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Admin side menu navigation items - Master Admin Panel
 */
const menuItems = [
  { path: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/users", label: "User & Role Management", icon: Users },
  { path: "/admin/subscriptions", label: "Subscriptions & Payments", icon: CreditCard },
  { path: "/admin/content", label: "Content Management", icon: FileCheck },
  { path: "/admin/instruments", label: "Instrument Management", icon: Music },
  { path: "/admin/generation", label: "AI Generation Control", icon: Sparkles },
  { path: "/admin/horoscope", label: "Horoscope Control", icon: Sparkles },
  { path: "/admin/therapy", label: "Therapy & Doctor Control", icon: Heart },
  { path: "/admin/artists", label: "Artist & Director Control", icon: Music },
  { path: "/admin/ebooks", label: "E-Book Control", icon: BookOpen },
  { path: "/admin/reports", label: "Reports & Safety", icon: AlertTriangle },
  { path: "/admin/analytics", label: "Analytics & Insights", icon: BarChart3 },
  { path: "/admin/system", label: "System Settings", icon: Wrench },
  { path: "/admin/access-control", label: "Dashboard Access Control", icon: Shield },
  { path: "/admin/role-menu-management", label: "Role Menu Management", icon: Menu },
  { path: "/admin/notifications", label: "Notifications", icon: Bell },
  { path: "/admin/security", label: "Security & Logging", icon: Shield },
  { path: "/admin/logs", label: "Generation Logs", icon: FileText },
  { path: "/admin/audit-logs", label: "Role Audit Logs", icon: FileText },
  { path: "/admin/credits", label: "Credits", icon: Coins },
  { path: "/admin/settings", label: "API Settings", icon: Settings },
];

/**
 * Props for AdminLayout component
 */
interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * AdminLayout component - provides side menu and main content area for admin
 */
export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    // Verify admin session on mount
    const verifySession = async () => {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        setLocation("/admin/login");
        return;
      }

      try {
        const response = await fetch("/api/admin/verify", {
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem("adminSession");
          setLocation("/admin/login");
          return;
        }

        const data = await response.json();
        setUsername(data.username || "Admin");
      } catch (error) {
        console.error("Session verification failed:", error);
        localStorage.removeItem("adminSession");
        setLocation("/admin/login");
      }
    };

    verifySession();
  }, [setLocation]);

  /**
   * Handle logout
   */
  const handleLogout = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (sessionId) {
        await fetch("/api/admin/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionId}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("adminSession");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      setLocation("/admin/login");
    }
  };

  /**
   * Check if a menu item is active
   */
  const isActive = (path: string) => {
    if (path === "/admin/dashboard") {
      return location === "/admin/dashboard";
    }
    return location.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="font-serif text-xl font-semibold">Admin Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Side menu - Desktop */}
        <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
          <div className="p-6 border-b">
            <h1 className="font-serif text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {username || "Admin"}
            </p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3",
                      active && "bg-secondary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Side menu - Mobile */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm">
            <aside className="w-64 h-full border-r bg-card shadow-lg">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-serif text-2xl font-bold">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {username || "Admin"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          active && "bg-secondary"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </Button>
              </div>
            </aside>
          </div>
        )}

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

