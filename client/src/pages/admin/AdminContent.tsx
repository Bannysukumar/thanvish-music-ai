import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileCheck, BookOpen, Music, CheckCircle, XCircle, Loader2, Eye, CheckSquare2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PendingContent {
  id: string;
  title: string;
  description?: string;
  teacherName?: string;
  courseTitle?: string;
  moduleTitle?: string;
  lessonTitle?: string;
  status: string;
  createdAt?: string;
}

export default function AdminContent() {
  const { toast } = useToast();
  const [pendingCourses, setPendingCourses] = useState<PendingContent[]>([]);
  const [pendingLessons, setPendingLessons] = useState<PendingContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PendingContent | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    fetchPendingContent();
    
    // Poll for new pending content every 30 seconds
    const interval = setInterval(() => {
      fetchPendingContent();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPendingContent = async () => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      // Fetch pending courses
      const coursesResponse = await fetch("/api/admin/content/pending?type=course", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setPendingCourses(coursesData.items || []);
      }

      // Fetch pending lessons
      const lessonsResponse = await fetch("/api/admin/content/pending?type=lesson", {
        headers: {
          Authorization: `Bearer ${sessionId}`,
        },
      });

      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        setPendingLessons(lessonsData.items || []);
      }
    } catch (error) {
      console.error("Error fetching pending content:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (item: PendingContent, contentType: "course" | "lesson") => {
    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      setIsProcessing(true);

      const response = await fetch(`/api/admin/content/${item.id}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ contentType }),
      });

      if (!response.ok) throw new Error("Failed to approve content");

      toast({
        title: "Success",
        description: "Content approved successfully",
      });

      fetchPendingContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve content",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: "approve" | "reject") => {
    if (selectedItems.size === 0) {
      toast({
        title: "Error",
        description: "Please select items to perform bulk action",
        variant: "destructive",
      });
      return;
    }

    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      setIsProcessing(true);

      const promises = Array.from(selectedItems).map(async (itemId) => {
        const item = [...pendingCourses, ...pendingLessons].find(i => i.id === itemId);
        if (!item) return;

        const contentType = item.courseTitle ? "lesson" : "course";
        const url = action === "approve"
          ? `/api/admin/content/${itemId}/approve`
          : `/api/admin/content/${itemId}/reject`;

        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionId}`,
          },
          body: JSON.stringify({
            contentType,
            reason: action === "reject" ? "Bulk rejection" : undefined,
          }),
        });

        if (!response.ok) throw new Error(`Failed to ${action} ${itemId}`);
      });

      await Promise.all(promises);

      toast({
        title: "Success",
        description: `${action === "approve" ? "Approved" : "Rejected"} ${selectedItems.size} item(s) successfully`,
      });

      setSelectedItems(new Set());
      setBulkAction(null);
      fetchPendingContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${bulkAction} items`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAll = (items: PendingContent[]) => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleReject = async () => {
    if (bulkAction === "reject" && selectedItems.size > 0) {
      // Handle bulk rejection
      try {
        const sessionId = localStorage.getItem("adminSession");
        if (!sessionId) return;

        setIsProcessing(true);

        const promises = Array.from(selectedItems).map(async (itemId) => {
          const item = [...pendingCourses, ...pendingLessons].find(i => i.id === itemId);
          if (!item) return;

          const contentType = item.courseTitle ? "lesson" : "course";
          const response = await fetch(`/api/admin/content/${itemId}/reject`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sessionId}`,
            },
            body: JSON.stringify({
              contentType,
              reason: rejectionReason || "Bulk rejection",
            }),
          });

          if (!response.ok) throw new Error(`Failed to reject ${itemId}`);
        });

        await Promise.all(promises);

        toast({
          title: "Success",
          description: `Rejected ${selectedItems.size} item(s) successfully`,
        });

        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedItem(null);
        setSelectedItems(new Set());
        setBulkAction(null);
        fetchPendingContent();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to reject content",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    if (!selectedItem) return;

    try {
      const sessionId = localStorage.getItem("adminSession");
      if (!sessionId) return;

      setIsProcessing(true);

      const contentType = selectedItem.courseTitle ? "lesson" : "course";
      const response = await fetch(`/api/admin/content/${selectedItem.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionId}`,
        },
        body: JSON.stringify({
          contentType,
          reason: rejectionReason,
        }),
      });

      if (!response.ok) throw new Error("Failed to reject content");

      toast({
        title: "Success",
        description: "Content rejected successfully",
      });

      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedItem(null);
      fetchPendingContent();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject content",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Content Management</h1>
          <p className="text-muted-foreground mt-2">Loading...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Management</h1>
        <p className="text-muted-foreground mt-2">
          Moderate and manage all content across all modules
        </p>
      </div>

      <Tabs defaultValue="educational" className="space-y-4">
        <TabsList>
          <TabsTrigger value="educational">Educational Music</TabsTrigger>
          <TabsTrigger value="instrumental">Instrumental Education</TabsTrigger>
        </TabsList>

        <TabsContent value="educational" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Educational Music Content</CardTitle>
              <CardDescription>
                Approve, reject, feature, or remove educational music content
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pending Courses ({pendingCourses.length})</h3>
                  <div className="flex gap-2">
                    {pendingCourses.length > 0 && selectedItems.size > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("approve")}
                          disabled={isProcessing}
                        >
                          <CheckSquare2 className="h-4 w-4 mr-1" />
                          Approve Selected ({selectedItems.size})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBulkAction("reject");
                            setShowRejectModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject Selected ({selectedItems.size})
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPendingContent}
                      disabled={isProcessing}
                    >
                      <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                {pendingCourses.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending courses</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedItems.size === pendingCourses.length && pendingCourses.length > 0}
                            onChange={() => selectAll(pendingCourses)}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCourses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(course.id)}
                              onChange={() => toggleItemSelection(course.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>{course.teacherName || "Unknown"}</TableCell>
                          <TableCell>
                            {course.createdAt
                              ? format(new Date(course.createdAt), "MMM dd, yyyy")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(course, "course")}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(course);
                                  setShowRejectModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Pending Lessons ({pendingLessons.length})</h3>
                  <div className="flex gap-2">
                    {pendingLessons.length > 0 && selectedItems.size > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkAction("approve")}
                          disabled={isProcessing}
                        >
                          <CheckSquare2 className="h-4 w-4 mr-1" />
                          Approve Selected ({selectedItems.size})
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBulkAction("reject");
                            setShowRejectModal(true);
                          }}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject Selected ({selectedItems.size})
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchPendingContent}
                      disabled={isProcessing}
                    >
                      <Loader2 className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
                {pendingLessons.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No pending lessons</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <input
                            type="checkbox"
                            checked={selectedItems.size === pendingLessons.length && pendingLessons.length > 0}
                            onChange={() => selectAll(pendingLessons)}
                            className="rounded border-gray-300"
                          />
                        </TableHead>
                        <TableHead>Lesson Title</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Module</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLessons.map((lesson) => (
                        <TableRow key={lesson.id}>
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedItems.has(lesson.id)}
                              onChange={() => toggleItemSelection(lesson.id)}
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lesson.lessonTitle || lesson.title}</TableCell>
                          <TableCell>{lesson.courseTitle || "Unknown"}</TableCell>
                          <TableCell>{lesson.moduleTitle || "Unknown"}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApprove(lesson, "lesson")}
                                disabled={isProcessing}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(lesson);
                                  setShowRejectModal(true);
                                }}
                                disabled={isProcessing}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instrumental" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instrumental Education</CardTitle>
              <CardDescription>
                Manage learning paths, practice features, and teacher assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Learning Paths</h3>
                <p className="text-muted-foreground">
                  Instrumental education management coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject Content Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === "reject" && selectedItems.size > 0
                ? `Reject ${selectedItems.size} Item(s)`
                : "Reject Content"}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === "reject" && selectedItems.size > 0
                ? `Provide a reason for rejecting ${selectedItems.size} selected item(s)`
                : "Provide a reason for rejecting this content"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason</Label>
              <Textarea
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason("");
                setSelectedItem(null);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Content
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

