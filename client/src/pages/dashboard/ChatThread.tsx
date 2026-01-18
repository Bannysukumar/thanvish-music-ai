import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Mic,
  User,
  File,
  Image as ImageIcon,
  Loader2,
  ArrowLeft,
  Play,
  Pause,
  Check,
  CheckCheck,
  X,
  Clock,
  Ban,
  Flag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { format, isToday, isYesterday } from "date-fns";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Message {
  id: string;
  senderId: string;
  senderName?: string;
  type: "text" | "file" | "voice";
  text?: string;
  attachments?: Array<{
    url: string;
    fileName: string;
    mimeType: string;
    size: number;
  }>;
  voice?: {
    url: string;
    durationMs: number;
    mimeType: string;
    size: number;
  };
  createdAt: any;
  status?: "sending" | "sent" | "failed";
}

interface ConversationInfo {
  id: string;
  otherUser: {
    id: string;
    name: string;
    email?: string;
  };
}

export default function ChatThread() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [conversation, setConversation] = useState<ConversationInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [voiceProgress, setVoiceProgress] = useState<Map<string, number>>(new Map());
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [reportDetails, setReportDetails] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (conversationId && user) {
      loadConversation();
      loadMessages();
      markAsRead();
      
      // Poll for new messages every 5 seconds
      const interval = setInterval(() => {
        loadNewMessages();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [conversationId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    if (!conversationId || !user) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/chat/conversations/${conversationId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  };

  const loadMessages = async (loadMore = false) => {
    if (!conversationId || !user) return;

    try {
      if (loadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const token = await auth.currentUser?.getIdToken();
      const url = cursor
        ? `/api/chat/conversations/${conversationId}/messages?cursor=${cursor}&limit=30`
        : `/api/chat/conversations/${conversationId}/messages?limit=30`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        
        if (loadMore) {
          setMessages((prev) => [...newMessages, ...prev]);
        } else {
          setMessages(newMessages);
        }
        
        setHasMore(data.hasMore || false);
        setCursor(data.nextCursor || null);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadNewMessages = async () => {
    if (!conversationId || !user || messages.length === 0) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      const lastMessageId = messages[messages.length - 1]?.id;
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages?after=${lastMessageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];
        if (newMessages.length > 0) {
          setMessages((prev) => [...prev, ...newMessages]);
          markAsRead();
        }
      }
    } catch (error) {
      console.error("Error loading new messages:", error);
    }
  };

  const markAsRead = async () => {
    if (!conversationId || !user) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !recordedAudio) || !conversationId || !user) return;

    setIsSending(true);
    
    // Create optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      senderId: user.id,
      senderName: user.name,
      type: recordedAudio ? "voice" : "text",
      text: recordedAudio ? undefined : newMessage.trim(),
      voice: recordedAudio ? {
        url: URL.createObjectURL(recordedAudio),
        durationMs: 0,
        mimeType: "audio/webm",
        size: recordedAudio.size,
      } : undefined,
      createdAt: new Date() as any,
      status: "sending",
    };
    
    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);
    const messageText = newMessage.trim();
    setNewMessage("");
    const audioToUpload = recordedAudio;
    setRecordedAudio(null);
    
    try {
      const token = await auth.currentUser?.getIdToken();
      
      let messageData: any = {
        type: audioToUpload ? "voice" : "text",
      };

      if (audioToUpload) {
        // Upload voice first
        const voiceId = await uploadVoice(audioToUpload);
        messageData.voiceId = voiceId;
      } else {
        messageData.text = messageText;
      }

      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messageData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) => 
          prev.map(msg => msg.id === tempId ? { ...data, status: "sent" } : msg)
        );
        markAsRead();
      } else {
        // Mark as failed
        setMessages((prev) => 
          prev.map(msg => msg.id === tempId ? { ...msg, status: "failed" } : msg)
        );
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Mark as failed if not already
      setMessages((prev) => 
        prev.map(msg => msg.id === tempId ? { ...msg, status: "failed" } : msg)
      );
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !conversationId || !user) return;

    const file = files[0];
    
    // Validate file size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 25MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg", "image/png", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
      "application/zip",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "File type not allowed",
        description: "Please select an image, document, or zip file",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      const token = await auth.currentUser?.getIdToken();
      
      // Upload file
      const attachmentId = await uploadFile(file);
      
      // Send message with file
      const response = await fetch(
        `/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "file",
            attachmentIds: [attachmentId],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data]);
        markAsRead();
      }
    } catch (error) {
      console.error("Error sending file:", error);
      toast({
        title: "Error",
        description: "Failed to send file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const token = await auth.currentUser?.getIdToken();
    
    // Init upload
    const initResponse = await fetch("/api/chat/uploads/init", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
      }),
    });

    if (!initResponse.ok) {
      throw new Error("Failed to initialize upload");
    }

    const { uploadUrl, attachmentId } = await initResponse.json();

    // Upload file
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file");
    }

    // Complete upload
    const completeResponse = await fetch("/api/chat/uploads/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attachmentId }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload");
    }

    return attachmentId;
  };

  const uploadVoice = async (audioBlob: Blob): Promise<string> => {
    const token = await auth.currentUser?.getIdToken();
    
    // Get audio duration
    let durationMs = 0;
    try {
      const audio = new Audio();
      const durationPromise = new Promise<number>((resolve, reject) => {
        audio.addEventListener("loadedmetadata", () => {
          resolve(audio.duration * 1000); // Convert to milliseconds
        });
        audio.addEventListener("error", reject);
        audio.src = URL.createObjectURL(audioBlob);
      });
      durationMs = await durationPromise;
    } catch (error) {
      console.warn("Could not get audio duration:", error);
      durationMs = 0;
    }
    
    // Init upload
    const initResponse = await fetch("/api/chat/uploads/init", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: "voice.webm",
        mimeType: "audio/webm",
        size: audioBlob.size,
        isVoice: true,
        durationMs: Math.round(durationMs),
      }),
    });

    if (!initResponse.ok) {
      throw new Error("Failed to initialize upload");
    }

    const { uploadUrl, attachmentId } = await initResponse.json();

    // Upload voice
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: audioBlob,
      headers: {
        "Content-Type": "audio/webm",
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload voice");
    }

    // Complete upload
    const completeResponse = await fetch("/api/chat/uploads/complete", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ attachmentId }),
    });

    if (!completeResponse.ok) {
      throw new Error("Failed to complete upload");
    }

    return attachmentId;
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setRecordedAudio(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setRecordedAudio(null);
  };

  const playVoice = (messageId: string, voiceUrl: string) => {
    const audio = audioRefs.current.get(messageId);
    if (!audio) return;

    if (playingVoiceId === messageId) {
      audio.pause();
      setPlayingVoiceId(null);
    } else {
      // Stop any other playing audio
      if (playingVoiceId) {
        const otherAudio = audioRefs.current.get(playingVoiceId);
        if (otherAudio) otherAudio.pause();
      }
      
      audio.play();
      setPlayingVoiceId(messageId);
      
      audio.addEventListener("timeupdate", () => {
        setVoiceProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, (audio.currentTime / audio.duration) * 100);
          return newMap;
        });
      });
      
      audio.addEventListener("ended", () => {
        setPlayingVoiceId(null);
        setVoiceProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(messageId, 0);
          return newMap;
        });
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      if (isToday(date)) {
        return "Today";
      } else if (isYesterday(date)) {
        return "Yesterday";
      } else {
        return format(date, "MMMM d, yyyy");
      }
    } catch (error) {
      return "";
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, "h:mm a");
    } catch (error) {
      return "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Render text with clickable links and basic markdown
  const renderTextWithLinks = (text: string) => {
    // URL regex pattern
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Basic markdown patterns
    const boldRegex = /\*\*(.*?)\*\*/g;
    const italicRegex = /\*(.*?)\*/g;
    const codeRegex = /`(.*?)`/g;
    
    // First, handle URLs
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    
    // Find all URLs
    const urlMatches: Array<{ start: number; end: number; url: string }> = [];
    while ((match = urlRegex.exec(text)) !== null) {
      urlMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        url: match[0],
      });
    }
    
    // Process text with URLs and markdown
    let currentIndex = 0;
    urlMatches.forEach((urlMatch) => {
      // Add text before URL
      if (urlMatch.start > currentIndex) {
        const textBefore = text.substring(currentIndex, urlMatch.start);
        parts.push(...renderMarkdown(textBefore));
      }
      
      // Add URL as link
      parts.push(
        <a
          key={`url-${urlMatch.start}`}
          href={urlMatch.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
        >
          {urlMatch.url}
        </a>
      );
      
      currentIndex = urlMatch.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(...renderMarkdown(text.substring(currentIndex)));
    }
    
    return parts.length > 0 ? parts : [text];
  };

  // Render basic markdown (bold, italic, code)
  const renderMarkdown = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let processed = text;
    let keyCounter = 0;
    
    // Process code blocks first (to avoid conflicts)
    processed = processed.replace(/`([^`]+)`/g, (match, code) => {
      const key = `code-${keyCounter++}`;
      parts.push(
        <code key={key} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
          {code}
        </code>
      );
      return `__MARKDOWN_PLACEHOLDER_${keyCounter - 1}__`;
    });
    
    // Process bold
    processed = processed.replace(/\*\*([^*]+)\*\*/g, (match, content) => {
      const key = `bold-${keyCounter++}`;
      parts.push(<strong key={key} className="font-bold">{content}</strong>);
      return `__MARKDOWN_PLACEHOLDER_${keyCounter - 1}__`;
    });
    
    // Process italic (single asterisk, not already part of bold)
    processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, (match, content) => {
      const key = `italic-${keyCounter++}`;
      parts.push(<em key={key} className="italic">{content}</em>);
      return `__MARKDOWN_PLACEHOLDER_${keyCounter - 1}__`;
    });
    
    // Split by placeholders and add remaining text
    const placeholders = processed.split(/__MARKDOWN_PLACEHOLDER_(\d+)__/);
    placeholders.forEach((part, index) => {
      if (index % 2 === 0 && part) {
        parts.push(part);
      } else if (index % 2 === 1) {
        // This is a placeholder index, the element is already in parts
        // Just skip
      }
    });
    
    return parts.length > 0 ? parts : [text];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return ImageIcon;
    return File;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!conversation) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">Conversation not found</p>
          <Button onClick={() => setLocation("/dashboard/chat")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Messages
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Header */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/dashboard/chat")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">{conversation.otherUser.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="h-4 w-4 mr-1" />
                Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBlockDialog(true)}
              >
                <Ban className="h-4 w-4 mr-1" />
                Block
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesContainerRef}>
          {hasMore && messages.length > 0 && (
            <div className="text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadMessages(true)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Load older messages"
                )}
              </Button>
            </div>
          )}

          {messages.map((message, index) => {
            const isOwn = message.senderId === user?.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDateSeparator =
              !prevMessage ||
              formatDate(prevMessage.createdAt) !== formatDate(message.createdAt);

            return (
              <div key={message.id}>
                {showDateSeparator && (
                  <div className="text-center text-xs text-muted-foreground my-4">
                    {formatDate(message.createdAt)}
                  </div>
                )}
                <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {!isOwn && (
                      <div className="text-xs font-semibold mb-1 opacity-80">
                        {message.senderName || "Unknown"}
                      </div>
                    )}

                    {message.type === "text" && (
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {renderTextWithLinks(message.text || "")}
                      </div>
                    )}

                    {message.type === "file" && message.attachments && (
                      <div className="space-y-2">
                        {message.attachments.map((attachment, idx) => {
                          const FileIcon = getFileIcon(attachment.mimeType);
                          const isImage = attachment.mimeType.startsWith("image/");
                          
                          return (
                            <div
                              key={idx}
                              className="border rounded p-2 bg-background/50"
                            >
                              {isImage ? (
                                <img
                                  src={attachment.url}
                                  alt={attachment.fileName}
                                  className="max-w-full max-h-64 rounded mb-2"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <FileIcon className="h-5 w-5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                      {attachment.fileName}
                                    </div>
                                    <div className="text-xs opacity-70">
                                      {formatFileSize(attachment.size)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs underline"
                              >
                                {isImage ? "View full size" : "Download"}
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {message.type === "voice" && message.voice && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!audioRefs.current.has(message.id)) {
                              const audio = new Audio(message.voice!.url);
                              audioRefs.current.set(message.id, audio);
                            }
                            playVoice(message.id, message.voice!.url);
                          }}
                        >
                          {playingVoiceId === message.id ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <Slider
                            value={[voiceProgress.get(message.id) || 0]}
                            max={100}
                            className="w-full"
                            disabled
                          />
                        </div>
                        <span className="text-xs opacity-70">
                          {Math.floor(message.voice.durationMs / 1000)}s
                        </span>
                        <audio
                          ref={(el) => {
                            if (el) {
                              audioRefs.current.set(message.id, el);
                            } else {
                              audioRefs.current.delete(message.id);
                            }
                          }}
                          src={message.voice.url}
                          preload="metadata"
                        />
                      </div>
                    )}

                    <div
                      className={`text-xs mt-1 flex items-center gap-1 ${
                        isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      <span>{formatTime(message.createdAt)}</span>
                      {isOwn && message.status && (
                        <span className="ml-1">
                          {message.status === "sending" && (
                            <Clock className="h-3 w-3 animate-pulse" />
                          )}
                          {message.status === "sent" && (
                            <Check className="h-3 w-3" />
                          )}
                          {message.status === "delivered" && (
                            <CheckCheck className="h-3 w-3" />
                          )}
                          {message.status === "read" && (
                            <CheckCheck className="h-3 w-3 text-blue-400" />
                          )}
                          {message.status === "failed" && (
                            <X className="h-3 w-3 text-red-400" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Voice Preview */}
        {recordedAudio && (
          <div className="border-t p-4 bg-muted/50">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm font-medium">Voice recording ready</p>
                <p className="text-xs text-muted-foreground">
                  {Math.floor(recordedAudio.size / 1024)} KB
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={cancelRecording}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSendMessage} disabled={isSending}>
                Send
              </Button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isRecording}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
            />
            
            {!isRecording && !recordedAudio && (
              <Button
                variant="ghost"
                size="icon"
                onClick={startRecording}
                disabled={isSending}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
            
            {isRecording && (
              <Button
                variant="destructive"
                size="icon"
                onClick={stopRecording}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}

            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!recordedAudio) {
                    handleSendMessage();
                  }
                }
              }}
              disabled={isSending || isRecording || !!recordedAudio}
              className="flex-1"
            />
            <Button
              onClick={handleSendMessage}
              disabled={(!newMessage.trim() && !recordedAudio) || isSending || isRecording}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Block User</DialogTitle>
            <DialogDescription>
              Blocking this user will prevent them from sending you messages. You can unblock them later from your settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to block <strong>{conversation.otherUser.name}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  try {
                    const token = await auth.currentUser?.getIdToken();
                    const response = await fetch(`/api/chat/users/${conversation.otherUser.id}/block`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    });
                    if (response.ok) {
                      toast({
                        title: "User Blocked",
                        description: `${conversation.otherUser.name} has been blocked.`,
                      });
                      setShowBlockDialog(false);
                      setLocation("/dashboard/chat");
                    } else {
                      throw new Error("Failed to block user");
                    }
                  } catch (error) {
                    console.error("Error blocking user:", error);
                    toast({
                      title: "Error",
                      description: "Failed to block user. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Block User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Report this user for inappropriate behavior. Our team will review your report.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="scam">Scam or Fraud</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Additional Details (Optional)</Label>
              <Textarea
                placeholder="Please provide more information about the issue..."
                rows={4}
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  try {
                    const token = await auth.currentUser?.getIdToken();
                    const response = await fetch(`/api/chat/users/${conversation.otherUser.id}/report`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        reason: reportReason,
                        details: reportDetails,
                      }),
                    });
                    if (response.ok) {
                      toast({
                        title: "Report Submitted",
                        description: "Thank you for your report. We will review it shortly.",
                      });
                      setShowReportDialog(false);
                      setReportReason("spam");
                      setReportDetails("");
                    } else {
                      throw new Error("Failed to submit report");
                    }
                  } catch (error) {
                    console.error("Error reporting user:", error);
                    toast({
                      title: "Error",
                      description: "Failed to submit report. Please try again.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

