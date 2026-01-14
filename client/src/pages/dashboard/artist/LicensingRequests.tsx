import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, CheckCircle, XCircle, DollarSign, Clock, Loader2 } from "lucide-react";
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

interface LicensingRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail?: string;
  usageType: string;
  territory: string;
  duration: string;
  offerAmount: string;
  rights: "exclusive" | "non-exclusive";
  trackId?: string;
  trackTitle?: string;
  status: "pending" | "approved" | "rejected" | "deal_closed" | "archived";
  artistId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function LicensingRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<LicensingRequest[]>([]);
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
        collection(db, "licensingRequests"),
        where("artistId", "==", user.id)
      );
      const querySnapshot = await getDocs(requestsQuery);
      const requestsData: LicensingRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        requestsData.push({
          id: doc.id,
          ...doc.data(),
        } as LicensingRequest);
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
      console.error("Error fetching licensing requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: "approved" | "rejected" | "deal_closed" | "archived") => {
    setUpdatingId(requestId);
    try {
      await updateDoc(doc(db, "licensingRequests", requestId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: `Request ${newStatus.replace("_", " ")} successfully`,
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
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "deal_closed":
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
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Licensing Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage commercial licensing requests for your tracks
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="deal_closed">Deal Closed</SelectItem>
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
              <p>No licensing requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{request.requesterName}</h3>
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status.replace("_", " ")}
                          </Badge>
                        </div>
                        {request.trackTitle && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Track: {request.trackTitle}
                          </p>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <div>
                            <span className="text-muted-foreground">Usage Type:</span> {request.usageType}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Territory:</span> {request.territory}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Duration:</span> {request.duration}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Rights:</span> {request.rights}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="flex items-center gap-1 font-semibold text-primary">
                            <DollarSign className="h-4 w-4" />
                            {request.offerAmount}
                          </span>
                          {request.createdAt && (
                            <span className="flex items-center gap-1 text-muted-foreground">
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
                              onClick={() => handleStatusUpdate(request.id, "approved")}
                              disabled={updatingId === request.id}
                            >
                              {updatingId === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
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
                        {request.status === "approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id, "deal_closed")}
                            disabled={updatingId === request.id}
                          >
                            {updatingId === request.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Mark Deal Closed"
                            )}
                          </Button>
                        )}
                        {(request.status === "deal_closed" || request.status === "rejected") && (
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
