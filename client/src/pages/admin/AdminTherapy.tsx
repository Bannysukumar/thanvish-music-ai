import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, AlertCircle, Shield } from "lucide-react";

export default function AdminTherapy() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Music Therapy & Doctor Control</h1>
        <p className="text-muted-foreground mt-2">
          Verify doctors, approve therapy programs, and enforce safety measures
        </p>
      </div>

      <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 dark:text-red-100">
                Safety & Compliance Requirements
              </h3>
              <ul className="text-sm text-red-800 dark:text-red-200 mt-2 space-y-1 list-disc list-inside">
                <li>Mandatory medical disclaimer on all therapy content</li>
                <li>Keyword blocking: diagnosis, cure, medicine</li>
                <li>Emergency disclaimer enforcement</li>
                <li>Remove unsafe or prohibited claims</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Doctor Verification</CardTitle>
          <CardDescription>
            Verify doctors and manage their access to therapy features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Doctor Management</h3>
            <p className="text-muted-foreground">
              Doctor verification and management coming soon
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Therapy Program Approval</CardTitle>
          <CardDescription>
            Review and approve therapy programs and session templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Program Moderation</h3>
            <p className="text-muted-foreground">
              Therapy program approval queue coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

