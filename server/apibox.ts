// API.box Music Generation API Client
// Documentation: https://docs.api.box/suno-api/generate-music

// API base URL - can be overridden via environment variable
// Correct endpoint: https://api.api.box/api/v1 (note: api.api.box, not api.box)
const API_BOX_BASE_URL = process.env.API_BOX_BASE_URL || "https://api.api.box/api/v1";

function getApiBoxKey(): string {
  const apiKey = process.env.API_BOX_API_KEY;
  if (!apiKey) {
    throw new Error("API_BOX_API_KEY environment variable is not set");
  }
  return apiKey;
}

export interface GenerateMusicParams {
  raga: string;
  tala: string;
  instruments: string[];
  tempo: number;
  mood: string;
  gender?: string; // Optional voice gender preference
  language?: string; // Optional language for lyrics/vocals
  prompt?: string; // Optional custom prompt from user
}

export interface GenerateMusicResponse {
  taskId: string;
}

export interface MusicGenerationStatus {
  code: number;
  msg: string;
  data: {
    taskId: string;
    status: "pending" | "processing" | "text" | "first" | "complete" | "failed";
    audioUrl?: string;
    audioUrls?: string[]; // Multiple variations
    title?: string;
    lyrics?: string;
  };
}

/**
 * Generate music using API.box
 * Converts Indian classical music parameters to API.box format
 */
export async function generateMusicComposition(
  params: GenerateMusicParams
): Promise<GenerateMusicResponse> {
  const { raga, tala, instruments, tempo, mood, gender, language, prompt: customPrompt } = params;

  // Use custom prompt if provided, otherwise build prompt from Indian classical music parameters
  let prompt: string;
  
  if (customPrompt && customPrompt.trim()) {
    // User provided custom prompt - use it as the primary prompt
    // Append essential parameters to ensure they're considered by the API
    prompt = customPrompt.trim();
    
    // Append key parameters in a concise format to ensure they're considered
    const paramInfo = `Raga: ${raga}, Tala: ${tala}, Tempo: ${tempo} BPM, Mood: ${mood}`;
    if (language && language !== "instrumental") {
      prompt += ` | ${paramInfo}, Language: ${language}`;
    } else {
      prompt += ` | ${paramInfo}`;
    }
  } else {
    // Build prompt from Indian classical music parameters
    prompt = `Indian classical music composition: Raga ${raga}, Tala ${tala}, Instruments: ${instruments.join(", ")}, Tempo: ${tempo} BPM, Mood: ${mood}. Create an authentic classical piece that honors traditional principles.`;
    
    // Add language preference to prompt if specified
    if (language) {
      prompt += ` Language for lyrics/vocals: ${language}.`;
    }
  }

  // Build style description
  const style = `Indian Classical Music - ${raga} in ${tala} - ${instruments.join(", ")}`;

  // Build title
  const title = `${raga} in ${tala}`;

  const apiKey = getApiBoxKey();
  const callbackUrl = process.env.API_BOX_CALLBACK_URL || 
    `${process.env.BASE_URL || "http://localhost:5000"}/api/music-callback`;

  const apiUrl = `${API_BOX_BASE_URL}/generate`;
  console.log(`[API.box] Calling API endpoint: ${apiUrl}`);
  console.log(`[API.box] Using base URL: ${API_BOX_BASE_URL}`);

  // Truncate prompt to API limit (500 chars for non-custom mode)
  const finalPrompt = prompt.substring(0, 500);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customMode: false, // Use non-custom mode for simpler usage
        instrumental: false, // Include vocals/lyrics
        prompt: finalPrompt, // Limit to 500 chars for non-custom mode
        model: process.env.API_BOX_MODEL || "V5", // Use V5 by default, can be overridden
        callBackUrl: callbackUrl,
        vocalGender: gender === "female" ? "f" : "m", // Use provided gender or default to male
        styleWeight: 0.65,
        weirdnessConstraint: 0.65,
        audioWeight: 0.65,
      }),
    });

    // Check response status
    if (!response.ok) {
      const text = await response.text();
      console.error(`[API.box] API Error: Status ${response.status}`);
      console.error(`[API.box] Response URL: ${response.url}`);
      console.error(`[API.box] Response preview:`, text.substring(0, 500));
      
      if (response.status === 404) {
        throw new Error(`API endpoint not found (404). Please verify the API base URL is correct. Current: ${API_BOX_BASE_URL}. Check the API documentation at https://docs.api.box/suno-api/generate-music for the correct endpoint.`);
      }
      
      throw new Error(`API request failed with status ${response.status}. Check server logs for details.`);
    }

    // Check content type
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`API.box API Error: Expected JSON but got ${contentType}, Response:`, text.substring(0, 500));
      throw new Error(`API returned non-JSON response (${contentType}). Please check the API base URL.`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.msg || "Failed to start music generation");
    }

    return {
      taskId: data.data.taskId,
    };
  } catch (error: any) {
    console.error("API.box API Error:", error);

    // Handle specific API.box API errors
    if (error?.status === 429 || error?.code === 405) {
      throw new Error("API rate limit exceeded. Please try again in a few moments.");
    } else if (error?.status === 401 || error?.code === 401) {
      throw new Error("API authentication failed. Please check your API key.");
    } else if (error?.status === 429 || error?.code === 429) {
      throw new Error("Insufficient credits. Please check your account balance.");
    } else if (error?.status === 430) {
      throw new Error("Call frequency too high. Please try again later.");
    } else if (error?.status === 455 || error?.code === 455) {
      throw new Error("System maintenance in progress. Please try again later.");
    } else if (error?.status === 500 || error?.code === 500) {
      throw new Error("API service error. Please try again later.");
    } else if (error?.message) {
      throw new Error(`API error: ${error.message}`);
    } else {
      throw new Error("Failed to generate music composition. Please try again later.");
    }
  }
}

// Cache to remember that status endpoint doesn't exist (to reduce log noise)
let statusEndpointCache: { available: boolean | null; lastChecked: number } = {
  available: null,
  lastChecked: 0,
};

/**
 * Get music generation status and results
 */
export async function getMusicGenerationStatus(
  taskId: string
): Promise<MusicGenerationStatus> {
  const apiKey = getApiBoxKey();

  try {
    // Try different endpoint formats - API might use different paths
    // Based on API.box documentation: "Get Music Generation Details" endpoint
    const possibleEndpoints = [
      `${API_BOX_BASE_URL}/generate/${taskId}`,           // Standard REST format (GET on same resource)
      `${API_BOX_BASE_URL}/generate/${taskId}/details`,  // Details endpoint variant
      `${API_BOX_BASE_URL}/task/${taskId}`,               // Alternative format
      `${API_BOX_BASE_URL}/task/${taskId}/details`,       // Task details variant
      `${API_BOX_BASE_URL}/music/${taskId}`,              // Music resource format
      `${API_BOX_BASE_URL}/music/${taskId}/details`,       // Music details variant
      `${API_BOX_BASE_URL}/status/${taskId}`,             // Status-specific endpoint
    ];

    let lastError: Error | null = null;

    // Only log verbosely on first attempt or if we haven't checked in a while (5 minutes)
    const shouldLog = statusEndpointCache.available === null || 
                     (Date.now() - statusEndpointCache.lastChecked) > 5 * 60 * 1000;

    for (const endpoint of possibleEndpoints) {
      try {
        if (shouldLog) {
          console.log(`[API.box] Trying status endpoint: ${endpoint}`);
        }
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });

        // Check response status
        if (!response.ok) {
          if (response.status === 404) {
            // Try next endpoint format
            lastError = new Error(`Endpoint not found: ${endpoint}`);
            continue;
          }
          const text = await response.text();
          if (shouldLog) {
            console.error(`[API.box] Status Check Error: Status ${response.status}, Response:`, text.substring(0, 500));
          }
          throw new Error(`Status check failed with status ${response.status}: ${text.substring(0, 200)}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          if (shouldLog) {
            console.error(`[API.box] Status Check Error: Expected JSON but got ${contentType}, Response:`, text.substring(0, 500));
          }
          throw new Error(`API returned non-JSON response (${contentType}). Please check the API base URL.`);
        }

        const data = await response.json();

        if (data.code !== 200) {
          throw new Error(data.msg || "Failed to get music generation status");
        }

        if (shouldLog) {
          console.log(`[API.box] Status check successful using endpoint: ${endpoint}`);
        }
        statusEndpointCache.available = true;
        statusEndpointCache.lastChecked = Date.now();
        return data;
      } catch (error: any) {
        // If it's a 404, try next endpoint; otherwise throw immediately
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    // If all endpoints failed, throw the last error
    if (lastError) {
      statusEndpointCache.available = false;
      statusEndpointCache.lastChecked = Date.now();
      if (shouldLog) {
        console.error(`[API.box] All status endpoint formats failed. The API uses callbacks only.`);
      }
      throw new Error(`Status endpoint not found. Tried: ${possibleEndpoints.join(", ")}. The API may use callbacks only, or the endpoint format is different. Check the API documentation.`);
    }

    throw new Error("Failed to check generation status: Unknown error");
  } catch (error: any) {
    // Only log if it's not a known "endpoint not found" error (to reduce noise)
    if (!error.message?.includes("Status endpoint not found")) {
      console.error("[API.box] Status Check Error:", error);
    }
    throw new Error(`Failed to check generation status: ${error.message}`);
  }
}

