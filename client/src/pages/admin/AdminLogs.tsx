import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw, FileText, Copy, Music2, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface GenerationLog {
  id: string;
  taskId: string;
  compositionId: string | null;
  time: string;
  type: "generate";
  model: string;
  prompt: string;
  callbackUrl: string;
  status: "pending" | "success" | "failed";
  creditsConsumed: number | null;
}

export default function AdminLogs() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/logs", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch logs");
      }

      setLogs(data.logs || []);
      setIsFetching(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch logs";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsFetching(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const formatPrompt = (prompt: string, callbackUrl: string) => {
    return `prompt: ${prompt}\ncallBackUrl: ${callbackUrl}`;
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return format(date, "yyyy-MM-dd HH:mm:ss");
    } catch {
      return timeString;
    }
  };

  if (isFetching && !logs.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Logs</h1>
          <p className="text-muted-foreground">
            An overview of your latest requests
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generation Logs
          </CardTitle>
          <CardDescription>
            All music generation requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No generation logs found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Prompt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Credits Consumed</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {formatTime(log.time)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.model}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="bg-muted p-2 rounded text-xs font-mono break-words relative group">
                            <div className="line-clamp-2">
                              {formatPrompt(log.prompt, log.callbackUrl)}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() =>
                                copyToClipboard(formatPrompt(log.prompt, log.callbackUrl))
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.status === "success" ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500" />
                            <span className="text-sm">success</span>
                          </div>
                        ) : log.status === "failed" ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500" />
                            <span className="text-sm">failed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.creditsConsumed !== null ? (
                          <span className="font-medium">{log.creditsConsumed}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.compositionId && log.status === "success" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a
                              href={`/dashboard/library`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Music2 className="h-4 w-4 mr-2" />
                              Result
                            </a>
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

