import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface SecurityLog {
  id: string;
  actionType: string;
  userId?: string;
  userEmail?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export default function AdminSecurity() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionTypeFilter, setActionTypeFilter] = useState<string>("all");

  useEffect(() => {
    fetchSecurityLogs();
  }, [actionTypeFilter]);

  const fetchSecurityLogs = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      const url = actionTypeFilter !== "all"
        ? `/api/admin/security-logs?actionType=${actionTypeFilter}`
        : "/api/admin/security-logs";

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch security logs");

      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch security logs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security & Logging</h1>
          <p className="text-muted-foreground mt-2">Loading security logs...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Logging</h1>
        <p className="text-muted-foreground mt-2">
          View security logs, login history, and manage access control
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Security Logs</CardTitle>
              <CardDescription>
                View login history, role changes, subscription changes, and critical system actions
              </CardDescription>
            </div>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="role_change">Role Change</option>
              <option value="subscription_change">Subscription Change</option>
              <option value="content_approval">Content Approval</option>
              <option value="user_suspension">User Suspension</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Security Logs</h3>
              <p className="text-muted-foreground">
                Security logs will appear here as actions are performed
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>IP Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.timestamp
                        ? format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.actionType}</Badge>
                    </TableCell>
                    <TableCell>
                      {log.userEmail || log.userId || "System"}
                    </TableCell>
                    <TableCell className="max-w-md truncate">
                      {log.details || "—"}
                    </TableCell>
                    <TableCell>
                      {log.ipAddress || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Control</CardTitle>
          <CardDescription>
            Force logout users, reset access, and lock suspicious accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Management</h3>
            <p className="text-muted-foreground">
              Access control tools coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

