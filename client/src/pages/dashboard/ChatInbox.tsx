import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, User, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { format, formatDistanceToNow } from "date-fns";

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email?: string;
  };
  lastMessage?: {
    text?: string;
    type: "text" | "file" | "voice";
    createdAt: any;
  };
  lastMessageAt: any;
  unreadCount: number;
}

export default function ChatInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      loadConversations();
      // Poll every 10 seconds for updates
      const interval = setInterval(() => {
        loadConversations();
      }, 10000);
      setPollInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = conversations.filter(
        (conv) =>
          conv.otherUser.name.toLowerCase().includes(query) ||
          conv.otherUser.email?.toLowerCase().includes(query) ||
          conv.lastMessage?.text?.toLowerCase().includes(query)
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
        if (!searchQuery) {
          setFilteredConversations(data.conversations || []);
        }
      } else {
        console.error("Failed to load conversations");
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastMessage = (message: Conversation["lastMessage"]) => {
    if (!message) return "No messages yet";
    
    if (message.type === "file") {
      return "📎 File";
    } else if (message.type === "voice") {
      return "🎤 Voice message";
    } else {
      return message.text || "No messages yet";
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true });
      } else {
        return format(date, "MMM d, yyyy");
      }
    } catch (error) {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          Your conversations and messages
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search conversations..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              {searchQuery
                ? "No conversations match your search."
                : "Start a conversation by clicking 'Chat with Owner' on any track in My Library."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <Card
              key={conversation.id}
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => setLocation(`/dashboard/chat/${conversation.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold truncate">
                          {conversation.otherUser.name}
                        </h3>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="shrink-0">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(conversation.lastMessageAt)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {formatLastMessage(conversation.lastMessage)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

