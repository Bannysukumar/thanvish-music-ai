import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Search,
  Calendar,
  User,
  MessageSquare,
  Lock,
  Filter
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Reading {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  question: string;
  rasi?: string;
  status: "pending" | "in_progress" | "completed" | "closed";
  response?: string;
  createdAt?: any;
  completedAt?: any;
}

export default function AstrologerReadings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [params] = useRoute("/dashboard/astrologer/readings");

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      setLocation("/dashboard");
      return;
    }

    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    setIsLocked(!subscriptionActive);

    fetchReadings();
  }, [user, setLocation]);

  const fetchReadings = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch readings assigned to this astrologer
      // This would query a readings collection where astrologerId matches
      // For now, we'll show a placeholder structure
      
      // In a real implementation, you would query:
      // const readingsQuery = query(
      //   collection(db, "astrologerReadings"),
      //   where("astrologerId", "==", user.id)
      // );
      // Then fetch and format the readings
      
      // Placeholder: Empty readings list for now
      setReadings([]);
    } catch (error) {
      console.error("Error fetching readings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!selectedReading || !responseText.trim()) {
      return;
    }

    // Check reading limit before creating/completing a reading
    try {
      if (!auth.currentUser) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const token = await auth.currentUser.getIdToken();
      const limitResponse = await fetch("/api/astrologer/check-reading-limit", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!limitResponse.ok) {
        const errorData = await limitResponse.json();
        toast({
          title: "Reading Limit Reached",
          description: errorData.error || "You've reached your readings limit for this month. Upgrade your plan to create more readings.",
          variant: "destructive",
        });
        return;
      }

      const limitData = await limitResponse.json();
      if (!limitData.canCreate) {
        toast({
          title: "Reading Limit Reached",
          description: limitData.error || "You've reached your readings limit for this month. Upgrade your plan to create more readings.",
          variant: "destructive",
        });
        return;
      }
    } catch (error: any) {
      console.error("Error checking reading limits:", error);
      toast({
        title: "Error",
        description: "Failed to check reading limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Update reading with response
      // await updateDoc(doc(db, "astrologerReadings", selectedReading.id), {
      //   response: responseText,
      //   status: "completed",
      //   completedAt: serverTimestamp(),
      // });

      // Increment reading count after successful completion
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        await fetch("/api/astrologer/increment-reading-count", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      setResponseText("");
      setSelectedReading(null);
      fetchReadings();
      
      toast({
        title: "Success",
        description: "Reading response submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReadings = readings.filter(reading => {
    const matchesSearch = 
      reading.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reading.question.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || reading.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading readings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AstrologyDisclaimer />

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          Readings
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage client readings and provide astrological guidance
        </p>
      </div>

      {isLocked && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Subscription Required
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  An active subscription is required to view and manage readings.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-3 border-amber-300 text-amber-900 hover:bg-amber-100 dark:text-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/30"
                  onClick={() => setLocation("/dashboard/upgrade")}
                >
                  Activate Subscription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLocked && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Search & Filter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or question..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {filteredReadings.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Readings Yet</h3>
                  <p className="text-muted-foreground">
                    Client readings will appear here when they request astrological guidance.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredReadings.map((reading) => (
                <Card key={reading.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{reading.userName || "Anonymous Client"}</CardTitle>
                        <CardDescription className="mt-1">
                          {reading.userEmail}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          reading.status === "completed" ? "default" :
                          reading.status === "in_progress" ? "secondary" :
                          reading.status === "closed" ? "outline" :
                          "destructive"
                        }
                      >
                        {reading.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reading.rasi && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rasi:</span>
                        <Badge variant="outline">{reading.rasi}</Badge>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm font-semibold">Question:</Label>
                      <p className="text-sm mt-1 text-muted-foreground">{reading.question}</p>
                    </div>
                    {reading.response && (
                      <div>
                        <Label className="text-sm font-semibold">Your Response:</Label>
                        <p className="text-sm mt-1">{reading.response}</p>
                      </div>
                    )}
                    {reading.createdAt && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Requested: {reading.createdAt.toDate ? new Date(reading.createdAt.toDate()).toLocaleDateString() : new Date(reading.createdAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {reading.status === "pending" || reading.status === "in_progress" ? (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => setSelectedReading(reading)}
                      >
                        {reading.status === "pending" ? "Start Reading" : "Continue Reading"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setSelectedReading(reading)}
                      >
                        View Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Response Modal/Dialog */}
          {selectedReading && (
            <Card className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
              <CardContent className="w-full max-w-2xl p-6 bg-card border shadow-lg max-h-[90vh] overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Reading Response</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedReading(null);
                        setResponseText("");
                      }}
                    >
                      ×
                    </Button>
                  </div>
                  <div>
                    <Label>Client: {selectedReading.userName || "Anonymous"}</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedReading.question}</p>
                  </div>
                  <div>
                    <Label htmlFor="response">Your Response *</Label>
                    <Textarea
                      id="response"
                      rows={8}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Provide your astrological guidance and recommendations..."
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Remember: This is for spiritual guidance only, not medical or financial advice.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitResponse}
                      disabled={!responseText.trim() || isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Response"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedReading(null);
                        setResponseText("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

