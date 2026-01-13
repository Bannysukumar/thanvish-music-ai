import { createContext, useContext, useState, useEffect, ReactNode } from "react";

/**
 * Horoscope Profile Data
 */
export interface HoroscopeProfile {
  fullName: string;
  dateOfBirth: string;
  timeOfBirth?: string;
  placeOfBirth: string;
  rasi: string;
  zodiacSign: string;
  age: number;
  height: string;
  weight: string;
  currentEmotionalState: string;
  lifeFocus: string;
}

/**
 * Horoscope Insights
 */
export interface HoroscopeInsights {
  zodiacOverview: string;
  emotionalInsights: string;
  strengths: string[];
  challenges: string[];
  therapyFocus: string;
  personalityTraits: string[];
  stressSensitivity: "Low" | "Medium" | "High";
  healingNeeds: string[];
  energyLevel: "Low" | "Medium" | "High";
}

/**
 * Horoscope Context Type
 */
interface HoroscopeContextType {
  profile: HoroscopeProfile | null;
  insights: HoroscopeInsights | null;
  setProfile: (profile: HoroscopeProfile) => void;
  setInsights: (insights: HoroscopeInsights) => void;
  clearHoroscope: () => void;
}

/**
 * Create Horoscope Context
 */
const HoroscopeContext = createContext<HoroscopeContextType | undefined>(undefined);

/**
 * HoroscopeProvider component - manages horoscope state
 */
export function HoroscopeProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<HoroscopeProfile | null>(null);
  const [insights, setInsightsState] = useState<HoroscopeInsights | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem("horoscopeProfile");
    const storedInsights = localStorage.getItem("horoscopeInsights");
    
    if (storedProfile) {
      try {
        setProfileState(JSON.parse(storedProfile));
      } catch (error) {
        console.error("Error loading horoscope profile:", error);
      }
    }
    
    if (storedInsights) {
      try {
        setInsightsState(JSON.parse(storedInsights));
      } catch (error) {
        console.error("Error loading horoscope insights:", error);
      }
    }
  }, []);

  const setProfile = (profile: HoroscopeProfile) => {
    setProfileState(profile);
    localStorage.setItem("horoscopeProfile", JSON.stringify(profile));
  };

  const setInsights = (insights: HoroscopeInsights) => {
    setInsightsState(insights);
    localStorage.setItem("horoscopeInsights", JSON.stringify(insights));
  };

  const clearHoroscope = () => {
    setProfileState(null);
    setInsightsState(null);
    localStorage.removeItem("horoscopeProfile");
    localStorage.removeItem("horoscopeInsights");
  };

  return (
    <HoroscopeContext.Provider
      value={{
        profile,
        insights,
        setProfile,
        setInsights,
        clearHoroscope,
      }}
    >
      {children}
    </HoroscopeContext.Provider>
  );
}

/**
 * Custom hook to use horoscope context
 */
export function useHoroscope() {
  const context = useContext(HoroscopeContext);
  if (context === undefined) {
    throw new Error("useHoroscope must be used within a HoroscopeProvider");
  }
  return context;
}

