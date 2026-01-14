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
import { Loader2, Search, Ban, CheckCircle, XCircle, Shield, User as UserIcon, CalendarIcon, Filter, X, Sparkles, GraduationCap, History, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
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
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired";
  subscriptionExpiresAt?: string;
  teacherSubscriptionRequired?: boolean;
  verifiedArtist?: boolean;
  verifiedDirector?: boolean;
  verifiedDoctor?: boolean;
  verifiedAstrologer?: boolean;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<"block" | "unblock" | "deactivate" | "activate" | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<"active" | "inactive" | "trial" | "expired">("inactive");
  const [trialDays, setTrialDays] = useState<number>(7);
  const [updatingSubscription, setUpdatingSubscription] = useState(false);

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

  const handleRoleChange = async (userId: string, newRole: string, requiresSubscription?: boolean) => {
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
        body: JSON.stringify({ 
          role: newRole,
          requiresSubscription: requiresSubscription !== undefined ? requiresSubscription : (newRole === "music_teacher" || newRole === "artist" || newRole === "music_director" || newRole === "doctor" || newRole === "astrologer" ? true : undefined), // Default to true for music_teacher, artist, music_director, doctor, and astrologer. Student is FREE.
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update user role");
      }

      const data = await response.json();

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? { 
                ...user, 
                role: newRole,
                teacherSubscriptionRequired: newRole === "music_teacher" ? (requiresSubscription !== false) : undefined,
                subscriptionStatus: (newRole === "music_teacher" || newRole === "artist" || newRole === "music_director" || newRole === "doctor" || newRole === "astrologer") && requiresSubscription !== false ? "inactive" : undefined,
              }
            : user
        )
      );

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      // If changing to music_teacher, artist, music_director, doctor, or astrologer and subscription is required, show subscription modal
      if ((newRole === "music_teacher" || newRole === "artist" || newRole === "music_director" || newRole === "doctor" || newRole === "astrologer") && requiresSubscription !== false) {
        const user = users.find(u => u.id === userId);
        if (user) {
          setSelectedUser({ ...user, role: newRole });
          setShowSubscriptionModal(true);
        }
      }
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

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    setUpdatingSubscription(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) throw new Error("Not authenticated");

      const response = await fetch(`/api/admin/users/${selectedUser.id}/subscription`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${sessionId}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          subscriptionStatus,
          trialDays: subscriptionStatus === "trial" ? trialDays : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMessage = data.error || `Failed to update subscription (${response.status})`;
        console.error("Subscription update error:", errorMessage, data);
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id
            ? { ...user, subscriptionStatus, subscriptionExpiresAt: data.subscriptionExpiresAt }
            : user
        )
      );

      toast({
        title: "Success",
        description: `Subscription status updated to ${subscriptionStatus}`,
      });

      setShowSubscriptionModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setUpdatingSubscription(false);
    }
  };

  const getRoleBadge = (role: string = "user") => {
    const roleConfig = {
      admin: { label: "Admin", variant: "default" as const, icon: Shield },
      moderator: { label: "Moderator", variant: "secondary" as const, icon: Shield },
      music_teacher: { label: "Music Teacher", variant: "default" as const, icon: UserIcon },
      artist: { label: "Artist", variant: "default" as const, icon: UserIcon },
      music_director: { label: "Music Director", variant: "default" as const, icon: UserIcon },
      doctor: { label: "Doctor", variant: "default" as const, icon: UserIcon },
      astrologer: { label: "Astrologer", variant: "default" as const, icon: Sparkles },
      student: { label: "Student", variant: "default" as const, icon: GraduationCap },
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
                      <SelectItem value="music_teacher">Music Teacher</SelectItem>
                      <SelectItem value="artist">Artist</SelectItem>
                      <SelectItem value="music_director">Music Director</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="astrologer">Astrologer</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
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
                  {users.some(u => u.role === "music_teacher" || u.role === "artist" || u.role === "music_director") && (
                    <TableHead>Subscription</TableHead>
                  )}
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
                          onValueChange={(value) => {
                            if (value === "music_teacher" || value === "artist" || value === "music_director" || value === "doctor" || value === "astrologer") {
                              // Show confirmation dialog for subscription requirement
                              const roleName = value === "music_teacher" ? "Music Teacher" : value === "artist" ? "Artist" : value === "music_director" ? "Music Director" : value === "doctor" ? "Doctor" : "Astrologer";
                              const requiresSubscription = window.confirm(
                                `Enable subscription requirement for ${roleName}? (Default: Yes)\n\n` +
                                "Click OK to require subscription (default).\n" +
                                "Click Cancel to allow free access."
                              );
                              handleRoleChange(user.id, value, requiresSubscription);
                            } else {
                              handleRoleChange(user.id, value);
                            }
                          }}
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
                            <SelectItem value="music_teacher">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Music Teacher
                              </div>
                            </SelectItem>
                            <SelectItem value="artist">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Artist
                              </div>
                            </SelectItem>
                            <SelectItem value="music_director">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Music Director
                              </div>
                            </SelectItem>
                            <SelectItem value="doctor">
                              <div className="flex items-center gap-2">
                                <UserIcon className="h-4 w-4" />
                                Doctor
                              </div>
                            </SelectItem>
                            <SelectItem value="astrologer">
                              <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Astrologer
                              </div>
                            </SelectItem>
                            <SelectItem value="student">
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4" />
                                Student
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {(user.role === "music_teacher" || user.role === "artist" || user.role === "music_director" || user.role === "doctor" || user.role === "astrologer") ? (
                          <div className="flex flex-col gap-1">
                            <Badge 
                              variant={user.subscriptionStatus === "active" ? "default" : user.subscriptionStatus === "trial" ? "secondary" : "outline"}
                              className="w-fit"
                            >
                              {user.subscriptionStatus || "inactive"}
                            </Badge>
                            {user.subscriptionExpiresAt && (
                              <span className="text-xs text-muted-foreground">
                                Expires: {format(new Date(user.subscriptionExpiresAt), "MMM d, yyyy")}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setSubscriptionStatus(user.subscriptionStatus || "inactive");
                                setShowSubscriptionModal(true);
                              }}
                              className="mt-1"
                            >
                              Manage Subscription
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
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

      {/* Subscription Management Modal */}
      <AlertDialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Manage Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Update subscription status for {selectedUser?.name} ({selectedUser?.email})
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Subscription Status</Label>
              <Select value={subscriptionStatus} onValueChange={(value: any) => setSubscriptionStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {subscriptionStatus === "trial" && (
              <div className="space-y-2">
                <Label>Trial Duration (days)</Label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={trialDays}
                  onChange={(e) => setTrialDays(parseInt(e.target.value) || 7)}
                />
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updatingSubscription}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUpdateSubscription} disabled={updatingSubscription}>
              {updatingSubscription ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Subscription"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
