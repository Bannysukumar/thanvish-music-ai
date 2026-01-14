import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Loader2, User, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  oldRole?: string;
  newRole: string;
  changedBy: string;
  changedByEmail?: string;
  changedAt: string;
  requiresSubscription?: boolean;
}

export default function AdminAuditLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("all");

  useEffect(() => {
    fetchAuditLogs();
  }, [roleFilter]);

  const fetchAuditLogs = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const url = roleFilter !== "all"
        ? `/api/admin/audit-logs?role=${roleFilter}`
        : "/api/admin/audit-logs";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch audit logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAuditLogs = () => {
    const csvHeaders = ["Timestamp", "User", "User Email", "Old Role", "New Role", "Changed By", "Changed By Email", "Subscription Required"];
    const csvRows = logs.map(log => [
      log.changedAt ? format(new Date(log.changedAt), "yyyy-MM-dd HH:mm:ss") : "",
      log.userId || "",
      log.userEmail || "",
      log.oldRole || "",
      log.newRole,
      log.changedBy || "",
      log.changedByEmail || "",
      log.requiresSubscription ? "Yes" : "No",
    ]);

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Exported",
      description: "Audit logs exported to CSV",
    });
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "music_teacher":
        return "default";
      case "artist":
        return "secondary";
      case "music_director":
        return "outline";
      case "doctor":
        return "default";
      case "astrologer":
        return "secondary";
      case "student":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Role Audit Logs</h1>
          <p className="text-muted-foreground mt-2">Loading audit logs...</p>
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
          <h1 className="text-3xl font-bold">Role Audit Logs</h1>
          <p className="text-muted-foreground mt-2">
            View complete history of role changes across the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={exportAuditLogs}
            disabled={logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="student">Student</option>
            <option value="music_teacher">Music Teacher</option>
            <option value="artist">Artist</option>
            <option value="music_director">Music Director</option>
            <option value="doctor">Doctor</option>
            <option value="astrologer">Astrologer</option>
            <option value="admin">Admin</option>
            <option value="moderator">Moderator</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Role Change History</CardTitle>
          <CardDescription>
            Complete audit trail of all role assignments and changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Audit Logs</h3>
              <p className="text-muted-foreground">
                Role change history will appear here
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Old Role</TableHead>
                  <TableHead>New Role</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Subscription</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.changedAt
                        ? format(new Date(log.changedAt), "MMM dd, yyyy HH:mm:ss")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{log.userEmail || log.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.oldRole ? (
                        <Badge variant={getRoleBadgeVariant(log.oldRole)}>
                          {log.oldRole.replace("_", " ")}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(log.newRole)}>
                        {log.newRole.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.changedByEmail || log.changedBy}</span>
                    </TableCell>
                    <TableCell>
                      {log.requiresSubscription !== undefined ? (
                        <Badge variant={log.requiresSubscription ? "default" : "outline"}>
                          {log.requiresSubscription ? "Required" : "Not Required"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

