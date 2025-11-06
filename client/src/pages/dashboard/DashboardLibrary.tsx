import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Library, Play, Download, Trash2, Search, Music2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  getSavedCompositions,
  deleteComposition,
  searchCompositions,
  type SavedComposition,
} from "@/lib/compositionStorage";
import { format } from "date-fns";

/**
 * DashboardLibrary component - user's music library page
 */
export default function DashboardLibrary() {
  const { toast } = useToast();
  const [compositions, setCompositions] = useState<SavedComposition[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

  // Load compositions on mount
  useEffect(() => {
    loadCompositions();
  }, []);

  // Filter compositions based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = searchCompositions(searchQuery);
      setCompositions(filtered);
    } else {
      loadCompositions();
    }
  }, [searchQuery]);

  /**
   * Load all saved compositions
   */
  const loadCompositions = () => {
    const saved = getSavedCompositions();
    setCompositions(saved);
  };

  /**
   * Handle delete composition
   */
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this composition?")) {
      const success = deleteComposition(id);
      if (success) {
        loadCompositions();
        toast({
          title: "Composition deleted",
          description: "The composition has been removed from your library.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete composition.",
          variant: "destructive",
        });
      }
    }
  };

  /**
   * Handle play/pause for a composition
   */
  const handlePlayPause = (composition: SavedComposition) => {
    const audioElement = audioRefs.current.get(composition.id);
    if (!audioElement) return;

    if (playingId === composition.id) {
      // Pause current
      audioElement.pause();
      setPlayingId(null);
    } else {
      // Pause any other playing audio
      if (playingId) {
        const otherAudio = audioRefs.current.get(playingId);
        if (otherAudio) otherAudio.pause();
      }
      // Play this one
      audioElement.play().then(() => {
        setPlayingId(composition.id);
      }).catch((error) => {
        console.error("Playback error:", error);
        toast({
          title: "Playback Error",
          description: "Could not play audio. Please check the audio URL.",
          variant: "destructive",
        });
      });
    }
  };

  /**
   * Set audio ref for a composition
   */
  const setAudioRef = (id: string, element: HTMLAudioElement | null) => {
    if (element) {
      audioRefs.current.set(id, element);
    } else {
      audioRefs.current.delete(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">My Library</h1>
        <p className="text-muted-foreground mt-2">
          Your saved compositions and generated music ({compositions.length} {compositions.length === 1 ? "composition" : "compositions"})
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search your library by title, raga, tala, mood, or instruments..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Library content */}
      {compositions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Library className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
            <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
              {searchQuery
                ? "No compositions found matching your search."
                : "Generate and save your first composition to start building your music library"}
            </p>
            {!searchQuery && (
              <Link href="/dashboard/generate">
                <Button>
                  <Music2 className="mr-2 h-4 w-4" />
                  Go to Generator
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {compositions.map((composition) => (
            <Card key={composition.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{composition.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {composition.description || `${composition.raga} in ${composition.tala}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-4">
                {/* Composition details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raga:</span>
                    <span className="font-medium capitalize">{composition.raga}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tala:</span>
                    <span className="font-medium capitalize">{composition.tala}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mood:</span>
                    <span className="font-medium">{composition.mood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo:</span>
                    <span className="font-medium">{composition.tempo} BPM</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Instruments: </span>
                    <span className="font-medium text-xs">
                      {composition.instruments.join(", ")}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Created: {format(new Date(composition.createdAt), "MMM d, yyyy")}
                  </div>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={(el) => setAudioRef(composition.id, el)}
                  src={composition.audioUrl}
                  preload="metadata"
                  onEnded={() => setPlayingId(null)}
                  onError={() => {
                    toast({
                      title: "Audio Error",
                      description: "Could not load audio for this composition.",
                      variant: "destructive",
                    });
                  }}
                />

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handlePlayPause(composition)}
                    disabled={!composition.audioUrl}
                  >
                    {playingId === composition.id ? (
                      <>
                        <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Playing
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    disabled={!composition.audioUrl}
                  >
                    <a href={composition.audioUrl} download={composition.title}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(composition.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
