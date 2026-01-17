import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Save, 
  Sun, 
  Moon, 
  Crown, 
  Shield, 
  Download, 
  Settings,
  Music,
  TrendingUp,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  AlertCircle,
  Users,
  Upload,
  FolderOpen,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { getSavedCompositions } from "@/lib/compositionStorage";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";

// Music generation constants (matching Onboarding and Generator)
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

/**
 * DashboardProfile component - user profile page with enhanced features
 */
export default function DashboardProfile() {
  const { user } = useAuth();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [name, setName] = useState(user?.name || "");
  const [email] = useState(user?.email || "");
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [compositionsCount, setCompositionsCount] = useState(0);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  
  // Music generation preferences state
  const [generationMode, setGenerationMode] = useState<"voice_only" | "instrumental_only" | "full_music" | "">("");
  const [tradition, setTradition] = useState<string>("");
  const [raga, setRaga] = useState("");
  const [tala, setTala] = useState("");
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [tempo, setTempo] = useState([100]);
  const [mood, setMood] = useState("");
  const [gender, setGender] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  // Subscription details state
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);

  // Load user stats
  useEffect(() => {
    const compositions = getSavedCompositions();
    setCompositionsCount(compositions.length);
  }, []);

  // Load subscription details
  useEffect(() => {
    const fetchSubscriptionDetails = async () => {
      if (!user || user.isGuest) {
        setIsLoadingSubscription(false);
        return;
      }

      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setIsLoadingSubscription(false);
          return;
        }

        const token = await currentUser.getIdToken();
        const response = await fetch("/api/user/subscription-details", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSubscriptionDetails(data);
        }
      } catch (error) {
        console.error("Error fetching subscription details:", error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscriptionDetails();
  }, [user]);

  // Load music generation preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user || user.isGuest) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.id);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          
          if (userData.generationMode) {
            setGenerationMode(userData.generationMode as "voice_only" | "instrumental_only" | "full_music" | "");
          }
          if (userData.tradition) {
            setTradition(userData.tradition);
          }
          if (userData.raga) {
            setRaga(userData.raga);
          }
          if (userData.tala) {
            setTala(userData.tala);
          }
          if (userData.instruments && Array.isArray(userData.instruments)) {
            setSelectedInstruments(userData.instruments);
          }
          if (userData.tempo && typeof userData.tempo === 'number') {
            setTempo([userData.tempo]);
          }
          if (userData.mood) {
            setMood(userData.mood);
          }
          if (userData.gender) {
            setGender(userData.gender);
          }
          if (userData.language) {
            setLanguage(userData.language);
          }
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [user, toast]);

  /**
   * Handle profile update
   */
  const handleSaveProfile = () => {
    // In a real app, this would update the user profile via API
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    });
  };

  /**
   * Handle upgrade account
   */
  const handleUpgrade = () => {
    setLocation("/dashboard/upgrade");
  };

  // Filter helpers
  const filteredRagas = tradition ? RAGAS.filter((r) => r.tradition === tradition) : [];
  const filteredTalas = tradition ? TALAS.filter((t) => t.tradition === tradition) : [];
  const filteredInstruments = tradition
    ? INSTRUMENTS.filter((i) => i.tradition === tradition || i.tradition === "Both")
    : INSTRUMENTS;

  const handleTraditionChange = (value: string) => {
    setTradition(value);
    // Clear raga and tala when tradition changes
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

  /**
   * Handle saving music generation preferences
   */
  const handleSavePreferences = async () => {
    if (!user || user.isGuest) {
      toast({
        title: "Error",
        description: "You must be logged in to save preferences",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPreferences(true);
    try {
      // First, get the existing user document to preserve role and subscriptionStatus
      const userDocRef = doc(db, "users", user.id);
      const userDocSnap = await getDoc(userDocRef);
      
      const existingData = userDocSnap.exists() ? userDocSnap.data() : {};
      
      // Prepare preferences with existing role and subscriptionStatus to satisfy Firestore rules
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
        updatedAt: serverTimestamp(),
        // Preserve existing role and subscriptionStatus (required by Firestore rules)
        role: existingData.role || "user",
        subscriptionStatus: existingData.subscriptionStatus || null,
      };

      await setDoc(userDocRef, preferences, { merge: true });

      toast({
        title: "Preferences Saved!",
        description: "Your music generation preferences have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  /**
   * Handle export data
   */
  const handleExportData = () => {
    const compositions = getSavedCompositions();
    const dataStr = JSON.stringify(compositions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `thanvish-music-library-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data exported",
      description: "Your library data has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account information, preferences, and settings
        </p>
      </div>

      {/* Account Statistics - Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compositions</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compositionsCount}</div>
            <p className="text-xs text-muted-foreground">Total saved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Type</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSubscription ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : subscriptionDetails ? (
              <>
                <div className="text-2xl font-bold">
                  {subscriptionDetails.planType === "free" ? "Free" : 
                   subscriptionDetails.planType === "free_trial" ? "Trial" : 
                   subscriptionDetails.planType === "paid" ? "Pro" : "Free"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {subscriptionDetails.planName || (user?.isGuest ? "Upgrade available" : "Premium member")}
                </p>
                {subscriptionDetails.subscriptionStatus && (
                  <Badge 
                    variant={
                      subscriptionDetails.subscriptionStatus === "active" ? "default" :
                      subscriptionDetails.subscriptionStatus === "trial" ? "secondary" :
                      subscriptionDetails.subscriptionStatus === "expired" ? "destructive" :
                      "outline"
                    }
                    className="mt-1 text-xs"
                  >
                    {subscriptionDetails.subscriptionStatus.toUpperCase()}
                  </Badge>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {user?.isGuest ? "Free" : "Pro"}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.isGuest ? "Upgrade available" : "Premium member"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Generation Credits</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingSubscription ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : subscriptionDetails ? (
              <>
                <div className="text-2xl font-bold">
                  {subscriptionDetails.dailyRemaining !== undefined && subscriptionDetails.monthlyRemaining !== undefined
                    ? `${subscriptionDetails.dailyRemaining}/${subscriptionDetails.dailyLimit}`
                    : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                  Daily remaining
                </p>
                {subscriptionDetails.monthlyRemaining !== undefined && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Monthly: {subscriptionDetails.monthlyRemaining}/{subscriptionDetails.monthlyLimit}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">Unlimited</div>
                <p className="text-xs text-muted-foreground">Cloud storage</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="music">Music Settings</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          {/* Profile Information */}
          <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>
            Update your profile details and personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
                disabled={user?.isGuest}
              />
            </div>
            {user?.isGuest && (
              <p className="text-xs text-muted-foreground">
                Sign up to edit your profile
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                className="pl-10"
                disabled={true}
              />
            </div>
            {user?.isGuest && (
              <p className="text-xs text-muted-foreground">
                Sign up to add an email address
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button onClick={handleSaveProfile} disabled={user?.isGuest}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Account Status & Upgrade */}
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Account Status
          </CardTitle>
          <CardDescription>
            Your current account type and subscription details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSubscription ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : subscriptionDetails ? (
            <>
              {/* Account Type Card */}
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">
                        {subscriptionDetails.planType === "free" ? "Free" : 
                         subscriptionDetails.planType === "free_trial" ? "Trial" : "Paid"} Account
                      </p>
                      <Badge 
                        variant={
                          subscriptionDetails.subscriptionStatus === "active" ? "default" :
                          subscriptionDetails.subscriptionStatus === "trial" ? "secondary" :
                          subscriptionDetails.subscriptionStatus === "expired" ? "destructive" :
                          "outline"
                        }
                      >
                        {subscriptionDetails.subscriptionStatus?.toUpperCase() || "INACTIVE"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Plan: {subscriptionDetails.planName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Billing: {subscriptionDetails.billingCycle === "monthly" ? "Monthly" : "Yearly"}
                    </p>
                  </div>
                  {(subscriptionDetails.subscriptionStatus === "expired" || !subscriptionDetails.planId) && (
                    <Button onClick={handleUpgrade} className="ml-4">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade
                    </Button>
                  )}
                </div>

                {/* Validity Information */}
                {subscriptionDetails.subscriptionStartDate && subscriptionDetails.subscriptionEndDate && (
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Start:</span>
                      <span>{new Date(subscriptionDetails.subscriptionStartDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">End:</span>
                      <span>{new Date(subscriptionDetails.subscriptionEndDate).toLocaleDateString()}</span>
                    </div>
                    {subscriptionDetails.daysRemaining !== null && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Days Remaining:</span>
                        <span className={subscriptionDetails.daysRemaining <= 7 ? "text-destructive font-semibold" : ""}>
                          {subscriptionDetails.daysRemaining} days
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Messages */}
                {subscriptionDetails.subscriptionStatus === "expired" && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <p className="text-sm text-destructive">
                        Plan expired. Upgrade to continue generating music.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Available Generation Credits */}
              <div className="p-4 border rounded-lg space-y-4">
                <h3 className="font-semibold text-sm">Available Generation Credits</h3>
                
                {/* Daily Remaining */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Daily Remaining</span>
                    <span className="font-semibold">
                      {subscriptionDetails.dailyRemaining} / {subscriptionDetails.dailyLimit}
                    </span>
                  </div>
                  <Progress 
                    value={(subscriptionDetails.dailyRemaining / subscriptionDetails.dailyLimit) * 100} 
                    className="h-2"
                  />
                  {subscriptionDetails.dailyRemaining === 0 && (
                    <p className="text-xs text-destructive">
                      Today's limit reached. Try again tomorrow or upgrade.
                    </p>
                  )}
                </div>

                {/* Monthly Remaining */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monthly Remaining</span>
                    <span className="font-semibold">
                      {subscriptionDetails.monthlyRemaining} / {subscriptionDetails.monthlyLimit}
                    </span>
                  </div>
                  <Progress 
                    value={(subscriptionDetails.monthlyRemaining / subscriptionDetails.monthlyLimit) * 100} 
                    className="h-2"
                  />
                  {subscriptionDetails.monthlyRemaining === 0 && (
                    <p className="text-xs text-destructive">
                      Monthly limit reached. Resets next month or upgrade.
                    </p>
                  )}
                </div>
              </div>

              {/* Teacher Capacity Section - Only for teachers */}
              {user?.role === "music_teacher" && subscriptionDetails?.teacherMaxStudents !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Teacher Capacity
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground block">Max Students Allowed</span>
                        <span className="font-semibold text-lg">{subscriptionDetails.teacherMaxStudents}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Students Assigned</span>
                        <span className="font-semibold text-lg">{subscriptionDetails.studentsAllocatedCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Remaining Slots</span>
                        <span className={`font-semibold text-lg ${(subscriptionDetails.studentsAllocatedRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.studentsAllocatedRemaining || 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Allocation Progress</span>
                        <span className="font-semibold">
                          {subscriptionDetails.studentsAllocatedCount || 0} / {subscriptionDetails.teacherMaxStudents}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.teacherMaxStudents > 0 
                          ? ((subscriptionDetails.studentsAllocatedCount || 0) / subscriptionDetails.teacherMaxStudents) * 100 
                          : 0} 
                        className="h-2" 
                      />
                    </div>

                    {subscriptionDetails.teacherPlanExpiryDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Plan Expiry:</span>
                          <span>{new Date(subscriptionDetails.teacherPlanExpiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.studentsAllocatedRemaining === 0 && subscriptionDetails.teacherMaxStudents > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            Student limit reached. Upgrade your plan to add more students.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Artist Capacity Section - Only for artists */}
              {user?.role === "artist" && subscriptionDetails?.maxTrackUploadsPerDay !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Artist Upload & Publish Limits
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Track Uploads Today</span>
                        <span className="font-semibold">
                          {subscriptionDetails.trackUploadsUsedToday || 0} / {subscriptionDetails.maxTrackUploadsPerDay || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxTrackUploadsPerDay > 0 
                          ? ((subscriptionDetails.trackUploadsUsedToday || 0) / subscriptionDetails.maxTrackUploadsPerDay) * 100 
                          : 0} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining Today</span>
                        <span className={`font-semibold ${(subscriptionDetails.trackUploadsRemainingToday || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.trackUploadsRemainingToday || 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Track Uploads This Month</span>
                        <span className="font-semibold">
                          {subscriptionDetails.trackUploadsUsedThisMonth || 0} / {subscriptionDetails.maxTrackUploadsPerMonth || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxTrackUploadsPerMonth > 0 
                          ? ((subscriptionDetails.trackUploadsUsedThisMonth || 0) / subscriptionDetails.maxTrackUploadsPerMonth) * 100 
                          : 0} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining This Month</span>
                        <span className={`font-semibold ${(subscriptionDetails.trackUploadsRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.trackUploadsRemainingThisMonth || 0}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Albums Published This Month</span>
                        <span className="font-semibold">
                          {subscriptionDetails.albumsPublishedThisMonth || 0} / {subscriptionDetails.maxAlbumsPublishedPerMonth || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxAlbumsPublishedPerMonth > 0 
                          ? ((subscriptionDetails.albumsPublishedThisMonth || 0) / subscriptionDetails.maxAlbumsPublishedPerMonth) * 100 
                          : 0} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining This Month</span>
                        <span className={`font-semibold ${(subscriptionDetails.albumsPublishRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.albumsPublishRemainingThisMonth || 0}
                        </span>
                      </div>
                    </div>

                    {subscriptionDetails.subscriptionEndDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Plan Expiry:</span>
                          <span>{new Date(subscriptionDetails.subscriptionEndDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.trackUploadsRemainingToday === 0 && subscriptionDetails.maxTrackUploadsPerDay > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached today's track upload limit. Try again tomorrow or upgrade your plan.
                          </p>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.trackUploadsRemainingThisMonth === 0 && subscriptionDetails.maxTrackUploadsPerMonth > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached this month's track upload limit. It will reset next month, or upgrade now.
                          </p>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.albumsPublishRemainingThisMonth === 0 && subscriptionDetails.maxAlbumsPublishedPerMonth > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached your album publish limit for this plan. Upgrade to publish more albums.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Director Limits Section - Only for music directors */}
              {user?.role === "music_director" && subscriptionDetails?.maxActiveProjects !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Director Project & Discovery Limits
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Active Projects */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Projects</span>
                        <span className="font-semibold">
                          {subscriptionDetails.activeProjectsCount || 0} / {subscriptionDetails.maxActiveProjects || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxActiveProjects > 0 
                          ? ((subscriptionDetails.activeProjectsCount || 0) / subscriptionDetails.maxActiveProjects) * 100 
                          : 0} 
                        className="h-2" 
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className={`font-semibold ${(subscriptionDetails.projectsRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.projectsRemaining || 0}
                        </span>
                      </div>
                    </div>

                    {/* Artist Discovery - Daily */}
                    {subscriptionDetails.artistDiscoveryPerDay !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Artist Discovery Today</span>
                          <span className="font-semibold">
                            {subscriptionDetails.artistDiscoveryUsedToday || 0} / {subscriptionDetails.artistDiscoveryPerDay || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.artistDiscoveryPerDay > 0 
                            ? ((subscriptionDetails.artistDiscoveryUsedToday || 0) / subscriptionDetails.artistDiscoveryPerDay) * 100 
                            : 0} 
                          className="h-2" 
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining Today</span>
                          <span className={`font-semibold ${(subscriptionDetails.discoveryRemainingToday || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.discoveryRemainingToday || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Artist Discovery - Monthly */}
                    {subscriptionDetails.artistDiscoveryPerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Artist Discovery This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.artistDiscoveryUsedThisMonth || 0} / {subscriptionDetails.artistDiscoveryPerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.artistDiscoveryPerMonth > 0 
                            ? ((subscriptionDetails.artistDiscoveryUsedThisMonth || 0) / subscriptionDetails.artistDiscoveryPerMonth) * 100 
                            : 0} 
                          className="h-2" 
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining This Month</span>
                          <span className={`font-semibold ${(subscriptionDetails.discoveryRemainingMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.discoveryRemainingMonth || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Shortlist Creation */}
                    {subscriptionDetails.maxShortlistsCreatePerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Shortlists Created This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.shortlistsCreatedThisMonth || 0} / {subscriptionDetails.maxShortlistsCreatePerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxShortlistsCreatePerMonth > 0 
                            ? ((subscriptionDetails.shortlistsCreatedThisMonth || 0) / subscriptionDetails.maxShortlistsCreatePerMonth) * 100 
                            : 0} 
                          className="h-2" 
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining This Month</span>
                          <span className={`font-semibold ${(subscriptionDetails.shortlistsRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.shortlistsRemaining || 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.directorPlanExpiryDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Plan Expiry:</span>
                          <span>{new Date(subscriptionDetails.directorPlanExpiryDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Status Messages */}
                    {subscriptionDetails.projectsRemaining === 0 && subscriptionDetails.maxActiveProjects > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached your active project limit. Complete or archive existing projects, or upgrade your plan.
                          </p>
                        </div>
                      </div>
                    )}

                    {(subscriptionDetails.discoveryRemainingToday === 0 || subscriptionDetails.discoveryRemainingMonth === 0) && subscriptionDetails.artistDiscoveryPerDay !== undefined && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached your artist discovery limit. Please upgrade your plan or try again later.
                          </p>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.shortlistsRemaining === 0 && subscriptionDetails.maxShortlistsCreatePerMonth > 0 && (
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            You've reached your shortlist creation limit. Please upgrade your plan or wait until next month.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Doctor Program, Template & Article Limits */}
              {user?.role === "doctor" && subscriptionDetails?.maxProgramsCreatePerMonth !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Doctor Program, Template & Article Limits
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Programs */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Programs This Month</span>
                        <span className="font-semibold">
                          {subscriptionDetails.programsCreatedThisMonth || 0} / {subscriptionDetails.maxProgramsCreatePerMonth || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxProgramsCreatePerMonth > 0 
                          ? ((subscriptionDetails.programsCreatedThisMonth || 0) / subscriptionDetails.maxProgramsCreatePerMonth) * 100 
                          : 0} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className={`font-semibold ${(subscriptionDetails.programsRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.programsRemainingThisMonth !== undefined ? (subscriptionDetails.programsRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.programsRemainingThisMonth) : 0}
                        </span>
                      </div>
                    </div>

                    {/* Templates */}
                    {subscriptionDetails.maxTemplatesCreatePerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Templates This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.templatesCreatedThisMonth || 0} / {subscriptionDetails.maxTemplatesCreatePerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxTemplatesCreatePerMonth > 0 
                            ? ((subscriptionDetails.templatesCreatedThisMonth || 0) / subscriptionDetails.maxTemplatesCreatePerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.templatesRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.templatesRemainingThisMonth !== undefined ? (subscriptionDetails.templatesRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.templatesRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Articles */}
                    {subscriptionDetails.maxArticlesPublishPerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Articles Published This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.articlesPublishedThisMonth || 0} / {subscriptionDetails.maxArticlesPublishPerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxArticlesPublishPerMonth > 0 
                            ? ((subscriptionDetails.articlesPublishedThisMonth || 0) / subscriptionDetails.maxArticlesPublishPerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.articlesRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.articlesRemainingThisMonth !== undefined ? (subscriptionDetails.articlesRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.articlesRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.astrologerPlanExpiryDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan Expiry</span>
                          <span className="font-semibold">
                            {new Date(subscriptionDetails.astrologerPlanExpiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        {subscriptionDetails.daysRemaining !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscriptionDetails.daysRemaining} days remaining
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Astrologer Client, Reading, Template, Rasi & Post Limits */}
              {user?.role === "astrologer" && subscriptionDetails?.maxClientsActive !== undefined && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Astrologer Client, Reading, Template, Rasi & Post Limits
                  </h3>
                  
                  <div className="space-y-3">
                    {/* Clients */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Clients</span>
                        <span className="font-semibold">
                          {subscriptionDetails.clientsActiveCount || 0} / {subscriptionDetails.maxClientsActive || 0}
                        </span>
                      </div>
                      <Progress 
                        value={subscriptionDetails.maxClientsActive > 0 
                          ? ((subscriptionDetails.clientsActiveCount || 0) / subscriptionDetails.maxClientsActive) * 100 
                          : 0} 
                        className="h-2"
                      />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Remaining</span>
                        <span className={`font-semibold ${(subscriptionDetails.clientsRemaining || 0) === 0 ? "text-destructive" : ""}`}>
                          {subscriptionDetails.clientsRemaining !== undefined ? (subscriptionDetails.clientsRemaining === -1 ? "Unlimited" : subscriptionDetails.clientsRemaining) : 0}
                        </span>
                      </div>
                    </div>

                    {/* Readings */}
                    {subscriptionDetails.maxReadingsPerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Readings This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.readingsCreatedThisMonth || 0} / {subscriptionDetails.maxReadingsPerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxReadingsPerMonth > 0 
                            ? ((subscriptionDetails.readingsCreatedThisMonth || 0) / subscriptionDetails.maxReadingsPerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.readingsRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.readingsRemainingThisMonth !== undefined ? (subscriptionDetails.readingsRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.readingsRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Templates */}
                    {subscriptionDetails.maxAstroTemplatesCreatePerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Templates This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.astroTemplatesCreatedThisMonth || 0} / {subscriptionDetails.maxAstroTemplatesCreatePerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxAstroTemplatesCreatePerMonth > 0 
                            ? ((subscriptionDetails.astroTemplatesCreatedThisMonth || 0) / subscriptionDetails.maxAstroTemplatesCreatePerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.templatesRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.templatesRemainingThisMonth !== undefined ? (subscriptionDetails.templatesRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.templatesRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Rasi Recommendations */}
                    {subscriptionDetails.maxRasiRecommendationsCreatePerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rasi Recommendations This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.rasiRecommendationsCreatedThisMonth || 0} / {subscriptionDetails.maxRasiRecommendationsCreatePerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxRasiRecommendationsCreatePerMonth > 0 
                            ? ((subscriptionDetails.rasiRecommendationsCreatedThisMonth || 0) / subscriptionDetails.maxRasiRecommendationsCreatePerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.rasiRecommendationsRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.rasiRecommendationsRemainingThisMonth !== undefined ? (subscriptionDetails.rasiRecommendationsRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.rasiRecommendationsRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Posts */}
                    {subscriptionDetails.maxHoroscopePostsPublishPerMonth !== undefined && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Posts Published This Month</span>
                          <span className="font-semibold">
                            {subscriptionDetails.horoscopePostsPublishedThisMonth || 0} / {subscriptionDetails.maxHoroscopePostsPublishPerMonth || 0}
                          </span>
                        </div>
                        <Progress 
                          value={subscriptionDetails.maxHoroscopePostsPublishPerMonth > 0 
                            ? ((subscriptionDetails.horoscopePostsPublishedThisMonth || 0) / subscriptionDetails.maxHoroscopePostsPublishPerMonth) * 100 
                            : 0} 
                          className="h-2"
                        />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className={`font-semibold ${(subscriptionDetails.postsRemainingThisMonth || 0) === 0 ? "text-destructive" : ""}`}>
                            {subscriptionDetails.postsRemainingThisMonth !== undefined ? (subscriptionDetails.postsRemainingThisMonth === -1 ? "Unlimited" : subscriptionDetails.postsRemainingThisMonth) : 0}
                          </span>
                        </div>
                      </div>
                    )}

                    {subscriptionDetails.astrologerPlanExpiryDate && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Plan Expiry</span>
                          <span className="font-semibold">
                            {new Date(subscriptionDetails.astrologerPlanExpiryDate).toLocaleDateString()}
                          </span>
                        </div>
                        {subscriptionDetails.daysRemaining !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {subscriptionDetails.daysRemaining} days remaining
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                {user?.isGuest 
                  ? "Limited features. Upgrade to unlock premium features."
                  : "No subscription plan assigned. Please contact support."
                }
              </p>
              {user?.isGuest && (
                <Button onClick={handleUpgrade} className="mt-4">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade Account
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {theme === "light" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                Appearance
              </CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="theme-toggle">Theme</Label>
              <p className="text-sm text-muted-foreground">
                Switch between light and dark mode
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={theme === "light" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4 mr-2" />
                Light
              </Button>
              <Button
                variant={theme === "dark" ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4 mr-2" />
                Dark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* App Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Configure your application preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications about your compositions
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get updates via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
              disabled={user?.isGuest}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-save">Auto-save Compositions</Label>
              <p className="text-sm text-muted-foreground">
                Automatically save generated compositions to library
              </p>
            </div>
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* Music Settings Tab */}
        <TabsContent value="music" className="space-y-4">
          {/* Music Generation Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Music Generation Preferences
              </CardTitle>
              <CardDescription>
                Update your default music generation settings. These will be pre-filled in the generator page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          {isLoadingPreferences ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Generation Mode */}
              <div className="space-y-3">
                <Label>Generation Mode</Label>
                <RadioGroup
                  value={generationMode}
                  onValueChange={(value) => setGenerationMode(value as "voice_only" | "instrumental_only" | "full_music" | "")}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="voice_only" id="pref-mode-voice" />
                    <Label htmlFor="pref-mode-voice" className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">Voice Only</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="instrumental_only" id="pref-mode-instrumental" />
                    <Label htmlFor="pref-mode-instrumental" className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">Instrumental Only</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="full_music" id="pref-mode-full" />
                    <Label htmlFor="pref-mode-full" className="cursor-pointer flex-1">
                      <div className="font-medium text-sm">Full Music</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <Separator />

              {/* Tradition */}
              <div className="space-y-2">
                <Label>Tradition</Label>
                <Select value={tradition} onValueChange={handleTraditionChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Hindustani or Carnatic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Hindustani">Hindustani</SelectItem>
                    <SelectItem value="Carnatic">Carnatic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Raga */}
              <div className="space-y-2">
                <Label>Raga</Label>
                <Select value={raga} onValueChange={setRaga} disabled={!tradition}>
                  <SelectTrigger>
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
              </div>

              {/* Tala */}
              <div className="space-y-2">
                <Label>Tala</Label>
                <Select value={tala} onValueChange={setTala} disabled={!tradition}>
                  <SelectTrigger>
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
              </div>

              {/* Instruments */}
              <div className="space-y-3">
                <Label>Instruments</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-2 border rounded-lg">
                  {filteredInstruments.map((instrument) => (
                    <Button
                      key={instrument.value}
                      variant={selectedInstruments.includes(instrument.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInstrument(instrument.value)}
                      className="justify-start h-auto py-2 px-3"
                    >
                      <div className="text-left">
                        <div className="font-medium text-xs">{instrument.label}</div>
                      </div>
                    </Button>
                  ))}
                </div>
                {selectedInstruments.length > 0 && (
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
                )}
              </div>

              {/* Tempo */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label>Tempo</Label>
                  <span className="text-sm font-semibold">{tempo[0]} BPM</span>
                </div>
                <Slider
                  value={tempo}
                  onValueChange={setTempo}
                  min={40}
                  max={200}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Slow (40 BPM)</span>
                  <span>Fast (200 BPM)</span>
                </div>
              </div>

              {/* Mood */}
              <div className="space-y-3">
                <Label>Mood</Label>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <Badge
                      key={m}
                      variant={mood === m ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1 text-sm"
                      onClick={() => setMood(m)}
                    >
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Voice Gender */}
              <div className="space-y-3">
                <Label>Voice Gender (Optional)</Label>
                <RadioGroup value={gender} onValueChange={setGender} className="grid grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem id="pref-gender-male" value="male" />
                    <Label htmlFor="pref-gender-male" className="cursor-pointer">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem id="pref-gender-female" value="female" />
                    <Label htmlFor="pref-gender-female" className="cursor-pointer">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Language */}
              <div className="space-y-2">
                <Label>Language (Optional)</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
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
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={handleSavePreferences} disabled={isSavingPreferences || user?.isGuest}>
                  {isSavingPreferences ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          {/* Security & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Privacy
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: Never
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={user?.isGuest}
              onClick={() => setChangePasswordOpen(true)}
            >
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security
              </p>
            </div>
            <Button variant="outline" size="sm" disabled={user?.isGuest}>
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or manage your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Export Library Data</p>
              <p className="text-sm text-muted-foreground">
                Download all your compositions as JSON
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
            <div>
              <p className="font-medium text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled={user?.isGuest}>
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </div>
  );
}
