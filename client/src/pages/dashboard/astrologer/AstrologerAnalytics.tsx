import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, FileText, Star, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AstrologyDisclaimer } from "@/components/astrologer/AstrologyDisclaimer";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function AstrologerAnalytics() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [analytics, setAnalytics] = useState({
    templateUsageCount: 0,
    recommendationSetUsage: 0,
    mostSelectedInstruments: [] as string[],
    mostCommonIntents: [] as string[],
  });

  useEffect(() => {
    if (!user || user.role !== "astrologer") {
      return;
    }

    const subscriptionActive = 
      user.subscriptionStatus === "active" || 
      user.subscriptionStatus === "trial";
    setIsLocked(!subscriptionActive);

    fetchAnalytics();
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      // Placeholder analytics - would need to aggregate from user data
      // Note: Cannot store private birth data without explicit user consent
      setAnalytics({
        templateUsageCount: 0,
        recommendationSetUsage: 0,
        mostSelectedInstruments: [],
        mostCommonIntents: [],
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
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
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-2">
          View aggregate analytics about your templates, recommendations, and user engagement.
        </p>
      </div>

      {isLocked && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                  Limited Analytics
                </h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  Full analytics are available with an active subscription.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Template Usage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.templateUsageCount}</div>
            <p className="text-xs text-muted-foreground">
              Total template applications
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recommendation Usage</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.recommendationSetUsage}</div>
            <p className="text-xs text-muted-foreground">
              Recommendation sets used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Instruments</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.mostSelectedInstruments.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Most selected instruments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Common Intents</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.mostCommonIntents.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Intent categories used
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Analytics Details</CardTitle>
          <CardDescription>
            Aggregate data only - no private user information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Most Selected Instruments</h3>
              {analytics.mostSelectedInstruments.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analytics.mostSelectedInstruments.map((instrument, idx) => (
                    <li key={idx}>{instrument}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No data available yet</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold mb-2">Most Common Intents</h3>
              {analytics.mostCommonIntents.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {analytics.mostCommonIntents.map((intent, idx) => (
                    <li key={idx}>{intent}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No data available yet</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

