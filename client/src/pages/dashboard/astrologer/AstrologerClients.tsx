import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Mail, 
  Calendar,
  MessageSquare,
  Lock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { useLocation } from "wouter";

interface Client {
  id: string;
  name: string;
  email: string;
  rasi?: string;
  totalReadings: number;
  lastReadingDate?: string;
  status: "active" | "inactive";
}

export default function AstrologerClients() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      setLocation("/dashboard");
      return;
    }

    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    setIsLocked(!subscriptionActive);

    fetchClients();
  }, [user, setLocation]);

  const fetchClients = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Fetch users who have requested readings from this astrologer
      // This would query a readings/requests collection where astrologerId matches
      // For now, we'll show a placeholder structure
      
      // In a real implementation, you would query:
      // const readingsQuery = query(
      //   collection(db, "astrologerReadings"),
      //   where("astrologerId", "==", user.id)
      // );
      // Then get unique userIds and fetch their user data
      
      // Placeholder: Empty clients list for now
      setClients([]);
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.rasi && client.rasi.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AstrologyDisclaimer />

      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          My Clients
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your client relationships and view reading history
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
                  An active subscription is required to view and manage clients.
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
              <CardTitle>Search Clients</CardTitle>
              <CardDescription>
                Search by name, email, or rasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {filteredClients.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
                  <p className="text-muted-foreground">
                    Clients will appear here once they request readings from you.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Card key={client.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      <Badge variant={client.status === "active" ? "default" : "secondary"}>
                        {client.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{client.email}</span>
                    </div>
                    {client.rasi && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Rasi:</span>
                        <Badge variant="outline">{client.rasi}</Badge>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Readings:</span>
                        <span className="font-semibold">{client.totalReadings}</span>
                      </div>
                    </div>
                    {client.lastReadingDate && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Last reading: {new Date(client.lastReadingDate).toLocaleDateString()}</span>
                      </div>
                    )}
                    <Button
                      variant="outline"
                      className="w-full mt-2"
                      onClick={() => setLocation(`/dashboard/astrologer/readings?clientId=${client.id}`)}
                    >
                      View Readings
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

