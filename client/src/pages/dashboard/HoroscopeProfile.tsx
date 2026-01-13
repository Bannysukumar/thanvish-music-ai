import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  User, 
  Ruler, 
  Weight, 
  Heart,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Star,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Heart as HeartIcon,
  Music4,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useHoroscope } from "@/contexts/HoroscopeContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { saveComposition } from "@/lib/compositionStorage";
import type { MusicGenerationRequest } from "@shared/schema";

// Zodiac signs mapping
const ZODIAC_SIGNS = [
  { value: "aries", label: "Aries ♈", rasi: "Mesha" },
  { value: "taurus", label: "Taurus ♉", rasi: "Vrishabha" },
  { value: "gemini", label: "Gemini ♊", rasi: "Mithuna" },
  { value: "cancer", label: "Cancer ♋", rasi: "Karka" },
  { value: "leo", label: "Leo ♌", rasi: "Simha" },
  { value: "virgo", label: "Virgo ♍", rasi: "Kanya" },
  { value: "libra", label: "Libra ♎", rasi: "Tula" },
  { value: "scorpio", label: "Scorpio ♏", rasi: "Vrischika" },
  { value: "sagittarius", label: "Sagittarius ♐", rasi: "Dhanu" },
  { value: "capricorn", label: "Capricorn ♑", rasi: "Makara" },
  { value: "aquarius", label: "Aquarius ♒", rasi: "Kumbha" },
  { value: "pisces", label: "Pisces ♓", rasi: "Meena" },
];

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

/**
 * Calculate age from date of birth
 */
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * DEPRECATED: Approximate zodiac calculation (Western/Tropical)
 * This is a fallback function. For accurate Vedic astrology, use the API endpoint.
 * 
 * Note: This function does NOT calculate Rasi correctly as it doesn't use:
 * - Moon's actual position
 * - Sidereal zodiac
 * - Lahiri Ayanamsa
 * - Time and place corrections
 * 
 * Returns { zodiacSign: string, rasi: string } - Rasi here is approximate and NOT accurate
 */
function calculateZodiacFromDate(dateOfBirth: string): { zodiacSign: string; rasi: string } | null {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const month = birthDate.getMonth() + 1; // 1-12
  const day = birthDate.getDate();
  
  // Approximate zodiac sign dates (Western/Tropical - NOT Vedic/Sidereal)
  // WARNING: This is NOT accurate for Vedic astrology
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { zodiacSign: "aries", rasi: "Mesha" }; // Rasi is approximate, not accurate
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { zodiacSign: "taurus", rasi: "Vrishabha" };
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { zodiacSign: "gemini", rasi: "Mithuna" };
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { zodiacSign: "cancer", rasi: "Karka" };
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { zodiacSign: "leo", rasi: "Simha" };
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { zodiacSign: "virgo", rasi: "Kanya" };
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { zodiacSign: "libra", rasi: "Tula" };
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { zodiacSign: "scorpio", rasi: "Vrischika" };
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { zodiacSign: "sagittarius", rasi: "Dhanu" };
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return { zodiacSign: "capricorn", rasi: "Makara" };
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { zodiacSign: "aquarius", rasi: "Kumbha" };
  } else if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return { zodiacSign: "pisces", rasi: "Meena" };
  }
  
  return null;
}

/**
 * Generate horoscope insights based on profile data (only birth details, no emotional state needed)
 */
function generateHoroscopeInsights(profile: any) {
  const zodiac = ZODIAC_SIGNS.find(z => z.value === profile.zodiacSign);
  
  // Personality traits based on zodiac
  const personalityTraits: Record<string, string[]> = {
    aries: ["Courageous", "Energetic", "Independent", "Impulsive"],
    taurus: ["Stable", "Reliable", "Persistent", "Stubborn"],
    gemini: ["Adaptable", "Curious", "Communicative", "Restless"],
    cancer: ["Emotional", "Intuitive", "Nurturing", "Moody"],
    leo: ["Confident", "Creative", "Generous", "Proud"],
    virgo: ["Analytical", "Practical", "Modest", "Critical"],
    libra: ["Diplomatic", "Harmonious", "Social", "Indecisive"],
    scorpio: ["Intense", "Passionate", "Determined", "Secretive"],
    sagittarius: ["Optimistic", "Adventurous", "Philosophical", "Impatient"],
    capricorn: ["Ambitious", "Disciplined", "Responsible", "Pessimistic"],
    aquarius: ["Independent", "Innovative", "Humanitarian", "Aloof"],
    pisces: ["Compassionate", "Artistic", "Intuitive", "Escapist"],
  };

  // Zodiac-specific emotional patterns
  const zodiacEmotionalPatterns: Record<string, string> = {
    aries: "Aries individuals often experience high energy and passion. You may benefit from music that channels your dynamic nature while providing grounding.",
    taurus: "Taurus individuals value stability and comfort. Calming, steady rhythms can help you maintain your natural equilibrium.",
    gemini: "Gemini individuals are versatile and curious. Music that offers variety and mental stimulation can support your adaptable nature.",
    cancer: "Cancer individuals are deeply emotional and intuitive. Soothing, nurturing melodies can help you process and express your feelings.",
    leo: "Leo individuals radiate confidence and creativity. Uplifting, expressive music can enhance your natural charisma and self-expression.",
    virgo: "Virgo individuals are analytical and detail-oriented. Structured, harmonious music can help you find balance and reduce overthinking.",
    libra: "Libra individuals seek harmony and balance. Peaceful, balanced compositions can help you maintain your natural equilibrium.",
    scorpio: "Scorpio individuals are intense and transformative. Deep, emotional music can support your journey of transformation and healing.",
    sagittarius: "Sagittarius individuals are optimistic and adventurous. Expansive, uplifting music can fuel your philosophical and exploratory nature.",
    capricorn: "Capricorn individuals are ambitious and disciplined. Grounding, structured music can help you maintain focus while reducing stress.",
    aquarius: "Aquarius individuals are independent and innovative. Unique, forward-thinking music can inspire your humanitarian and creative spirit.",
    pisces: "Pisces individuals are compassionate and artistic. Dreamy, intuitive music can enhance your natural creativity and emotional depth.",
  };

  // Determine stress sensitivity based on zodiac (general tendencies)
  const zodiacStressSensitivity: Record<string, "Low" | "Medium" | "High"> = {
    aries: "Medium",
    taurus: "Low",
    gemini: "High",
    cancer: "High",
    leo: "Medium",
    virgo: "High",
    libra: "Medium",
    scorpio: "High",
    sagittarius: "Low",
    capricorn: "Medium",
    aquarius: "Low",
    pisces: "High",
  };

  // Determine energy level based on zodiac
  const zodiacEnergyLevel: Record<string, "Low" | "Medium" | "High"> = {
    aries: "High",
    taurus: "Medium",
    gemini: "High",
    cancer: "Medium",
    leo: "High",
    virgo: "Medium",
    libra: "Medium",
    scorpio: "Medium",
    sagittarius: "High",
    capricorn: "Medium",
    aquarius: "Medium",
    pisces: "Low",
  };

  // General healing needs based on zodiac
  const zodiacHealingNeeds: Record<string, string[]> = {
    aries: ["Energy channeling", "Patience", "Grounding"],
    taurus: ["Flexibility", "Stress relief", "Comfort"],
    gemini: ["Focus", "Calm", "Mental clarity"],
    cancer: ["Emotional release", "Security", "Nurturing"],
    leo: ["Humility", "Self-expression", "Confidence"],
    virgo: ["Relaxation", "Self-acceptance", "Balance"],
    libra: ["Decision-making", "Harmony", "Peace"],
    scorpio: ["Transformation", "Trust", "Healing"],
    sagittarius: ["Patience", "Focus", "Optimism"],
    capricorn: ["Stress relief", "Joy", "Balance"],
    aquarius: ["Connection", "Grounding", "Innovation"],
    pisces: ["Boundaries", "Reality", "Compassion"],
  };

  const traits = personalityTraits[profile.zodiacSign] || ["Balanced", "Adaptive", "Intuitive"];
  const strengths = traits.slice(0, 3);
  const challenges = traits.slice(1, 3);
  const stressSensitivity = zodiacStressSensitivity[profile.zodiacSign] || "Medium";
  const energyLevel = zodiacEnergyLevel[profile.zodiacSign] || "Medium";
  const healingNeeds = zodiacHealingNeeds[profile.zodiacSign] || ["Balance", "Harmony", "Well-being"];

  // Build zodiac overview with birth details
  const birthDate = new Date(profile.dateOfBirth);
  const birthMonth = birthDate.toLocaleString('default', { month: 'long' });
  const birthDay = birthDate.getDate();
  const birthYear = birthDate.getFullYear();
  
  // Personalized greeting with user's name
  const userName = profile.fullName || "Dear Seeker";
  const placeOfBirth = profile.placeOfBirth || "your birthplace";
  const timeOfBirth = profile.timeOfBirth ? ` at ${profile.timeOfBirth}` : "";
  
  // More detailed zodiac overview incorporating all user inputs
  const zodiacOverview = `${userName}, as a ${zodiac?.label || profile.zodiacSign} born on ${birthMonth} ${birthDay}, ${birthYear}${timeOfBirth} in ${placeOfBirth}, you are known for your ${traits[0].toLowerCase()} nature and ${traits[1].toLowerCase()} approach to life. Your ${profile.rasi} (Rasi) influences your core personality and life path. The cosmic alignment at your birth suggests a journey of ${healingNeeds[0]?.toLowerCase() || "balance"} and ${healingNeeds[1]?.toLowerCase() || "harmony"}. Your unique combination of birth elements creates a distinctive energy pattern that guides your personal growth and healing journey.`;
  
  // Enhanced emotional insights with personalization
  const emotionalInsightsText = `${zodiacEmotionalPatterns[profile.zodiacSign] || "Your zodiac sign reveals unique emotional patterns."} Born in ${placeOfBirth}, your connection to this place may influence your emotional landscape. Music therapy can help harmonize your inner world and support your natural tendencies, creating a personalized healing experience tailored to your ${profile.rasi} energy.`;
  
  // Enhanced therapy focus with personal details
  const therapyFocusText = `${userName}, as a ${zodiac?.label || profile.zodiacSign} with ${profile.rasi} (Rasi), your music therapy should focus on ${healingNeeds[0] || "balance"} and ${healingNeeds[1] || "harmony"}. The therapeutic sounds can help you embrace your strengths (${strengths.join(", ").toLowerCase()}) while working through your growth areas. Your birth details from ${placeOfBirth} add unique vibrational qualities to your healing journey.`;

  return {
    zodiacOverview,
    emotionalInsights: emotionalInsightsText,
    strengths,
    challenges,
    therapyFocus: therapyFocusText,
    personalityTraits: traits,
    stressSensitivity,
    healingNeeds,
    energyLevel,
  };
}

export default function HoroscopeProfile() {
  const { profile, insights, setProfile, setInsights } = useHoroscope();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "",
    dateOfBirth: profile?.dateOfBirth || "",
    timeOfBirth: profile?.timeOfBirth || "",
    placeOfBirth: profile?.placeOfBirth || "",
    rasi: profile?.rasi || "",
    zodiacSign: profile?.zodiacSign || "",
    age: profile?.age || 0,
  });

  const [isCalculatingAstrology, setIsCalculatingAstrology] = useState(false);
  const [astrologyCalculationError, setAstrologyCalculationError] = useState<string | null>(null);

  // Step definitions
  const steps = [
    { id: "personal", title: "Personal Info", required: true },
    { id: "astrological", title: "Astrological", required: true },
    { id: "generate", title: "Generate", required: true },
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  // Step validation
  const isStepValid = (stepId: string): boolean => {
    switch (stepId) {
      case "personal":
        return !!(formData.fullName && formData.dateOfBirth && formData.timeOfBirth && formData.placeOfBirth);
      case "astrological":
        return !!(formData.zodiacSign && formData.rasi && !isCalculatingAstrology);
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

  // Calculate age when date changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      setFormData(prev => ({ ...prev, age }));
    }
  }, [formData.dateOfBirth]);

  // Calculate Vedic astrology when all required fields are available
  const calculateVedicAstrology = async () => {
    if (!formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth) {
      return;
    }

    setIsCalculatingAstrology(true);
    setAstrologyCalculationError(null);

    try {
      const response = await fetch("/api/calculate-vedic-astrology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateOfBirth: formData.dateOfBirth,
          timeOfBirth: formData.timeOfBirth,
          placeOfBirth: formData.placeOfBirth,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // If service is not available, show helpful message
        if (errorData.code === "CALCULATION_SERVICE_UNAVAILABLE") {
          setAstrologyCalculationError("Vedic astrology calculation service is being integrated. For now, using approximate calculations based on date.");
          // Fallback to approximate calculation for now
          const zodiacData = calculateZodiacFromDate(formData.dateOfBirth);
          if (zodiacData) {
            setFormData(prev => ({
              ...prev,
              zodiacSign: zodiacData.zodiacSign,
              rasi: zodiacData.rasi,
            }));
          }
        } else {
          setAstrologyCalculationError(errorData.error || "Failed to calculate astrology");
        }
        setIsCalculatingAstrology(false);
        return;
      }

      const data = await response.json();
      
      setFormData(prev => ({
        ...prev,
        zodiacSign: data.zodiacSign,
        rasi: data.rasi,
      }));

      setIsCalculatingAstrology(false);
    } catch (error: any) {
      console.error("Error calculating Vedic astrology:", error);
      setAstrologyCalculationError("Failed to calculate. Using approximate values.");
      // Fallback to approximate calculation
      const zodiacData = calculateZodiacFromDate(formData.dateOfBirth);
      if (zodiacData) {
        setFormData(prev => ({
          ...prev,
          zodiacSign: zodiacData.zodiacSign,
          rasi: zodiacData.rasi,
        }));
      }
      setIsCalculatingAstrology(false);
    }
  };

  // Auto-calculate when all required fields are filled
  useEffect(() => {
    if (formData.dateOfBirth && formData.timeOfBirth && formData.placeOfBirth) {
      // Debounce the calculation
      const timer = setTimeout(() => {
        calculateVedicAstrology();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.dateOfBirth, formData.timeOfBirth, formData.placeOfBirth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields including time of birth.",
        variant: "destructive",
      });
      return;
    }

    // Ensure zodiac and rasi are calculated
    if (!formData.zodiacSign || !formData.rasi) {
      // Try to calculate if not already done
      if (isCalculatingAstrology) {
        toast({
          title: "Calculation in Progress",
          description: "Please wait while we calculate your astrological details.",
          variant: "default",
        });
        return;
      }
      
      // Attempt calculation
      await calculateVedicAstrology();
      
      // If still not calculated after attempt, show error
      if (!formData.zodiacSign || !formData.rasi) {
        toast({
          title: "Calculation Required",
          description: "Unable to calculate astrological details. Please check your inputs and try again.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsProcessing(true);

    // Simulate processing delay for better UX
    setTimeout(() => {
      const profileData = {
        fullName: formData.fullName,
        dateOfBirth: formData.dateOfBirth,
        timeOfBirth: formData.timeOfBirth,
        placeOfBirth: formData.placeOfBirth,
        rasi: formData.rasi,
        zodiacSign: formData.zodiacSign,
        age: formData.age || calculateAge(formData.dateOfBirth),
        // These will be filled in Music Therapy page
        height: profile?.height || "",
        weight: profile?.weight || "",
        currentEmotionalState: profile?.currentEmotionalState || "",
        lifeFocus: profile?.lifeFocus || "",
      };

      const insightsData = generateHoroscopeInsights(profileData);

      setProfile(profileData);
      setInsights(insightsData);
      setIsSubmitted(true);
      setIsProcessing(false);

      toast({
        title: "Horoscope Profile Created",
        description: "Your zodiac sign and rasi have been determined! Proceed to Music Therapy to complete your profile.",
      });
    }, 1000);
  };

  // Music generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<{
    url: string;
    title: string;
    therapyType: string;
    zodiacSign: string;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [sessionTimer] = useState<number>(10);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Convert horoscope data to music generation parameters
  const convertHoroscopeToMusicParams = (
    therapyType: string,
    profileData: any,
    insightsData: any
  ): Partial<MusicGenerationRequest> => {
    const therapyMoodMap: Record<string, string> = {
      stress_relief: "calm",
      emotional_healing: "soothing",
      deep_sleep: "peaceful",
      focus_study: "energetic",
      spiritual_calm: "meditative",
      confidence_boost: "uplifting",
    };

    const energyLevelToTempo: Record<string, number> = {
      Low: 60,
      Medium: 80,
      High: 100,
    };

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

    const therapyTalaMap: Record<string, string> = {
      stress_relief: "teental",
      emotional_healing: "rupak",
      deep_sleep: "ektaal",
      focus_study: "jhaptal",
      spiritual_calm: "ektaal",
      confidence_boost: "teental",
    };

    const therapyInstruments: Record<string, string[]> = {
      stress_relief: ["bansuri", "santoor", "tanpura"],
      emotional_healing: ["sarangi", "piano", "bansuri"],
      deep_sleep: ["veena", "tanpura", "bansuri"],
      focus_study: ["sitar", "violin", "tabla"],
      spiritual_calm: ["tanpura", "bansuri", "mridangam"],
      confidence_boost: ["sitar", "tabla", "harmonium"],
    };

    const mood = therapyMoodMap[therapyType] || "calm";
    const tempo = energyLevelToTempo[insightsData?.energyLevel || "Medium"] || 80;
    const ragaOptions = zodiacRagaMap[profileData?.zodiacSign || "aries"] || ["yaman"];
    const raga = ragaOptions[0];
    const tala = therapyTalaMap[therapyType] || "teental";
    const instruments = therapyInstruments[therapyType] || ["bansuri", "tanpura"];

    const therapyLabel = therapyType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const zodiacSign = profileData?.zodiacSign || "aries";
    const rasi = profileData?.rasi || "Rasi";
    const energyLevel = insightsData?.energyLevel || "Medium";
    const stressSensitivity = insightsData?.stressSensitivity || "Medium";
    const healingNeeds = insightsData?.healingNeeds?.join(", ") || "balance";
    const primaryHealingNeed = insightsData?.healingNeeds?.[0] || "balance";
    const age = profileData?.age || 0;

    let prompt = `Create an instrumental therapeutic music composition for ${therapyLabel} therapy. Therapy Type: ${therapyLabel}. Zodiac Sign: ${zodiacSign} (${rasi}). Age: ${age} years.`;
    prompt += ` Energy Level: ${energyLevel}. Stress Sensitivity: ${stressSensitivity}. Healing Needs: ${healingNeeds}. Use Raga ${raga} with Tala ${tala}, featuring ${instruments.join(", ")}. Tempo: ${tempo} BPM. Mood: ${mood}. The music should help with ${primaryHealingNeed}.`;
    prompt += ` Personalized for ${zodiacSign} zodiac sign with ${mood} therapeutic mood.`;

    return {
      generationMode: "instrumental_only",
      raga,
      tala,
      instruments,
      tempo,
      mood,
      prompt: prompt.substring(0, 500),
    };
  };

  const generateMusicMutation = useMutation({
    mutationFn: async (params: Partial<MusicGenerationRequest>) => {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
          error = JSON.parse(errorText);
        } catch {
          error = { error: errorText || "Failed to generate music" };
        }
        throw new Error(error.error || error.message || "Failed to generate music");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Music Generation Started",
        description: "Your personalized music is being generated. This may take a few moments.",
      });
      
      if (data.taskId) {
        pollForMusic(data.taskId);
      } else {
        setIsGenerating(false);
        toast({
          title: "Generation Error",
          description: "Invalid response from server. Please try again.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      let errorMessage = error.message || "Failed to generate music. Please try again.";
      
      // Provide more user-friendly error messages
      if (errorMessage.includes("credits") || errorMessage.includes("insufficient")) {
        errorMessage = "API service credits are insufficient. Please contact support or try again later.";
      } else if (errorMessage.includes("429") || errorMessage.includes("Too Many Requests")) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const pollForMusic = async (taskId: string) => {
    const maxAttempts = 60;
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
            
            setCurrentTrack({
              url: data.audioUrl,
              title: `Horoscope Music - ${profile?.zodiacSign || "Horoscope"}`,
              therapyType: "stress_relief",
              zodiacSign: profile?.zodiacSign || "",
            });

            setTimeRemaining(sessionTimer * 60);
            
            toast({
              title: "Music Generated",
              description: "Your personalized horoscope music is ready!",
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
          description: "Music generation is taking longer than expected. Please try again later.",
          variant: "destructive",
        });
      }
    }, 5000);
  };

  const handleGenerateHoroscopeMusic = () => {
    if (!profile || !insights) {
      toast({
        title: "Profile Required",
        description: "Please generate your horoscope profile first.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    const defaultTherapy = insights.healingNeeds?.[0]?.toLowerCase().includes("stress") 
      ? "stress_relief" 
      : insights.healingNeeds?.[0]?.toLowerCase().includes("healing")
      ? "emotional_healing"
      : "stress_relief";
    
    const params = convertHoroscopeToMusicParams(defaultTherapy, profile, insights);
    generateMusicMutation.mutate(params);
  };

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
    handleGenerateHoroscopeMusic();
  };

  const handleSaveToFavorites = () => {
    if (!currentTrack || !profile) return;

    try {
      saveComposition({
        title: currentTrack.title,
        raga: profile.rasi || "N/A",
        tala: "Therapy Session",
        instruments: [],
        tempo: 80,
        mood: "calm",
        audioUrl: currentTrack.url,
        description: `Personalized horoscope music for ${profile.zodiacSign || ""} zodiac sign`,
      });

      setIsFavorited(true);
      toast({
        title: "Saved to Favorites",
        description: "Your horoscope music has been saved to your library.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save music to favorites.",
        variant: "destructive",
      });
    }
  };

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isSubmitted && insights) {
    return (
      <div className="py-6 md:py-12">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Your Horoscope Profile
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Personalized insights based on your birth details
            </p>
          </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Zodiac Overview */}
          <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Zodiac Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.zodiacOverview}</p>
            </CardContent>
          </Card>

          {/* Emotional Insights */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-pink-600" />
                Emotional Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{insights.emotionalInsights}</p>
            </CardContent>
          </Card>

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.strengths.map((strength, idx) => (
                  <Badge key={idx} variant="default" className="bg-green-500 hover:bg-green-600">
                    {strength}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <CardTitle>Growth Areas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {insights.challenges.map((challenge, idx) => (
                  <Badge key={idx} variant="outline" className="border-orange-500 text-orange-700 dark:text-orange-400">
                    {challenge}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Birth Details Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Birth Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date of Birth</p>
                  <p className="font-medium">{new Date(profile?.dateOfBirth || "").toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Place of Birth</p>
                  <p className="font-medium">{profile?.placeOfBirth || "N/A"}</p>
                </div>
                {profile?.timeOfBirth && (
                  <div>
                    <p className="text-muted-foreground">Time of Birth</p>
                    <p className="font-medium">{profile.timeOfBirth}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Age</p>
                  <p className="font-medium">{profile?.age || formData.age} years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Therapy Focus */}
          <Card className="md:col-span-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-indigo-600" />
                Suggested Therapy Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{insights.therapyFocus}</p>
              <div>
                <p className="text-sm font-medium mb-2">Healing Needs:</p>
                <div className="flex flex-wrap gap-2">
                  {insights.healingNeeds.map((need, idx) => (
                    <Badge key={idx} variant="secondary">{need}</Badge>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Stress Sensitivity</p>
                  <Badge variant={insights.stressSensitivity === "High" ? "destructive" : insights.stressSensitivity === "Medium" ? "default" : "secondary"}>
                    {insights.stressSensitivity}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Energy Level</p>
                  <Badge variant={insights.energyLevel === "High" ? "default" : insights.energyLevel === "Medium" ? "secondary" : "outline"}>
                    {insights.energyLevel}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Zodiac Element</p>
                  <Badge variant="outline">
                    {profile?.zodiacSign === "aries" || profile?.zodiacSign === "leo" || profile?.zodiacSign === "sagittarius" ? "Fire" :
                     profile?.zodiacSign === "taurus" || profile?.zodiacSign === "virgo" || profile?.zodiacSign === "capricorn" ? "Earth" :
                     profile?.zodiacSign === "gemini" || profile?.zodiacSign === "libra" || profile?.zodiacSign === "aquarius" ? "Air" : "Water"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

          {/* Generate Music Section */}
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music4 className="h-5 w-5 text-purple-600" />
                Generate Personalized Music
              </CardTitle>
              <CardDescription>
                Create custom music therapy based on your horoscope profile. The music will be personalized to your zodiac sign, emotional patterns, and healing needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Button
                  size="lg"
                  onClick={handleGenerateHoroscopeMusic}
                  disabled={isGenerating}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white min-w-[280px] h-12 text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Music...
                    </>
                  ) : (
                    <>
                      Generate Horoscope Music
                      <Music4 className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                {isGenerating && (
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    This may take a few moments. Your personalized music is being created based on your horoscope profile.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Music Player */}
          {currentTrack && (
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 mt-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between flex-wrap gap-2">
                  <span className="flex items-center gap-2">
                    <Music4 className="h-5 w-5 text-purple-600" />
                    {currentTrack.title}
                  </span>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Horoscope Music
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Your personalized music based on {profile?.zodiacSign || "your"} zodiac sign
                </CardDescription>
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
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
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
                  className={isFavorited ? "text-purple-600" : ""}
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

  return (
    <div className="py-6 md:py-12">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 mb-4">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Horoscope Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create your personalized horoscope profile to unlock cosmic insights and personalized music therapy
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  How it works
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-200">
                  Follow the steps below to create your horoscope profile. We'll guide you through each step.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
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
                          ? "bg-purple-600 text-white"
                          : isCurrent
                          ? "bg-purple-600 text-white ring-4 ring-purple-600/20"
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
                        isCompleted ? "bg-purple-600" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Personal Information */}
          {currentStepData?.id === "personal" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Step 1: Personal Information
              </CardTitle>
              <CardDescription>
                Tell us about yourself. Your basic details help us understand your cosmic connection and calculate your astrological profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="e.g., John Doe"
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter your full name as you'd like it to appear</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-base">
                    Date of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Select your birth date to calculate your zodiac sign</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeOfBirth" className="text-base">
                    Time of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="timeOfBirth"
                    type="time"
                    value={formData.timeOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, timeOfBirth: e.target.value }))}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Exact time is required for accurate Rasi (Moon Sign) calculation</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placeOfBirth" className="text-base">
                    Place of Birth <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="placeOfBirth"
                    value={formData.placeOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, placeOfBirth: e.target.value }))}
                    placeholder="e.g., Mumbai, Maharashtra, India"
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">City, state, or country where you were born</p>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Step 2: Astrological Details */}
          {currentStepData?.id === "astrological" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-purple-600" />
                Step 2: Astrological Details
              </CardTitle>
              <CardDescription>
                Your zodiac sign (Sun Sign) and Rasi (Moon Sign) are calculated using authentic Vedic (Sidereal) astrology with Lahiri Ayanamsa, based on exact planetary positions at your time and place of birth.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Trust & Transparency Text */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <p className="text-sm text-purple-900 dark:text-purple-100 font-medium mb-1">
                  🔮 Authentic Vedic Astrology
                </p>
                <p className="text-xs text-purple-800 dark:text-purple-200">
                  Astrological details are calculated using authentic Vedic (Sidereal) astrology with Lahiri Ayanamsa, based on exact planetary positions at the time and place of birth. This platform follows the same astrological calculation principles used by professional Vedic astrologers.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zodiacSign" className="text-base">Zodiac Sign (Sun Sign - Sidereal)</Label>
                  <Input
                    id="zodiacSign"
                    value={formData.zodiacSign ? ZODIAC_SIGNS.find(z => z.value === formData.zodiacSign)?.label || formData.zodiacSign : "Calculating..."}
                    readOnly
                    className="bg-muted font-medium h-11"
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated from Sun's position in Sidereal zodiac</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rasi" className="text-base">Rasi (Moon Sign)</Label>
                  <Input
                    id="rasi"
                    value={formData.rasi || (isCalculatingAstrology ? "Calculating..." : "Enter birth details above")}
                    readOnly
                    className="bg-muted font-medium h-11"
                  />
                  <p className="text-xs text-muted-foreground">Auto-calculated from Moon's exact position at birth time</p>
                </div>
              </div>
              
              {isCalculatingAstrology && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Calculating your astrological details using Vedic Sidereal Astrology...
                  </p>
                </div>
              )}

              {astrologyCalculationError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    ⚠️ {astrologyCalculationError}
                  </p>
                </div>
              )}

              {formData.zodiacSign && formData.rasi && !isCalculatingAstrology && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                    ✓ Your astrological profile is ready!
                  </p>
                  <p className="text-xs text-green-800 dark:text-green-200 mb-2">
                    {ZODIAC_SIGNS.find(z => z.value === formData.zodiacSign)?.label} (Sun Sign) • {formData.rasi} Rasi (Moon Sign)
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 italic">
                    Calculated using Vedic Sidereal Astrology (Lahiri Ayanamsa)
                  </p>
                </div>
              )}

              {!formData.timeOfBirth && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Exact birth time is required for accurate Rasi calculation. Please go back and enter your time of birth.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          )}

          {/* Step 3: Confirmation & Generate */}
          {currentStepData?.id === "generate" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-purple-600" />
                Step 3: Confirm Details & Generate Profile
              </CardTitle>
              <CardDescription>
                Please review all your details carefully. Once confirmed, we'll generate your personalized horoscope profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Confirmation Card */}
              <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-200 dark:border-purple-800 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-3">
                  Please confirm your details:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Time of Birth</p>
                      <p className="font-medium">{formData.timeOfBirth || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-muted-foreground">Place of Birth</p>
                      <p className="font-medium">{formData.placeOfBirth || "Not provided"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {formData.zodiacSign ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 animate-spin flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-muted-foreground">Zodiac Sign (Auto)</p>
                      <p className="font-medium">{formData.zodiacSign ? ZODIAC_SIGNS.find(z => z.value === formData.zodiacSign)?.label || formData.zodiacSign : "Calculating..."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    {formData.rasi ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-blue-600 mt-0.5 animate-spin flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-muted-foreground">Rasi (Auto)</p>
                      <p className="font-medium">{formData.rasi || "Calculating..."}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Statement */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 text-center">
                  🔮 Calculated using Vedic Sidereal Astrology (Lahiri Ayanamsa) based on exact planetary positions
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-4 pt-4">
                <Button
                  type="submit"
                  size="lg"
                  disabled={isProcessing || !formData.fullName || !formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth || !formData.zodiacSign || !formData.rasi || isCalculatingAstrology}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white min-w-[280px] h-12 text-base"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Your Horoscope...
                    </>
                  ) : (
                    <>
                      Confirm Details & Generate Profile
                      <Sparkles className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
                {(!formData.fullName || !formData.dateOfBirth || !formData.timeOfBirth || !formData.placeOfBirth || !formData.zodiacSign || !formData.rasi) && (
                  <p className="text-xs text-muted-foreground text-center max-w-md">
                    Please complete all previous steps and ensure astrological details are calculated before generating your profile.
                  </p>
                )}
                {isCalculatingAstrology && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 text-center max-w-md">
                    Calculating astrological details... Please wait.
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
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                disabled={!canGoNext()}
                className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

