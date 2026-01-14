import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";

export default function AdminEBooks() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Music E-Book Control</h1>
          <p className="text-muted-foreground mt-2">
            Upload, manage, and control access to music e-books
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Upload E-Book
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>E-Book Library</CardTitle>
          <CardDescription>
            Manage all music e-books, assign categories, and control premium access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">E-Book Management</h3>
            <p className="text-muted-foreground">
              E-book upload and management coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

