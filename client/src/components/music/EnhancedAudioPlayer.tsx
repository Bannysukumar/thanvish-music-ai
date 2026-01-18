import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { auth } from "@/lib/firebase";

interface EnhancedAudioPlayerProps {
  audioUrl: string;
  trackId: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export function EnhancedAudioPlayer({ 
  audioUrl, 
  trackId, 
  onPlay, 
  onPause, 
  onEnded 
}: EnhancedAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [isLoadingStream, setIsLoadingStream] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch signed streaming URL
  useEffect(() => {
    const fetchStreamUrl = async () => {
      try {
        setIsLoadingStream(true);
        
        // Get auth token from Firebase Auth
        let token: string | null = null;
        if (auth.currentUser) {
          token = await auth.currentUser.getIdToken();
        }
        
        if (!token) {
          // Fallback to direct URL if no auth
          setStreamUrl(audioUrl);
          setIsLoadingStream(false);
          return;
        }

        const response = await fetch(`/api/tracks/${trackId}/stream`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStreamUrl(data.streamUrl);
        } else {
          // Fallback to direct URL
          setStreamUrl(audioUrl);
        }
      } catch (error) {
        console.error("Error fetching stream URL:", error);
        setStreamUrl(audioUrl);
      } finally {
        setIsLoadingStream(false);
      }
    };

    if (audioUrl && trackId) {
      fetchStreamUrl();
    } else {
      setStreamUrl(audioUrl);
      setIsLoadingStream(false);
    }
  }, [audioUrl, trackId]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };
    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    // Prevent download
    audio.addEventListener("contextmenu", (e) => e.preventDefault());
    audio.controlsList.add("nodownload");

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
    };
  }, [onPlay, onPause, onEnded]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      const newVolume = value[0];
      audio.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      if (isMuted) {
        audio.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audio.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingStream || !streamUrl) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="metadata"
        controlsList="nodownload"
        style={{ display: "none" }}
      />
      
      {/* Play/Pause Button */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={togglePlayPause}
          disabled={!streamUrl}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>

        {/* Seek Bar */}
        <div className="flex-1 space-y-1">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2 w-24">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleMute}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
        </div>
      </div>
    </div>
  );
}

