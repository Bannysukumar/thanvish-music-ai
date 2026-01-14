import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Users } from "lucide-react";

export default function AdminArtists() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Artist & Director Ecosystem Control</h1>
        <p className="text-muted-foreground mt-2">
          Manage artists, directors, content moderation, and collaboration disputes
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Artist Control</CardTitle>
            <CardDescription>
              Verify artists, moderate tracks & albums, handle reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Artist Management</h3>
              <p className="text-muted-foreground">
                Artist verification and content moderation coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Music Director Control</CardTitle>
            <CardDescription>
              Verify directors, view projects, moderate collaborations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Director Management</h3>
              <p className="text-muted-foreground">
                Director verification and project oversight coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

