import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, Coins, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminCredits() {
  const { toast } = useToast();
  const [credits, setCredits] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/credits", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch credits");
      }

      setCredits(data.credits);
      setIsFetching(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch credits";
      setError(errorMessage);
      setIsFetching(false);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  if (isFetching && !error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">API Credits</h1>
        <p className="text-muted-foreground">
          View your remaining API.box credits balance
        </p>
      </div>

      {/* Credits Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Remaining Credits</CardTitle>
              <CardDescription className="mt-1">
                Current balance of available credits for your API.box account
              </CardDescription>
            </div>
            {credits !== null && credits > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Active</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {/* Credits Display */}
            <div className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription className="mt-2">
                    {error}
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="flex items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-dashed border-primary/20">
                    <div className="text-center space-y-2">
                      <div className="text-5xl font-bold text-primary">
                        {credits !== null ? credits.toLocaleString() : "—"}
                      </div>
                      <div className="text-sm text-muted-foreground font-medium">
                        Available Credits
                      </div>
                    </div>
                  </div>

                  {credits !== null && credits === 0 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>No Credits Available</AlertTitle>
                      <AlertDescription className="mt-2">
                        Your account has no remaining credits. Please add credits to your API.box account to continue generating music.
                      </AlertDescription>
                    </Alert>
                  )}

                  {credits !== null && credits > 0 && credits < 10 && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Low Credits Warning</AlertTitle>
                      <AlertDescription className="mt-2">
                        You have less than 10 credits remaining. Consider adding more credits to avoid service interruption.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <Button
                onClick={fetchCredits}
                disabled={isLoading}
                variant="outline"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Credits
                  </>
                )}
              </Button>
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>About Credits</AlertTitle>
              <AlertDescription className="mt-2">
                Credits are consumed each time you generate music. The balance shown here is retrieved directly from your API.box account. 
                To add more credits, visit the{" "}
                <a
                  href="https://api.box"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  API.box management page
                </a>
                .
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

