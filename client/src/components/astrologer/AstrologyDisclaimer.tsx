import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Mandatory safety disclaimer for all Astrologer pages
 * This component must be displayed on every Astrologer-related page
 */
export function AstrologyDisclaimer() {
  return (
    <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
              Important Notice
            </h3>
            <p className="text-sm text-purple-800 dark:text-purple-200">
              Astrology-based content is interpretive and provided for entertainment and wellness purposes only.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

