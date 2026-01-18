import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { EnhancedAudioPlayer } from "@/components/music/EnhancedAudioPlayer";
import { SocialInteractions } from "@/components/music/SocialInteractions";
import { format } from "date-fns";

interface TrackData {
  id: string;
  title: string;
  raga: string;
  tala: string;
  instruments: string[];
  tempo: number;
  mood: string;
  description?: string;
  audioUrl: string;
  generatedBy: {
    userId: string;
    role: string;
    name?: string;
    email?: string;
  };
  createdAt: any;
  likesCount?: number;
  averageRating?: number;
  ratingsCount?: number;
  commentsCount?: number;
}

export default function ShareTrack() {
  const { trackId } = useParams<{ trackId: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [track, setTrack] = useState<TrackData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (trackId) {
      loadTrack();
    }
  }, [trackId, user]);

  const loadTrack = async () => {
    if (!trackId) return;

    try {
      setIsLoading(true);
      const token = user ? await auth.currentUser?.getIdToken() : null;
      
      const response = await fetch(`/api/share/track/${trackId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.status === 403) {
        setAccessDenied(true);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setTrack(data.track);
      } else {
        const error = await response.json();
        if (error.error?.includes("private") || error.error?.includes("403")) {
          setAccessDenied(true);
        } else {
          toast({
            title: "Error",
            description: error.error || "Failed to load track",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error loading track:", error);
      toast({
        title: "Error",
        description: "Failed to load track",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading track...</p>
        </div>
      </div>
    );
  }

  if (accessDenied || !track) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This track is private or restricted. Only the owner can view it.
            </p>
            <Button onClick={() => setLocation("/dashboard/library")}>
              Go to My Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-2xl">{track.title}</CardTitle>
                <CardDescription className="mt-2">
                  {track.description || `${track.raga} in ${track.tala}`}
                </CardDescription>
              </div>
              <Badge variant="outline">
                {track.generatedBy.role
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Track Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Raga</div>
                <div className="font-medium capitalize">{track.raga}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tala</div>
                <div className="font-medium capitalize">{track.tala}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Mood</div>
                <div className="font-medium">{track.mood}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tempo</div>
                <div className="font-medium">{track.tempo} BPM</div>
              </div>
            </div>

            {/* Instruments */}
            <div>
              <div className="text-sm text-muted-foreground mb-2">Instruments</div>
              <div className="flex flex-wrap gap-2">
                {track.instruments.map((inst) => (
                  <Badge key={inst} variant="secondary">
                    {inst}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Audio Player */}
            <div className="border-t pt-4">
              <EnhancedAudioPlayer
                audioUrl={track.audioUrl}
                trackId={track.id}
                onPlay={() => setPlayingId(track.id)}
                onPause={() => setPlayingId(null)}
                onEnded={() => setPlayingId(null)}
              />
            </div>

            {/* Social Interactions */}
            <div className="border-t pt-4">
              <SocialInteractions
                trackId={track.id}
                ownerId={track.generatedBy.userId}
                ownerName={track.generatedBy.name}
                initialLikes={track.likesCount || 0}
                initialAverageRating={track.averageRating || 0}
                initialRatingsCount={track.ratingsCount || 0}
                initialCommentsCount={track.commentsCount || 0}
              />
            </div>

            {/* Created Info */}
            <div className="text-xs text-muted-foreground border-t pt-4">
              Created by {track.generatedBy.name || "Unknown"} on{" "}
              {track.createdAt
                ? format(
                    track.createdAt.toDate
                      ? track.createdAt.toDate()
                      : new Date(track.createdAt),
                    "MMM d, yyyy"
                  )
                : "Unknown date"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

