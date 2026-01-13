import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home as HomeIcon, 
  Sparkles, 
  Library, 
  User, 
  Crown,
  Menu,
  X,
  LogOut,
  Star as HoroscopeIcon,
  Music as MusicTherapyIcon,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * Side menu navigation items
 */
const menuItems = [
  { path: "/dashboard", label: "Home", icon: HomeIcon },
  { path: "/dashboard/generate", label: "Generate", icon: Sparkles },
  { path: "/dashboard/library", label: "My Library", icon: Library },
  { path: "/dashboard/horoscope", label: "Horoscope Profile", icon: HoroscopeIcon, emoji: "🔮" },
  { path: "/dashboard/music-therapy", label: "Music Therapy", icon: MusicTherapyIcon, emoji: "🎵" },
  { path: "/dashboard/profile", label: "Profile", icon: User },
  { path: "/dashboard/upgrade", label: "Upgrade", icon: Crown },
];

/**
 * Props for DashboardLayout component
 */
interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * DashboardLayout component - provides side menu and main content area
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem("dashboardMenuCollapsed");
    return saved === "true";
  });

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    setLocation("/");
  };

  /**
   * Check if a menu item is active
   */
  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location === "/dashboard";
    }
    return location.startsWith(path);
  };

  /**
   * Toggle sidebar collapse state
   */
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("dashboardMenuCollapsed", String(newState));
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile header */}
      <header className="lg:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4">
          <h1 className="font-serif text-xl font-semibold">Dashboard</h1>
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
        <aside 
          className={cn(
            "hidden lg:flex flex-col border-r bg-card transition-all duration-300 ease-in-out relative group/sidebar",
            isCollapsed ? "w-16" : "w-64"
          )}
        >
          {/* Collapse Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent transition-all",
              "opacity-70 hover:opacity-100 group-hover/sidebar:opacity-100"
            )}
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>

          <div className={cn(
            "p-6 border-b transition-all duration-300",
            isCollapsed && "px-2"
          )}>
            {!isCollapsed ? (
              <>
                <h1 className="font-serif text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Thanvish AI
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.isGuest ? "Guest User" : user?.name || "User"}
                </p>
              </>
            ) : (
              <h1 className="font-serif text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent text-center">
                T
              </h1>
            )}
          </div>

          <nav className={cn(
            "flex-1 p-4 space-y-2 transition-all duration-300",
            isCollapsed && "px-2"
          )}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={cn(
                      "w-full gap-3 transition-all duration-200",
                      isCollapsed ? "justify-center px-2" : "justify-start",
                      active && "bg-secondary font-medium",
                      !isCollapsed && "group/item"
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={cn("h-5 w-5 flex-shrink-0", item.emoji && "relative")} />
                    {!isCollapsed && (
                      <span className="flex items-center gap-2">
                        {item.emoji && <span>{item.emoji}</span>}
                        <span>{item.label}</span>
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className={cn(
            "p-4 border-t transition-all duration-300",
            isCollapsed && "px-2"
          )}>
            <Button
              variant="ghost"
              className={cn(
                "w-full gap-3 text-destructive hover:text-destructive transition-all duration-200",
                isCollapsed ? "justify-center px-2" : "justify-start"
              )}
              onClick={handleLogout}
              title={isCollapsed ? "Logout" : undefined}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>Logout</span>}
            </Button>
          </div>
        </aside>

        {/* Side menu - Mobile */}
        {mobileMenuOpen && (
          <div 
            className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
          >
            <aside 
              className="w-64 h-full border-r bg-card shadow-lg animate-in slide-in-from-left duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-serif text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Thanvish AI
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      {user?.isGuest ? "Guest User" : user?.name || "User"}
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

              <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={active ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 transition-all duration-200",
                          active && "bg-secondary font-medium"
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="flex items-center gap-2">
                          {item.emoji && <span>{item.emoji}</span>}
                          <span>{item.label}</span>
                        </span>
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
        <main className={cn(
          "flex-1 overflow-y-auto transition-all duration-300",
          isCollapsed ? "lg:ml-0" : ""
        )}>
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

