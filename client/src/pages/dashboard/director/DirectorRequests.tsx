import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, MessageSquare, Clock, Loader2, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface Request {
  id: string;
  type: "collaboration" | "licensing";
  artistId: string;
  artistName: string;
  projectTitle?: string;
  trackTitle?: string;
  status: string;
  createdAt?: any;
}

export default function DirectorRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const isLocked = user?.subscriptionStatus !== "active" && user?.subscriptionStatus !== "trial";

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchRequests();
    }
  }, [user, typeFilter, statusFilter]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const allRequests: Request[] = [];

      // Fetch collaboration requests
      if (typeFilter === "all" || typeFilter === "collaboration") {
        const collabQuery = query(
          collection(db, "collaborationRequests"),
          where("directorId", "==", user.id)
        );
        const collabSnapshot = await getDocs(collabQuery);
        collabSnapshot.forEach((doc) => {
          const data = doc.data();
          allRequests.push({
            id: doc.id,
            type: "collaboration",
            artistId: data.artistId,
            artistName: data.artistName || "Unknown Artist",
            projectTitle: data.projectTitle,
            status: data.status,
            createdAt: data.createdAt,
          });
        });
      }

      // Fetch licensing requests
      if (typeFilter === "all" || typeFilter === "licensing") {
        const licensingQuery = query(
          collection(db, "licensingRequests"),
          where("directorId", "==", user.id)
        );
        const licensingSnapshot = await getDocs(licensingQuery);
        licensingSnapshot.forEach((doc) => {
          const data = doc.data();
          allRequests.push({
            id: doc.id,
            type: "licensing",
            artistId: data.artistId,
            artistName: data.artistName || "Unknown Artist",
            trackTitle: data.trackTitle,
            status: data.status,
            createdAt: data.createdAt,
          });
        });
      }

      // Sort by creation date (newest first)
      allRequests.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Apply status filter
      const filtered = statusFilter === "all"
        ? allRequests
        : allRequests.filter((req) => req.status === statusFilter);

      setRequests(filtered);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "accepted":
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "completed":
      case "deal_closed":
        return "secondary";
      case "sent":
      case "seen":
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage your collaboration and licensing requests
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="collaboration">Collaboration</SelectItem>
              <SelectItem value="licensing">Licensing</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
              <SelectItem value="seen">Seen</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
          <CardDescription>
            {requests.length} request{requests.length !== 1 ? "s" : ""} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No requests yet</p>
              <p className="text-sm mt-2">Send collaboration or licensing requests to artists</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={request.type === "collaboration" ? "default" : "secondary"}>
                            {request.type === "collaboration" ? "Collaboration" : "Licensing"}
                          </Badge>
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{request.artistName}</h3>
                        {request.projectTitle && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Project: {request.projectTitle}
                          </p>
                        )}
                        {request.trackTitle && (
                          <p className="text-sm text-muted-foreground mb-1">
                            Track: {request.trackTitle}
                          </p>
                        )}
                        {request.createdAt && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                            <Clock className="h-3 w-3" />
                            {request.createdAt.toDate?.().toLocaleDateString() || "Recently"}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Message
                        </Button>
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

