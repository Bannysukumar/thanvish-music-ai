import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  GripVertical,
  Menu as MenuIcon,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  path: string;
  label: string;
  icon?: string;
  emoji?: string;
  enabled: boolean;
  order: number;
}

interface RoleMenuConfig {
  role: string;
  menuItems: MenuItem[];
}

const availableMenuItems: Record<string, Omit<MenuItem, "enabled" | "order">[]> = {
  base: [
    { path: "/dashboard", label: "Home", icon: "Home" },
    { path: "/dashboard/generate", label: "Generate", icon: "Sparkles" },
    { path: "/dashboard/library", label: "My Library", icon: "Library" },
    { path: "/dashboard/horoscope", label: "Horoscope Profile", icon: "Star", emoji: "🔮" },
    { path: "/dashboard/music-therapy", label: "Music Therapy", icon: "Music", emoji: "🎵" },
    { path: "/dashboard/profile", label: "Profile", icon: "User" },
    { path: "/dashboard/upgrade", label: "Upgrade", icon: "Crown" },
  ],
  music_teacher: [
    { path: "/dashboard/teacher", label: "Teacher Dashboard", icon: "GraduationCap" },
    { path: "/dashboard/teacher/courses", label: "Course Builder", icon: "BookOpen" },
    { path: "/dashboard/teacher/lessons", label: "My Lessons", icon: "Library" },
    { path: "/dashboard/teacher/students", label: "My Students", icon: "Users" },
    { path: "/dashboard/teacher/earnings", label: "Earnings", icon: "DollarSign" },
    { path: "/dashboard/teacher/settings", label: "Teacher Settings", icon: "Settings" },
  ],
  artist: [
    { path: "/dashboard/artist", label: "Artist Dashboard", icon: "Music2" },
    { path: "/dashboard/artist/library", label: "My Library", icon: "Library" },
    { path: "/dashboard/artist/upload", label: "Upload Track", icon: "Upload" },
    { path: "/dashboard/artist/albums", label: "Albums", icon: "Disc" },
    { path: "/dashboard/artist/requests", label: "Collaboration Requests", icon: "FileText" },
    { path: "/dashboard/artist/licensing", label: "Licensing Requests", icon: "FileText" },
    { path: "/dashboard/artist/analytics", label: "Analytics", icon: "BarChart3" },
    { path: "/dashboard/artist/settings", label: "Artist Settings", icon: "Settings" },
  ],
  music_director: [
    { path: "/dashboard/director", label: "Director Dashboard", icon: "Film" },
    { path: "/dashboard/director/projects", label: "Projects", icon: "FolderOpen" },
    { path: "/dashboard/director/discovery", label: "Artist Discovery", icon: "Search" },
    { path: "/dashboard/director/shortlists", label: "Shortlists", icon: "Star" },
    { path: "/dashboard/director/requests", label: "Requests", icon: "FileText" },
    { path: "/dashboard/director/approvals", label: "Deliveries / Approvals", icon: "CheckCircle" },
    { path: "/dashboard/director/settings", label: "Director Settings", icon: "Settings" },
    { path: "/dashboard/director/analytics", label: "Analytics", icon: "BarChart3" },
  ],
  doctor: [
    { path: "/dashboard/doctor", label: "Doctor Dashboard", icon: "Stethoscope" },
    { path: "/dashboard/doctor/programs", label: "Therapy Programs", icon: "Heart" },
    { path: "/dashboard/doctor/templates", label: "Session Templates", icon: "FileEdit" },
    { path: "/dashboard/doctor/articles", label: "Guidance Articles", icon: "BookOpen" },
    { path: "/dashboard/doctor/analytics", label: "Outcomes Analytics", icon: "BarChart3" },
    { path: "/dashboard/doctor/settings", label: "Doctor Settings", icon: "Settings" },
  ],
  astrologer: [
    { path: "/dashboard/astrologer", label: "Astrologer Dashboard", icon: "Sparkles" },
    { path: "/dashboard/astrologer/templates", label: "Create Template", icon: "FileEdit" },
    { path: "/dashboard/astrologer/recommendations", label: "Create Rasi Set", icon: "Star" },
    { path: "/dashboard/astrologer/posts", label: "Publish Post", icon: "BookOpen" },
    { path: "/dashboard/astrologer/clients", label: "My Clients", icon: "Users" },
    { path: "/dashboard/astrologer/readings", label: "Readings", icon: "BookOpen" },
    { path: "/dashboard/astrologer/settings", label: "Astrologer Settings", icon: "Settings" },
  ],
  student: [
    { path: "/dashboard/student", label: "Student Dashboard", icon: "GraduationCap" },
    { path: "/dashboard/student/courses", label: "My Courses", icon: "BookOpen" },
    { path: "/dashboard/student/lessons", label: "My Lessons", icon: "Library" },
    { path: "/dashboard/student/progress", label: "Progress", icon: "BarChart3" },
  ],
};

const roles = [
  { value: "user", label: "User" },
  { value: "student", label: "Student" },
  { value: "music_teacher", label: "Music Teacher" },
  { value: "artist", label: "Artist" },
  { value: "music_director", label: "Music Director" },
  { value: "doctor", label: "Doctor" },
  { value: "astrologer", label: "Astrologer" },
];

export default function AdminRoleMenuManagement() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<RoleMenuConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({
    path: "",
    label: "",
    icon: "",
    emoji: "",
  });

  // Get all unique menu items across all roles
  const getAllMenuItems = (): Array<Omit<MenuItem, "enabled" | "order"> & { roles: string[] }> => {
    const itemMap = new Map<string, { item: Omit<MenuItem, "enabled" | "order">; roles: string[] }>();
    
    // Add base items to all roles
    availableMenuItems.base?.forEach(item => {
      itemMap.set(item.path, { item, roles: roles.map(r => r.value) });
    });
    
    // Add role-specific items
    roles.forEach(role => {
      const roleItems = availableMenuItems[role.value] || [];
      roleItems.forEach(item => {
        const existing = itemMap.get(item.path);
        if (existing) {
          existing.roles.push(role.value);
        } else {
          itemMap.set(item.path, { item, roles: [role.value] });
        }
      });
    });
    
    return Array.from(itemMap.values()).map(({ item, roles }) => ({
      ...item,
      roles: [...new Set(roles)].sort(),
    }));
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Initialize defaults if configs are empty after loading
  useEffect(() => {
    if (!isLoading && configs.length === 0) {
      initializeDefaultConfigs();
    }
  }, [isLoading, configs.length]);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) throw new Error("Not authenticated");

      const response = await fetch("/api/admin/role-menu-configs", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("text/html")) {
          throw new Error("Server returned HTML instead of JSON. Please check if the server is running and the API endpoint exists.");
        }
        throw new Error(`Failed to fetch menu configurations: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned non-JSON response");
      }

      const data = await response.json();
      const fetchedConfigs = data.configs || [];
      
      // Ensure all roles have configs, even if empty
      const allRoleConfigs = roles.map(role => {
        const existing = fetchedConfigs.find((c: RoleMenuConfig) => c.role === role.value);
        if (existing) {
          return existing;
        }
        // Return empty config for roles that don't have one
        return {
          role: role.value,
          menuItems: [],
        };
      });
      
      setConfigs(allRoleConfigs);
    } catch (error: any) {
      console.error("Error fetching configs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to load menu configurations. Using default configuration.",
        variant: "destructive",
      });
      // Initialize with default configs if fetch fails
      initializeDefaultConfigs();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeDefaultConfigs = () => {
    const defaultConfigs: RoleMenuConfig[] = roles.map((role) => {
      const roleSpecificItems = availableMenuItems[role.value] || [];
      const baseItems = availableMenuItems.base || [];
      
      let menuItems: MenuItem[] = [];
      
      if (role.value === "user") {
        menuItems = baseItems.map((item, index) => ({
          ...item,
          enabled: true,
          order: index,
        }));
      } else {
        // Combine role-specific items with base items
        const allItems = [
          ...roleSpecificItems.map((item, index) => ({
            ...item,
            enabled: true,
            order: index,
          })),
          ...baseItems.map((item, index) => ({
            ...item,
            enabled: true,
            order: roleSpecificItems.length + index,
          })),
        ];
        menuItems = allItems;
      }

      return {
        role: role.value,
        menuItems,
      };
    });
    setConfigs(defaultConfigs);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) throw new Error("Not authenticated");

      // Save all configs
      for (const config of configs) {
        const response = await fetch(`/api/admin/role-menu-configs/${config.role}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${sessionId}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ menuItems: config.menuItems }),
        });

        if (!response.ok) {
          throw new Error(`Failed to save config for ${config.role}`);
        }
      }

      toast({
        title: "Success",
        description: "Menu configurations saved successfully",
      });
    } catch (error) {
      console.error("Error saving configs:", error);
      toast({
        title: "Error",
        description: "Failed to save menu configurations",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleItem = (role: string, itemPath: string) => {
    setConfigs((prev) =>
      prev.map((config) => {
        if (config.role === role) {
          return {
            ...config,
            menuItems: config.menuItems.map((item) =>
              item.path === itemPath
                ? { ...item, enabled: !item.enabled }
                : item
            ),
          };
        }
        return config;
      })
    );
  };

  const handleAddCustomItem = (role: string) => {
    if (!newMenuItem.path || !newMenuItem.label) {
      toast({
        title: "Error",
        description: "Path and label are required",
        variant: "destructive",
      });
      return;
    }

    setConfigs((prev) =>
      prev.map((config) => {
        if (config.role === role) {
          const maxOrder = Math.max(
            ...config.menuItems.map((item) => item.order),
            -1
          );
          return {
            ...config,
            menuItems: [
              ...config.menuItems,
              {
                ...newMenuItem,
                enabled: true,
                order: maxOrder + 1,
              },
            ],
          };
        }
        return config;
      })
    );

    setNewMenuItem({ path: "", label: "", icon: "", emoji: "" });
    setShowAddDialog(false);
  };

  const handleRemoveItem = (role: string, itemPath: string) => {
    setConfigs((prev) =>
      prev.map((config) => {
        if (config.role === role) {
          return {
            ...config,
            menuItems: config.menuItems.filter((item) => item.path !== itemPath),
          };
        }
        return config;
      })
    );
  };

  const handleMoveItem = (role: string, itemPath: string, direction: "up" | "down") => {
    setConfigs((prev) =>
      prev.map((config) => {
        if (config.role === role) {
          const items = [...config.menuItems];
          const index = items.findIndex((item) => item.path === itemPath);
          if (index === -1) return config;

          const newIndex = direction === "up" ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= items.length) return config;

          // Swap orders
          const tempOrder = items[index].order;
          items[index].order = items[newIndex].order;
          items[newIndex].order = tempOrder;

          // Swap items
          [items[index], items[newIndex]] = [items[newIndex], items[index]];

          return {
            ...config,
            menuItems: items,
          };
        }
        return config;
      })
    );
  };

  const getRoleConfig = (role: string) => {
    return configs.find((c) => c.role === role);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Role Menu Management</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Get all menu items with their role associations
  const getAllMenuItemsWithStatus = () => {
    const allItems = getAllMenuItems();
    return allItems.map(item => {
      const roleStatuses = roles.map(role => {
        const config = getRoleConfig(role.value);
        const menuItem = config?.menuItems.find(mi => mi.path === item.path);
        return {
          role: role.value,
          roleLabel: role.label,
          enabled: menuItem?.enabled ?? false,
          order: menuItem?.order ?? -1,
        };
      });
      return {
        ...item,
        roleStatuses,
      };
    });
  };

  const handleToggleItemForRole = (role: string, itemPath: string, currentEnabled: boolean) => {
    console.log("Toggle item:", { role, itemPath, currentEnabled });
    
    setConfigs((prev) => {
      // Find the item template from availableMenuItems
      let itemTemplate: Omit<MenuItem, "enabled" | "order"> | null = null;
      
      // Check base items first
      const baseItem = availableMenuItems.base?.find(item => item.path === itemPath);
      if (baseItem) {
        itemTemplate = baseItem;
      } else {
        // Check role-specific items
        const roleItem = availableMenuItems[role]?.find(item => item.path === itemPath);
        if (roleItem) {
          itemTemplate = roleItem;
        }
      }

      if (!itemTemplate) {
        console.warn("Item template not found for:", itemPath);
        return prev;
      }

      // Update the config
      const updated = prev.map((config) => {
        if (config.role === role) {
          const existingItem = config.menuItems.find(item => item.path === itemPath);
          
          if (existingItem) {
            // Item exists, just toggle it
            console.log("Toggling existing item:", existingItem);
            return {
              ...config,
              menuItems: config.menuItems.map((item) =>
                item.path === itemPath
                  ? { ...item, enabled: !item.enabled }
                  : item
              ),
            };
          } else {
            // Item doesn't exist, add it
            const maxOrder = Math.max(
              ...config.menuItems.map((item) => item.order),
              -1
            );
            console.log("Adding new item:", itemTemplate);
            return {
              ...config,
              menuItems: [
                ...config.menuItems,
                {
                  ...itemTemplate,
                  enabled: true,
                  order: maxOrder + 1,
                },
              ],
            };
          }
        }
        return config;
      });

      // Ensure all roles have configs
      const allRolesHaveConfigs = roles.every(roleObj => 
        updated.some(c => c.role === roleObj.value)
      );

      if (!allRolesHaveConfigs) {
        // Add missing role configs
        roles.forEach(roleObj => {
          if (!updated.some(c => c.role === roleObj.value)) {
            updated.push({
              role: roleObj.value,
              menuItems: [],
            });
          }
        });
      }

      console.log("Updated configs:", updated);
      return updated;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Menu Management</h1>
          <p className="text-muted-foreground mt-2">
            Enable or disable side menu items for each user role. All available menu items are shown below.
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
              Save All Changes
            </>
          )}
        </Button>
      </div>

      {/* All Menu Items View */}
      <Card>
        <CardHeader>
          <CardTitle>All Available Menu Items</CardTitle>
          <CardDescription>
            Toggle menu items on/off for each role. Items are shown in the dashboard sidebar for enabled roles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {getAllMenuItemsWithStatus().map((item) => (
              <div
                key={item.path}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.emoji && <span className="text-xl">{item.emoji}</span>}
                      <h3 className="font-semibold text-lg">{item.label}</h3>
                      <Badge variant="outline" className="ml-2">
                        {item.icon || "No Icon"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-mono">{item.path}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-muted-foreground">Appears in:</span>
                      {item.roles.map(roleValue => {
                        const role = roles.find(r => r.value === roleValue);
                        return (
                          <Badge key={roleValue} variant="secondary" className="text-xs">
                            {role?.label || roleValue}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Role Toggles */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {roles.map((role) => {
                      const status = item.roleStatuses.find(rs => rs.role === role.value);
                      const isEnabled = status?.enabled ?? false;
                      const isAvailable = item.roles.includes(role.value);
                      
                      return (
                        <div
                          key={role.value}
                          className={cn(
                            "flex items-center justify-between p-3 border rounded-lg",
                            !isAvailable && "opacity-50 bg-muted"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <Label
                              htmlFor={`${item.path}-${role.value}`}
                              className="text-sm font-medium cursor-pointer block truncate"
                              title={role.label}
                            >
                              {role.label}
                            </Label>
                          </div>
                          <Switch
                            id={`${item.path}-${role.value}`}
                            checked={isEnabled}
                            disabled={!isAvailable}
                            onCheckedChange={() => {
                              handleToggleItemForRole(role.value, item.path);
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role-Specific Configuration (Collapsible) */}
      <Card>
        <CardHeader>
          <CardTitle>Role-Specific Menu Ordering</CardTitle>
          <CardDescription>
            Configure the order of menu items for each role. Items can be reordered within each role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {roles.map((role) => {
              const config = getRoleConfig(role.value);
              const menuItems = config?.menuItems.filter(item => item.enabled).sort((a, b) => a.order - b.order) || [];

              return (
                <div key={role.value} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{role.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {menuItems.length} enabled items
                      </p>
                    </div>
                  </div>
                  
                  {menuItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No menu items enabled for this role
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {menuItems.map((item, index) => (
                        <div
                          key={item.path}
                          className="flex items-center gap-3 p-2 border rounded"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 flex items-center gap-2">
                            {item.emoji && <span>{item.emoji}</span>}
                            <span className="text-sm font-medium">{item.label}</span>
                            <span className="text-xs text-muted-foreground">({item.path})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleMoveItem(role.value, item.path, "up")
                              }
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() =>
                                handleMoveItem(role.value, item.path, "down")
                              }
                              disabled={index === menuItems.length - 1}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

