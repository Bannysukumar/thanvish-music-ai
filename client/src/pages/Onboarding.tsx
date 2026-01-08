import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

// Import constants from Generator (or define them here)
const RAGAS = [
  { value: "yaman", label: "Yaman", description: "Evening raga, peaceful and devotional", tradition: "Hindustani" },
  { value: "bhairav", label: "Bhairav", description: "Morning raga, serious and contemplative", tradition: "Hindustani" },
  { value: "bhairavi", label: "Bhairavi", description: "All-time raga, expressive and emotional", tradition: "Hindustani" },
  { value: "bilawal", label: "Bilawal", description: "Morning raga, bright and optimistic", tradition: "Hindustani" },
  { value: "kafi", label: "Kafi", description: "Evening raga, romantic and lyrical", tradition: "Hindustani" },
  { value: "asavari", label: "Asavari", description: "Morning raga, devotional and serene", tradition: "Hindustani" },
  { value: "kalyani_hindustani", label: "Kalyani", description: "Evening raga, majestic and uplifting", tradition: "Hindustani" },
  { value: "darbari", label: "Darbari", description: "Night raga, deep and meditative", tradition: "Hindustani" },
  { value: "malkauns", label: "Malkauns", description: "Night raga, serious and profound", tradition: "Hindustani" },
  { value: "todi_hindustani", label: "Todi", description: "Morning raga, devotional and contemplative", tradition: "Hindustani" },
  { value: "purvi", label: "Purvi", description: "Evening raga, complex and introspective", tradition: "Hindustani" },
  { value: "marwa", label: "Marwa", description: "Evening raga, serene and spiritual", tradition: "Hindustani" },
  { value: "bageshri", label: "Bageshri", description: "Night raga, romantic and melancholic", tradition: "Hindustani" },
  { value: "shuddh_sarang", label: "Shuddh Sarang", description: "Afternoon raga, bright and cheerful", tradition: "Hindustani" },
  { value: "bihag", label: "Bihag", description: "Night raga, romantic and graceful", tradition: "Hindustani" },
  { value: "shankarabharanam", label: "Shankarabharanam", description: "Evening raga, majestic and uplifting", tradition: "Carnatic" },
  { value: "kalyani_carnatic", label: "Kalyani", description: "Evening raga, bright and joyful", tradition: "Carnatic" },
  { value: "thodi", label: "Thodi", description: "Morning raga, devotional and contemplative", tradition: "Carnatic" },
  { value: "bhairavi_carnatic", label: "Bhairavi", description: "Morning raga, devotional and serene", tradition: "Carnatic" },
  { value: "kharaharapriya", label: "Kharaharapriya", description: "Evening raga, expressive and emotional", tradition: "Carnatic" },
  { value: "harikambhoji", label: "Harikambhoji", description: "Evening raga, joyful and uplifting", tradition: "Carnatic" },
  { value: "natabhairavi", label: "Natabhairavi", description: "Morning raga, devotional and peaceful", tradition: "Carnatic" },
  { value: "mayamalavagowla", label: "Mayamalavagowla", description: "Morning raga, foundational and serene", tradition: "Carnatic" },
  { value: "mohanam", label: "Mohanam", description: "Evening raga, romantic and melodious", tradition: "Carnatic" },
  { value: "hindolam", label: "Hindolam", description: "Evening raga, bright and cheerful", tradition: "Carnatic" },
  { value: "shubhapantuvarali", label: "Shubhapantuvarali", description: "Evening raga, melancholic and expressive", tradition: "Carnatic" },
  { value: "madhyamavati", label: "Madhyamavati", description: "Evening raga, devotional and peaceful", tradition: "Carnatic" },
  { value: "abheri", label: "Abheri", description: "Evening raga, romantic and lyrical", tradition: "Carnatic" },
  { value: "sahana", label: "Sahana", description: "Evening raga, romantic and expressive", tradition: "Carnatic" },
];

const TALAS = [
  { value: "teental", label: "Teental", beats: "16 beats", description: "Most common tala in Hindustani music", tradition: "Hindustani" },
  { value: "jhaptal", label: "Jhaptal", beats: "10 beats", description: "Popular medium-tempo tala", tradition: "Hindustani" },
  { value: "rupak", label: "Rupak", beats: "7 beats", description: "Asymmetric tala with unique feel", tradition: "Hindustani" },
  { value: "ektaal", label: "Ektaal", beats: "12 beats", description: "Slow, majestic compositions", tradition: "Hindustani" },
  { value: "dadra", label: "Dadra", beats: "6 beats", description: "Light classical and semi-classical compositions", tradition: "Hindustani" },
  { value: "keherwa", label: "Keherwa", beats: "8 beats", description: "Common in light music and folk", tradition: "Hindustani" },
  { value: "jhumra", label: "Jhumra", beats: "14 beats", description: "Slow, meditative compositions", tradition: "Hindustani" },
  { value: "tilwada", label: "Tilwada", beats: "16 beats", description: "Slow tempo, devotional compositions", tradition: "Hindustani" },
  { value: "chautal", label: "Chautal", beats: "12 beats", description: "Traditional dhrupad tala", tradition: "Hindustani" },
  { value: "sultal", label: "Sultal", beats: "10 beats", description: "Used in dhrupad style", tradition: "Hindustani" },
  { value: "adi", label: "Adi Tala", beats: "8 beats", description: "Most common Carnatic tala", tradition: "Carnatic" },
  { value: "rupaka", label: "Rupaka Tala", beats: "3 beats", description: "Short, rhythmic tala", tradition: "Carnatic" },
  { value: "misra_chapu", label: "Misra Chapu", beats: "7 beats", description: "Asymmetric, expressive tala", tradition: "Carnatic" },
  { value: "khanda_chapu", label: "Khanda Chapu", beats: "5 beats", description: "Fast-paced, energetic tala", tradition: "Carnatic" },
  { value: "tishra", label: "Tishra Tala", beats: "3 beats", description: "Simple three-beat cycle", tradition: "Carnatic" },
  { value: "jhampe", label: "Jhampe Tala", beats: "10 beats", description: "Medium tempo compositions", tradition: "Carnatic" },
  { value: "ata", label: "Ata Tala", beats: "14 beats", description: "Complex, slow compositions", tradition: "Carnatic" },
  { value: "eka", label: "Eka Tala", beats: "4 beats", description: "Simple four-beat cycle", tradition: "Carnatic" },
];

const INSTRUMENTS = [
  { value: "sitar", label: "Sitar", tradition: "Hindustani" },
  { value: "tabla", label: "Tabla", tradition: "Hindustani" },
  { value: "bansuri", label: "Bansuri (Flute)", tradition: "Hindustani" },
  { value: "sarod", label: "Sarod", tradition: "Hindustani" },
  { value: "santoor", label: "Santoor", tradition: "Hindustani" },
  { value: "shehnai", label: "Shehnai", tradition: "Hindustani" },
  { value: "harmonium", label: "Harmonium", tradition: "Hindustani" },
  { value: "pakhavaj", label: "Pakhavaj", tradition: "Hindustani" },
  { value: "dholak", label: "Dholak", tradition: "Hindustani" },
  { value: "sarangi", label: "Sarangi", tradition: "Hindustani" },
  { value: "veena", label: "Veena", tradition: "Carnatic" },
  { value: "mridangam", label: "Mridangam", tradition: "Carnatic" },
  { value: "ghatam", label: "Ghatam", tradition: "Carnatic" },
  { value: "kanjira", label: "Kanjira", tradition: "Carnatic" },
  { value: "morsing", label: "Morsing (Jaw Harp)", tradition: "Carnatic" },
  { value: "nadaswaram", label: "Nadaswaram", tradition: "Carnatic" },
  { value: "venu", label: "Venu (Carnatic Flute)", tradition: "Carnatic" },
  { value: "violin", label: "Violin", tradition: "Both" },
  { value: "tanpura", label: "Tanpura", tradition: "Both" },
  { value: "flute", label: "Flute (Generic)", tradition: "Both" },
];

const MOODS = [
  "Devotional", "Romantic", "Serene", "Energetic", "Contemplative", "Joyful",
  "Melancholic", "Peaceful", "Meditative", "Mystical", "Celebratory", "Spiritual",
];

const LANGUAGES = [
  { value: "hindi", label: "Hindi", description: "Most common language for Indian classical music" },
  { value: "sanskrit", label: "Sanskrit", description: "Traditional language for classical compositions" },
  { value: "english", label: "English", description: "English lyrics" },
  { value: "tamil", label: "Tamil", description: "South Indian classical tradition" },
  { value: "telugu", label: "Telugu", description: "Carnatic music tradition" },
];

const STEPS = [
  { id: "generationMode", title: "Generation Mode", required: true },
  { id: "tradition", title: "Tradition", required: true },
  { id: "raga", title: "Raga", required: true },
  { id: "tala", title: "Tala", required: true },
  { id: "instruments", title: "Instruments", required: true },
  { id: "tempo", title: "Tempo", required: true },
  { id: "mood", title: "Mood", required: true },
  { id: "gender", title: "Voice Gender", required: false },
  { id: "language", title: "Language", required: false },
];

export default function Onboarding() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [generationMode, setGenerationMode] = useState<"voice_only" | "instrumental_only" | "full_music" | "">("");
  const [tradition, setTradition] = useState<string>("");
  const [raga, setRaga] = useState("");
  const [tala, setTala] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState([100]);
  const [mood, setMood] = useState("");
  const [gender, setGender] = useState<string>("");
  const [language, setLanguage] = useState<string>("");

  const totalSteps = STEPS.length;
  const currentStepData = STEPS[currentStep];

  // Filter based on tradition
  const filteredRagas = tradition ? RAGAS.filter((r) => r.tradition === tradition) : [];
  const filteredTalas = tradition ? TALAS.filter((t) => t.tradition === tradition) : [];
  const filteredInstruments = tradition
    ? INSTRUMENTS.filter((i) => i.tradition === tradition || i.tradition === "Both")
    : INSTRUMENTS;

  const selectedRaga = RAGAS.find((r) => r.value === raga);
  const selectedTala = TALAS.find((t) => t.value === tala);

  // Redirect if not authenticated or if onboarding already completed
  useEffect(() => {
    if (!user || user.isGuest) {
      setLocation("/");
      return;
    }

    // Check if onboarding is already completed
    const checkOnboardingStatus = async () => {
      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // Only redirect to dashboard if onboarding is explicitly completed (true)
          if (userData.onboardingCompleted === true) {
            setLocation("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
    };

    checkOnboardingStatus();
  }, [user, setLocation]);

  const isStepValid = (stepId: string): boolean => {
    switch (stepId) {
      case "generationMode":
        return !!generationMode;
      case "tradition":
        return !!tradition;
      case "raga":
        return !!raga;
      case "tala":
        return !!tala;
      case "instruments":
        return selectedInstruments.length > 0;
      case "tempo":
        return tempo[0] > 0;
      case "mood":
        return !!mood;
      case "gender":
      case "language":
        return true; // Optional
      default:
        return true;
    }
  };

  const canGoNext = (): boolean => {
    if (!currentStepData) return false;
    if (currentStepData.required) {
      return isStepValid(currentStepData.id);
    }
    return true;
  };

  const handleNext = () => {
    if (canGoNext() && currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTraditionChange = (value: string) => {
    setTradition(value);
    setRaga("");
    setTala("");
  };

  const toggleInstrument = (instrument: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(instrument)
        ? prev.filter((i) => i !== instrument)
        : [...prev, instrument]
    );
  };

  const handleFinish = async () => {
    if (!user || user.isGuest) {
      toast({
        title: "Error",
        description: "You must be logged in to save preferences",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const preferences = {
        generationMode,
        tradition,
        raga,
        tala,
        instruments: selectedInstruments,
        tempo: tempo[0],
        mood,
        gender: gender || null,
        language: language || null,
        onboardingCompleted: true,
        onboardingCompletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", user.id), preferences, { merge: true });

      toast({
        title: "Preferences Saved!",
        description: "Your music generation preferences have been saved successfully.",
      });

      // Navigate to dashboard
      setLocation("/dashboard");
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset step when generation mode changes
  useEffect(() => {
    if (!generationMode) {
      setCurrentStep(0);
    }
  }, [generationMode]);

  if (!user || user.isGuest) {
    return null;
  }

  return (
    <div className="min-h-screen py-12 md:py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4">
            Welcome! Let's Set Up Your Preferences
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Help us personalize your music generation experience by telling us about your preferences
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`mt-2 text-xs text-center max-w-[80px] ${
                        isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < totalSteps - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded ${
                        isCompleted ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Step {currentStep + 1} of {totalSteps}: {currentStepData?.title}</CardTitle>
            <CardDescription>
              {currentStepData?.id === "generationMode" && "Select your preferred music generation mode"}
              {currentStepData?.id === "tradition" && "Choose between Hindustani or Carnatic classical tradition"}
              {currentStepData?.id === "raga" && "Select your favorite raga"}
              {currentStepData?.id === "tala" && "Choose your preferred rhythmic pattern"}
              {currentStepData?.id === "instruments" && "Select instruments you love"}
              {currentStepData?.id === "tempo" && "Choose your preferred tempo"}
              {currentStepData?.id === "mood" && "What mood do you prefer in music?"}
              {currentStepData?.id === "gender" && "Voice gender preference (optional)"}
              {currentStepData?.id === "language" && "Preferred language for vocals (optional)"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Generation Mode */}
            {currentStepData?.id === "generationMode" && (
              <RadioGroup
                value={generationMode}
                onValueChange={(value) => setGenerationMode(value as "voice_only" | "instrumental_only" | "full_music")}
                className="space-y-3"
              >
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="voice_only" id="mode-voice-only" />
                  <Label htmlFor="mode-voice-only" className="cursor-pointer flex-1">
                    <div className="font-medium">Voice Only</div>
                    <div className="text-sm text-muted-foreground">Pure vocal audio with no instruments</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="instrumental_only" id="mode-instrumental-only" />
                  <Label htmlFor="mode-instrumental-only" className="cursor-pointer flex-1">
                    <div className="font-medium">Instrumental Only</div>
                    <div className="text-sm text-muted-foreground">Pure instrumental music with no vocals</div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="full_music" id="mode-full-music" />
                  <Label htmlFor="mode-full-music" className="cursor-pointer flex-1">
                    <div className="font-medium">Full Music (Voice + Instruments)</div>
                    <div className="text-sm text-muted-foreground">Complete music with both vocals and instruments</div>
                  </Label>
                </div>
              </RadioGroup>
            )}

            {/* Tradition */}
            {currentStepData?.id === "tradition" && (
              <Select value={tradition} onValueChange={handleTraditionChange}>
                <SelectTrigger className="h-14">
                  <SelectValue placeholder="Select Hindustani or Carnatic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hindustani" className="py-3">
                    <div>
                      <div className="font-medium">Hindustani</div>
                      <div className="text-xs text-muted-foreground">North Indian classical tradition</div>
                    </div>
                  </SelectItem>
                  <SelectItem value="Carnatic" className="py-3">
                    <div>
                      <div className="font-medium">Carnatic</div>
                      <div className="text-xs text-muted-foreground">South Indian classical tradition</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Raga */}
            {currentStepData?.id === "raga" && (
              <div className="space-y-4">
                <Select value={raga} onValueChange={setRaga} disabled={!tradition}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder={tradition ? "Choose a raga" : "First select a tradition"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredRagas.map((r) => (
                      <SelectItem key={r.value} value={r.value} className="py-3">
                        <div>
                          <div className="font-medium">{r.label}</div>
                          <div className="text-xs text-muted-foreground">{r.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedRaga && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">{selectedRaga.label}</p>
                    <p className="text-sm text-muted-foreground">{selectedRaga.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tala */}
            {currentStepData?.id === "tala" && (
              <div className="space-y-4">
                <Select value={tala} onValueChange={setTala} disabled={!tradition}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder={tradition ? "Choose a tala" : "First select a tradition"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTalas.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="py-3">
                        <div>
                          <div className="font-medium">{t.label} ({t.beats})</div>
                          <div className="text-xs text-muted-foreground">{t.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTala && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">{selectedTala.label} ({selectedTala.beats})</p>
                    <p className="text-sm text-muted-foreground">{selectedTala.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Instruments */}
            {currentStepData?.id === "instruments" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-2">
                  {filteredInstruments.map((instrument) => (
                    <Button
                      key={instrument.value}
                      variant={selectedInstruments.includes(instrument.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInstrument(instrument.value)}
                      className="justify-start h-auto py-3 px-4"
                    >
                      <div className="text-left">
                        <div className="font-medium text-sm">{instrument.label}</div>
                        <div className="text-xs opacity-80">{instrument.tradition}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                {selectedInstruments.length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected ({selectedInstruments.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedInstruments.map((inst) => {
                        const instObj = INSTRUMENTS.find((i) => i.value === inst);
                        return (
                          <Badge key={inst} variant="secondary">
                            {instObj?.label || inst}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tempo */}
            {currentStepData?.id === "tempo" && (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="text-5xl font-bold mb-2">{tempo[0]}</div>
                  <div className="text-lg text-muted-foreground">BPM</div>
                </div>
                <Slider
                  value={tempo}
                  onValueChange={setTempo}
                  min={40}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Slow (40 BPM)</span>
                  <span>Fast (200 BPM)</span>
                </div>
              </div>
            )}

            {/* Mood */}
            {currentStepData?.id === "mood" && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 max-h-[400px] overflow-y-auto p-2">
                  {MOODS.map((m) => (
                    <Badge
                      key={m}
                      variant={mood === m ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                      onClick={() => setMood(m)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
                {mood && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected: <span className="font-semibold">{mood}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Voice Gender */}
            {currentStepData?.id === "gender" && (
              <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-6 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem id="gender-male" value="male" />
                  <Label htmlFor="gender-male" className="cursor-pointer text-lg font-medium">Male</Label>
                </div>
                <div className="flex items-center space-x-3 p-6 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem id="gender-female" value="female" />
                  <Label htmlFor="gender-female" className="cursor-pointer text-lg font-medium">Female</Label>
                </div>
              </RadioGroup>
            )}

            {/* Language */}
            {currentStepData?.id === "language" && (
              <div className="space-y-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="h-14">
                    <SelectValue placeholder="Choose a language (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value} className="py-3">
                        <div>
                          <div className="font-medium">{lang.label}</div>
                          <div className="text-xs text-muted-foreground">{lang.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {language && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">{LANGUAGES.find((l) => l.value === language)?.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {LANGUAGES.find((l) => l.value === language)?.description}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        {currentStepData && (
          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext} disabled={!canGoNext()} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinish}
                disabled={isSaving || !canGoNext()}
                className="gap-2"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Complete Setup
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

