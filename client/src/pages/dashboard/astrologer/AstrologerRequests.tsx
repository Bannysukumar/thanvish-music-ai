import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

interface UserRequest {
  id: string;
  userId: string;
  userName?: string;
  question: string;
  status: "pending" | "answered" | "closed";
  response?: string;
  createdAt?: any;
}

export default function AstrologerRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      return;
    }

    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    setIsLocked(!subscriptionActive);

    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
    if (!user) return;

    try {
      // Note: This would need to query requests assigned to this astrologer
      // For now, showing placeholder
      setRequests([]);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AstrologyDisclaimer />

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Requests / Queries</h1>
        <p className="text-muted-foreground mt-2">
          Respond to user questions related to music personalization based on their horoscope.
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
                  Subscription is required to respond to user requests.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Requests Yet</h3>
              <p className="text-muted-foreground">
                User questions and requests will appear here when available.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{request.userName || "Anonymous User"}</CardTitle>
                  <Badge
                    variant={
                      request.status === "answered" ? "default" :
                      request.status === "closed" ? "secondary" :
                      "outline"
                    }
                  >
                    {request.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Question</Label>
                    <p className="text-sm mt-1">{request.question}</p>
                  </div>
                  {request.response && (
                    <div>
                      <Label>Your Response</Label>
                      <p className="text-sm mt-1">{request.response}</p>
                    </div>
                  )}
                  {!request.response && !isLocked && (
                    <div className="space-y-2">
                      <Label htmlFor={`response-${request.id}`}>Your Response</Label>
                      <Textarea
                        id={`response-${request.id}`}
                        placeholder="Provide guidance and template suggestions..."
                        rows={4}
                      />
                      <Button size="sm">Submit Response</Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

