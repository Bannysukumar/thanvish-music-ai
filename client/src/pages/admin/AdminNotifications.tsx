import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Bell, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  targetType: "all" | "role" | "user";
  targetRole?: string;
  targetUserId?: string;
  scheduledFor?: string;
  sent: boolean;
  createdAt: string;
}

export default function AdminNotifications() {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    targetType: "all" as "all" | "role" | "user",
    targetRole: "",
    targetUserId: "",
    scheduledFor: "",
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const response = await fetch("/api/admin/notifications", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch notifications");

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNotification = async () => {
    try {
      if (!formData.title || !formData.message) {
        toast({
          title: "Error",
          description: "Title and message are required",
          variant: "destructive",
        });
        return;
      }

      if (formData.targetType === "role" && !formData.targetRole) {
        toast({
          title: "Error",
          description: "Target role is required",
          variant: "destructive",
        });
        return;
      }

      if (formData.targetType === "user" && !formData.targetUserId) {
        toast({
          title: "Error",
          description: "Target user ID is required",
          variant: "destructive",
        });
        return;
      }

      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      setIsSaving(true);

      const response = await fetch("/api/admin/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          title: formData.title,
          message: formData.message,
          targetType: formData.targetType,
          targetRole: formData.targetType === "role" ? formData.targetRole : undefined,
          targetUserId: formData.targetType === "user" ? formData.targetUserId : undefined,
          scheduledFor: formData.scheduledFor || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create notification");
      }

      toast({
        title: "Success",
        description: "Notification created successfully",
      });

      setShowCreateModal(false);
      setFormData({
        title: "",
        message: "",
        targetType: "all",
        targetRole: "",
        targetUserId: "",
        scheduledFor: "",
      });
      fetchNotifications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create notification",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications & Communication</h1>
          <p className="text-muted-foreground mt-2">Loading notifications...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications & Communication</h1>
          <p className="text-muted-foreground mt-2">
            Send platform-wide announcements and targeted notifications
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Notification
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>
            Send announcements to all users, specific roles, or individual users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
              <p className="text-muted-foreground mb-4">
                Create your first notification to get started
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Notification
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="font-medium">{notification.title}</TableCell>
                    <TableCell>
                      {notification.targetType === "all" ? (
                        <Badge variant="default">All Users</Badge>
                      ) : notification.targetType === "role" ? (
                        <Badge variant="secondary">{notification.targetRole}</Badge>
                      ) : (
                        <Badge variant="outline">User: {notification.targetUserId}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.sent ? "default" : "outline"}>
                        {notification.sent ? "Sent" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {notification.createdAt
                        ? format(new Date(notification.createdAt), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {notification.scheduledFor
                        ? format(new Date(notification.scheduledFor), "MMM dd, yyyy HH:mm")
                        : "Immediate"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Notification Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Notification</DialogTitle>
            <DialogDescription>
              Send announcements to users, roles, or all users
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Notification title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Notification message"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetType">Target Audience *</Label>
              <select
                id="targetType"
                value={formData.targetType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    targetType: e.target.value as "all" | "role" | "user",
                  })
                }
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="all">All Users</option>
                <option value="role">Specific Role</option>
                <option value="user">Specific User</option>
              </select>
            </div>

            {formData.targetType === "role" && (
              <div className="space-y-2">
                <Label htmlFor="targetRole">Target Role *</Label>
                <select
                  id="targetRole"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Select role</option>
                  <option value="student">Student</option>
                  <option value="music_teacher">Music Teacher</option>
                  <option value="artist">Artist</option>
                  <option value="music_director">Music Director</option>
                  <option value="doctor">Doctor</option>
                  <option value="astrologer">Astrologer</option>
                </select>
              </div>
            )}

            {formData.targetType === "user" && (
              <div className="space-y-2">
                <Label htmlFor="targetUserId">User ID *</Label>
                <Input
                  id="targetUserId"
                  value={formData.targetUserId}
                  onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                  placeholder="Enter user ID"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Schedule For (Optional)</Label>
              <Input
                id="scheduledFor"
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to send immediately
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreateNotification} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

