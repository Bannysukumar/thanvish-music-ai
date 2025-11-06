import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Download, Loader2, Music, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { saveComposition } from "@/lib/compositionStorage";
import type { MusicGenerationRequest } from "@shared/schema";

const RAGAS = [
  { value: "yaman", label: "Yaman", description: "Evening raga, peaceful and devotional" },
  { value: "bhairav", label: "Bhairav", description: "Morning raga, serious and contemplative" },
  { value: "bhairavi", label: "Bhairavi", description: "All-time raga, expressive and emotional" },
  { value: "bilawal", label: "Bilawal", description: "Morning raga, bright and optimistic" },
  { value: "kafi", label: "Kafi", description: "Evening raga, romantic and lyrical" },
  { value: "asavari", label: "Asavari", description: "Morning raga, devotional and serene" },
];

const TALAS = [
  { value: "teental", label: "Teental", beats: "16 beats", description: "Most common tala in Hindustani music" },
  { value: "jhaptal", label: "Jhaptal", beats: "10 beats", description: "Popular medium-tempo tala" },
  { value: "rupak", label: "Rupak", beats: "7 beats", description: "Asymmetric tala with unique feel" },
  { value: "ektaal", label: "Ektaal", beats: "12 beats", description: "Slow, majestic compositions" },
  { value: "adi", label: "Adi (Carnatic)", beats: "8 beats", description: "Most common Carnatic tala" },
];

const INSTRUMENTS = [
  { value: "sitar", label: "Sitar", tradition: "Hindustani" },
  { value: "tabla", label: "Tabla", tradition: "Hindustani" },
  { value: "bansuri", label: "Bansuri (Flute)", tradition: "Hindustani" },
  { value: "sarod", label: "Sarod", tradition: "Hindustani" },
  { value: "veena", label: "Veena", tradition: "Carnatic" },
  { value: "mridangam", label: "Mridangam", tradition: "Carnatic" },
  { value: "violin", label: "Violin", tradition: "Both" },
  { value: "tanpura", label: "Tanpura", tradition: "Both" },
];

const MOODS = [
  "Devotional",
  "Romantic",
  "Serene",
  "Energetic",
  "Contemplative",
  "Joyful",
  "Melancholic",
];

const LANGUAGES = [
  { value: "hindi", label: "Hindi", description: "Most common language for Indian classical music" },
  { value: "sanskrit", label: "Sanskrit", description: "Traditional language for classical compositions" },
  { value: "english", label: "English", description: "English lyrics" },
  { value: "tamil", label: "Tamil", description: "South Indian classical tradition" },
  { value: "telugu", label: "Telugu", description: "Carnatic music tradition" },
  { value: "bengali", label: "Bengali", description: "Eastern Indian classical tradition" },
  { value: "marathi", label: "Marathi", description: "Western Indian classical tradition" },
  { value: "gujarati", label: "Gujarati", description: "Western Indian classical tradition" },
  { value: "punjabi", label: "Punjabi", description: "North Indian classical tradition" },
  { value: "kannada", label: "Kannada", description: "South Indian classical tradition" },
  { value: "malayalam", label: "Malayalam", description: "South Indian classical tradition" },
  { value: "instrumental", label: "Instrumental Only", description: "No vocals, pure instrumental" },
];

export default function Generator() {
  const { toast } = useToast();
  const [raga, setRaga] = useState("");
  const [tala, setTala] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState([100]);
  const [mood, setMood] = useState("");
  const [gender, setGender] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [generatedComposition, setGeneratedComposition] = useState<any>(null);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const generationStartRef = useRef<number>(0);

  const generateMutation = useMutation({
    mutationFn: async (data: MusicGenerationRequest) => {
      const res = await apiRequest("POST", "/api/generate-music", data);
      return await res.json();
    },
    onSuccess: async (data) => {
      // API.box returns taskId - we need to poll for status
      if (data.taskId) {
        // Start polling for status
        const pollStatus = async (taskId: string) => {
          const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
          let attempts = 0;

          const checkStatus = async (): Promise<void> => {
            try {
              const res = await apiRequest("GET", `/api/generate-music/${taskId}/status`);
              const status = await res.json();

              if (status.status === "complete" && status.audioUrl) {
                // Generation complete - update composition
                const updatedComposition = {
                  ...data,
                  audioUrl: status.audioUrl,
                  title: status.title || `${data.raga} in ${data.tala}`,
                };
                setGeneratedComposition(updatedComposition);
                setAudioSrc(status.audioUrl);
                setIsGenerating(false);
                
                // Automatically save to library
                try {
                  const languageLabel = data.language 
                    ? LANGUAGES.find((l) => l.value === data.language)?.label || data.language 
                    : null;
                  saveComposition({
                    title: updatedComposition.title,
                    raga: data.raga,
                    tala: data.tala,
                    instruments: data.instruments,
                    tempo: data.tempo,
                    mood: data.mood,
                    audioUrl: status.audioUrl,
                    description: `Generated ${data.raga} composition in ${data.tala} with ${data.instruments.join(", ")}${languageLabel ? ` in ${languageLabel}` : ""}`,
                  });
                } catch (error) {
                  console.error("Error saving composition:", error);
                }
                
                toast({
                  title: "Composition Generated!",
                  description: "Your classical music piece is ready to play and has been saved to your library.",
                });
              } else if (status.status === "failed") {
                setIsGenerating(false);
                toast({
                  title: "Generation Failed",
                  description: "Music generation failed. Please try again.",
                  variant: "destructive",
                });
              } else if (attempts < maxAttempts) {
                // Still processing - poll again after 5 seconds
                attempts++;
                setTimeout(checkStatus, 5000);
              } else {
                // Timeout
                setIsGenerating(false);
                toast({
                  title: "Generation Timeout",
                  description: "Generation is taking longer than expected. Please check back later.",
                  variant: "destructive",
                });
              }
            } catch (error: any) {
              console.error("Status check error:", error);
              if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStatus, 5000);
              } else {
                setIsGenerating(false);
                toast({
                  title: "Status Check Failed",
                  description: "Unable to check generation status. Please try again later.",
                  variant: "destructive",
                });
              }
            }
          };

          // Start polling after 2 seconds
          setTimeout(checkStatus, 2000);
        };

        pollStatus(data.taskId);
      } else {
        // Fallback for immediate response (shouldn't happen with API.box)
        setGeneratedComposition(data);
        setIsGenerating(false);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to generate composition. Please try again.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleGenerate = () => {
    if (!raga || !tala || selectedInstruments.length === 0 || !mood) {
      toast({
        title: "Missing Information",
        description: "Please select raga, tala, at least one instrument, and mood.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    generationStartRef.current = Date.now();

    // OLD MUSIC GENERATION CODE - COMMENTED OUT
    // These special cases played local MP3 files instead of using the API
    // Now all music generation goes through the API.box API
    
    /*
    // Special case: Yaman + Teental (16 beats) + Sitar + Devotional -> play cranberry_head_flan.mp3
    const hasSitar = selectedInstruments.includes("sitar");
    // Asavari + Teental + Sitar + Devotional -> magnum_p_i.mp3
    if (raga === "asavari" && tala === "teental" && hasSitar && mood === "Devotional") {
      const filePath = "/magnum_p_i.mp3";
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "magnum_p_i.mp3",
          description: "Generated devotional piece in Raga Asavari set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing magnum_p_i.mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }

    // Kafi + Teental + Sitar + Devotional -> sidi_wesalak.mp3
    if (raga === "kafi" && tala === "teental" && hasSitar && mood === "Devotional") {
      const filePath = "/sidi_wesalak.mp3";
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "sidi_wesalak.mp3",
          description: "Generated devotional piece in Raga Kafi set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing sidi_wesalak.mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }

    // Bilawal + Teental + Sitar + Devotional -> lee_know.mp3
    if (raga === "bilawal" && tala === "teental" && hasSitar && mood === "Devotional") {
      const filePath = "/lee_know.mp3";
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "lee_know.mp3",
          description: "Generated devotional piece in Raga Bilawal set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing lee_know.mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }

    // Bhairavi + Teental + Sitar + Devotional -> ia_ia_ahhh_yes_yes (1).mp3
    if (raga === "bhairavi" && tala === "teental" && hasSitar && mood === "Devotional") {
      const rawPath = "/ia_ia_ahhh_yes_yes.mp3";
      const filePath = encodeURI(rawPath);
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "ia_ia_ahhh_yes_yes (1).mp3",
          description: "Generated devotional piece in Raga Bhairavi set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing ia_ia_ahhh_yes_yes (1).mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }

    // Bhairav + Teental + Sitar + Devotional -> i_m_white_i_m_black.mp3
    if (raga === "bhairav" && tala === "teental" && hasSitar && mood === "Devotional") {
      const filePath = "/i_m_white_i_m_black.mp3";
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "i_m_white_i_m_black.mp3",
          description: "Generated devotional piece in Raga Bhairav set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing i_m_white_i_m_black.mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }

    if (raga === "yaman" && tala === "teental" && hasSitar && mood === "Devotional") {
      const filePath = "/cranberry_head_flan.mp3";
      const elapsed = Date.now() - generationStartRef.current;
      const waitMs = Math.max(0, 20000 - elapsed);
      setTimeout(() => {
        setGeneratedComposition({
          title: "cranberry_head_flan.mp3",
          description: "Generated devotional piece in Raga Yaman set to Teental with Sitar.",
          notation: "",
        });
        setAudioSrc(filePath);
        // Attempt autoplay after state update
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
              setIsPlaying(false);
            });
          }
        }, 0);
        toast({
          title: "Composition Generated!",
          description: "Playing cranberry_head_flan.mp3",
        });
        setIsGenerating(false);
      }, waitMs);
      return;
    }
    */

    // Always use API.box for music generation
    generateMutation.mutate({
      raga,
      tala,
      instruments: selectedInstruments,
      tempo: tempo[0],
      mood,
      gender: gender || undefined, // Include gender if selected
      language: language || undefined, // Include language if selected
    });
  };

  const selectedRaga = RAGAS.find((r) => r.value === raga);
  const selectedTala = TALAS.find((t) => t.value === tala);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="generator-title">
            AI Music Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create authentic classical compositions by selecting traditional ragas, talas, and instruments
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card data-testid="card-raga-selection">
              <CardHeader>
                <CardTitle>Select Raga</CardTitle>
                <CardDescription>Choose the melodic framework for your composition</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={raga} onValueChange={setRaga}>
                  <SelectTrigger data-testid="select-raga">
                    <SelectValue placeholder="Choose a raga" />
                  </SelectTrigger>
                  <SelectContent>
                    {RAGAS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRaga && (
                  <p className="text-sm text-muted-foreground mt-3" data-testid="raga-description">
                    {selectedRaga.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-tala-selection">
              <CardHeader>
                <CardTitle>Select Tala</CardTitle>
                <CardDescription>Choose the rhythmic cycle for your composition</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={tala} onValueChange={setTala}>
                  <SelectTrigger data-testid="select-tala">
                    <SelectValue placeholder="Choose a tala" />
                  </SelectTrigger>
                  <SelectContent>
                    {TALAS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} ({t.beats})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTala && (
                  <p className="text-sm text-muted-foreground mt-3" data-testid="tala-description">
                    {selectedTala.description}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card data-testid="card-instrument-selection">
              <CardHeader>
                <CardTitle>Select Instruments</CardTitle>
                <CardDescription>Choose one or more instruments for your composition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {INSTRUMENTS.map((instrument) => (
                    <Button
                      key={instrument.value}
                      variant={selectedInstruments.includes(instrument.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInstrument(instrument.value)}
                      className="justify-start h-auto py-3 px-4"
                      data-testid={`button-instrument-${instrument.value}`}
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{instrument.label}</div>
                        <div className="text-xs opacity-80">{instrument.tradition}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-tempo-selection">
              <CardHeader>
                <CardTitle>Tempo</CardTitle>
                <CardDescription>
                  Adjust the speed of your composition (40-200 BPM)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Slider
                    value={tempo}
                    onValueChange={setTempo}
                    min={40}
                    max={200}
                    step={5}
                    className="w-full"
                    data-testid="slider-tempo"
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Slow (40 BPM)</span>
                    <span className="font-semibold" data-testid="tempo-value">{tempo[0]} BPM</span>
                    <span className="text-muted-foreground">Fast (200 BPM)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-mood-selection">
              <CardHeader>
                <CardTitle>Mood</CardTitle>
                <CardDescription>Select the emotional character of your composition</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Badge
                      key={m}
                      variant={mood === m ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm hover-elevate active-elevate-2"
                      onClick={() => setMood(m)}
                      data-testid={`badge-mood-${m.toLowerCase()}`}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-voice-gender">
              <CardHeader>
                <CardTitle>Voice Gender</CardTitle>
                <CardDescription>Select Male or Female voice preference (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="gender-male" value="male" />
                    <Label htmlFor="gender-male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem id="gender-female" value="female" />
                    <Label htmlFor="gender-female" className="cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card data-testid="card-language-selection">
              <CardHeader>
                <CardTitle>Language</CardTitle>
                <CardDescription>Select the language for lyrics/vocals (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger data-testid="select-language">
                    <SelectValue placeholder="Choose a language (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {language && (
                  <p className="text-sm text-muted-foreground mt-3" data-testid="language-description">
                    {LANGUAGES.find((l) => l.value === language)?.description}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Generate Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raga:</span>
                    <span className="font-medium" data-testid="summary-raga">
                      {raga || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tala:</span>
                    <span className="font-medium" data-testid="summary-tala">
                      {tala || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Instruments:</span>
                    <span className="font-medium" data-testid="summary-instruments">
                      {selectedInstruments.length || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tempo:</span>
                    <span className="font-medium" data-testid="summary-tempo">
                      {tempo[0]} BPM
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mood:</span>
                    <span className="font-medium" data-testid="summary-mood">
                      {mood || "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Voice Gender:</span>
                    <span className="font-medium" data-testid="summary-gender">
                      {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "Not selected"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language:</span>
                    <span className="font-medium" data-testid="summary-language">
                      {language ? LANGUAGES.find((l) => l.value === language)?.label || language : "Not selected"}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                  size="lg"
                  data-testid="button-generate"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Generate Music
                    </>
                  )}
                </Button>

                {generatedComposition && (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2" data-testid="composition-title">
                        {generatedComposition.title}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid="composition-description">
                        {generatedComposition.description}
                      </p>
                    </div>

                    {/* Hidden audio element used for playback control */}
                    <audio
                      ref={audioRef}
                      src={audioSrc || undefined}
                      preload="auto"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => {
                        setIsPlaying(false);
                        toast({
                          title: "Audio Error",
                          description: `Could not load ${audioSrc || "audio source"}. Ensure the file exists in client/public.`,
                          variant: "destructive",
                        });
                      }}
                    />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        data-testid="button-play"
                        onClick={() => {
                          if (!audioRef.current) return;
                          // Ensure latest source is loaded before attempting playback
                          try {
                            audioRef.current.load();
                          } catch {}
                          if (isPlaying) {
                            audioRef.current.pause();
                            setIsPlaying(false);
                          } else {
                            audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
                          }
                        }}
                        disabled={!audioSrc}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        {isPlaying ? "Pause" : "Play"}
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1"
                        data-testid="button-download"
                        disabled={!audioSrc}
                      >
                        <a href={audioSrc || "#"} download>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </a>
                      </Button>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground text-center">
                        ✓ Saved to your library
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
