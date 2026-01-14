import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminHoroscope() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music Horoscope Control</h1>
        <p className="text-muted-foreground mt-2">
          Enforce astrology accuracy, moderate astrologer content, and verify astrologers
        </p>
      </div>

      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Astrology Accuracy Enforcement
              </h3>
              <ul className="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 list-disc list-inside">
                <li>Vedic Sidereal astrology only</li>
                <li>Lahiri Ayanamsa mandatory</li>
                <li>Date + Time + Place required (no manual override)</li>
                <li>Admin enforces these rules strictly</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Astrologer Content Moderation</CardTitle>
          <CardDescription>
            Approve or reject rasi recommendations, astro music templates, and horoscope posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Content Queue</h3>
            <p className="text-muted-foreground">
              Astrologer content moderation coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Astrologer Verification</CardTitle>
          <CardDescription>
            Verify astrologers and remove misleading or fear-based content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              Astrologer verification management coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

