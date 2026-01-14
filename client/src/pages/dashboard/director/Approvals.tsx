import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Music, Loader2 } from "lucide-react";
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

interface Delivery {
  id: string;
  projectId: string;
  projectTitle: string;
  artistId: string;
  artistName: string;
  trackTitle: string;
  version: string;
  audioUrl?: string;
  status: "pending_review" | "approved" | "rejected" | "revision_requested";
  notes?: string;
  createdAt?: any;
}

export default function Approvals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === "music_director") {
      fetchDeliveries();
    }
  }, [user, statusFilter]);

  const fetchDeliveries = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const deliveriesQuery = query(
        collection(db, "deliveries"),
        where("directorId", "==", user.id)
      );
      const querySnapshot = await getDocs(deliveriesQuery);
      const deliveriesData: Delivery[] = [];
      
      querySnapshot.forEach((doc) => {
        deliveriesData.push({
          id: doc.id,
          ...doc.data(),
        } as Delivery);
      });

      // Sort by creation date (newest first)
      deliveriesData.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      // Apply status filter
      const filtered = statusFilter === "all"
        ? deliveriesData
        : deliveriesData.filter((delivery) => delivery.status === statusFilter);

      setDeliveries(filtered);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      toast({
        title: "Error",
        description: "Failed to load deliveries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, newStatus: "approved" | "rejected" | "revision_requested") => {
    setUpdatingId(deliveryId);
    try {
      await updateDoc(doc(db, "deliveries", deliveryId), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Success",
        description: `Delivery ${newStatus.replace("_", " ")} successfully`,
      });

      fetchDeliveries();
    } catch (error) {
      console.error("Error updating delivery status:", error);
      toast({
        title: "Error",
        description: "Failed to update delivery status",
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
      case "revision_requested":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading approvals...</p>
        </div>
      </div>
    );
  }

  const pendingCount = deliveries.filter((d) => d.status === "pending_review").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">Deliveries / Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve artist deliveries
          </p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="revision_requested">Revision Requested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deliveries</CardTitle>
          <CardDescription>
            {deliveries.length} deliver{deliveries.length !== 1 ? "ies" : "y"} found
            {pendingCount > 0 && ` (${pendingCount} pending review)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Card key={delivery.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{delivery.trackTitle}</h3>
                          <Badge variant={getStatusBadgeVariant(delivery.status)}>
                            {delivery.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Artist: {delivery.artistName}
                        </p>
                        <p className="text-sm text-muted-foreground mb-1">
                          Project: {delivery.projectTitle}
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          Version: {delivery.version}
                        </p>
                        {delivery.notes && (
                          <p className="text-sm text-muted-foreground italic">
                            Notes: {delivery.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        {delivery.audioUrl && (
                          <Button variant="outline" size="sm" asChild>
                            <a href={delivery.audioUrl} target="_blank" rel="noopener noreferrer">
                              <Music className="h-4 w-4 mr-2" />
                              Listen
                            </a>
                          </Button>
                        )}
                        {delivery.status === "pending_review" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(delivery.id, "approved")}
                              disabled={updatingId === delivery.id}
                            >
                              {updatingId === delivery.id ? (
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
                              onClick={() => handleStatusUpdate(delivery.id, "revision_requested")}
                              disabled={updatingId === delivery.id}
                            >
                              Request Revision
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStatusUpdate(delivery.id, "rejected")}
                              disabled={updatingId === delivery.id}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </>
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

