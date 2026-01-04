import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, Ban, CheckCircle, XCircle, Shield, User as UserIcon } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
  isBlocked?: boolean;
  isActive?: boolean;
  createdAt?: string;
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

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            user.name.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

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
        // TODO: Replace with actual user data from Firebase Admin SDK
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
      // Set empty array on error
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
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            View and manage user accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
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

          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {users.length === 0 ? (
                <p>No users found. Firebase Admin SDK needs to be configured to fetch users.</p>
              ) : (
                <p>No users match your search query.</p>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
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
                        {getRoleBadge(user.role)}
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

