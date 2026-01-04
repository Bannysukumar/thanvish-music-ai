import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Ban, CheckCircle, XCircle, Shield, User as UserIcon, CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  isBlocked?: boolean;
  isActive?: boolean;
  createdAt?: string;
  lastSignIn?: string;
  emailVerified?: boolean;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"block" | "unblock" | "deactivate" | "activate" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Filter states
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState<string>("all");
  const [createdDateFrom, setCreatedDateFrom] = useState<Date | undefined>(undefined);
  const [createdDateTo, setCreatedDateTo] = useState<Date | undefined>(undefined);
  const [lastSignInDateFrom, setLastSignInDateFrom] = useState<Date | undefined>(undefined);
  const [lastSignInDateTo, setLastSignInDateTo] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply filters whenever any filter changes
  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(query) ||
          user.name.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => (user.role || "user") === roleFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((user) => !user.isBlocked && user.isActive !== false);
      } else if (statusFilter === "blocked") {
        filtered = filtered.filter((user) => user.isBlocked === true);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((user) => user.isActive === false);
      }
    }

    // Email verified filter
    if (emailVerifiedFilter !== "all") {
      const isVerified = emailVerifiedFilter === "verified";
      filtered = filtered.filter((user) => user.emailVerified === isVerified);
    }

    // Created date filter
    if (createdDateFrom) {
      const fromDate = new Date(createdDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((user) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        userDate.setHours(0, 0, 0, 0);
        return userDate >= fromDate;
      });
    }

    if (createdDateTo) {
      const toDate = new Date(createdDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((user) => {
        if (!user.createdAt) return false;
        const userDate = new Date(user.createdAt);
        return userDate <= toDate;
      });
    }

    // Last sign in date filter
    if (lastSignInDateFrom) {
      const fromDate = new Date(lastSignInDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((user) => {
        if (!user.lastSignIn) return false;
        const userDate = new Date(user.lastSignIn);
        userDate.setHours(0, 0, 0, 0);
        return userDate >= fromDate;
      });
    }

    if (lastSignInDateTo) {
      const toDate = new Date(lastSignInDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((user) => {
        if (!user.lastSignIn) return false;
        const userDate = new Date(user.lastSignIn);
        return userDate <= toDate;
      });
    }

    setFilteredUsers(filtered);
  }, [searchQuery, users, roleFilter, statusFilter, emailVerifiedFilter, createdDateFrom, createdDateTo, lastSignInDateFrom, lastSignInDateTo]);

  const clearAllFilters = () => {
    setRoleFilter("all");
    setStatusFilter("all");
    setEmailVerifiedFilter("all");
    setCreatedDateFrom(undefined);
    setCreatedDateTo(undefined);
    setLastSignInDateFrom(undefined);
    setLastSignInDateTo(undefined);
    setSearchQuery("");
  };

  const hasActiveFilters = () => {
    return (
      roleFilter !== "all" ||
      statusFilter !== "all" ||
      emailVerifiedFilter !== "all" ||
      createdDateFrom !== undefined ||
      createdDateTo !== undefined ||
      lastSignInDateFrom !== undefined ||
      lastSignInDateTo !== undefined ||
      searchQuery.trim() !== ""
    );
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        throw new Error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Firebase Admin SDK needs to be configured.",
        variant: "destructive",
      });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!actionUser || !actionType) return;

    setIsActionLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) throw new Error("Not authenticated");

      const isBlocked = actionType === "block" || (actionType === "unblock" ? false : actionUser.isBlocked);
      const isActive = actionType === "activate" || (actionType === "deactivate" ? false : actionUser.isActive);

      const response = await fetch(`/api/admin/users/${actionUser.id}/status`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isBlocked, isActive }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === actionUser.id
            ? { ...user, isBlocked, isActive }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User ${actionType === "block" ? "blocked" : actionType === "unblock" ? "unblocked" : actionType === "deactivate" ? "deactivated" : "activated"} successfully`,
      });

      setActionUser(null);
      setActionType(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user status",
        variant: "destructive",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) throw new Error("Not authenticated");

      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user role");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { ...user, role: newRole }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update user role",
        variant: "destructive",
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const getRoleBadge = (role: string = "user") => {
    const roleConfig = {
      admin: { label: "Admin", variant: "default" as const, icon: Shield },
      moderator: { label: "Moderator", variant: "secondary" as const, icon: Shield },
      user: { label: "User", variant: "outline" as const, icon: UserIcon },
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.user;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-2">
          Manage all registered users
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                View and manage user accounts ({filteredUsers.length} of {users.length} users)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {hasActiveFilters() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by email or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="mb-6 p-4 border rounded-lg bg-muted/50 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Role Filter */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="blocked">Blocked</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Verified Filter */}
                <div className="space-y-2">
                  <Label>Email Verified</Label>
                  <Select value={emailVerifiedFilter} onValueChange={setEmailVerifiedFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="not-verified">Not Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Created Date From */}
                <div className="space-y-2">
                  <Label>Created Date (From)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !createdDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createdDateFrom ? format(createdDateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={createdDateFrom}
                        onSelect={setCreatedDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Created Date To */}
                <div className="space-y-2">
                  <Label>Created Date (To)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !createdDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {createdDateTo ? format(createdDateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={createdDateTo}
                        onSelect={setCreatedDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Last Sign In Date From */}
                <div className="space-y-2">
                  <Label>Last Sign In (From)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !lastSignInDateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {lastSignInDateFrom ? format(lastSignInDateFrom, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={lastSignInDateFrom}
                        onSelect={setLastSignInDateFrom}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Last Sign In Date To */}
                <div className="space-y-2">
                  <Label>Last Sign In (To)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !lastSignInDateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {lastSignInDateTo ? format(lastSignInDateTo, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={lastSignInDateTo}
                        onSelect={setLastSignInDateTo}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0 ? (
                <p>No users found. Firebase Admin SDK needs to be configured to fetch users.</p>
              ) : (
                <p>No users match your filters.</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.email}
                          {user.emailVerified && (
                            <Badge variant="outline" className="text-xs">Verified</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.role || "user"}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updatingRole === user.id}
                        >
                          <SelectTrigger className="w-[140px]">
                            {updatingRole === user.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                User
                              </div>
                            </SelectItem>
                            <SelectItem value="moderator">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Moderator
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Admin
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          {user.isBlocked ? (
                            <Badge variant="destructive">Blocked</Badge>
                          ) : (
                            <Badge variant="default">Active</Badge>
                          )}
                          {user.isActive === false && (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastSignIn ? format(new Date(user.lastSignIn), "MMM d, yyyy") : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {user.isBlocked ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionUser(user);
                                setActionType("unblock");
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Unblock
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionUser(user);
                                setActionType("block");
                              }}
                            >
                              <Ban className="h-4 w-4 mr-1" />
                              Block
                            </Button>
                          )}
                          {user.isActive === false ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionUser(user);
                                setActionType("activate");
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Activate
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActionUser(user);
                                setActionType("deactivate");
                              }}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!actionUser && !!actionType} onOpenChange={(open) => {
        if (!open) {
          setActionUser(null);
          setActionType(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "block" && "Block User"}
              {actionType === "unblock" && "Unblock User"}
              {actionType === "deactivate" && "Deactivate User"}
              {actionType === "activate" && "Activate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType} {actionUser?.name} ({actionUser?.email})?
              {actionType === "block" && " This will prevent them from accessing the platform."}
              {actionType === "deactivate" && " This will deactivate their account."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} disabled={isActionLoading}>
              {isActionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
