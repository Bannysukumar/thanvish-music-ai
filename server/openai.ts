import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
// Reference: javascript_openai blueprint
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

export async function generateMusicComposition(params: {
  raga: string;
  tala: string;
  instruments: string[];
  tempo: number;
  mood: string;
}): Promise<{ title: string; description: string; notation: string }> {
  const { raga, tala, instruments, tempo, mood } = params;

  const prompt = `You are an expert in Indian classical music composition. Generate a detailed description for a classical music composition with the following parameters:

Raga: ${raga}
Tala: ${tala}
Instruments: ${instruments.join(", ")}
Tempo: ${tempo} BPM
Mood: ${mood}

Please provide:
1. A creative title for the composition that reflects the raga and mood
2. A detailed description of how the composition would sound, including the interplay of instruments, the emotional journey, and key musical phrases
3. A brief notation or structure outline (alaap, jor, jhala, gat, or similar structure)

Respond in JSON format with keys: title, description, notation`;

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in Indian classical music, well-versed in both Hindustani and Carnatic traditions. You understand ragas, talas, and the nuances of classical composition.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      title: result.title || `${raga} in ${tala}`,
      description:
        result.description ||
        "A beautiful classical composition blending traditional elements.",
      notation: result.notation || "Alaap - Jor - Jhala - Gat",
    };
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    
    // Handle specific OpenAI API errors
    if (error?.status === 429) {
      if (error?.code === "insufficient_quota") {
        throw new Error("OpenAI API quota exceeded. Please check your billing and plan details.");
      } else {
        throw new Error("OpenAI API rate limit exceeded. Please try again in a few moments.");
      }
    } else if (error?.status === 401) {
      throw new Error("OpenAI API authentication failed. Please check your API key.");
    } else if (error?.status === 500 || error?.status === 503) {
      throw new Error("OpenAI API service is currently unavailable. Please try again later.");
    } else if (error?.message) {
      throw new Error(`OpenAI API error: ${error.message}`);
    } else {
      throw new Error("Failed to generate music composition. Please try again later.");
    }
  }
}
