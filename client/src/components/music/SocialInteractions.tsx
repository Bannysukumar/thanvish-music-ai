import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Share2, MessageSquare, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface SocialInteractionsProps {
  trackId: string;
  ownerId: string;
  ownerName?: string;
  initialLikes?: number;
  initialUserLiked?: boolean;
  initialRating?: number;
  initialAverageRating?: number;
  initialRatingsCount?: number;
  initialCommentsCount?: number;
  onChatClick?: () => void;
}

export function SocialInteractions({
  trackId,
  ownerId,
  ownerName,
  initialLikes = 0,
  initialUserLiked = false,
  initialRating = 0,
  initialAverageRating = 0,
  initialRatingsCount = 0,
  initialCommentsCount = 0,
  onChatClick,
}: SocialInteractionsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialUserLiked);
  const [likesCount, setLikesCount] = useState(initialLikes);
  const [userRating, setUserRating] = useState(initialRating);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingsCount, setRatingsCount] = useState(initialRatingsCount);
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to like tracks",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/tracks/${trackId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleRate = async (rating: number) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to rate tracks",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/tracks/${trackId}/rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserRating(rating);
        setAverageRating(data.averageRating);
        setRatingsCount(data.ratingsCount);
      }
    } catch (error) {
      console.error("Error rating track:", error);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/track/${trackId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this music",
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Share link copied to clipboard",
      });
    }
  };

  const loadComments = async () => {
    if (!user) return;
    
    setIsLoadingComments(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/tracks/${trackId}/comments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Error loading comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmittingComment(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/tracks/${trackId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data, ...comments]);
        setCommentsCount(commentsCount + 1);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (showComments) {
      loadComments();
    }
  }, [showComments, trackId]);

  const isOwner = user?.id === ownerId;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Like Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLike}
        className={liked ? "text-red-500" : ""}
      >
        <Heart className={`h-4 w-4 mr-1 ${liked ? "fill-current" : ""}`} />
        <span className="text-xs">{likesCount}</span>
      </Button>

      {/* Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            className={`text-sm ${
              star <= (userRating || averageRating)
                ? "text-yellow-500"
                : "text-muted-foreground"
            }`}
          >
            <Star
              className={`h-4 w-4 ${
                star <= (userRating || averageRating) ? "fill-current" : ""
              }`}
            />
          </button>
        ))}
        {ratingsCount > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            ({averageRating.toFixed(1)})
          </span>
        )}
      </div>

      {/* Share Button */}
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 className="h-4 w-4 mr-1" />
        <span className="text-xs">Share</span>
      </Button>

      {/* Comments Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(true)}
      >
        <MessageSquare className="h-4 w-4 mr-1" />
        <span className="text-xs">{commentsCount}</span>
      </Button>

      {/* Chat with Owner Button (if not owner) */}
      {!isOwner && user && (
        <Button
          variant="outline"
          size="sm"
          onClick={onChatClick}
        >
          <Send className="h-4 w-4 mr-1" />
          Chat with {ownerName || "Owner"}
        </Button>
      )}

      {/* Comments Dialog */}
      <Dialog open={showComments} onOpenChange={setShowComments}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
            <DialogDescription>
              Share your thoughts about this track
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Comment Input */}
            {user && (
              <div className="flex gap-2">
                <Textarea
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            {isLoadingComments ? (
              <div className="text-center py-4">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="border-b pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">
                          {comment.user?.name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {comment.text}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {comment.createdAt
                            ? format(
                                comment.createdAt.toDate
                                  ? comment.createdAt.toDate()
                                  : new Date(comment.createdAt),
                                "MMM d, yyyy 'at' h:mm a"
                              )
                            : "Recently"}
                        </div>
                      </div>
                      {comment.userId === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            try {
                              const token = await auth.currentUser?.getIdToken();
                              await fetch(
                                `/api/tracks/${trackId}/comments/${comment.id}`,
                                {
                                  method: "DELETE",
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                  },
                                }
                              );
                              setComments(
                                comments.filter((c) => c.id !== comment.id)
                              );
                              setCommentsCount(commentsCount - 1);
                            } catch (error) {
                              console.error("Error deleting comment:", error);
                            }
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

