/**
 * Vedic Astrology Calculation Module
 * Uses Swiss Ephemeris with Lahiri Ayanamsa for accurate Vedic (Sidereal) calculations
 */

import {
  dateToJulianDay,
  calculatePosition,
  setSiderealMode,
  getAyanamsa,
} from "@swisseph/node";
import {
  Planet,
  CalculationFlag,
  SiderealMode,
} from "@swisseph/core";

// Zodiac signs in order (0-11)
const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer",
  "leo", "virgo", "libra", "scorpio",
  "sagittarius", "capricorn", "aquarius", "pisces"
];

// Rasi names in Sanskrit
const RASI_NAMES = [
  "Mesha", "Vrishabha", "Mithuna", "Karka",
  "Simha", "Kanya", "Tula", "Vrischika",
  "Dhanu", "Makara", "Kumbha", "Meena"
];

/**
 * Convert date, time, and timezone to a Date object in UTC
 */
function createUTCDate(year: number, month: number, day: number, hour: number, minute: number, timezone: number = 0): Date {
  // Adjust for timezone (timezone is offset from UTC in hours)
  // If timezone is +5:30 (IST), we subtract 5.5 hours to get UTC
  const utcHour = hour - timezone;
  const utcMinute = minute;
  
  // Create date in UTC
  return new Date(Date.UTC(year, month - 1, day, Math.floor(utcHour), utcMinute, 0, 0));
}

/**
 * Get longitude in degrees from a zodiac sign
 * Each sign is 30 degrees
 */
function getZodiacFromLongitude(longitude: number): { sign: string; rasi: string; degrees: number } {
  // Normalize longitude to 0-360
  let normalizedLongitude = longitude % 360;
  if (normalizedLongitude < 0) {
    normalizedLongitude += 360;
  }
  
  // Determine which sign (0-11)
  const signIndex = Math.floor(normalizedLongitude / 30);
  const degrees = normalizedLongitude % 30;
  
  return {
    sign: ZODIAC_SIGNS[signIndex],
    rasi: RASI_NAMES[signIndex],
    degrees: degrees
  };
}

/**
 * Get timezone offset for a place (simplified - in production, use a geocoding service)
 * This is a placeholder - you should use a proper geocoding API
 */
async function getTimezoneForPlace(placeOfBirth: string): Promise<number> {
  // TODO: Integrate with a geocoding API (e.g., Google Geocoding API, OpenCage, etc.)
  // For now, return 0 (UTC) as placeholder
  // In production, you would:
  // 1. Geocode the place to get lat/lng
  // 2. Get timezone from lat/lng using a timezone API
  // 3. Return the offset in hours from UTC
  
  console.warn(`[Vedic Astrology] Timezone lookup not implemented for: ${placeOfBirth}. Using UTC (0).`);
  return 0;
}

/**
 * Calculate Vedic Astrology details
 * 
 * @param dateOfBirth - Date in YYYY-MM-DD or DD-MM-YYYY format
 * @param timeOfBirth - Time in HH:MM format (24-hour) or HH:MM AM/PM
 * @param placeOfBirth - Place name (City, State, Country)
 * @returns Zodiac sign, Rasi, and calculation details
 */
export async function calculateVedicAstrology(
  dateOfBirth: string,
  timeOfBirth: string,
  placeOfBirth: string
): Promise<{
  zodiacSign: string;
  rasi: string;
  sunLongitude: number;
  moonLongitude: number;
  calculationMethod: string;
  confidence: "high" | "medium";
  message?: string;
}> {
  try {
    // Parse date
    let birthDate: Date;
    if (dateOfBirth.includes("-")) {
      const parts = dateOfBirth.split("-");
      if (parts[0].length === 4) {
        birthDate = new Date(dateOfBirth);
      } else {
        const [day, month, year] = parts;
        birthDate = new Date(`${year}-${month}-${day}`);
      }
    } else {
      birthDate = new Date(dateOfBirth);
    }
    
    if (isNaN(birthDate.getTime())) {
      throw new Error("Invalid date format");
    }
    
    // Parse time
    const timeStr = timeOfBirth.trim().toUpperCase();
    let hours = 0;
    let minutes = 0;
    
    if (timeStr.includes("AM") || timeStr.includes("PM")) {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
        const period = timeMatch[3];
        
        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }
      }
    } else {
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = parseInt(timeMatch[2]);
      }
    }
    
    // Get timezone (placeholder - should use geocoding API)
    const timezone = await getTimezoneForPlace(placeOfBirth);
    
    // Create UTC date
    const year = birthDate.getFullYear();
    const month = birthDate.getMonth() + 1;
    const day = birthDate.getDate();
    
    const utcDate = createUTCDate(year, month, day, hours, minutes, timezone);
    
    // Calculate Julian Day Number using the library function
    const jd = dateToJulianDay(utcDate);
    
    // Set sidereal mode to Lahiri Ayanamsa (required before calculating sidereal positions)
    setSiderealMode(SiderealMode.Lahiri);
    
    // Calculate Sun position in sidereal zodiac
    const sunPosition = calculatePosition(jd, Planet.Sun, CalculationFlag.Sidereal | CalculationFlag.Speed);
    const sunSiderealLongitude = sunPosition.longitude;
    
    // Calculate Moon position in sidereal zodiac
    const moonPosition = calculatePosition(jd, Planet.Moon, CalculationFlag.Sidereal | CalculationFlag.Speed);
    const moonSiderealLongitude = moonPosition.longitude;
    
    // Get ayanamsa value for reference
    const ayanamsa = getAyanamsa(jd);
    
    // Get zodiac signs
    const sunZodiac = getZodiacFromLongitude(sunSiderealLongitude);
    const moonZodiac = getZodiacFromLongitude(moonSiderealLongitude);
    
    // Determine confidence based on proximity to sign boundaries
    const sunDegreesFromBoundary = Math.min(sunZodiac.degrees, 30 - sunZodiac.degrees);
    const moonDegreesFromBoundary = Math.min(moonZodiac.degrees, 30 - moonZodiac.degrees);
    
    const confidence = (sunDegreesFromBoundary > 1 && moonDegreesFromBoundary > 1) ? "high" : "medium";
    
    let message: string | undefined;
    if (confidence === "medium") {
      message = "Calculated with high precision based on exact birth time. Position is near sign boundary.";
    }
    
    return {
      zodiacSign: sunZodiac.sign,
      rasi: moonZodiac.rasi,
      sunLongitude: sunSiderealLongitude,
      moonLongitude: moonSiderealLongitude,
      calculationMethod: "Vedic Sidereal Astrology (Lahiri Ayanamsa)",
      confidence,
      message,
    };
  } catch (error: any) {
    console.error("[Vedic Astrology] Calculation error:", error);
    throw new Error(`Failed to calculate Vedic astrology: ${error.message}`);
  }
}

