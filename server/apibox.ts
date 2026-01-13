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
  generationMode: "voice_only" | "instrumental_only" | "full_music";
  raga?: string;
  tala?: string;
  instruments?: string[];
  tempo?: number;
  mood?: string;
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
  const { generationMode, raga, tala, instruments, tempo, mood, gender, language, prompt: customPrompt } = params;

  const apiKey = getApiBoxKey();
  const callbackUrl = process.env.API_BOX_CALLBACK_URL || 
    `${process.env.BASE_URL || "http://localhost:5000"}/api/music-callback`;

  const apiUrl = `${API_BOX_BASE_URL}/generate`;
  console.log(`[API.box] Calling API endpoint: ${apiUrl}`);
  console.log(`[API.box] Using base URL: ${API_BOX_BASE_URL}`);
  console.log(`[API.box] Generation mode: ${generationMode}`);
  console.log(`[API.box] Callback URL: ${callbackUrl}`);
  console.log(`[API.box] ⚠️  Note: If running locally, API.box cannot reach localhost. Use ngrok or deploy to receive callbacks.`);

  let prompt: string;
  let instrumental: boolean;
  let apiBody: any;

  if (generationMode === "voice_only") {
    // Voice Only: Generate ONLY vocal audio (no instruments)
    // instrumental = false, has_vocals = true
    // Include: custom_prompt, voice_gender (if selected), language (if selected)
    prompt = customPrompt?.trim() || "";
    instrumental = false;
    
    apiBody = {
      customMode: false,
      instrumental: false, // Not instrumental, so has vocals
      prompt: prompt.substring(0, 500),
      model: process.env.API_BOX_MODEL || "V5",
      callBackUrl: callbackUrl,
      styleWeight: 0.65,
      weirdnessConstraint: 0.65,
      audioWeight: 0.65,
    };

    // Only include vocalGender if gender is provided
    if (gender) {
      apiBody.vocalGender = gender === "female" ? "f" : "m";
    }

    // Note: language is embedded in the prompt, not sent as a separate parameter
    if (language && language.trim()) {
      // Language preference can be added to prompt if needed
      prompt = `${prompt} Language: ${language}`.substring(0, 500);
      apiBody.prompt = prompt;
    }

  } else if (generationMode === "instrumental_only") {
    // Instrumental Only: Generate ONLY instrumental music (NO vocals)
    // instrumental = true, has_vocals = false
    // Do NOT send lyrics, voice_gender, language
    // Build prompt from: raga, tala, instruments, tempo, mood
    if (!raga || !tala || !instruments || instruments.length === 0 || !tempo || !mood) {
      throw new Error("Instrumental Only mode requires raga, tala, instruments, tempo, and mood");
    }

    // Use custom prompt if provided (from Music Therapy with horoscope data), otherwise build default
    if (customPrompt && customPrompt.trim()) {
      // Use the personalized prompt from client (includes horoscope data)
      prompt = customPrompt.trim();
    } else {
      // Fallback to default prompt if no custom prompt provided
      const tradition = "classical"; // Default tradition - could be determined from raga if needed
      prompt = `Create an instrumental ${tradition} classical composition in Raga ${raga} using Tala ${tala}, featuring ${instruments.join(", ")}. Tempo is ${tempo} BPM with a ${mood} mood.`;
    }
    
    instrumental = true;

    apiBody = {
      customMode: false,
      instrumental: true, // Instrumental only, no vocals
      prompt: prompt.substring(0, 500),
      model: process.env.API_BOX_MODEL || "V5",
      callBackUrl: callbackUrl,
      styleWeight: 0.65,
      weirdnessConstraint: 0.65,
      audioWeight: 0.65,
    };
    // Do NOT include vocalGender or language for instrumental mode

  } else if (generationMode === "full_music") {
    // Full Music: Generate complete music with vocals and instruments
    // instrumental = false, has_vocals = true
    // Include ALL fields
    if (!raga || !tala || !instruments || instruments.length === 0 || !tempo || !mood || !customPrompt?.trim()) {
      throw new Error("Full Music mode requires raga, tala, instruments, tempo, mood, and custom prompt");
    }

    const tradition = "classical"; // Default tradition
    prompt = `Create a ${tradition} classical composition in Raga ${raga} using Tala ${tala}, featuring ${instruments.join(", ")}. Tempo is ${tempo} BPM with a ${mood} mood. Lyrics and vocal expression should follow: ${customPrompt.trim()}`;
    instrumental = false;

    apiBody = {
      customMode: false,
      instrumental: false, // Not instrumental, so has vocals
      prompt: prompt.substring(0, 500),
      model: process.env.API_BOX_MODEL || "V5",
      callBackUrl: callbackUrl,
      styleWeight: 0.65,
      weirdnessConstraint: 0.65,
      audioWeight: 0.65,
    };

    // Include vocalGender if gender is provided
    if (gender) {
      apiBody.vocalGender = gender === "female" ? "f" : "m";
    }

    // Language preference can be added to prompt if needed
    if (language && language.trim()) {
      prompt = `${prompt} Language: ${language}`.substring(0, 500);
      apiBody.prompt = prompt;
    }

  } else {
    throw new Error(`Invalid generation mode: ${generationMode}`);
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(apiBody),
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

/**
 * Get remaining credits from API.box
 */
export async function getRemainingCredits(): Promise<number> {
  const apiKey = getApiBoxKey();
  const apiUrl = `${API_BOX_BASE_URL}/generate/credit`;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API.box] Credits API Error: Status ${response.status}`);
      console.error(`[API.box] Response:`, text.substring(0, 500));
      
      if (response.status === 401) {
        throw new Error("API authentication failed. Please check your API key.");
      }
      
      throw new Error(`Failed to get credits: Status ${response.status}`);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error(`[API.box] Credits API Error: Expected JSON but got ${contentType}, Response:`, text.substring(0, 500));
      throw new Error(`API returned non-JSON response (${contentType})`);
    }

    const data = await response.json();

    if (data.code !== 200) {
      throw new Error(data.msg || "Failed to get remaining credits");
    }

    return data.data || 0;
  } catch (error: any) {
    console.error("[API.box] Get Credits Error:", error);
    throw new Error(`Failed to get remaining credits: ${error.message}`);
  }
}

/**
 * Get generation logs from API.box (if endpoint exists)
 * This attempts to fetch logs from API.box's logs API
 */
export async function getApiBoxLogs(): Promise<any[]> {
  const apiKey = getApiBoxKey();
  
  // Try common logs endpoint patterns
  const possibleEndpoints = [
    `${API_BOX_BASE_URL}/logs`,
    `${API_BOX_BASE_URL}/generate/logs`,
    `${API_BOX_BASE_URL}/history`,
    `${API_BOX_BASE_URL}/generate/history`,
  ];

  for (const endpoint of possibleEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.code === 200 && data.data) {
            console.log(`[API.box] Logs API found at: ${endpoint}`);
            return Array.isArray(data.data) ? data.data : [];
          }
        }
      }
    } catch (error) {
      // Try next endpoint
      continue;
    }
  }

  // If no endpoint works, return empty array
  return [];
}

