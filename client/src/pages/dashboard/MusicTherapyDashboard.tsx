import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  HeartPulse,
  MoonStar,
  Brain,
  Sunrise,
  Activity,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Heart as HeartIcon,
  Clock,
  Music4,
  Loader2,
  AlertCircle,
  Shield,
  Volume2,
  Ruler,
  Weight,
  Heart,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { useHoroscope } from "@/contexts/HoroscopeContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { saveComposition } from "@/lib/compositionStorage";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import type { MusicGenerationRequest } from "@shared/schema";

const EMOTIONAL_STATES = [
  "Calm & Balanced",
  "Stressed & Anxious",
  "Happy & Energetic",
  "Sad & Melancholic",
  "Angry & Frustrated",
  "Confused & Uncertain",
  "Peaceful & Content",
  "Restless & Agitated"
];

const LIFE_FOCUS_OPTIONS = [
  { value: "career", label: "Career Growth" },
  { value: "peace", label: "Inner Peace" },
  { value: "healing", label: "Emotional Healing" },
  { value: "love", label: "Love & Relationships" },
  { value: "confidence", label: "Confidence Building" },
];

const COMMON_HEALTH_CONDITIONS = [
  "Anxiety",
  "Depression",
  "Insomnia",
  "Chronic Pain",
  "High Blood Pressure",
  "Diabetes",
  "Asthma",
  "Migraine",
  "Arthritis",
  "Stress",
  "Fatigue",
  "Digestive Issues",
  "None",
];

// Therapy options
const THERAPY_OPTIONS = [
  { 
    value: "stress_relief", 
    label: "Stress Relief", 
    icon: HeartPulse,
    description: "Calming music to reduce stress and anxiety",
    duration: "20 minutes"
  },
  { 
    value: "emotional_healing", 
    label: "Emotional Healing", 
    icon: Sparkles,
    description: "Soothing music for emotional recovery",
    duration: "35 minutes"
  },
  { 
    value: "deep_sleep", 
    label: "Deep Sleep", 
    icon: MoonStar,
    description: "Peaceful melodies for restful sleep",
    duration: "30 minutes"
  },
  { 
    value: "focus_study", 
    label: "Focus & Study", 
    icon: Brain,
    description: "Enhancing concentration and mental clarity",
    duration: "40 minutes"
  },
  { 
    value: "spiritual_calm", 
    label: "Spiritual Calm", 
    icon: Sunrise,
    description: "Meditative music for inner peace",
    duration: "25 minutes"
  },
  { 
    value: "confidence_boost", 
    label: "Confidence Boost", 
    icon: Activity,
    description: "Empowering music to build self-confidence",
    duration: "30 minutes"
  },
];

// Session timer options
const TIMER_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 20, label: "20 minutes" },
];

/**
 * Convert horoscope data to music generation parameters
 */
function convertHoroscopeToMusicParams(
  therapyType: string,
  profile: any,
  insights: any
): Partial<MusicGenerationRequest> {
  // Map therapy types to moods
  const therapyMoodMap: Record<string, string> = {
    stress_relief: "calm",
    emotional_healing: "soothing",
    deep_sleep: "peaceful",
    focus_study: "energetic",
    spiritual_calm: "meditative",
    confidence_boost: "uplifting",
  };

  // Map emotional state to tempo - adjust based on actual emotional state
  const emotionalStateToTempo: Record<string, number> = {
    "Calm & Balanced": 75,
    "Stressed & Anxious": 60,
    "Happy & Energetic": 100,
    "Sad & Melancholic": 65,
    "Angry & Frustrated": 70,
    "Confused & Uncertain": 72,
    "Peaceful & Content": 70,
    "Restless & Agitated": 85,
  };

  // Map energy level to tempo (as fallback)
  const energyLevelToTempo: Record<string, number> = {
    Low: 60,
    Medium: 80,
    High: 100,
  };

  // Map zodiac to raga preferences
  const zodiacRagaMap: Record<string, string[]> = {
    aries: ["yaman", "bilawal"],
    taurus: ["bhairav", "malkauns"],
    gemini: ["bhairavi", "kafi"],
    cancer: ["bhairavi", "yaman"],
    leo: ["kalyani_hindustani", "shankarabharanam"],
    virgo: ["todi_hindustani", "thodi"],
    libra: ["kafi", "harikambhoji"],
    scorpio: ["darbari", "kharaharapriya"],
    sagittarius: ["bihag", "mohanam"],
    capricorn: ["bhairav", "mayamalavagowla"],
    aquarius: ["shuddh_sarang", "hindolam"],
    pisces: ["bageshri", "abheri"],
  };

  // Map therapy type to tala
  const therapyTalaMap: Record<string, string> = {
    stress_relief: "teental",
    emotional_healing: "rupak",
    deep_sleep: "ektaal",
    focus_study: "jhaptal",
    spiritual_calm: "rupak",
    confidence_boost: "teental",
  };

  const mood = therapyMoodMap[therapyType] || "calm";
  // Use emotional state for tempo, fallback to energy level
  const tempo = emotionalStateToTempo[profile?.currentEmotionalState || ""] || 
                energyLevelToTempo[insights?.energyLevel || "Medium"] || 80;
  const ragaOptions = zodiacRagaMap[profile?.zodiacSign || "aries"] || ["yaman"];
  const raga = ragaOptions[0];
  const tala = therapyTalaMap[therapyType] || "teental";

  // Map therapy type to instruments
  const therapyInstruments: Record<string, string[]> = {
    stress_relief: ["bansuri", "santoor", "tanpura"],
    emotional_healing: ["sarangi", "piano", "bansuri"],
    deep_sleep: ["veena", "tanpura", "bansuri"],
    focus_study: ["sitar", "violin", "tabla"],
    spiritual_calm: ["tanpura", "bansuri", "mridangam"],
    confidence_boost: ["sitar", "tabla", "harmonium"],
  };

  const instruments = therapyInstruments[therapyType] || ["bansuri", "tanpura"];

  // Build comprehensive personalized prompt with ALL user selections
  const therapyLabel = therapyType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const zodiacSign = profile?.zodiacSign || "aries";
  const rasi = profile?.rasi || "Rasi";
  const emotionalState = profile?.currentEmotionalState || "calm";
  const lifeFocus = profile?.lifeFocus || "balance";
  const energyLevel = insights?.energyLevel || "Medium";
  const stressSensitivity = insights?.stressSensitivity || "Medium";
  const healingNeeds = insights?.healingNeeds?.join(", ") || "balance";
  const primaryHealingNeed = insights?.healingNeeds?.[0] || "balance";
  const age = profile?.age || 0;
  const height = profile?.height || "";
  const weight = profile?.weight || "";
  const diseases = (profile as any)?.diseases || "";

  // Build comprehensive personalized prompt with ALL user selections including physical data
  let prompt = `Create an instrumental therapeutic music composition for ${therapyLabel} therapy. Therapy Type: ${therapyLabel}. Zodiac Sign: ${zodiacSign} (${rasi}). Age: ${age} years.`;
  
  if (height) prompt += ` Height: ${height}.`;
  if (weight) prompt += ` Weight: ${weight}.`;
  if (diseases && diseases !== "None") prompt += ` Health Conditions: ${diseases}.`;
  
  prompt += ` Emotional State: ${emotionalState}. Life Focus: ${lifeFocus}. Energy Level: ${energyLevel}. Stress Sensitivity: ${stressSensitivity}. Healing Needs: ${healingNeeds}. Use Raga ${raga} with Tala ${tala}, featuring ${instruments.join(", ")}. Tempo: ${tempo} BPM. Mood: ${mood}. The music should help with ${primaryHealingNeed} and support ${lifeFocus}.`;
  
  if (diseases && diseases !== "None") {
    prompt += ` The music should be therapeutic for ${diseases} condition.`;
  }
  
  prompt += ` Personalized for ${zodiacSign} zodiac sign with ${mood} therapeutic mood.`;

  return {
    generationMode: "instrumental_only",
    raga,
    tala,
    instruments,
    tempo,
    mood,
    prompt: prompt.substring(0, 500), // Ensure prompt length limit
  };
}

export default function MusicTherapyDashboard() {
  const { profile, insights, setProfile, setInsights } = useHoroscope();
  const { toast } = useToast();
  const [location] = useLocation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const [selectedTherapy, setSelectedTherapy] = useState<string>("");
  const [sessionTimer, setSessionTimer] = useState<number>(10);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{
    url: string;
    title: string;
    therapyType: string;
    zodiacSign: string;
  } | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hasAutoGenerated, setHasAutoGenerated] = useState(false);

  // Step definitions
  const steps = [
    { id: "physical", title: "Physical & Emotional", required: true },
    { id: "therapy", title: "Therapy Type", required: true },
    { id: "timer", title: "Session Timer", required: false },
    { id: "generate", title: "Generate", required: true },
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  // Step validation
  const isStepValid = (stepId: string): boolean => {
    switch (stepId) {
      case "physical":
        return !!(physicalEmotionalData.currentEmotionalState && physicalEmotionalData.lifeFocus);
      case "therapy":
        return !!selectedTherapy;
      case "timer":
        return true; // Always valid
      case "generate":
        return true; // Always valid, just needs to be clicked
      default:
        return false;
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

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the current step
    if (stepIndex <= currentStep || isStepValid(steps[stepIndex]?.id || "")) {
      setCurrentStep(stepIndex);
    }
  };

  // Physical & Emotional State form data
  const [physicalEmotionalData, setPhysicalEmotionalData] = useState({
    height: "",
    weight: "",
    diseases: "",
    currentEmotionalState: "",
    lifeFocus: "",
  });

  // Load physical/emotional data from profile when profile changes
  useEffect(() => {
    if (profile) {
      setPhysicalEmotionalData({
        height: profile.height || "",
        weight: profile.weight || "",
        diseases: (profile as any).diseases || "",
        currentEmotionalState: profile.currentEmotionalState || "",
        lifeFocus: profile.lifeFocus || "",
      });
    }
  }, [profile]);

  // Update profile when physical/emotional data changes
  const updateProfileWithPhysicalEmotional = () => {
    if (profile) {
      const updatedProfile = {
        ...profile,
        height: physicalEmotionalData.height,
        weight: physicalEmotionalData.weight,
        diseases: physicalEmotionalData.diseases,
        currentEmotionalState: physicalEmotionalData.currentEmotionalState,
        lifeFocus: physicalEmotionalData.lifeFocus,
      };
      setProfile(updatedProfile);
      
      // Regenerate insights with new data
      const updatedInsights = generateHoroscopeInsights(updatedProfile);
      setInsights(updatedInsights);
    }
  };

  // Generate horoscope insights (simplified version)
  const generateHoroscopeInsights = (profileData: any) => {
    const emotionalInsights: Record<string, string> = {
      "Calm & Balanced": "Your emotional equilibrium is strong. You maintain inner harmony well.",
      "Stressed & Anxious": "You may benefit from calming therapies and stress-relief techniques.",
      "Happy & Energetic": "Your positive energy is flowing. Harness this for personal growth.",
      "Sad & Melancholic": "Consider healing-focused music therapy to uplift your spirit.",
      "Angry & Frustrated": "Focus on release and transformation through therapeutic sound.",
      "Confused & Uncertain": "Meditation and calming music can help bring clarity.",
      "Peaceful & Content": "You're in a state of tranquility. Maintain this balance.",
      "Restless & Agitated": "Grounding practices and steady rhythms can help stabilize your energy.",
    };

    let stressSensitivity: "Low" | "Medium" | "High" = "Medium";
    if (profileData.currentEmotionalState?.includes("Stressed") || 
        profileData.currentEmotionalState?.includes("Anxious") ||
        profileData.currentEmotionalState?.includes("Restless")) {
      stressSensitivity = "High";
    } else if (profileData.currentEmotionalState?.includes("Calm") ||
               profileData.currentEmotionalState?.includes("Peaceful")) {
      stressSensitivity = "Low";
    }

    let energyLevel: "Low" | "Medium" | "High" = "Medium";
    if (profileData.currentEmotionalState?.includes("Energetic") || 
        profileData.currentEmotionalState?.includes("Happy")) {
      energyLevel = "High";
    } else if (profileData.currentEmotionalState?.includes("Sad") ||
               profileData.currentEmotionalState?.includes("Restless")) {
      energyLevel = "Low";
    }

    const healingNeeds: Record<string, string[]> = {
      career: ["Focus enhancement", "Confidence building", "Motivation"],
      peace: ["Stress relief", "Meditation", "Inner calm"],
      healing: ["Emotional release", "Trauma healing", "Self-compassion"],
      love: ["Heart opening", "Connection", "Self-love"],
      confidence: ["Empowerment", "Self-esteem", "Courage"],
    };

    return {
      ...(insights || {}),
      emotionalInsights: emotionalInsights[profileData.currentEmotionalState] || "Your emotional state reflects your current life journey.",
      stressSensitivity,
      energyLevel,
      healingNeeds: healingNeeds[profileData.lifeFocus] || ["Balance", "Harmony", "Well-being"],
      therapyFocus: `Based on your focus on ${LIFE_FOCUS_OPTIONS.find(f => f.value === profileData.lifeFocus)?.label || profileData.lifeFocus}, your music therapy should emphasize ${healingNeeds[profileData.lifeFocus]?.[0] || "balance and healing"}.`,
    };
  };

  // Timer effect
  useEffect(() => {
    if (isPlaying && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            if (audioRef.current) {
              audioRef.current.pause();
            }
            toast({
              title: "Session Complete",
              description: "Your music therapy session has ended.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isPlaying, timeRemaining, toast]);

  // Audio progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.addEventListener("timeupdate", updateProgress);
    return () => audio.removeEventListener("timeupdate", updateProgress);
  }, [currentTrack]);

  const generateMusicMutation = useMutation({
    mutationFn: async (params: Partial<MusicGenerationRequest>) => {
      console.log("Mutation function called with params:", params);
      
      try {
        const response = await fetch("/api/generate-music", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        console.log("API Response status:", response.status);
        console.log("API Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error Response:", errorText);
          let error;
          try {
            error = JSON.parse(errorText);
          } catch {
            error = { error: errorText || "Failed to generate music" };
          }
          throw new Error(error.error || error.message || "Failed to generate music");
        }

        const data = await response.json();
        console.log("API Success Response:", data);
        return data;
      } catch (error) {
        console.error("Mutation function error:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Mutation success:", data);
      toast({
        title: "Music Generation Started",
        description: "Your personalized music is being generated. This may take a few moments.",
      });
      
      if (data.taskId) {
        // Poll for completion
        pollForMusic(data.taskId);
      } else {
        console.error("No taskId in response:", data);
        setIsGenerating(false);
        toast({
          title: "Generation Error",
          description: "Invalid response from server. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate music. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const pollForMusic = async (taskId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`/api/compositions/by-task/${taskId}`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          
          if (data.audioUrl) {
            clearInterval(poll);
            setIsGenerating(false);
            
            const therapyOption = THERAPY_OPTIONS.find(t => t.value === selectedTherapy);
            setCurrentTrack({
              url: data.audioUrl,
              title: `${therapyOption?.label || "Therapy"} Music - ${profile?.zodiacSign || "Horoscope"}`,
              therapyType: selectedTherapy,
              zodiacSign: profile?.zodiacSign || "",
            });

            setTimeRemaining(sessionTimer * 60);
            
            toast({
              title: "Music Generated",
              description: "Your personalized therapy music is ready!",
            });
          }
        }
      } catch (error) {
        console.error("Error polling for music:", error);
      }

      if (attempts >= maxAttempts) {
        clearInterval(poll);
        setIsGenerating(false);
        toast({
          title: "Generation Timeout",
          description: "Music generation is taking longer than expected. Please check your library later.",
          variant: "destructive",
        });
      }
    }, 5000); // Poll every 5 seconds
  };

  // Generate music based only on horoscope data (for auto-generation from Horoscope Profile)
  const generateMusicFromHoroscope = (therapyType: string = "stress_relief") => {
    if (!profile || !insights) {
      toast({
        title: "Horoscope Profile Required",
        description: "Please complete your horoscope profile first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      
      // Use horoscope data only, with default values for missing physical/emotional data
      const profileForMusic = {
        ...profile,
        currentEmotionalState: profile.currentEmotionalState || "Calm & Balanced",
        lifeFocus: profile.lifeFocus || "peace",
        height: profile.height || "",
        weight: profile.weight || "",
        diseases: (profile as any).diseases || "",
      };

      const params = convertHoroscopeToMusicParams(therapyType, profileForMusic, insights);
      
      console.log("Auto-generating music from horoscope with params:", params);
      
      generateMusicMutation.mutate(params);
    } catch (error) {
      console.error("Error in generateMusicFromHoroscope:", error);
      setIsGenerating(false);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = () => {
    console.log("Generate button clicked");
    console.log("Selected Therapy:", selectedTherapy);
    console.log("Profile:", profile);
    console.log("Physical Emotional Data:", physicalEmotionalData);

    if (!selectedTherapy) {
      toast({
        title: "Select Therapy Type",
        description: "Please select a therapy option first.",
        variant: "destructive",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Horoscope Profile Required",
        description: "Please complete your horoscope profile first.",
        variant: "destructive",
      });
      return;
    }

    // If physical/emotional data is not filled, use horoscope data only
    if (!physicalEmotionalData.currentEmotionalState || !physicalEmotionalData.lifeFocus) {
      // Generate based on horoscope only
      generateMusicFromHoroscope(selectedTherapy);
      return;
    }

    try {
      // Ensure profile is updated with latest physical/emotional data
      updateProfileWithPhysicalEmotional();
      
      // Get updated insights
      const currentInsights = insights || generateHoroscopeInsights({
        ...profile,
        ...physicalEmotionalData,
      });

      setIsGenerating(true);
      
      const params = convertHoroscopeToMusicParams(selectedTherapy, {
        ...profile,
        ...physicalEmotionalData,
      }, currentInsights);
      
      console.log("Generated params:", params);
      console.log("Calling generateMusicMutation.mutate");
      
      generateMusicMutation.mutate(params);
    } catch (error) {
      console.error("Error in handleGenerate:", error);
      setIsGenerating(false);
      toast({
        title: "Generation Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  // Auto-generate music when arriving from Horoscope Profile page
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const autoGenerate = searchParams.get("autoGenerate") === "true";
    
    if (autoGenerate && profile && insights && !hasAutoGenerated && !isGenerating && !currentTrack) {
      setHasAutoGenerated(true);
      // Set default therapy type based on horoscope insights
      const defaultTherapy = insights.healingNeeds?.[0]?.toLowerCase().includes("stress") 
        ? "stress_relief" 
        : insights.healingNeeds?.[0]?.toLowerCase().includes("healing")
        ? "emotional_healing"
        : "stress_relief";
      
      setSelectedTherapy(defaultTherapy);
      
      // Small delay to ensure UI is ready
      setTimeout(() => {
        generateMusicFromHoroscope(defaultTherapy);
        toast({
          title: "Generating Your Music",
          description: "Creating personalized music based on your horoscope profile...",
        });
      }, 500);
    }
  }, [profile, insights, hasAutoGenerated, isGenerating, currentTrack, toast]);

  const handlePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play();
    setIsPlaying(true);
    setTimeRemaining(sessionTimer * 60);
  };

  const handleRegenerate = () => {
    if (!currentTrack) return;
    setCurrentTrack(null);
    setIsPlaying(false);
    setProgress(0);
    setTimeRemaining(0);
    handleGenerate();
  };

  const handleSaveToFavorites = () => {
    if (!currentTrack) return;

    try {
      saveComposition({
        title: currentTrack.title,
        raga: profile?.rasi || "N/A",
        tala: "Therapy Session",
        instruments: [],
        tempo: 80,
        mood: selectedTherapy.replace("_", " "),
        audioUrl: currentTrack.url,
        description: `Personalized ${THERAPY_OPTIONS.find(t => t.value === selectedTherapy)?.label || "Therapy"} music for ${profile?.zodiacSign || ""} zodiac sign`,
      });

      setIsFavorited(true);
      toast({
        title: "Saved to Favorites",
        description: "Your therapy music has been saved to your library.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save music to favorites.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="py-6 md:py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 mb-4">
            <Music4 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2">
            Music Therapy
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Personalized healing music powered by Suno AI. Select your therapy goal and generate music tailored to your needs.
          </p>
        </div>

        {/* Progress Indicator */}
        {profile && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isValid = isStepValid(step.id);
                return (
                  <div
                    key={step.id}
                    className="flex items-center flex-1 cursor-pointer"
                    onClick={() => handleStepClick(index)}
                  >
                    <div className="flex flex-col items-center flex-1">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isCompleted
                            ? "bg-pink-600 text-white"
                            : isCurrent
                            ? "bg-pink-600 text-white ring-4 ring-pink-600/20"
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
                          isCompleted ? "bg-pink-600" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Disclaimer */}
      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Disclaimer
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                This experience is intended for relaxation and emotional wellness only and does not replace professional medical or psychological treatment.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horoscope Profile Status */}
      {!profile ? (
        <Card className="bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please complete your{" "}
                <a href="/dashboard/horoscope" className="underline font-medium">
                  Horoscope Profile
                </a>{" "}
                first to get personalized music recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
              {/* Physical & Emotional State */}
          {currentStepData?.id === "physical" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Step {currentStep + 1} of {totalSteps}: Physical & Emotional State
              </CardTitle>
              <CardDescription>
                Tell us about your current physical and emotional state. This helps us create music therapy that's perfectly tailored to your needs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-base">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={profile.age || 0}
                    readOnly
                    className="bg-muted h-11 font-medium"
                  />
                  <p className="text-xs text-muted-foreground">Automatically calculated from your birth date</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height" className="text-base">Height <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                  <Input
                    id="height"
                    value={physicalEmotionalData.height}
                    onChange={(e) => {
                      setPhysicalEmotionalData(prev => ({ ...prev, height: e.target.value }));
                    }}
                    onBlur={updateProfileWithPhysicalEmotional}
                    placeholder="e.g., 5ft 8in or 170 cm"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Your height helps personalize the therapy</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-base">Weight <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                  <Input
                    id="weight"
                    value={physicalEmotionalData.weight}
                    onChange={(e) => {
                      setPhysicalEmotionalData(prev => ({ ...prev, weight: e.target.value }));
                    }}
                    onBlur={updateProfileWithPhysicalEmotional}
                    placeholder="e.g., 70 kg or 154 lbs"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">Your weight helps personalize the therapy</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="emotionalState" className="text-base">
                  Current Emotional State <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={physicalEmotionalData.currentEmotionalState}
                  onValueChange={(value) => {
                    setPhysicalEmotionalData(prev => ({ ...prev, currentEmotionalState: value }));
                    if (profile) {
                      const updatedProfile = { ...profile, currentEmotionalState: value };
                      setProfile(updatedProfile);
                      const updatedInsights = generateHoroscopeInsights(updatedProfile);
                      setInsights(updatedInsights);
                    }
                  }}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="How are you feeling right now?" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMOTIONAL_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lifeFocus" className="text-base">
                  Life Focus <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={physicalEmotionalData.lifeFocus}
                  onValueChange={(value) => {
                    setPhysicalEmotionalData(prev => ({ ...prev, lifeFocus: value }));
                    if (profile) {
                      const updatedProfile = { ...profile, lifeFocus: value };
                      setProfile(updatedProfile);
                      const updatedInsights = generateHoroscopeInsights(updatedProfile);
                      setInsights(updatedInsights);
                    }
                  }}
                  required
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="What would you like to focus on?" />
                  </SelectTrigger>
                  <SelectContent>
                    {LIFE_FOCUS_OPTIONS.map((focus) => (
                      <SelectItem key={focus.value} value={focus.value}>
                        {focus.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diseases">
                  Health Conditions / Diseases (Optional)
                </Label>
                <Select
                  value={physicalEmotionalData.diseases}
                  onValueChange={(value) => {
                    setPhysicalEmotionalData(prev => ({ ...prev, diseases: value }));
                    if (profile) {
                      const updatedProfile = { ...profile, diseases: value };
                      setProfile(updatedProfile);
                      const updatedInsights = generateHoroscopeInsights(updatedProfile);
                      setInsights(updatedInsights);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select any health conditions (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_HEALTH_CONDITIONS.map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This helps us personalize the music therapy for your specific needs
                </p>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Personalized Info Display */}
          {insights && currentStepData?.id === "physical" && (
            <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Personalized for You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{profile.zodiacSign.toUpperCase()}</Badge>
                  <Badge variant="secondary">{insights.energyLevel} Energy</Badge>
                  <Badge variant="secondary">{insights.stressSensitivity} Stress Sensitivity</Badge>
                  <Badge variant="secondary">{insights.healingNeeds?.[0] || "Balance"}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

          {/* Therapy Selection */}
          {currentStepData?.id === "therapy" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-pink-600" />
                Step {currentStep + 1} of {totalSteps}: Select Therapy Type
              </CardTitle>
              <CardDescription>
                Choose the therapy goal that matches your current needs. Each therapy type is designed to address specific emotional and physical wellness goals.
              </CardDescription>
            </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THERAPY_OPTIONS.map((therapy) => {
              const Icon = therapy.icon;
              const isSelected = selectedTherapy === therapy.value;
              return (
                <Button
                  key={therapy.value}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "h-auto flex-col items-start p-4 gap-2",
                    isSelected && "bg-gradient-to-br from-pink-500 to-rose-600 text-white"
                  )}
                  onClick={() => setSelectedTherapy(therapy.value)}
                >
                  <Icon className="h-6 w-6" />
                  <div className="text-left">
                    <div className="font-semibold">{therapy.label}</div>
                    <div className="text-xs opacity-80 mt-1">{therapy.description}</div>
                    <div className="text-xs opacity-60 mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {therapy.duration}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Session Timer Selection */}
      {currentStepData?.id === "timer" && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-pink-600" />
            Step {currentStep + 1} of {totalSteps}: Session Timer
          </CardTitle>
              <CardDescription>
                Set how long you'd like your therapy session to last. The music will play for the selected duration.
              </CardDescription>
            </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {TIMER_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant={sessionTimer === option.value ? "default" : "outline"}
                onClick={() => {
                  setSessionTimer(option.value);
                  setTimeRemaining(option.value * 60);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Generate Step */}
      {currentStepData?.id === "generate" && (
      <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Step {currentStep + 1} of {totalSteps}: Generate Your Therapy Music
          </CardTitle>
          <CardDescription>
            Review your selections and generate personalized music therapy. Make sure all information is correct before proceeding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Emotional State</p>
                <p className="font-medium">{physicalEmotionalData.currentEmotionalState || "Not selected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Life Focus</p>
                <p className="font-medium">{LIFE_FOCUS_OPTIONS.find(f => f.value === physicalEmotionalData.lifeFocus)?.label || physicalEmotionalData.lifeFocus || "Not selected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Therapy Type</p>
                <p className="font-medium">{THERAPY_OPTIONS.find(t => t.value === selectedTherapy)?.label || "Not selected"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Session Duration</p>
                <p className="font-medium">{TIMER_OPTIONS.find(t => t.value === sessionTimer)?.label || `${sessionTimer} minutes`}</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log("Button clicked, calling handleGenerate");
                handleGenerate();
              }}
              disabled={isGenerating || !selectedTherapy}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white min-w-[280px] h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating Music...
                </>
              ) : (
                <>
                  Generate Therapy Music
                  <Sparkles className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            {!selectedTherapy && (
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Please complete all previous steps before generating music.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Navigation Buttons */}
      {currentStepData && currentStepData.id !== "generate" && (
        <div className="flex justify-between gap-4 pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Music Player */}
      {currentTrack && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Music4 className="h-5 w-5" />
                {currentTrack.title}
              </span>
              <Badge variant="secondary">{currentTrack.therapyType.replace("_", " ")}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden Audio Element */}
            <audio
              ref={audioRef}
              src={currentTrack.url}
              onEnded={() => {
                setIsPlaying(false);
                setProgress(0);
              }}
            />

            {/* Progress Bar */}
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(Math.floor((progress / 100) * (sessionTimer * 60)))}</span>
                <span>{formatTime(timeRemaining)} remaining</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleReplay}
                title="Replay"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <Button
                size="lg"
                onClick={handlePlayPause}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white"
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Play
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleRegenerate}
                title="Regenerate Variation"
              >
                <Sparkles className="h-5 w-5" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSaveToFavorites}
                title="Save to Favorites"
                className={isFavorited ? "text-pink-600" : ""}
              >
                <HeartIcon className={`h-5 w-5 ${isFavorited ? "fill-current" : ""}`} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

        </div>
      </div>
    );
  }

