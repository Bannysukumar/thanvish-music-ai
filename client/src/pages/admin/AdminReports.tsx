import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Loader2, CheckCircle, XCircle, Ban, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Report {
  id: string;
  type: "content_abuse" | "copyright" | "harassment" | "misleading" | "other";
  reportedBy: string;
  reportedByEmail?: string;
  targetUserId?: string;
  targetContentId?: string;
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: string;
}

export default function AdminReports() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Placeholder - would fetch from API
      setReports([]);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReportTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
      content_abuse: "destructive",
      copyright: "destructive",
      harassment: "destructive",
      misleading: "secondary",
      other: "outline",
    };
    return variants[type] || "outline";
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pending: "default",
      reviewed: "secondary",
      resolved: "outline",
      dismissed: "outline",
    };
    return variants[status] || "outline";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports, Complaints & Safety</h1>
          <p className="text-muted-foreground mt-2">Loading reports...</p>
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
        <h1 className="text-3xl font-bold">Reports, Complaints & Safety</h1>
        <p className="text-muted-foreground mt-2">
          Handle all user reports, content abuse, copyright issues, and safety concerns
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({reports.filter(r => r.status === "pending").length})
          </TabsTrigger>
          <TabsTrigger value="reviewed">
            Reviewed ({reports.filter(r => r.status === "reviewed").length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({reports.filter(r => r.status === "resolved").length})
          </TabsTrigger>
          <TabsTrigger value="all">All Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reports</CardTitle>
              <CardDescription>
                Reports awaiting review and action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.filter(r => r.status === "pending").length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Reports</h3>
                  <p className="text-muted-foreground">
                    All reports have been reviewed
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports
                      .filter(r => r.status === "pending")
                      .map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant={getReportTypeBadge(report.type)}>
                              {report.type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.reportedByEmail || report.reportedBy}</TableCell>
                          <TableCell className="max-w-md truncate">
                            {report.description}
                          </TableCell>
                          <TableCell>
                            {format(new Date(report.createdAt), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                              <Button variant="outline" size="sm">
                                <Ban className="h-4 w-4 mr-1" />
                                Take Action
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reviewed Reports</CardTitle>
              <CardDescription>
                Reports that have been reviewed but not yet resolved
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.filter(r => r.status === "reviewed").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No reviewed reports</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Reviewed By</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports
                      .filter(r => r.status === "reviewed")
                      .map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant={getReportTypeBadge(report.type)}>
                              {report.type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.reportedByEmail || report.reportedBy}</TableCell>
                          <TableCell>{report.reviewedBy || "Admin"}</TableCell>
                          <TableCell>
                            {report.reviewedAt
                              ? format(new Date(report.reviewedAt), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(report.status)}>
                              {report.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Reports</CardTitle>
              <CardDescription>
                Reports that have been resolved or dismissed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.filter(r => r.status === "resolved" || r.status === "dismissed").length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No resolved reports</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Action Taken</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports
                      .filter(r => r.status === "resolved" || r.status === "dismissed")
                      .map((report) => (
                        <TableRow key={report.id}>
                          <TableCell>
                            <Badge variant={getReportTypeBadge(report.type)}>
                              {report.type.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{report.reportedByEmail || report.reportedBy}</TableCell>
                          <TableCell>{report.action || "—"}</TableCell>
                          <TableCell>
                            {report.reviewedAt
                              ? format(new Date(report.reviewedAt), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadge(report.status)}>
                              {report.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Reports</CardTitle>
              <CardDescription>
                Complete history of all user reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports</h3>
                  <p className="text-muted-foreground">
                    User reports will appear here
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Reported By</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <Badge variant={getReportTypeBadge(report.type)}>
                            {report.type.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.reportedByEmail || report.reportedBy}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {report.description}
                        </TableCell>
                        <TableCell>
                          {format(new Date(report.createdAt), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadge(report.status)}>
                            {report.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>User Action History</CardTitle>
          <CardDescription>
            View action history per user (warnings, suspensions, content removals)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Action Log</h3>
            <p className="text-muted-foreground">
              User action history tracking coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

