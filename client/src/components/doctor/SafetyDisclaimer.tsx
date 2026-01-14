import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Mandatory safety disclaimer for all Doctor pages
 * This component must be displayed on every Doctor-related page
 */
export function SafetyDisclaimer() {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Important Safety Notice
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              This content is for wellness and relaxation support only and is not a medical or psychiatric treatment.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

