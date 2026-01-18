import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { format } from "date-fns";

interface ChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserId: string;
  otherUserName?: string;
  conversationId?: string;
}

export function ChatDialog({
  open,
  onOpenChange,
  otherUserId,
  otherUserName,
  conversationId: initialConversationId,
}: ChatDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversationId, setConversationId] = useState(initialConversationId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open && user) {
      loadConversation();
    }
  }, [open, otherUserId, user]);

  const loadConversation = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      
      // Create or get conversation
      let convId = conversationId;
      if (!convId) {
        const createResponse = await fetch("/api/chat/conversations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ otherUserId }),
        });

        if (createResponse.ok) {
          const data = await createResponse.json();
          convId = data.conversationId;
          setConversationId(convId);
        }
      }

      // Load messages
      if (convId) {
        const messagesResponse = await fetch(
          `/api/chat/conversations/${convId}/messages`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (messagesResponse.ok) {
          const data = await messagesResponse.json();
          setMessages(data.messages || []);
        }
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || !user) return;

    setIsSending(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: newMessage }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chat with {otherUserName || "User"}</DialogTitle>
          <DialogDescription>
            Send a message to start a conversation
          </DialogDescription>
        </DialogHeader>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.userId === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="text-sm font-semibold mb-1">
                      {message.user?.name || "Unknown"}
                    </div>
                    <div className="text-sm">{message.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {message.createdAt
                        ? format(
                            message.createdAt.toDate
                              ? message.createdAt.toDate()
                              : new Date(message.createdAt),
                            "h:mm a"
                          )
                        : "Now"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="flex gap-2 pt-4 border-t">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending || !conversationId}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending || !conversationId}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

