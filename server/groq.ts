/**
 * Groq AI API Integration
 * Using Groq API for fast AI chat responses with streaming support
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Get Groq API key from environment variable
 */
function getGroqApiKey(): string {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY environment variable is not set. Please configure it in the admin settings or .env file.");
  }
  return apiKey;
}

/**
 * Send chat message to Groq API with streaming support
 */
export async function sendChatMessageStream(
  messages: ChatMessage[],
  onChunk: (content: string) => void,
  onError?: (error: string) => void
): Promise<void> {
  try {
    const apiKey = getGroqApiKey();
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: messages,
        temperature: 1,
        max_completion_tokens: 8192,
        top_p: 1,
        reasoning_effort: "medium",
        stream: true,
        stop: null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `Groq API error: ${response.statusText}`;
      if (onError) {
        onError(errorMessage);
      }
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body from Groq API");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return;
          }

          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.delta?.content || "";
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Skip invalid JSON lines
            console.warn("Failed to parse SSE data:", data);
          }
        }
      }
    }
  } catch (error: any) {
    console.error("Groq API Error:", error);
    const errorMessage = error.message || "Failed to get response from AI assistant";
    if (onError) {
      onError(errorMessage);
    }
    throw error;
  }
}

/**
 * Send chat message to Groq API (non-streaming, for backwards compatibility)
 */
export async function sendChatMessage(
  messages: ChatMessage[]
): Promise<{ message?: string; error?: string }> {
  let fullMessage = "";
  let errorOccurred = false;
  let errorMessage = "";

  try {
    await sendChatMessageStream(
      messages,
      (chunk) => {
        fullMessage += chunk;
      },
      (error) => {
        errorOccurred = true;
        errorMessage = error;
      }
    );

    if (errorOccurred) {
      return { error: errorMessage };
    }

    if (!fullMessage) {
      return { error: "No response from Groq API" };
    }

    return { message: fullMessage };
  } catch (error: any) {
    return {
      error: error.message || "Failed to get response from AI assistant",
    };
  }
}

