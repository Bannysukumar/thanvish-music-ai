import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";
import { Sparkles, Library, TrendingUp, Music } from "lucide-react";
import { getSavedCompositions } from "@/lib/compositionStorage";
import { useEffect, useState } from "react";

/**
 * DashboardHome component - main dashboard page
 */
export default function DashboardHome() {
  const { user } = useAuth();
  const [totalCompositions, setTotalCompositions] = useState(0);
  const [libraryCount, setLibraryCount] = useState(0);

  // Load composition counts
  useEffect(() => {
    const compositions = getSavedCompositions();
    setTotalCompositions(compositions.length);
    setLibraryCount(compositions.length);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">
          Welcome back{user?.name ? `, ${user.name}` : ""}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {user?.isGuest 
            ? "You're browsing as a guest. Sign up to save your creations."
            : "Here's what's happening with your music today."
          }
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Compositions</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCompositions}</div>
            <p className="text-xs text-muted-foreground">
              {totalCompositions === 0 ? "Start creating to see your stats" : "Compositions generated"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Library</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{libraryCount}</div>
            <p className="text-xs text-muted-foreground">Saved compositions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">New compositions</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Start Creating</CardTitle>
            <CardDescription>
              Generate new AI-powered classical music compositions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/generate">
              <Button className="w-full">
                <Sparkles className="mr-2 h-4 w-4" />
                Go to Generator
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Library</CardTitle>
            <CardDescription>
              View and manage your saved compositions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/library">
              <Button variant="outline" className="w-full">
                <Library className="mr-2 h-4 w-4" />
                View Library
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest compositions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No recent activity yet</p>
            <p className="text-sm mt-2">Start creating to see your activity here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

