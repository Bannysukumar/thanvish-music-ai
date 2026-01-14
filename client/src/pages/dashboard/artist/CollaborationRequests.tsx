import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, MessageSquare, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CollaborationRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  projectTitle: string;
  description: string;
  role: string;
  budgetRange?: string;
  deadline?: string;
  attachments?: string[];
  status: "pending" | "accepted" | "rejected" | "completed" | "archived";
  artistId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function CollaborationRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<CollaborationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "artist") {
      fetchRequests();
    }
  }, [user, statusFilter]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const requestsQuery = query(
        collection(db, "collaborationRequests"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData: CollaborationRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
        } as CollaborationRequest);
      });

      // Sort by creation date (newest first)
      requestsData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Apply status filter
      const filtered = statusFilter === "all"
        ? requestsData
        : requestsData.filter((req) => req.status === statusFilter);

      setRequests(filtered);
    } catch (error) {
      console.error("Error fetching collaboration requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: "accepted" | "rejected" | "completed" | "archived") => {
    setUpdatingId(requestId);
    try {
      await updateDoc(doc(db, "collaborationRequests", requestId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: `Request ${newStatus} successfully`,
      });

      fetchRequests();
    } catch (error) {
      console.error("Error updating request status:", error);
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
        return "secondary";
      case "archived":
        return "outline";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Collaboration Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage collaboration requests from music directors and other artists
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Incoming Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? "s" : ""}
            {pendingCount > 0 && ` (${pendingCount} pending)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No collaboration requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.projectTitle}</h3>
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: {request.requesterName}
                          {request.requesterEmail && ` (${request.requesterEmail})`}
                        </p>
                        <p className="text-sm mb-2">{request.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            Role: {request.role}
                          </span>
                          {request.budgetRange && (
                            <span>Budget: {request.budgetRange}</span>
                          )}
                          {request.deadline && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Deadline: {new Date(request.deadline).toLocaleDateString()}
                            </span>
                          )}
                          {request.createdAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {request.createdAt.toDate?.().toLocaleDateString() || "Recently"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {request.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(request.id, "accepted")}
                              disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(request.id, "rejected")}
                              disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </>
                              )}
                            </Button>
                          </>
                        )}
                        {request.status === "accepted" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, "completed")}
                            disabled={updatingId === request.id}
                          >
                            {updatingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Mark Completed"
                            )}
                          </Button>
                        )}
                        {(request.status === "completed" || request.status === "rejected") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, "archived")}
                            disabled={updatingId === request.id}
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
