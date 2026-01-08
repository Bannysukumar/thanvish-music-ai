import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Download, Loader2, Music, Save, Mic, Square, Clock, ChevronLeft, ChevronRight, CheckCircle2, MessageCircle } from "lucide-react";
import { AIChatPanel } from "@/components/chat/AIChatPanel";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { saveComposition } from "@/lib/compositionStorage";
import { Textarea } from "@/components/ui/textarea";
import type { MusicGenerationRequest } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp, doc, getDoc } from "firebase/firestore";

const RAGAS = [
  // Hindustani Ragas
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
  // Carnatic Ragas
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
  // Hindustani Talas
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
  // Carnatic Talas
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
  // Hindustani Instruments
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
  { value: "esraj", label: "Esraj", tradition: "Hindustani" },
  { value: "dilruba", label: "Dilruba", tradition: "Hindustani" },
  { value: "surmandal", label: "Surmandal", tradition: "Hindustani" },
  { value: "swarmandal", label: "Swarmandal", tradition: "Hindustani" },
  { value: "rudra_veena", label: "Rudra Veena", tradition: "Hindustani" },
  { value: "vichitra_veena", label: "Vichitra Veena", tradition: "Hindustani" },
  { value: "surbahar", label: "Surbahar", tradition: "Hindustani" },
  { value: "surbahar_sitar", label: "Surbahar Sitar", tradition: "Hindustani" },
  // Carnatic Instruments
  { value: "veena", label: "Veena", tradition: "Carnatic" },
  { value: "mridangam", label: "Mridangam", tradition: "Carnatic" },
  { value: "ghatam", label: "Ghatam", tradition: "Carnatic" },
  { value: "kanjira", label: "Kanjira", tradition: "Carnatic" },
  { value: "morsing", label: "Morsing (Jaw Harp)", tradition: "Carnatic" },
  { value: "nadaswaram", label: "Nadaswaram", tradition: "Carnatic" },
  { value: "thavil", label: "Thavil", tradition: "Carnatic" },
  { value: "gottuvadhyam", label: "Gottuvadhyam (Chitravina)", tradition: "Carnatic" },
  { value: "venu", label: "Venu (Carnatic Flute)", tradition: "Carnatic" },
  { value: "nagaswaram", label: "Nagaswaram", tradition: "Carnatic" },
  { value: "tavil", label: "Tavil", tradition: "Carnatic" },
  { value: "udukkai", label: "Udukkai", tradition: "Carnatic" },
  { value: "pambai", label: "Pambai", tradition: "Carnatic" },
  // Instruments Used in Both Traditions
  { value: "violin", label: "Violin", tradition: "Both" },
  { value: "tanpura", label: "Tanpura", tradition: "Both" },
  { value: "flute", label: "Flute (Generic)", tradition: "Both" },
  { value: "harmonium_both", label: "Harmonium (Both)", tradition: "Both" },
  { value: "santoor_both", label: "Santoor (Both)", tradition: "Both" },
  { value: "guitar", label: "Guitar (Fusion)", tradition: "Both" },
  { value: "piano", label: "Piano (Fusion)", tradition: "Both" },
  { value: "keyboard", label: "Keyboard (Fusion)", tradition: "Both" },
  { value: "cello", label: "Cello (Fusion)", tradition: "Both" },
  { value: "double_bass", label: "Double Bass (Fusion)", tradition: "Both" },
];

const MOODS = [
  // Nine Rasas (Classical Emotions)
  "Shringara", // Love/Romance
  "Hasya", // Joy/Laughter
  "Karuna", // Compassion/Sorrow
  "Raudra", // Anger
  "Veera", // Courage/Heroism
  "Bhayanaka", // Fear
  "Bibhatsa", // Disgust
  "Adbhuta", // Wonder
  "Shanta", // Peace/Tranquility
  // Common Moods
  "Devotional",
  "Romantic",
  "Serene",
  "Energetic",
  "Contemplative",
  "Joyful",
  "Melancholic",
  "Peaceful",
  "Meditative",
  "Mystical",
  "Celebratory",
  "Nostalgic",
  "Passionate",
  "Solemn",
  "Triumphant",
  "Melancholy",
  "Uplifting",
  "Introspective",
  "Expressive",
  "Dramatic",
  "Gentle",
  "Powerful",
  "Soothing",
  "Vibrant",
  "Reflective",
  "Spiritual",
  "Festive",
  "Yearning",
  "Tranquil",
  "Intense",
  "Graceful",
  "Majestic",
  "Playful",
  "Sorrowful",
  "Hopeful",
  "Reverent",
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
  const { user } = useAuth();
  const [generationMode, setGenerationMode] = useState<"voice_only" | "instrumental_only" | "full_music" | "">("");
  const [tradition, setTradition] = useState<string>(""); // Hindustani or Carnatic
  const [raga, setRaga] = useState("");
  const [tala, setTala] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState([100]);
  const [mood, setMood] = useState("");
  const [gender, setGender] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recognition, setRecognition] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>(""); // Store all final transcripts
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Track silence timeout
  const SILENCE_TIMEOUT = 2000; // Stop recording after 2 seconds of silence (2000ms)
  const [generatedComposition, setGeneratedComposition] = useState<any>(null);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [selectedAudioIndex, setSelectedAudioIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const generationStartRef = useRef<number>(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  // Load user preferences from Firebase on mount
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user || user.isGuest || preferencesLoaded) {
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          // Load preferences if they exist
          // Load generation mode first as it affects step calculation
          if (userData.generationMode) {
            setGenerationMode(userData.generationMode as "voice_only" | "instrumental_only" | "full_music" | "");
          }
          // Load tradition before raga/tala since they depend on tradition
          if (userData.tradition) {
            setTradition(userData.tradition);
          }
          // Load raga and tala after tradition
          if (userData.raga) {
            setRaga(userData.raga);
          }
          if (userData.tala) {
            setTala(userData.tala);
          }
          // Load instruments
          if (userData.instruments && Array.isArray(userData.instruments) && userData.instruments.length > 0) {
            setSelectedInstruments(userData.instruments);
          }
          // Load tempo
          if (userData.tempo && typeof userData.tempo === 'number') {
            setTempo([userData.tempo]);
          }
          // Load mood
          if (userData.mood) {
            setMood(userData.mood);
          }
          // Load gender (optional)
          if (userData.gender) {
            setGender(userData.gender);
          }
          // Load language (optional)
          if (userData.language) {
            setLanguage(userData.language);
          }
        }
      } catch (error) {
        console.error("Error loading user preferences:", error);
      } finally {
        setPreferencesLoaded(true);
      }
    };

    loadUserPreferences();
  }, [user, preferencesLoaded]);

  // Initialize Speech Recognition
  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "en-US"; // Can be made configurable

      recognitionInstance.onresult = (event: any) => {
        let interimTranscript = "";
        let newFinalTranscript = "";

        // Only process new results (from resultIndex onwards)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            // Add new final transcripts
            newFinalTranscript += transcript + " ";
          } else {
            // Get the latest interim result
            interimTranscript = transcript;
          }
        }

        // Update the final transcript ref with new final results only
        if (newFinalTranscript) {
          finalTranscriptRef.current += newFinalTranscript;
        }

        // Combine all final transcripts with current interim result
        const completeText = finalTranscriptRef.current + interimTranscript;
        setCustomPrompt(completeText.substring(0, 1000)); // Respect max length

        // Reset silence timeout - user is still speaking
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Set new timeout to auto-stop after silence
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
              setIsRecording(false);
              toast({
                title: "Recording Stopped",
                description: "Recording stopped automatically after detecting silence.",
              });
            } catch (error) {
              console.error("Error auto-stopping recognition:", error);
              setIsRecording(false);
            }
          }
        }, SILENCE_TIMEOUT);
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        
        // Clear silence timeout on error
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        let errorMessage = "Speech recognition error occurred.";
        if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try again.";
        } else if (event.error === "audio-capture") {
          errorMessage = "No microphone found. Please check your microphone.";
        } else if (event.error === "not-allowed") {
          errorMessage = "Microphone permission denied. Please allow microphone access.";
        }
        
        toast({
          title: "Recording Error",
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        // Clear silence timeout when recording ends
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        // Don't clear finalTranscriptRef here - keep the text even after recording stops
      };

      recognitionRef.current = recognitionInstance;
      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech Recognition API not supported in this browser");
    }

    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      // Clear silence timeout on unmount
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      // Reset final transcript ref on unmount
      finalTranscriptRef.current = "";
    };
  }, [toast]);

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
      if (elapsedTimeIntervalRef.current) {
        clearInterval(elapsedTimeIntervalRef.current);
      }
    };
  }, []);

  // Helper function to save completed composition
  const saveCompletedComposition = async (composition: any, requestData: MusicGenerationRequest) => {
    try {
      const languageLabel = requestData.language 
        ? LANGUAGES.find((l) => l.value === requestData.language)?.label || requestData.language 
        : null;
      
      // Save to local storage
      saveComposition({
        title: composition.title,
        raga: requestData.raga || "N/A",
        tala: requestData.tala || "N/A",
        instruments: requestData.instruments || [],
        tempo: requestData.tempo || 100,
        mood: requestData.mood || "N/A",
        audioUrl: composition.audioUrl,
        description: requestData.raga && requestData.tala && requestData.instruments
          ? `Generated ${requestData.raga} composition in ${requestData.tala} with ${requestData.instruments.join(", ")}${languageLabel ? ` in ${languageLabel}` : ""}`
          : `Generated music composition${languageLabel ? ` in ${languageLabel}` : ""}`,
      });

      // Save to Firestore for authenticated users
      if (user && !user.isGuest) {
        await addDoc(collection(db, "users", user.id, "compositions"), {
          title: composition.title,
          raga: requestData.raga || "N/A",
          tala: requestData.tala || "N/A",
          instruments: requestData.instruments || [],
          tempo: requestData.tempo || 100,
          mood: requestData.mood || "N/A",
          audioUrl: composition.audioUrl,
          language: languageLabel,
          prompt: requestData.prompt || null,
          createdAt: serverTimestamp(),
          generatedAt: serverTimestamp(),
          source: "generator",
        });
      }
    } catch (error) {
      console.error("Error saving completed composition:", error);
    }
  };

  // Check for delayed completions on mount and periodically
  useEffect(() => {
    const PENDING_TASKS_KEY = "pending_generation_tasks";
    
    const checkPendingCompositions = async () => {
      try {
        const pendingTasksStr = localStorage.getItem(PENDING_TASKS_KEY);
        if (!pendingTasksStr) return;
        
        const pendingTasks: Array<{ taskId: string; requestData: MusicGenerationRequest; timestamp: number }> = 
          JSON.parse(pendingTasksStr);
        
        if (pendingTasks.length === 0) return;

        // Check each pending task
        const updatedTasks = [];
        for (const task of pendingTasks) {
          try {
            // Only check tasks that are less than 24 hours old
            const age = Date.now() - task.timestamp;
            if (age > 24 * 60 * 60 * 1000) {
              // Remove old tasks
              continue;
            }

            const res = await apiRequest("GET", `/api/compositions/by-task/${task.taskId}`);
            
            // Check content type before parsing JSON (apiRequest already checks status, but content-type might be wrong)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
              // Server returned non-JSON (likely HTML error page or 404 page)
              // This usually means the taskId mapping was lost (server restart)
              console.log(`Task ${task.taskId} returned non-JSON response (${contentType}), removing from pending list`);
              continue; // Remove from pending list
            }
            
            const composition = await res.json();

            if (composition.isComplete && composition.audioUrl) {
              // Composition completed! Save it
              await saveCompletedComposition(composition, task.requestData);
              
              const variationText = composition.audioUrls && composition.audioUrls.length > 1 
                ? ` (${composition.audioUrls.length} variations)` 
                : "";
              toast({
                title: "Composition Ready!",
                description: `Your music "${composition.title}" has been generated and saved to your library.${variationText}`,
              });
              
              // Don't add to updatedTasks - remove it from pending list
            } else {
              // Still pending, keep it
              updatedTasks.push(task);
            }
          } catch (error: any) {
            // Error checking this task
            // If it's a JSON parse error (server returned HTML), the mapping was probably lost
            if (error instanceof SyntaxError && error.message.includes("JSON")) {
              console.log(`Task ${task.taskId} mapping lost (server returned HTML), removing from pending list`);
              // Don't add to updatedTasks - remove it from pending list
              continue;
            }
            // Other errors - keep it in the list and try again later
            console.error(`Error checking task ${task.taskId}:`, error);
            updatedTasks.push(task);
          }
        }

        // Update pending tasks list
        if (updatedTasks.length !== pendingTasks.length) {
          if (updatedTasks.length === 0) {
            localStorage.removeItem(PENDING_TASKS_KEY);
          } else {
            localStorage.setItem(PENDING_TASKS_KEY, JSON.stringify(updatedTasks));
          }
        }
      } catch (error) {
        console.error("Error checking pending compositions:", error);
      }
    };

    // Check immediately
    checkPendingCompositions();

    // Check every 30 seconds while on this page
    const interval = setInterval(checkPendingCompositions, 30000);

    return () => clearInterval(interval);
  }, [user, toast]);

  /**
   * Toggle speech recognition
   */
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      // Stop recording manually
      // Clear silence timeout
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error("Error stopping recognition:", error);
        setIsRecording(false);
      }
    } else {
      // Start recording - initialize final transcript with existing text
      finalTranscriptRef.current = customPrompt;
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast({
          title: "Recording Started",
          description: "Speak your prompt. Click the microphone again to stop.",
        });
      } catch (error: any) {
        console.error("Error starting recognition:", error);
        setIsRecording(false);
        
        let errorMessage = "Failed to start recording.";
        if (error.message?.includes("already started")) {
          errorMessage = "Recording is already in progress.";
        } else if (error.message?.includes("permission")) {
          errorMessage = "Microphone permission denied. Please allow microphone access in your browser settings.";
        }
        
        toast({
          title: "Recording Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  const generateMutation = useMutation({
    mutationFn: async (data: MusicGenerationRequest) => {
      const res = await apiRequest("POST", "/api/generate-music", data);
      return await res.json();
    },
    onSuccess: async (data) => {
      // API.box returns taskId - we need to poll for status
      if (data.taskId) {
        const PENDING_TASKS_KEY = "pending_generation_tasks";
        
        // Store taskId and request data for delayed completion checking
        try {
          const pendingTasksStr = localStorage.getItem(PENDING_TASKS_KEY);
          const pendingTasks = pendingTasksStr ? JSON.parse(pendingTasksStr) : [];
          pendingTasks.push({
            taskId: data.taskId,
            requestData: data,
            timestamp: Date.now(),
          });
          localStorage.setItem(PENDING_TASKS_KEY, JSON.stringify(pendingTasks));
        } catch (error) {
          console.error("Error storing pending task:", error);
        }

        // Helper to remove task from pending list
        const removePendingTask = (taskId: string) => {
          try {
            const pendingTasksStr = localStorage.getItem(PENDING_TASKS_KEY);
            if (pendingTasksStr) {
              const pendingTasks = JSON.parse(pendingTasksStr);
              const filtered = pendingTasks.filter((t: any) => t.taskId !== taskId);
              if (filtered.length === 0) {
                localStorage.removeItem(PENDING_TASKS_KEY);
              } else {
                localStorage.setItem(PENDING_TASKS_KEY, JSON.stringify(filtered));
              }
            }
          } catch (error) {
            console.error("Error removing pending task:", error);
          }
        };

        // Start polling for status
        const pollStatus = async (taskId: string, requestData: MusicGenerationRequest) => {
          const maxAttempts = 60; // Poll for up to 5 minutes (60 * 5 seconds)
          let attempts = 0;

          const checkStatus = async (): Promise<void> => {
            try {
              const res = await apiRequest("GET", `/api/generate-music/${taskId}/status`);
              const status = await res.json();

              if (status.status === "complete" && status.audioUrl) {
                // Generation complete - update composition
                const languageLabel = requestData.language 
                  ? LANGUAGES.find((l) => l.value === requestData.language)?.label || requestData.language 
                  : null;
                const title = status.title || (requestData.raga && requestData.tala ? `${requestData.raga} in ${requestData.tala}` : "Music Composition");
                const description = requestData.raga && requestData.tala && requestData.instruments
                  ? `Generated ${requestData.raga} composition in ${requestData.tala} with ${requestData.instruments.join(", ")}${languageLabel ? ` in ${languageLabel}` : ""}`
                  : `Generated music composition${languageLabel ? ` in ${languageLabel}` : ""}`;
                
                // Get all audio URLs (multiple variations)
                const allAudioUrls = status.audioUrls && status.audioUrls.length > 0 
                  ? status.audioUrls 
                  : [status.audioUrl];
                
                const updatedComposition = {
                  ...requestData,
                  audioUrl: status.audioUrl,
                  title,
                  description,
                };
                setGeneratedComposition(updatedComposition);
                setAudioUrls(allAudioUrls);
                setSelectedAudioIndex(0);
                setAudioSrc(allAudioUrls[0]);
                setIsGenerating(false);
                
                // Save to library (save all variations if multiple)
                await saveCompletedComposition(updatedComposition, requestData);
                
                // Remove from pending tasks
                removePendingTask(taskId);
                
                const variationText = allAudioUrls.length > 1 
                  ? ` (${allAudioUrls.length} variations generated)` 
                  : "";
                toast({
                  title: "Composition Generated!",
                  description: `Your music piece is ready to play and has been saved to your library.${variationText}`,
                });
              } else if (status.status === "failed") {
                // Remove from pending tasks on failure
                removePendingTask(taskId);
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
                // Timeout - keep task in pending list for later checking
                setIsGenerating(false);
                toast({
                  title: "Generation Timeout",
                  description: "Generation is taking longer than expected. We'll check for completion in the background and notify you when ready.",
                  variant: "destructive",
                  duration: 8000,
                });
              }
            } catch (error: any) {
              console.error("Status check error:", error);
              if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkStatus, 5000);
              } else {
                // Status check failed - keep task in pending list for later checking
                setIsGenerating(false);
                toast({
                  title: "Status Check Failed",
                  description: "Unable to check generation status. We'll check in the background and notify you when ready.",
                  variant: "destructive",
                  duration: 8000,
                });
              }
            }
          };

          // Start polling after 2 seconds
          setTimeout(checkStatus, 2000);
        };

        pollStatus(data.taskId, data);
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
    // Validate generation mode is selected
    if (!generationMode) {
      toast({
        title: "Generation Mode Required",
        description: "Please select a generation mode: Voice Only, Instrumental Only, or Full Music.",
        variant: "destructive",
      });
      return;
    }

    // Validate based on selected mode
    if (generationMode === "voice_only") {
      if (!customPrompt.trim()) {
        toast({
          title: "Missing Information",
          description: "Voice Only mode requires a custom prompt.",
          variant: "destructive",
        });
        return;
      }
    } else if (generationMode === "instrumental_only") {
      if (!raga || !tala || selectedInstruments.length === 0 || !mood) {
        toast({
          title: "Missing Information",
          description: "Instrumental Only mode requires raga, tala, at least one instrument, and mood.",
          variant: "destructive",
        });
        return;
      }
    } else if (generationMode === "full_music") {
      if (!raga || !tala || selectedInstruments.length === 0 || !mood || !customPrompt.trim()) {
        toast({
          title: "Missing Information",
          description: "Full Music mode requires all fields: raga, tala, instruments, tempo, mood, and custom prompt.",
          variant: "destructive",
        });
        return;
      }
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
      generationMode,
      raga: generationMode !== "voice_only" ? raga : undefined,
      tala: generationMode !== "voice_only" ? tala : undefined,
      instruments: generationMode !== "voice_only" ? selectedInstruments : undefined,
      tempo: generationMode !== "voice_only" ? tempo[0] : undefined,
      mood: generationMode !== "voice_only" ? mood : undefined,
      gender: (generationMode === "voice_only" || generationMode === "full_music") ? (gender || undefined) : undefined,
      language: (generationMode === "voice_only" || generationMode === "full_music") ? (language || undefined) : undefined,
      prompt: (generationMode === "voice_only" || generationMode === "full_music") ? customPrompt.trim() : undefined,
    });
  };

  // Filter ragas based on selected tradition
  const filteredRagas = tradition 
    ? RAGAS.filter((r) => r.tradition === tradition)
    : [];

  // Filter talas based on selected tradition
  const filteredTalas = tradition 
    ? TALAS.filter((t) => t.tradition === tradition)
    : [];

  // Filter instruments based on selected tradition (show Both and selected tradition)
  const filteredInstruments = tradition 
    ? INSTRUMENTS.filter((i) => i.tradition === tradition || i.tradition === "Both")
    : INSTRUMENTS; // Show all if no tradition selected

  const selectedRaga = RAGAS.find((r) => r.value === raga);
  const selectedTala = TALAS.find((t) => t.value === tala);

  // Handle tradition change - clear raga and tala selection
  const handleTraditionChange = (value: string) => {
    setTradition(value);
    setRaga(""); // Clear raga when tradition changes
    setTala(""); // Clear tala when tradition changes
  };

  // Step management
  const getSteps = () => {
    const steps = [
      { id: "mode", title: "Generation Mode", required: true },
    ];

    if (generationMode === "voice_only") {
      steps.push(
        { id: "prompt", title: "Custom Prompt", required: true },
        { id: "gender", title: "Voice Gender", required: false },
        { id: "language", title: "Language", required: false }
      );
    } else if (generationMode === "instrumental_only") {
      steps.push(
        { id: "tradition", title: "Tradition", required: true },
        { id: "raga", title: "Raga", required: true },
        { id: "tala", title: "Tala", required: true },
        { id: "instruments", title: "Instruments", required: true },
        { id: "tempo", title: "Tempo", required: true },
        { id: "mood", title: "Mood", required: true }
      );
    } else if (generationMode === "full_music") {
      steps.push(
        { id: "tradition", title: "Tradition", required: true },
        { id: "raga", title: "Raga", required: true },
        { id: "tala", title: "Tala", required: true },
        { id: "instruments", title: "Instruments", required: true },
        { id: "tempo", title: "Tempo", required: true },
        { id: "mood", title: "Mood", required: true },
        { id: "prompt", title: "Custom Prompt", required: true },
        { id: "gender", title: "Voice Gender", required: false },
        { id: "language", title: "Language", required: false }
      );
    }

    return steps;
  };

  const steps = getSteps();
  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];

  const isStepValid = (stepId: string): boolean => {
    switch (stepId) {
      case "mode":
        return !!generationMode;
      case "prompt":
        return !!customPrompt.trim();
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
        return true; // Optional steps
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

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or the current step
    if (stepIndex <= currentStep || isStepValid(steps[stepIndex]?.id || "")) {
      setCurrentStep(stepIndex);
    }
  };

  // Reset step when generation mode changes
  useEffect(() => {
    if (generationMode) {
      const newSteps = getSteps();
      if (currentStep >= newSteps.length) {
        setCurrentStep(0);
      }
    } else {
      setCurrentStep(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationMode]);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4" data-testid="generator-title">
            AI Music Generator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create authentic classical compositions step by step
          </p>
        </div>

        {/* Progress Indicator */}
        {generationMode && totalSteps > 1 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                const isValid = isStepValid(step.id);
                return (
                  <div
                    key={step.id}
                    className="flex items-center flex-1"
                    onClick={() => handleStepClick(index)}
                    style={{ cursor: index <= currentStep ? "pointer" : "default" }}
                  >
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
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Generation Mode */}
            {currentStepData?.id === "mode" && (
            <Card data-testid="card-generation-mode">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Generation Mode</CardTitle>
                <CardDescription>
                  Select the type of music you want to generate. This determines which options are available.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={generationMode} onValueChange={(value) => setGenerationMode(value as "voice_only" | "instrumental_only" | "full_music")} className="space-y-3">
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="voice_only" id="mode-voice-only" />
                    <Label htmlFor="mode-voice-only" className="cursor-pointer flex-1">
                      <div className="font-medium">Voice Only</div>
                      <div className="text-sm text-muted-foreground">Generate pure vocal audio with no instruments</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="instrumental_only" id="mode-instrumental-only" />
                    <Label htmlFor="mode-instrumental-only" className="cursor-pointer flex-1">
                      <div className="font-medium">Instrumental Only</div>
                      <div className="text-sm text-muted-foreground">Generate pure instrumental music with no vocals</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="full_music" id="mode-full-music" />
                    <Label htmlFor="mode-full-music" className="cursor-pointer flex-1">
                      <div className="font-medium">Full Music (Voice + Instruments)</div>
                      <div className="text-sm text-muted-foreground">Generate complete music with both vocals and instruments</div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
            )}

            {/* Step: Custom Prompt */}
            {currentStepData?.id === "prompt" && (
              <Card data-testid="card-custom-prompt">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Custom Prompt</CardTitle>
                <CardDescription>
                  {generationMode === "voice_only" 
                    ? "Provide lyrics or vocal instructions for voice-only generation."
                      : "Provide your own detailed description or instructions for the music generation."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="custom-prompt">Your Custom Prompt</Label>
                    <Button
                      type="button"
                      variant={isRecording ? "destructive" : "outline"}
                      size="sm"
                      onClick={toggleRecording}
                      className="gap-2"
                      data-testid="button-microphone"
                    >
                      {isRecording ? (
                        <>
                          <Square className="h-4 w-4" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Voice Input
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <Textarea
                      id="custom-prompt"
                      placeholder={generationMode === "voice_only" 
                        ? "Enter lyrics or vocal instructions for voice-only generation..."
                        : "e.g., Create a slow, meditative piece that starts with a gentle alaap, gradually building to a vibrant gat section. Include intricate taans and emphasize the emotional depth of the raga..."}
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      className="min-h-[120px] resize-y pr-12"
                      maxLength={1000}
                      data-testid="textarea-custom-prompt"
                    />
                    {isRecording && (
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-red-500 font-medium">Recording...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Describe your vision for the composition in detail {isRecording && "(speaking...)"}</span>
                    <span>{customPrompt.length}/1000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Step: Tradition */}
            {currentStepData?.id === "tradition" && (
              <Card data-testid="card-tradition-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Select Tradition</CardTitle>
                <CardDescription>
                    Choose between Hindustani or Carnatic classical tradition
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <Select value={tradition} onValueChange={handleTraditionChange}>
                    <SelectTrigger data-testid="select-tradition" className="h-14">
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
                </CardContent>
              </Card>
            )}

            {/* Step: Raga */}
            {currentStepData?.id === "raga" && (
              <Card data-testid="card-raga-selection">
                <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Select Raga</CardTitle>
                  <CardDescription>
                    Choose the melodic framework for your composition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Choose a Raga</Label>
                  <Select 
                    value={raga} 
                    onValueChange={setRaga}
                      disabled={!tradition}
                  >
                      <SelectTrigger data-testid="select-raga" className="h-14">
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
                    {!tradition && (
                    <p className="text-xs text-muted-foreground mt-1">
                        Please go back and select a tradition first
                    </p>
                  )}
                </div>
                {selectedRaga && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">{selectedRaga.label}</p>
                      <p className="text-sm text-muted-foreground" data-testid="raga-description">
                    {selectedRaga.description}
                  </p>
                    </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Step: Tala */}
            {currentStepData?.id === "tala" && (
              <Card data-testid="card-tala-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Select Tala</CardTitle>
                <CardDescription>
                    Choose the rhythmic cycle for your composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select 
                  value={tala} 
                  onValueChange={setTala}
                    disabled={!tradition}
                >
                    <SelectTrigger data-testid="select-tala" className="h-14">
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
                  {!tradition && (
                  <p className="text-xs text-muted-foreground mt-1">
                      Please go back and select a tradition first
                  </p>
                )}
                {selectedTala && (
                    <div className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm font-medium mb-1">{selectedTala.label} ({selectedTala.beats})</p>
                      <p className="text-sm text-muted-foreground" data-testid="tala-description">
                    {selectedTala.description}
                  </p>
                    </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Step: Instruments */}
            {currentStepData?.id === "instruments" && (
              <Card data-testid="card-instrument-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Select Instruments</CardTitle>
                <CardDescription>
                    Choose one or more instruments for your composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                  {!tradition && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Select a tradition to see filtered instruments, or choose from all instruments below
                  </p>
                )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-2">
                  {filteredInstruments.map((instrument) => (
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
                  {selectedInstruments.length > 0 && (
                    <div className="mt-4 p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Selected ({selectedInstruments.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedInstruments.map((inst) => {
                          const instObj = INSTRUMENTS.find(i => i.value === inst);
                          return (
                            <Badge key={inst} variant="secondary">
                              {instObj?.label || inst}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
            )}

            {/* Step: Tempo */}
            {currentStepData?.id === "tempo" && (
              <Card data-testid="card-tempo-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Tempo</CardTitle>
                <CardDescription>
                    Adjust the speed of your composition (40-200 BPM)
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="space-y-6 py-4">
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2" data-testid="tempo-value">{tempo[0]}</div>
                      <div className="text-lg text-muted-foreground">BPM</div>
                    </div>
                  <Slider
                    value={tempo}
                    onValueChange={setTempo}
                    min={40}
                    max={200}
                    step={5}
                    className="w-full"
                    data-testid="slider-tempo"
                  />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Slow (40 BPM)</span>
                      <span>Fast (200 BPM)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Step: Mood */}
            {currentStepData?.id === "mood" && (
              <Card data-testid="card-mood-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Mood</CardTitle>
                <CardDescription>
                    Select the emotional character of your composition
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="flex flex-wrap gap-2 max-h-[500px] overflow-y-auto p-2">
                  {MOODS.map((m) => (
                    <Badge
                      key={m}
                      variant={mood === m ? "default" : "outline"}
                        className="cursor-pointer px-4 py-2 text-sm hover:scale-105 transition-transform"
                        onClick={() => setMood(m)}
                      data-testid={`badge-mood-${m.toLowerCase()}`}
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
              </CardContent>
            </Card>
            )}

            {/* Step: Voice Gender */}
            {currentStepData?.id === "gender" && (
              <Card data-testid="card-voice-gender">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Voice Gender</CardTitle>
                <CardDescription>
                    Select Male or Female voice preference (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
            )}

            {/* Step: Language */}
            {currentStepData?.id === "language" && (
              <Card data-testid="card-language-selection">
              <CardHeader>
                  <CardTitle>Step {currentStep + 1} of {totalSteps}: Language</CardTitle>
                <CardDescription>
                    Select the language for lyrics/vocals (optional)
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger data-testid="select-language" className="h-14">
                      <SelectValue placeholder="Choose a language (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.filter(l => l.value !== "instrumental").map((lang) => (
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
                    <div className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm font-medium mb-1">{LANGUAGES.find((l) => l.value === language)?.label}</p>
                      <p className="text-sm text-muted-foreground" data-testid="language-description">
                    {LANGUAGES.find((l) => l.value === language)?.description}
                  </p>
                    </div>
                )}
              </CardContent>
            </Card>
            )}

            {/* Navigation Buttons */}
            {currentStepData && (
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
                {currentStep < totalSteps - 1 ? (
                  <Button
                    onClick={handleNext}
                    disabled={!canGoNext()}
                    className="gap-2"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating || !canGoNext()}
                    className="gap-2"
                    size="lg"
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Music
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="font-medium" data-testid="summary-generation-mode">
                      {generationMode === "voice_only" 
                        ? "Voice Only" 
                        : generationMode === "instrumental_only"
                        ? "Instrumental Only"
                        : generationMode === "full_music"
                        ? "Full Music"
                        : "-"}
                    </span>
                  </div>
                  {generationMode !== "voice_only" && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tradition:</span>
                        <span className="font-medium">{tradition || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Raga:</span>
                    <span className="font-medium" data-testid="summary-raga">
                          {selectedRaga?.label || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tala:</span>
                    <span className="font-medium" data-testid="summary-tala">
                          {selectedTala?.label || "-"}
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
                          {mood || "-"}
                    </span>
                  </div>
                    </>
                  )}
                  {(generationMode === "voice_only" || generationMode === "full_music") && (
                    <>
                  <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                    <span className="font-medium" data-testid="summary-gender">
                          {gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Language:</span>
                    <span className="font-medium" data-testid="summary-language">
                          {language ? LANGUAGES.find((l) => l.value === language)?.label || language : "-"}
                    </span>
                  </div>
                  {customPrompt.trim() && (
                    <div className="pt-2 border-t">
                      <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Prompt:</span>
                            <p className="text-xs font-medium text-foreground line-clamp-3" data-testid="summary-prompt">
                          {customPrompt}
                        </p>
                      </div>
                    </div>
                  )}
                    </>
                  )}
                </div>

                {isGenerating && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">{generationStatus || "Generating..."}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, "0")}
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>This may take 2-5 minutes</span>
                        <span>{Math.round(generationProgress)}%</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Your music is being generated. You can continue using the app - we'll notify you when it's ready.
                    </p>
                  </div>
                )}

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

                    {/* Audio Variation Selector (if multiple variations) */}
                    {audioUrls.length > 1 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Variation ({audioUrls.length} versions)</Label>
                        <Select
                          value={selectedAudioIndex.toString()}
                          onValueChange={(value) => {
                            const index = parseInt(value);
                            setSelectedAudioIndex(index);
                            setAudioSrc(audioUrls[index]);
                            setIsPlaying(false);
                            if (audioRef.current) {
                              audioRef.current.pause();
                              audioRef.current.load();
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {audioUrls.map((url, index) => (
                              <SelectItem key={index} value={index.toString()}>
                                Variation {index + 1}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

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

      {/* AI Chat Floating Button */}
      {!isChatOpen && (
        <div 
          style={{ 
            position: 'fixed',
            left: '1.5rem',
            right: 'auto',
            bottom: '1.5rem',
            zIndex: 40
          }}
        >
          <Button
            onClick={() => setIsChatOpen(true)}
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
            aria-label="Open AI Chat Assistant"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </div>
      )}

      {/* AI Chat Panel */}
      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
}
