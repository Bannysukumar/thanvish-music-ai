import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Download, Loader2, Music } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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

export default function Generator() {
  const { toast } = useToast();
  const [raga, setRaga] = useState("");
  const [tala, setTala] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState([100]);
  const [mood, setMood] = useState("");
  const [generatedComposition, setGeneratedComposition] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: MusicGenerationRequest) => {
      const res = await apiRequest("POST", "/api/generate-music", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedComposition(data);
      toast({
        title: "Composition Generated!",
        description: "Your classical music piece is ready to play.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || "Failed to generate composition. Please try again.";
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
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

    generateMutation.mutate({
      raga,
      tala,
      instruments: selectedInstruments,
      tempo: tempo[0],
      mood,
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
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={generateMutation.isPending}
                  className="w-full"
                  size="lg"
                  data-testid="button-generate"
                >
                  {generateMutation.isPending ? (
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

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" data-testid="button-play">
                        <Play className="w-4 h-4 mr-2" />
                        Play
                      </Button>
                      <Button variant="outline" className="flex-1" data-testid="button-download">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
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
