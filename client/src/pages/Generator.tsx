import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Play, Download, Loader2, Music, Save, Mic, Square } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { saveComposition } from "@/lib/compositionStorage";
import { Textarea } from "@/components/ui/textarea";
import type { MusicGenerationRequest } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

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
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const generationStartRef = useRef<number>(0);

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
                
                // Automatically save to local library
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

                // Save to Firestore for authenticated users
                try {
                  if (user && !user.isGuest) {
                    const languageLabel = data.language 
                      ? LANGUAGES.find((l) => l.value === data.language)?.label || data.language 
                      : null;
                    await addDoc(collection(db, "users", user.id, "compositions"), {
                      title: updatedComposition.title,
                      raga: data.raga,
                      tala: data.tala,
                      instruments: data.instruments,
                      tempo: data.tempo,
                      mood: data.mood,
                      audioUrl: status.audioUrl,
                      language: languageLabel,
                      prompt: (data as any).prompt || null,
                      createdAt: serverTimestamp(),
                      generatedAt: serverTimestamp(),
                      source: "generator",
                    });
                  }
                } catch (error) {
                  console.error("Error saving composition to Firestore:", error);
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
      prompt: customPrompt.trim() || undefined, // Include custom prompt if provided
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
            <Card data-testid="card-custom-prompt">
              <CardHeader>
                <CardTitle>Custom Prompt (Optional)</CardTitle>
                <CardDescription>
                  Provide your own detailed description or instructions for the music generation. 
                  If left empty, a prompt will be generated from your selections below.
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
                      placeholder="e.g., Create a slow, meditative piece that starts with a gentle alaap, gradually building to a vibrant gat section. Include intricate taans and emphasize the emotional depth of the raga..."
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

            <Card data-testid="card-raga-selection">
              <CardHeader>
                <CardTitle>Select Raga</CardTitle>
                <CardDescription>Choose the melodic framework for your composition</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Tradition</Label>
                  <Select value={tradition} onValueChange={handleTraditionChange}>
                    <SelectTrigger data-testid="select-tradition">
                      <SelectValue placeholder="Select Hindustani or Carnatic" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hindustani">Hindustani</SelectItem>
                      <SelectItem value="Carnatic">Carnatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Choose a Raga</Label>
                  <Select 
                    value={raga} 
                    onValueChange={setRaga}
                    disabled={!tradition}
                  >
                    <SelectTrigger data-testid="select-raga">
                      <SelectValue placeholder={tradition ? "Choose a raga" : "First select a tradition"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRagas.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!tradition && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Please select a tradition first to see available ragas
                    </p>
                  )}
                </div>
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
                <Select 
                  value={tala} 
                  onValueChange={setTala}
                  disabled={!tradition}
                >
                  <SelectTrigger data-testid="select-tala">
                    <SelectValue placeholder={tradition ? "Choose a tala" : "First select a tradition"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTalas.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label} ({t.beats})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!tradition && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Please select a tradition first to see available talas
                  </p>
                )}
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
                {!tradition && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Select a tradition to see filtered instruments, or choose from all instruments below
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  {customPrompt.trim() && (
                    <div className="pt-2 border-t">
                      <div className="space-y-1">
                        <span className="text-muted-foreground text-xs">Custom Prompt:</span>
                        <p className="text-xs font-medium text-foreground line-clamp-2" data-testid="summary-prompt">
                          {customPrompt}
                        </p>
                      </div>
                    </div>
                  )}
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
