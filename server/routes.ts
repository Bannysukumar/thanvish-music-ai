import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMusicComposition, getMusicGenerationStatus, getRemainingCredits, getApiBoxLogs } from "./apibox";
import {
  musicGenerationRequestSchema,
  insertContactSubmissionSchema,
} from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { randomBytes } from "crypto";
import { adminAuth, adminDb, admin } from "./firebase-admin";
import {
  generateAndSendOTP,
  verifyOTP,
  isEmailVerified,
  getResendCooldown,
  removeVerifiedOTP,
  } from "./otp-service.js";
import { sendChatMessage, sendChatMessageStream, type ChatMessage } from "./groq.js";

// Admin session storage (in-memory, use Redis in production)
const adminSessions = new Map<string, { username: string; userId?: string; expiresAt: number }>();

// Admin authentication middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const sessionId = authHeader?.replace("Bearer ", "") || (req as any).cookies?.adminSession;
  
  if (!sessionId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const session = adminSessions.get(sessionId);
  if (!session || session.expiresAt < Date.now()) {
    adminSessions.delete(sessionId);
    return res.status(401).json({ error: "Session expired" });
  }

  // Extend session
  session.expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  next();
}

// Helper to read .env file
function readEnvFile(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const content = fs.readFileSync(envPath, "utf-8");
  const env: Record<string, string> = {};
  
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
  });
  
  return env;
}

// Helper to write .env file
function writeEnvFile(env: Record<string, string>) {
  const envPath = path.join(process.cwd(), ".env");
  const lines: string[] = [];
  
  // Preserve comments and structure
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("#")) {
        lines.push(line);
      } else if (trimmed && trimmed.includes("=")) {
        const [key] = trimmed.split("=");
        if (key && env[key.trim()]) {
          lines.push(`${key.trim()}=${env[key.trim()]}`);
          delete env[key.trim()];
        } else {
          lines.push(line);
        }
      } else {
        lines.push(line);
      }
    });
  }
  
  // Add any new keys
  Object.entries(env).forEach(([key, value]) => {
    if (value) {
      lines.push(`${key}=${value}`);
    }
  });
  
  fs.writeFileSync(envPath, lines.join("\n") + "\n", "utf-8");
}

// Generation log interface
interface GenerationLog {
  id: string;
  taskId: string;
  compositionId: string | null;
  time: string; // ISO timestamp
  type: "generate";
  model: string;
  prompt: string;
  callbackUrl: string;
  status: "pending" | "success" | "failed";
  creditsConsumed: number | null;
  requestData: any;
  createdAt: number; // Unix timestamp for sorting
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Store taskId to compositionId mapping temporarily
  const taskIdToCompositionId = new Map<string, string>();
  
  // Store multiple audio URLs for each composition (complement to audioUrl field)
  const compositionAudioUrls = new Map<string, string[]>();
  
  // Store generation logs
  const generationLogs = new Map<string, GenerationLog>();
  
  // Cache to remember that API status endpoint doesn't exist (to avoid trying every time)
  let statusEndpointAvailable: boolean | null = null;
  
  // Helper function to extract audioUrls from description if stored there
  const extractAudioUrlsFromDescription = (description: string | null | undefined): string[] | undefined => {
    if (!description) return undefined;
    const match = description.match(/<!--AUDIO_URLS:(.*?)-->/);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  };
  
  // Helper function to clean description (remove AUDIO_URLS marker)
  const cleanDescription = (description: string | null | undefined): string => {
    if (!description) return "";
    return description.replace(/\n\n<!--AUDIO_URLS:.*?-->/, "").trim();
  };

  app.post("/api/generate-music", async (req, res) => {
    try {
      const validatedData = musicGenerationRequestSchema.parse(req.body);

      // Backend validation for generation mode
      if (!validatedData.generationMode) {
        return res.status(400).json({
          error: "Generation mode is required. Please select Voice Only, Instrumental Only, or Full Music.",
          code: "MISSING_GENERATION_MODE",
        });
      }

      // Start music generation (async - returns taskId)
      const { taskId } = await generateMusicComposition(validatedData);

      // Create composition with pending status
      // For voice_only mode, use placeholder values for required fields
      const composition = await storage.createComposition({
        title: validatedData.generationMode === "voice_only" 
          ? "Voice Only Composition"
          : validatedData.raga && validatedData.tala
          ? `${validatedData.raga} in ${validatedData.tala}`
          : "Music Composition",
        raga: validatedData.raga || "N/A",
        tala: validatedData.tala || "N/A",
        instruments: validatedData.instruments || [],
        tempo: validatedData.tempo || 100,
        mood: validatedData.mood || "N/A",
        description: validatedData.generationMode === "voice_only"
          ? `Generating voice-only composition with custom prompt`
          : validatedData.raga && validatedData.tala && validatedData.instruments
          ? `Generating ${validatedData.raga} composition in ${validatedData.tala} with ${validatedData.instruments.join(", ")}`
          : "Generating music composition",
        audioUrl: null,
      });

      // Store mapping for callback/polling
      taskIdToCompositionId.set(taskId, composition.id);

      // Create generation log entry
      const callbackUrl = process.env.API_BOX_CALLBACK_URL || 
        `${process.env.BASE_URL || "http://localhost:5000"}/api/music-callback`;
      const model = process.env.API_BOX_MODEL || "V5";
      
      // Build prompt display string
      let promptDisplay = "";
      if (validatedData.generationMode === "voice_only") {
        promptDisplay = validatedData.prompt || "";
      } else if (validatedData.generationMode === "full_music") {
        const tradition = "classical";
        promptDisplay = `Create a ${tradition} classical composition in Raga ${validatedData.raga || "N/A"} using Tala ${validatedData.tala || "N/A"}, featuring ${(validatedData.instruments || []).join(", ")}. Tempo is ${validatedData.tempo || 100} BPM with a ${validatedData.mood || "N/A"} mood. ${validatedData.prompt || ""}`;
      } else {
        const tradition = "classical";
        promptDisplay = `Create a ${tradition} classical instrumental composition in Raga ${validatedData.raga || "N/A"} using Tala ${validatedData.tala || "N/A"}, featuring ${(validatedData.instruments || []).join(", ")}. Tempo is ${validatedData.tempo || 100} BPM with a ${validatedData.mood || "N/A"} mood.`;
      }

      const logEntry: GenerationLog = {
        id: taskId,
        taskId,
        compositionId: composition.id,
        time: new Date().toISOString(),
        type: "generate",
        model: model === "V5" ? "chirp-crow" : model, // API.box uses chirp-crow for V5 model
        prompt: promptDisplay.substring(0, 200), // Truncate for display
        callbackUrl,
        status: "pending",
        creditsConsumed: null,
        requestData: validatedData,
        createdAt: Date.now(),
      };
      
      // Store in memory (for backwards compatibility)
      generationLogs.set(taskId, logEntry);
      
      // Save to Firebase Firestore
      try {
        await adminDb.collection("generationLogs").doc(taskId).set({
          taskId,
          compositionId: composition.id,
          time: logEntry.time,
          type: logEntry.type,
          model: logEntry.model,
          prompt: logEntry.prompt,
          callbackUrl,
          status: logEntry.status,
          creditsConsumed: null,
          requestData: validatedData,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (firebaseError) {
        console.error("Error saving log to Firebase:", firebaseError);
        // Continue even if Firebase save fails
      }

      res.json({
        ...composition,
        taskId,
        status: "pending",
        message: "Music generation started. Use the taskId to poll for status or wait for callback.",
      });
    } catch (error: any) {
      console.error("Music generation error:", error);
      
      // Determine appropriate status code based on error type
      let statusCode = 400;
      if (error.message?.includes("quota") || error.message?.includes("rate limit") || error.message?.includes("frequency")) {
        statusCode = 429; // Too Many Requests
      } else if (error.message?.includes("authentication") || error.message?.includes("API key")) {
        statusCode = 401; // Unauthorized
      } else if (error.message?.includes("unavailable") || error.message?.includes("maintenance")) {
        statusCode = 503; // Service Unavailable
      } else if (error.message?.includes("credits")) {
        statusCode = 429; // Insufficient credits
      }
      
      res.status(statusCode).json({
        error: error.message || "Failed to generate music composition",
        code: error.code || "GENERATION_ERROR",
      });
    }
  });

  // AI Chat endpoint (Groq) with streaming support
  app.post("/api/chat", async (req, res) => {
    console.log("[Chat API] Request received:", { path: req.path, method: req.method });
    try {
      const { messages, stream } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      // Validate message format
      const validMessages: ChatMessage[] = messages.map((msg: any) => ({
        role: msg.role || "user",
        content: msg.content || "",
      }));

      // Add system message if not present
      const systemMessage: ChatMessage = {
        role: "system",
        content: "You are a helpful AI assistant specialized in Indian classical music. You can help users understand ragas, talas, instruments, and provide guidance on music generation. Be concise, friendly, and knowledgeable. Focus on helping users make decisions about their music generation preferences.",
      };

      const allMessages = [systemMessage, ...validMessages];

      // If streaming is requested, use Server-Sent Events
      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          await sendChatMessageStream(
            allMessages,
            (chunk) => {
              res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
            },
            (error) => {
              res.write(`data: ${JSON.stringify({ error: error })}\n\n`);
              res.end();
            }
          );
          res.write(`data: [DONE]\n\n`);
          res.end();
        } catch (error: any) {
          res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
          res.end();
        }
        return;
      }

      // Non-streaming response (backwards compatibility)
      const result = await sendChatMessage(allMessages);

      if (result.error) {
        return res.status(500).json({ error: result.error });
      }

      res.json({ message: result.message });
    } catch (error: any) {
      console.error("Chat API error:", error);
      res.status(500).json({ error: error.message || "Failed to process chat message" });
    }
  });

  // Polling endpoint to check generation status
  app.get("/api/generate-music/:taskId/status", async (req, res) => {
    try {
      const { taskId } = req.params;
      
      // Try to get status from API, but if it fails (404), return pending status
      // The API likely uses callbacks only, so we'll rely on the callback endpoint
      // Skip API call if we know the endpoint doesn't exist
      if (statusEndpointAvailable === false) {
        // We know the status endpoint doesn't exist, check local storage for completed composition
        const compositionId = taskIdToCompositionId.get(taskId);
        if (compositionId) {
          const composition = await storage.getComposition(compositionId);
          if (composition && composition.audioUrl) {
            // Composition already has audio URL (callback worked)
            const audioUrls = compositionAudioUrls.get(compositionId);
            return res.json({
              taskId,
              status: "complete",
              audioUrl: composition.audioUrl,
              audioUrls: audioUrls || [composition.audioUrl],
              title: composition.title,
            });
          }
        }
        // Return pending - waiting for callback
        return res.json({
          taskId,
          status: "pending",
          message: "Waiting for callback...",
        });
      }

      try {
        const status = await getMusicGenerationStatus(taskId);
        // If we got here, the status endpoint works
        statusEndpointAvailable = true;

        // If generation is complete, update the composition
        if (status.data.status === "complete" && status.data.audioUrl) {
          const compositionId = taskIdToCompositionId.get(taskId);
          if (compositionId) {
            const composition = await storage.getComposition(compositionId);
            if (composition) {
              // Update with audio URL (using first audioUrl if multiple)
              const audioUrl = status.data.audioUrl || (status.data.audioUrls && status.data.audioUrls[0]);
              await storage.updateComposition(compositionId, {
                audioUrl: audioUrl || null,
                title: status.data.title || composition.title,
              });
            }
          }
        }

        const compositionId = taskIdToCompositionId.get(taskId);
        const storedAudioUrls = compositionId ? compositionAudioUrls.get(compositionId) : undefined;
        
        res.json({
          taskId: status.data.taskId,
          status: status.data.status,
          audioUrl: status.data.audioUrl || (status.data.audioUrls && status.data.audioUrls[0]),
          audioUrls: storedAudioUrls || status.data.audioUrls || (status.data.audioUrl ? [status.data.audioUrl] : []),
          title: status.data.title,
          lyrics: status.data.lyrics,
        });
      } catch (statusError: any) {
        // Mark that status endpoint doesn't exist (cache this to avoid trying again)
        if (statusError.message?.includes("Status endpoint not found") || 
            statusError.message?.includes("404") ||
            statusError.message?.includes("not found")) {
          statusEndpointAvailable = false;
        }

        // If status endpoint doesn't exist (404), check if we already have the composition with audio
        // This means the callback already updated it
        const compositionId = taskIdToCompositionId.get(taskId);
        if (compositionId) {
          const composition = await storage.getComposition(compositionId);
          if (composition && composition.audioUrl) {
            // Composition already has audio URL (callback worked)
            return res.json({
              taskId,
              status: "complete",
              audioUrl: composition.audioUrl,
              title: composition.title,
            });
          }
        }
        
        // Status endpoint not available - return pending status
        // The callback will update the composition when ready
        res.json({
          taskId,
          status: "pending",
          message: "Waiting for callback...",
        });
      }
    } catch (error: any) {
      console.error("Status check error:", error);
      res.status(500).json({
        error: error.message || "Failed to check generation status",
        code: "STATUS_CHECK_ERROR",
      });
    }
  });

  // Callback endpoint for API.box webhooks
  app.post("/api/music-callback", async (req, res) => {
    try {
      console.log("[API.box] Callback received:", JSON.stringify(req.body, null, 2));
      const callbackData = req.body;
      
      // API.box uses different field names - handle both formats
      const taskId = callbackData.taskId || callbackData.task_id || callbackData.data?.task_id || callbackData.data?.taskId;
      
      // Determine callback stage: text, first, or complete
      const callbackType = callbackData.data?.callbackType || callbackData.callbackType;
      const msg = callbackData.msg || callbackData.message || "";
      
      // More flexible completion detection:
      // - Explicitly marked as "complete"
      // - OR has audio_list with valid URLs
      // - OR message indicates success/completion
      let isComplete = callbackType === "complete";
      
      // Extract audio URLs from the callback structure
      // API.box callback format varies by stage:
      // - text: { code, msg, data: { callbackType: "text", task_id, data: [{ prompt, title, ... }] } }
      // - complete: { code, msg, data: { task_id, audio_list: [{ audio_url, stream_audio_url, title, ... }] } }
      let audioUrl: string | undefined;
      let audioUrls: string[] | undefined;
      let title: string | undefined;

      // Check for audio_list format (complete stage)
      if (callbackData.data?.audio_list && Array.isArray(callbackData.data.audio_list) && callbackData.data.audio_list.length > 0) {
        isComplete = true; // If we have audio_list, it's complete
        const firstAudio = callbackData.data.audio_list[0];
        audioUrl = firstAudio.audio_url || firstAudio.stream_audio_url || firstAudio.source_audio_url;
        audioUrls = callbackData.data.audio_list.map((audio: any) => 
          audio.audio_url || audio.stream_audio_url || audio.source_audio_url
        ).filter((url: string) => url && url.trim() !== ""); // Filter out empty strings
        title = firstAudio.title || firstAudio.name;
      }
      // Check for data array format
      else if (callbackData.data?.data && Array.isArray(callbackData.data.data) && callbackData.data.data.length > 0) {
        const firstItem = callbackData.data.data[0];
        // Check if we have audio_url (not empty) - this indicates completion
          if (firstItem.audio_url && firstItem.audio_url.trim() !== "") {
          isComplete = true;
            audioUrl = firstItem.audio_url;
            audioUrls = callbackData.data.data
              .map((item: any) => item.audio_url)
              .filter((url: string) => url && url.trim() !== "");
        } else if (firstItem.stream_audio_url && firstItem.stream_audio_url.trim() !== "") {
          // If we have stream_audio_url but no audio_url, it might still be processing
          // But if callbackType is complete, use it
          if (isComplete) {
            audioUrl = firstItem.stream_audio_url;
          }
        }
        title = firstItem.title || firstItem.name;
      }
      // Check for direct audio_url fields
      else if (callbackData.audio_url || callbackData.audioUrl) {
        isComplete = true;
        audioUrl = callbackData.audio_url || callbackData.audioUrl;
        title = callbackData.title || callbackData.name;
      }
      // Fallback: check if message indicates completion
      else if (msg && (msg.toLowerCase().includes("success") || msg.toLowerCase().includes("complete") || msg.toLowerCase().includes("finished"))) {
        // Message indicates completion but no audio URL yet - log and wait
        console.log(`[API.box] Callback message indicates completion but no audio URL found: ${msg}`);
      }

      if (!taskId) {
        console.warn("[API.box] Callback missing taskId/task_id");
        return res.status(400).json({ error: "taskId is required" });
      }

      // Find the composition by taskId
      const compositionId = taskIdToCompositionId.get(taskId);
      if (!compositionId) {
        console.warn(`[API.box] No composition found for taskId: ${taskId}`);
        return res.status(404).json({ error: "Composition not found for this taskId" });
      }

      // Update composition when we have actual audio URLs
      if (isComplete && (audioUrl || (audioUrls && audioUrls.length > 0))) {
        const composition = await storage.getComposition(compositionId);
        if (composition) {
          const finalAudioUrl = audioUrl || (audioUrls && audioUrls[0]);
          const allAudioUrls = audioUrls && audioUrls.length > 0 ? audioUrls : (audioUrl ? [audioUrl] : []);
          
          // Only update if we have a valid, non-empty URL
          if (finalAudioUrl && finalAudioUrl.trim() !== "") {
            // Store all audio URLs in the map
            compositionAudioUrls.set(compositionId, allAudioUrls);
            
            await storage.updateComposition(compositionId, {
              audioUrl: finalAudioUrl,
              title: title || composition.title,
            });
            console.log(`[API.box] ✅ Updated composition ${compositionId} with ${allAudioUrls.length} audio URL(s)`);
            console.log(`[API.box] Title: ${title || composition.title}`);
            if (allAudioUrls.length > 1) {
              console.log(`[API.box] Multiple variations available: ${allAudioUrls.length} versions`);
            }

            // Update log entry with success status and credits consumed (typically 12 credits per generation)
            const logEntry = generationLogs.get(taskId);
            if (logEntry) {
              logEntry.status = "success";
              logEntry.creditsConsumed = 12; // API.box typically charges 12 credits per generation
              generationLogs.set(taskId, logEntry);
            }
            
            // Update in Firebase
            try {
              await adminDb.collection("generationLogs").doc(taskId).update({
                status: "success",
                creditsConsumed: 12,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
            } catch (firebaseError) {
              console.error("Error updating log in Firebase:", firebaseError);
            }
          } else {
            console.log(`[API.box] Callback marked complete but no valid audio URL for taskId ${taskId}`);
          }
        }
      } else if (msg && msg.toLowerCase().includes("fail")) {
        // Update log entry with failed status
        const logEntry = generationLogs.get(taskId);
        if (logEntry) {
          logEntry.status = "failed";
          generationLogs.set(taskId, logEntry);
        }
        
        // Update in Firebase
        try {
          await adminDb.collection("generationLogs").doc(taskId).update({
            status: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        } catch (firebaseError) {
          console.error("Error updating log in Firebase:", firebaseError);
        }
      } else {
        console.log(`[API.box] Callback stage: ${callbackType || "unknown"} for taskId ${taskId} - isComplete: ${isComplete}, hasAudioUrl: ${!!audioUrl}`);
        console.log(`[API.box] Message: ${msg}`);
        console.log(`[API.box] Waiting for complete stage with audio URLs`);
      }

      // Always return 200 to acknowledge callback
      res.status(200).json({ success: true, message: "Callback received" });
    } catch (error: any) {
      console.error("[API.box] Callback error:", error);
      // Still return 200 to prevent API.box from retrying
      res.status(200).json({ success: false, error: error.message });
    }
  });

  app.get("/api/learning-modules", async (_req, res) => {
    try {
      const modules = await storage.getAllLearningModules();
      res.json(modules);
    } catch (error: any) {
      console.error("Error fetching learning modules:", error);
      res.status(500).json({ error: "Failed to fetch learning modules" });
    }
  });

  app.get("/api/learning-modules/:id", async (req, res) => {
    try {
      const module = await storage.getLearningModule(req.params.id);
      if (!module) {
        return res.status(404).json({ error: "Learning module not found" });
      }
      res.json(module);
    } catch (error: any) {
      console.error("Error fetching learning module:", error);
      res.status(500).json({ error: "Failed to fetch learning module" });
    }
  });

  app.get("/api/blog-posts", async (_req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      console.error("Error fetching blog posts:", error);
      res.status(500).json({ error: "Failed to fetch blog posts" });
    }
  });

  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const post = await storage.getBlogPost(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Blog post not found" });
      }
      res.json(post);
    } catch (error: any) {
      console.error("Error fetching blog post:", error);
      res.status(500).json({ error: "Failed to fetch blog post" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema
        .omit({ submittedAt: true })
        .parse(req.body);

      const submission = await storage.createContactSubmission({
        ...validatedData,
        submittedAt: new Date().toISOString(),
      });

      res.json(submission);
    } catch (error: any) {
      console.error("Contact submission error:", error);
      res.status(400).json({
        error: error.message || "Failed to submit contact form",
      });
    }
  });

  app.get("/api/compositions", async (_req, res) => {
    try {
      const compositions = await storage.getAllCompositions();
      res.json(compositions);
    } catch (error: any) {
      console.error("Error fetching compositions:", error);
      res.status(500).json({ error: "Failed to fetch compositions" });
    }
  });

  // Check if a composition by taskId has completed (for delayed completions)
  app.get("/api/compositions/by-task/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const compositionId = taskIdToCompositionId.get(taskId);
      
      if (!compositionId) {
        return res.status(404).json({ error: "Composition not found for this taskId" });
      }

      const composition = await storage.getComposition(compositionId);
      if (!composition) {
        return res.status(404).json({ error: "Composition not found" });
      }

      // Get stored audioUrls for this composition
      const audioUrls = compositionAudioUrls.get(compositionId);
      
      // Return composition with completion status and all audio URLs
      res.json({
        ...composition,
        taskId,
        isComplete: !!composition.audioUrl,
        audioUrls: audioUrls || (composition.audioUrl ? [composition.audioUrl] : []),
      });
    } catch (error: any) {
      console.error("Error fetching composition by taskId:", error);
      res.status(500).json({ error: "Failed to fetch composition" });
    }
  });

  // ========== ADMIN ROUTES ==========
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Verify user exists in Firebase and check admin role
      let userRecord;
      try {
        userRecord = await adminAuth.getUserByEmail(email);
      } catch (error: any) {
        if (error.code === "auth/user-not-found") {
          return res.status(401).json({ error: "Invalid credentials" });
        }
        throw error;
      }

      // Check if user is admin in Firestore
      const adminDoc = await adminDb.collection("admins").doc(userRecord.uid).get();
      if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admin privileges required." });
      }

      // Verify password by attempting to sign in (we'll use Firebase Auth REST API)
      // For security, we'll create a custom token and verify it
      // Actually, we need to verify the password. Let's use Firebase Auth REST API
      const firebaseApiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyDqVNSOnxuksvNtVNfcmIQKsHdZEAuTDds";
      
      try {
        // Verify password using Firebase Auth REST API
        const verifyResponse = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              password: password,
              returnSecureToken: true,
            }),
          }
        );

        const verifyData = await verifyResponse.json();
        
        if (!verifyResponse.ok) {
          return res.status(401).json({ 
            error: verifyData.error?.message || "Invalid credentials" 
          });
        }

        // Password is correct, create admin session
        const sessionId = randomBytes(32).toString("hex");
        adminSessions.set(sessionId, {
          username: email,
          userId: userRecord.uid,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        res.json({ sessionId, username: email, userId: userRecord.uid });
      } catch (verifyError: any) {
        console.error("Password verification error:", verifyError);
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error: any) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Admin logout
  app.post("/api/admin/logout", requireAdmin, async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionId = authHeader?.replace("Bearer ", "") || (req as any).cookies?.adminSession;
      if (sessionId) {
        adminSessions.delete(sessionId);
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Admin logout error:", error);
      res.status(500).json({ error: "Failed to logout" });
    }
  });

  // Verify admin session
  app.get("/api/admin/verify", requireAdmin, async (req, res) => {
    const authHeader = req.headers.authorization;
    const sessionId = authHeader?.replace("Bearer ", "") || (req as any).cookies?.adminSession;
    const session = sessionId ? adminSessions.get(sessionId) : null;
    res.json({ authenticated: true, username: session?.username });
  });

  // Get API key (masked)
  app.get("/api/admin/settings/api-key", requireAdmin, async (req, res) => {
    try {
      const apiKey = process.env.API_BOX_API_KEY || "";
      const masked = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "";
      res.json({ apiKey: masked, hasKey: !!apiKey });
    } catch (error: any) {
      console.error("Error getting API key:", error);
      res.status(500).json({ error: "Failed to get API key" });
    }
  });

  // Update API key
  app.put("/api/admin/settings/api-key", requireAdmin, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string") {
        return res.status(400).json({ error: "API key is required" });
      }

      // Read current .env
      const env = readEnvFile();
      env.API_BOX_API_KEY = apiKey.trim();
      
      // Write back to .env
      writeEnvFile(env);
      
      // Update process.env (for current session)
      process.env.API_BOX_API_KEY = apiKey.trim();

      res.json({ success: true, message: "API key updated successfully" });
    } catch (error: any) {
      console.error("Error updating API key:", error);
      res.status(500).json({ error: "Failed to update API key" });
    }
  });

  // Get Groq API key (masked)
  app.get("/api/admin/settings/groq-api-key", requireAdmin, async (req, res) => {
    try {
      const apiKey = process.env.GROQ_API_KEY || "";
      const masked = apiKey ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}` : "";
      res.json({ apiKey: masked, hasKey: !!apiKey });
    } catch (error: any) {
      console.error("Error getting Groq API key:", error);
      res.status(500).json({ error: "Failed to get Groq API key" });
    }
  });

  // Update Groq API key
  app.put("/api/admin/settings/groq-api-key", requireAdmin, async (req, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || typeof apiKey !== "string") {
        return res.status(400).json({ error: "API key is required" });
      }

      // Read current .env
      const env = readEnvFile();
      env.GROQ_API_KEY = apiKey.trim();
      
      // Write back to .env
      writeEnvFile(env);
      
      // Update process.env (for current session)
      process.env.GROQ_API_KEY = apiKey.trim();

      res.json({ success: true, message: "Groq API key updated successfully" });
    } catch (error: any) {
      console.error("Error updating Groq API key:", error);
      res.status(500).json({ error: "Failed to update Groq API key" });
    }
  });

  // Get SMTP email settings (masked password)
  app.get("/api/admin/settings/smtp", requireAdmin, async (req, res) => {
    try {
      const env = readEnvFile();
      const smtpPassword = env.SMTP_PASSWORD || "";
      const maskedPassword = smtpPassword ? `${smtpPassword.substring(0, 4)}...${smtpPassword.substring(smtpPassword.length - 4)}` : "";
      
      res.json({
        smtpHost: env.SMTP_HOST || "",
        smtpPort: env.SMTP_PORT || "",
        smtpUser: env.SMTP_USER || "",
        smtpPassword: maskedPassword,
        smtpFrom: env.SMTP_FROM || "",
        hasConfig: !!(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD),
      });
    } catch (error: any) {
      console.error("Error getting SMTP settings:", error);
      res.status(500).json({ error: "Failed to get SMTP settings" });
    }
  });

  // Update SMTP email settings
  app.put("/api/admin/settings/smtp", requireAdmin, async (req, res) => {
    try {
      const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFrom } = req.body;

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return res.status(400).json({ error: "SMTP Host, User, and Password are required" });
      }

      // Validate port
      const port = parseInt(smtpPort || "587");
      if (isNaN(port) || port < 1 || port > 65535) {
        return res.status(400).json({ error: "Invalid SMTP port. Must be between 1 and 65535" });
      }

      // Read current .env
      const env = readEnvFile();
      env.SMTP_HOST = smtpHost.trim();
      env.SMTP_PORT = port.toString();
      env.SMTP_USER = smtpUser.trim();
      env.SMTP_PASSWORD = smtpPassword.trim();
      env.SMTP_FROM = (smtpFrom || smtpUser).trim();
      
      // Write back to .env
      writeEnvFile(env);
      
      // Update process.env (for current session)
      process.env.SMTP_HOST = env.SMTP_HOST;
      process.env.SMTP_PORT = env.SMTP_PORT;
      process.env.SMTP_USER = env.SMTP_USER;
      process.env.SMTP_PASSWORD = env.SMTP_PASSWORD;
      process.env.SMTP_FROM = env.SMTP_FROM;

      res.json({ success: true, message: "SMTP settings updated successfully" });
    } catch (error: any) {
      console.error("Error updating SMTP settings:", error);
      res.status(500).json({ error: "Failed to update SMTP settings" });
    }
  });

  // Get guest mode setting (public endpoint for frontend)
  app.get("/api/settings/guest-mode", async (req, res) => {
    try {
      const env = readEnvFile();
      // Default to enabled if not set (for backward compatibility)
      const guestModeEnabled = env.GUEST_MODE_ENABLED === undefined || 
                               env.GUEST_MODE_ENABLED === "" ||
                               env.GUEST_MODE_ENABLED === "true" || 
                               env.GUEST_MODE_ENABLED === "1";
      res.json({ enabled: guestModeEnabled });
    } catch (error: any) {
      console.error("Error getting guest mode setting:", error);
      // Default to enabled on error
      res.json({ enabled: true });
    }
  });

  // Get guest mode setting (admin endpoint)
  app.get("/api/admin/settings/guest-mode", requireAdmin, async (req, res) => {
    try {
      const env = readEnvFile();
      // Default to enabled if not set (for backward compatibility)
      const guestModeEnabled = env.GUEST_MODE_ENABLED === undefined || 
                               env.GUEST_MODE_ENABLED === "" ||
                               env.GUEST_MODE_ENABLED === "true" || 
                               env.GUEST_MODE_ENABLED === "1";
      res.json({ enabled: guestModeEnabled });
    } catch (error: any) {
      console.error("Error getting guest mode setting:", error);
      res.status(500).json({ error: "Failed to get guest mode setting" });
    }
  });

  // Update guest mode setting
  app.put("/api/admin/settings/guest-mode", requireAdmin, async (req, res) => {
    try {
      const { enabled } = req.body;

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "Enabled must be a boolean value" });
      }

      // Read current .env
      const env = readEnvFile();
      env.GUEST_MODE_ENABLED = enabled ? "true" : "false";
      
      // Write back to .env
      writeEnvFile(env);
      
      // Update process.env (for current session)
      process.env.GUEST_MODE_ENABLED = env.GUEST_MODE_ENABLED;

      res.json({ 
        success: true, 
        message: `Guest mode ${enabled ? "enabled" : "disabled"} successfully`,
        enabled 
      });
    } catch (error: any) {
      console.error("Error updating guest mode setting:", error);
      res.status(500).json({ error: "Failed to update guest mode setting" });
    }
  });

  // Get generation logs
  app.get("/api/admin/logs", requireAdmin, async (req, res) => {
    try {
      // Try to fetch logs from API.box API first (if available)
      let apiBoxLogs: any[] = [];
      try {
        apiBoxLogs = await getApiBoxLogs();
        console.log(`[API.box] Fetched ${apiBoxLogs.length} logs from API.box`);
      } catch (apiBoxError) {
        // API.box logs endpoint might not exist, that's okay - use Firebase logs
        console.log("[API.box] Logs API not available, using Firebase logs only");
      }

      // Fetch logs from Firebase Firestore
      const logsSnapshot = await adminDb.collection("generationLogs")
        .orderBy("createdAt", "desc")
        .limit(1000) // Limit to 1000 most recent logs
        .get();

      const firebaseLogsArray = logsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          taskId: data.taskId || doc.id,
          compositionId: data.compositionId || null,
          time: data.time || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()),
          type: data.type || "generate",
          model: data.model || "chirp-crow",
          prompt: data.prompt || "",
          callbackUrl: data.callbackUrl || "",
          status: data.status || "pending",
          creditsConsumed: data.creditsConsumed !== undefined ? data.creditsConsumed : null,
        };
      });

      // If API.box logs are available, merge with Firebase logs (prefer API.box data)
      // Create a map of taskIds from Firebase for deduplication
      const firebaseTaskIdMap = new Map(firebaseLogsArray.map(log => [log.taskId, log]));
      
      // Process API.box logs and add to map (API.box logs take precedence)
      apiBoxLogs.forEach(apiLog => {
        // Convert API.box log format to our format
        const taskId = apiLog.taskId || apiLog.id || apiLog.task_id;
        if (taskId) {
          firebaseTaskIdMap.set(taskId, {
            id: taskId,
            taskId: taskId,
            compositionId: firebaseTaskIdMap.get(taskId)?.compositionId || null,
            time: apiLog.time || apiLog.createdAt || apiLog.timestamp || new Date().toISOString(),
            type: "generate",
            model: apiLog.model || "chirp-crow",
            prompt: apiLog.prompt || apiLog.input || "",
            callbackUrl: apiLog.callbackUrl || apiLog.callback_url || "",
            status: apiLog.status === "success" || apiLog.status === "complete" ? "success" : 
                   apiLog.status === "failed" ? "failed" : "pending",
            creditsConsumed: apiLog.creditsConsumed || apiLog.credits || null,
          });
        }
      });

      // Convert map back to array and sort by time (newest first)
      const allLogs = Array.from(firebaseTaskIdMap.values()).sort((a, b) => {
        const timeA = new Date(a.time).getTime();
        const timeB = new Date(b.time).getTime();
        return timeB - timeA; // Newest first
      });

      res.json({ logs: allLogs });
    } catch (error: any) {
      console.error("Error fetching generation logs:", error);
      res.status(500).json({ error: "Failed to fetch generation logs: " + (error.message || "Unknown error") });
    }
  });

  // Get remaining API credits
  app.get("/api/admin/credits", requireAdmin, async (req, res) => {
    try {
      const credits = await getRemainingCredits();
      res.json({ credits, success: true });
    } catch (error: any) {
      console.error("Error getting credits:", error);
      res.status(500).json({ error: error.message || "Failed to get remaining credits" });
    }
  });

  // Get all users (from Firebase)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      // List all users from Firebase Auth
      const listUsersResult = await adminAuth.listUsers(1000); // Get up to 1000 users
      const firebaseUsers = listUsersResult.users;

      // Fetch user profiles from Firestore
      const usersWithProfiles = await Promise.all(
        firebaseUsers.map(async (firebaseUser) => {
          try {
            // Get user profile from Firestore
            const userDoc = await adminDb.collection("users").doc(firebaseUser.uid).get();
            const profileData = userDoc.exists ? userDoc.data() : null;

            // Check if user is admin
            const adminDoc = await adminDb.collection("admins").doc(firebaseUser.uid).get();
            const isAdmin = adminDoc.exists && adminDoc.data()?.isAdmin === true;
            
            // Get user role from Firestore (default to "user")
            const userRole = profileData?.role || (isAdmin ? "admin" : "user");

            return {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: profileData?.name || firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Unknown",
              mobileNumber: profileData?.mobileNumber || null,
              role: userRole,
              isBlocked: firebaseUser.disabled || false,
              isActive: !firebaseUser.disabled,
              // Use Firestore emailVerified if available (from OTP verification), otherwise use Firebase Auth's emailVerified
              emailVerified: profileData?.emailVerified !== undefined ? profileData.emailVerified : firebaseUser.emailVerified,
              createdAt: firebaseUser.metadata.creationTime,
              lastSignIn: firebaseUser.metadata.lastSignInTime,
              subscriptionStatus: profileData?.subscriptionStatus,
              subscriptionExpiresAt: profileData?.subscriptionExpiresAt,
              teacherSubscriptionRequired: profileData?.teacherSubscriptionRequired,
              verifiedArtist: profileData?.verifiedArtist || false,
              verifiedDirector: profileData?.verifiedDirector || false,
              verifiedDoctor: profileData?.verifiedDoctor || false,
              profileData: profileData ? {
                createdAt: profileData.createdAt,
                updatedAt: profileData.updatedAt,
              } : null,
            };
          } catch (error) {
            console.error(`Error fetching profile for user ${firebaseUser.uid}:`, error);
            // Return basic user info even if Firestore fetch fails
            // Check if user is admin
            let userRole = "user";
            try {
              const adminDoc = await adminDb.collection("admins").doc(firebaseUser.uid).get();
              if (adminDoc.exists && adminDoc.data()?.isAdmin === true) {
                userRole = "admin";
              }
            } catch (error) {
              console.error(`Error checking admin status for user ${firebaseUser.uid}:`, error);
            }

            return {
              id: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Unknown",
              mobileNumber: null,
              role: userRole,
              isBlocked: firebaseUser.disabled || false,
              isActive: !firebaseUser.disabled,
              // Use Firebase Auth's emailVerified as fallback (no Firestore profile)
              emailVerified: firebaseUser.emailVerified,
              createdAt: firebaseUser.metadata.creationTime,
              lastSignIn: firebaseUser.metadata.lastSignInTime,
              profileData: null,
            };
          }
        })
      );

      res.json({ users: usersWithProfiles });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users: " + (error.message || "Unknown error") });
    }
  });

  // Update user status (block/deactivate)
  app.put("/api/admin/users/:userId/status", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { isBlocked, isActive } = req.body;
      
      // Determine if user should be disabled (blocked or inactive)
      const shouldDisable = isBlocked === true || isActive === false;

      // Update user in Firebase Auth
      await adminAuth.updateUser(userId, {
        disabled: shouldDisable,
      });

      // Also update status in Firestore for easier querying
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        await userRef.update({
          isBlocked: isBlocked ?? false,
          isActive: isActive !== false, // Default to true if not specified
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // If user profile doesn't exist in Firestore, create it with status
        await userRef.set({
          isBlocked: isBlocked ?? false,
          isActive: isActive !== false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      res.json({ 
        success: true, 
        message: `User ${shouldDisable ? "blocked/deactivated" : "activated"}`,
        userId,
        isBlocked: isBlocked ?? false,
        isActive: isActive !== false,
      });
    } catch (error: any) {
      console.error("Error updating user status:", error);
      
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.status(500).json({ error: "Failed to update user status: " + (error.message || "Unknown error") });
    }
  });

  // Update user role
  app.put("/api/admin/users/:userId/role", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { role, requiresSubscription } = req.body;
      const sessionId = req.headers.authorization?.replace("Bearer ", "") || (req as any).cookies?.adminSession;
      const session = sessionId ? adminSessions.get(sessionId) : null;
      const adminUserId = session?.userId || "unknown";

      if (!role || !["user", "admin", "moderator", "music_teacher", "artist", "music_director", "doctor", "astrologer", "student"].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'user', 'admin', 'moderator', 'music_teacher', 'artist', 'music_director', 'doctor', 'astrologer', or 'student'" });
      }

      // Get current user data to track role change
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      const previousRole = userDoc.exists ? (userDoc.data()?.role || "user") : "user";
      
      // Update role in Firestore users collection
      const updateData: any = {
        role: role,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // For music_teacher, artist, music_director, doctor, and astrologer roles, handle subscription requirement
      if (role === "music_teacher" || role === "artist" || role === "music_director" || role === "doctor" || role === "astrologer") {
        // If requiresSubscription is explicitly set, use it; otherwise default to true
        const subscriptionRequired = requiresSubscription !== false;
        updateData.subscriptionRequired = subscriptionRequired;
        
        // If subscription is required and not already set, set status to inactive
        if (subscriptionRequired && !userDoc.data()?.subscriptionStatus) {
          updateData.subscriptionStatus = "inactive";
        }
      } else if (role === "student") {
        // Student role is FREE - no subscription required
        updateData.subscriptionRequired = admin.firestore.FieldValue.delete();
        updateData.subscriptionStatus = admin.firestore.FieldValue.delete();
        updateData.subscriptionExpiresAt = admin.firestore.FieldValue.delete();
      } else {
        // Clear role-specific fields when changing to a role that doesn't require subscription
        updateData.subscriptionRequired = admin.firestore.FieldValue.delete();
        updateData.subscriptionStatus = admin.firestore.FieldValue.delete();
        updateData.subscriptionExpiresAt = admin.firestore.FieldValue.delete();
      }
      
      if (userDoc.exists) {
        await userRef.update(updateData);
      } else {
        // If user profile doesn't exist, create it
        await userRef.set(updateData, { merge: true });
      }

      // If role is admin, also update admins collection
      if (role === "admin") {
        await adminDb.collection("admins").doc(userId).set({
          isAdmin: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        // Remove from admins collection if not admin
        await adminDb.collection("admins").doc(userId).delete().catch(() => {
          // Ignore error if document doesn't exist
        });
      }

      // Log role change audit
      try {
        const auditData: any = {
          userId,
          previousRole,
          newRole: role,
          changedBy: adminUserId,
          changedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        
        // Only add requiresSubscription if it's defined
        if (role === "music_teacher" || role === "artist" || role === "music_director" || role === "doctor" || role === "astrologer") {
          auditData.requiresSubscription = requiresSubscription !== false;
        }
        
        await adminDb.collection("roleChangeAudit").add(auditData);
      } catch (auditError) {
        console.error("Error logging role change audit:", auditError);
        // Don't fail the request if audit logging fails
      }

      res.json({ 
        success: true, 
        message: `User role updated to ${role}`,
        userId,
        role,
        requiresSubscription: (role === "music_teacher" || role === "artist" || role === "music_director" || role === "doctor" || role === "astrologer") ? (requiresSubscription !== false) : undefined,
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      
      if (error.code === "auth/user-not-found") {
        return res.status(404).json({ error: "User not found" });
      }
      
      res.status(500).json({ error: "Failed to update user role: " + (error.message || "Unknown error") });
    }
  });

  // Update artist verification status
  app.put("/api/admin/users/:userId/verify", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { verifiedArtist } = req.body;

      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      if (userData?.role !== "artist") {
        return res.status(400).json({ error: "User must have artist role to manage verification" });
      }

      await userRef.update({
        verifiedArtist: verifiedArtist === true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ 
        success: true, 
        message: `Artist verification ${verifiedArtist ? "enabled" : "disabled"}`,
        userId,
        verifiedArtist: verifiedArtist === true,
      });
    } catch (error: any) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ error: "Failed to update verification status: " + (error.message || "Unknown error") });
    }
  });

  // Update user subscription status (for music teachers and artists)
  app.put("/api/admin/users/:userId/subscription", requireAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      const { subscriptionStatus, subscriptionExpiresAt, trialDays } = req.body;

      if (!subscriptionStatus || !["active", "inactive", "trial", "expired"].includes(subscriptionStatus)) {
        console.error("Invalid subscription status received:", subscriptionStatus);
        console.error("Request body:", req.body);
        return res.status(400).json({ 
          error: `Invalid subscription status: ${subscriptionStatus || "undefined"}. Must be 'active', 'inactive', 'trial', or 'expired'` 
        });
      }

      // Verify user has a role that requires subscription
      const userRef = adminDb.collection("users").doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      const userData = userDoc.data();
      const userRole = userData?.role || "user";
      if (userRole !== "music_teacher" && userRole !== "artist" && userRole !== "music_director" && userRole !== "doctor" && userRole !== "astrologer") {
        return res.status(400).json({ 
          error: `User must have music_teacher, artist, music_director, doctor, or astrologer role to manage subscription. Current role: ${userRole}` 
        });
      }

      // Calculate expiration date
      let expiresAt = subscriptionExpiresAt;
      if (subscriptionStatus === "trial" && trialDays) {
        const trialExpiry = new Date();
        trialExpiry.setDate(trialExpiry.getDate() + trialDays);
        expiresAt = trialExpiry.toISOString();
      } else if (subscriptionStatus === "active" && !expiresAt) {
        // Default to 1 year if not specified
        const oneYear = new Date();
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        expiresAt = oneYear.toISOString();
      }

      await userRef.update({
        subscriptionStatus,
        subscriptionExpiresAt: expiresAt || admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({ 
        success: true, 
        message: `Subscription status updated to ${subscriptionStatus}`,
        userId,
        subscriptionStatus,
        subscriptionExpiresAt: expiresAt,
      });
    } catch (error: any) {
      console.error("Error updating subscription status:", error);
      console.error("Request body:", req.body);
      console.error("User ID:", userId);
      res.status(500).json({ error: "Failed to update subscription status: " + (error.message || "Unknown error") });
    }
  });

  // ==================== OTP Verification Endpoints ====================

  /**
   * Send OTP to email for verification
   * POST /api/auth/send-otp
   */
  app.post("/api/auth/send-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check if email already exists in Firebase
      try {
        await adminAuth.getUserByEmail(email);
        return res.status(400).json({ error: "An account with this email already exists" });
      } catch (error: any) {
        // If user not found, that's good - email is available
        if (error.code !== "auth/user-not-found") {
          throw error;
        }
      }

      const result = await generateAndSendOTP(email);

      if (!result.success) {
        return res.status(400).json({
          error: result.message,
          resendCooldown: result.resendCooldown,
        });
      }

      res.json({
        success: true,
        message: result.message,
        resendCooldown: result.resendCooldown,
      });
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: "Failed to send OTP: " + (error.message || "Unknown error") });
    }
  });

  /**
   * Verify OTP
   * POST /api/auth/verify-otp
   */
  app.post("/api/auth/verify-otp", async (req, res) => {
    try {
      const { email, otp } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!otp || typeof otp !== "string") {
        return res.status(400).json({ error: "OTP is required" });
      }

      // Validate OTP format (6 digits)
      if (!/^\d{6}$/.test(otp)) {
        return res.status(400).json({ error: "OTP must be a 6-digit number" });
      }

      const result = verifyOTP(email, otp);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      res.json({
        success: true,
        message: result.message,
        verified: true,
      });
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP: " + (error.message || "Unknown error") });
    }
  });

  /**
   * Resend OTP
   * POST /api/auth/resend-otp
   */
  app.post("/api/auth/resend-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      // Check cooldown
      const cooldown = getResendCooldown(email);
      if (cooldown > 0) {
        return res.status(429).json({
          error: `Please wait ${cooldown} seconds before requesting a new OTP`,
          resendCooldown: cooldown,
        });
      }

      const result = await generateAndSendOTP(email);

      if (!result.success) {
        return res.status(400).json({
          error: result.message,
          resendCooldown: result.resendCooldown,
        });
      }

      res.json({
        success: true,
        message: result.message,
        resendCooldown: result.resendCooldown,
      });
    } catch (error: any) {
      console.error("Error resending OTP:", error);
      res.status(500).json({ error: "Failed to resend OTP: " + (error.message || "Unknown error") });
    }
  });

  /**
   * Check if email is verified
   * GET /api/auth/check-email-verification
   */
  app.get("/api/auth/check-email-verification", async (req, res) => {
    try {
      const email = req.query.email as string;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      const verified = isEmailVerified(email);
      res.json({ verified });
    } catch (error: any) {
      console.error("Error checking email verification:", error);
      res.status(500).json({ error: "Failed to check email verification" });
    }
  });

  /**
   * Helper function to normalize mobile number (remove spaces, dashes, parentheses)
   */
  function normalizeMobileNumber(mobileNumber: string): string {
    // Remove all non-digit characters except +
    return mobileNumber.replace(/[^\d+]/g, "");
  }

  /**
   * GET /api/auth/check-email-exists
   * Check if an email already exists in Firebase Auth
   */
  app.get("/api/auth/check-email-exists", async (req, res) => {
    try {
      const email = req.query.email as string;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      try {
        await adminAuth.getUserByEmail(email);
        // User exists
        res.json({ exists: true });
      } catch (error: any) {
        // If user not found, email doesn't exist
        if (error.code === "auth/user-not-found") {
          res.json({ exists: false });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Error checking email existence:", error);
      res.status(500).json({ error: "Failed to check email existence" });
    }
  });

  /**
   * GET /api/auth/check-mobile-exists
   * Check if a mobile number already exists in Firestore users collection
   */
  app.get("/api/auth/check-mobile-exists", async (req, res) => {
    try {
      const mobileNumber = req.query.mobileNumber as string;

      if (!mobileNumber || typeof mobileNumber !== "string") {
        return res.status(400).json({ error: "Mobile number is required" });
      }

      // Normalize the mobile number
      const normalizedMobile = normalizeMobileNumber(mobileNumber.trim());

      if (normalizedMobile.length < 10) {
        return res.status(400).json({ error: "Invalid mobile number format" });
      }

      // Query Firestore for users with this mobile number
      // Check multiple variations: original, trimmed, normalized
      const usersRef = adminDb.collection("users");
      
      // Check exact match with original (trimmed)
      const exactMatch = await usersRef.where("mobileNumber", "==", mobileNumber.trim()).limit(1).get();
      
      // Check normalized version
      const normalizedMatch = await usersRef.where("mobileNumber", "==", normalizedMobile).limit(1).get();

      let exists = !exactMatch.empty || !normalizedMatch.empty;

      // If not found with exact match, check all users and normalize their numbers
      // This handles cases where numbers are stored in different formats
      if (!exists) {
        const allUsersSnapshot = await usersRef.limit(1000).get();
        for (const doc of allUsersSnapshot.docs) {
          const userData = doc.data();
          if (userData.mobileNumber) {
            const userNormalized = normalizeMobileNumber(userData.mobileNumber);
            const inputNormalized = normalizedMobile;
            // Compare normalized versions
            if (userNormalized === inputNormalized || 
                userData.mobileNumber.trim() === mobileNumber.trim()) {
              exists = true;
              break;
            }
          }
        }
      }

      res.json({ exists });
    } catch (error: any) {
      console.error("Error checking mobile number existence:", error);
      res.status(500).json({ error: "Failed to check mobile number existence" });
    }
  });

  /**
   * Remove verified OTP after account creation (cleanup)
   * POST /api/auth/remove-otp
   */
  app.post("/api/auth/remove-otp", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || typeof email !== "string") {
        return res.status(400).json({ error: "Email is required" });
      }

      removeVerifiedOTP(email);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error removing OTP:", error);
      res.status(500).json({ error: "Failed to remove OTP" });
    }
  });

  // ========== MASTER ADMIN PANEL - ADDITIONAL ENDPOINTS ==========

  // Get role audit logs
  app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const roleFilter = req.query.role as string | undefined;
      
      let query: any = adminDb.collection("roleChangeAudit").orderBy("changedAt", "desc").limit(limit);
      
      if (roleFilter) {
        query = query.where("newRole", "==", roleFilter);
      }
      
      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        changedAt: doc.data().changedAt?.toDate?.()?.toISOString() || doc.data().changedAt,
      }));
      
      res.json({ logs });
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });

  // ========== SUBSCRIPTION PLANS MANAGEMENT ==========
  
  // Get all subscription plans
  app.get("/api/admin/subscription-plans", requireAdmin, async (req, res) => {
    try {
      const role = req.query.role as string | undefined;
      
      let query: any = adminDb.collection("subscriptionPlans");
      if (role) {
        query = query.where("role", "==", role);
      }
      
      const snapshot = await query.get();
      const plans = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        };
      });
      
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching subscription plans:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });
      
      // Check if it's a Firestore index error
      if (error.code === 9 || error.message?.includes("index")) {
        return res.status(400).json({ 
          error: "Firestore index required. Please create the index in Firebase Console.",
          details: error.message 
        });
      }
      
      res.status(500).json({ 
        error: "Failed to fetch subscription plans",
        details: error.message 
      });
    }
  });

  // Create subscription plan
  app.post("/api/admin/subscription-plans", requireAdmin, async (req, res) => {
    try {
      const { role, name, price, duration, features, usageLimits, displayOnUpgradePage } = req.body;
      
      if (!role || !name || price === undefined || !duration) {
        return res.status(400).json({ error: "Role, name, price, and duration are required" });
      }
      
      if (!["user", "music_teacher", "artist", "music_director", "doctor", "astrologer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role for subscription plan" });
      }
      
      const planData = {
        role,
        name,
        price: parseFloat(price),
        duration: parseInt(duration), // days
        features: Array.isArray(features) ? features : [],
        usageLimits: usageLimits || {},
        displayOnUpgradePage: displayOnUpgradePage === true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await adminDb.collection("subscriptionPlans").add(planData);
      
      res.json({
        success: true,
        id: docRef.id,
        message: "Subscription plan created successfully",
      });
    } catch (error: any) {
      console.error("Error creating subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  // Update subscription plan
  app.put("/api/admin/subscription-plans/:planId", requireAdmin, async (req, res) => {
    try {
      const { planId } = req.params;
      const { name, price, duration, features, usageLimits, displayOnUpgradePage } = req.body;
      
      const planRef = adminDb.collection("subscriptionPlans").doc(planId);
      const planDoc = await planRef.get();
      
      if (!planDoc.exists) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (name !== undefined) updateData.name = name;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (duration !== undefined) updateData.duration = parseInt(duration);
      if (features !== undefined) updateData.features = Array.isArray(features) ? features : [];
      if (usageLimits !== undefined) updateData.usageLimits = usageLimits;
      if (displayOnUpgradePage !== undefined) updateData.displayOnUpgradePage = displayOnUpgradePage === true;
      
      await planRef.update(updateData);
      
      res.json({ success: true, message: "Subscription plan updated successfully" });
    } catch (error: any) {
      console.error("Error updating subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  // Delete subscription plan
  app.delete("/api/admin/subscription-plans/:planId", requireAdmin, async (req, res) => {
    try {
      const { planId } = req.params;
      
      await adminDb.collection("subscriptionPlans").doc(planId).delete();
      
      res.json({ success: true, message: "Subscription plan deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  // Public endpoint to get upgrade page plans
  app.get("/api/upgrade-plans", async (req, res) => {
    try {
      let snapshot;
      
      // Try to fetch with filter first
      try {
        snapshot = await adminDb
          .collection("subscriptionPlans")
          .where("displayOnUpgradePage", "==", true)
          .get();
      } catch (filterError: any) {
        // If filter query fails (e.g., index missing), fetch all and filter in memory
        console.warn("Filter query failed, fetching all plans:", filterError.message);
        snapshot = await adminDb
          .collection("subscriptionPlans")
          .get();
      }
      
      const allPlans = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          price: data.price || 0,
          displayOnUpgradePage: data.displayOnUpgradePage || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString(),
        };
      });
      
      // Filter plans that should be displayed on upgrade page
      const plans = allPlans.filter(plan => plan.displayOnUpgradePage === true);
      
      // Sort by price in memory (ascending)
      plans.sort((a, b) => (a.price || 0) - (b.price || 0));
      
      res.json({ plans });
    } catch (error: any) {
      console.error("Error fetching upgrade plans:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        details: error.details,
      });
      
      res.status(500).json({ 
        error: "Failed to fetch upgrade plans",
        details: error.message || error.details || "Unknown error"
      });
    }
  });

  // ========== INSTRUMENT MANAGEMENT ==========
  
  // Get all instruments
  app.get("/api/admin/instruments", requireAdmin, async (req, res) => {
    try {
      const snapshot = await adminDb.collection("instruments").orderBy("name").get();
      const instruments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));
      
      res.json({ instruments });
    } catch (error: any) {
      console.error("Error fetching instruments:", error);
      res.status(500).json({ error: "Failed to fetch instruments" });
    }
  });

  // Create instrument
  app.post("/api/admin/instruments", requireAdmin, async (req, res) => {
    try {
      const { name, category, previewAudioUrl, previewDuration, isEnabled, autoPreviewEnabled } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({ error: "Name and category are required" });
      }
      
      if (!["hindustani", "carnatic", "both", "fusion"].includes(category)) {
        return res.status(400).json({ error: "Invalid category. Must be hindustani, carnatic, both, or fusion" });
      }
      
      if (previewDuration && (previewDuration < 5 || previewDuration > 10)) {
        return res.status(400).json({ error: "Preview duration must be between 5-10 seconds" });
      }
      
      const instrumentData = {
        name,
        category,
        previewAudioUrl: previewAudioUrl || null,
        previewDuration: previewDuration ? parseInt(previewDuration) : 5,
        isEnabled: isEnabled !== false,
        autoPreviewEnabled: autoPreviewEnabled === true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await adminDb.collection("instruments").add(instrumentData);
      
      res.json({
        success: true,
        id: docRef.id,
        message: "Instrument created successfully",
      });
    } catch (error: any) {
      console.error("Error creating instrument:", error);
      res.status(500).json({ error: "Failed to create instrument" });
    }
  });

  // Update instrument
  app.put("/api/admin/instruments/:instrumentId", requireAdmin, async (req, res) => {
    try {
      const { instrumentId } = req.params;
      const { name, category, previewAudioUrl, previewDuration, isEnabled, autoPreviewEnabled } = req.body;
      
      const instrumentRef = adminDb.collection("instruments").doc(instrumentId);
      const instrumentDoc = await instrumentRef.get();
      
      if (!instrumentDoc.exists) {
        return res.status(404).json({ error: "Instrument not found" });
      }
      
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) {
        if (!["hindustani", "carnatic", "both", "fusion"].includes(category)) {
          return res.status(400).json({ error: "Invalid category" });
        }
        updateData.category = category;
      }
      if (previewAudioUrl !== undefined) updateData.previewAudioUrl = previewAudioUrl || null;
      if (previewDuration !== undefined) {
        if (previewDuration < 5 || previewDuration > 10) {
          return res.status(400).json({ error: "Preview duration must be between 5-10 seconds" });
        }
        updateData.previewDuration = parseInt(previewDuration);
      }
      if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
      if (autoPreviewEnabled !== undefined) updateData.autoPreviewEnabled = autoPreviewEnabled;
      
      await instrumentRef.update(updateData);
      
      res.json({ success: true, message: "Instrument updated successfully" });
    } catch (error: any) {
      console.error("Error updating instrument:", error);
      res.status(500).json({ error: "Failed to update instrument" });
    }
  });

  // Delete instrument
  app.delete("/api/admin/instruments/:instrumentId", requireAdmin, async (req, res) => {
    try {
      const { instrumentId } = req.params;
      
      await adminDb.collection("instruments").doc(instrumentId).delete();
      
      res.json({ success: true, message: "Instrument deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting instrument:", error);
      res.status(500).json({ error: "Failed to delete instrument" });
    }
  });

  // ========== ANALYTICS & INSIGHTS ==========
  
  // Get platform analytics
  app.get("/api/admin/analytics", requireAdmin, async (req, res) => {
    try {
      // Get user counts by role
      const usersSnapshot = await adminDb.collection("users").get();
      const users = usersSnapshot.docs.map(doc => doc.data());
      
      const roleCounts: Record<string, number> = {};
      let totalSubscriptions = 0;
      let activeSubscriptions = 0;
      
      users.forEach(user => {
        const role = user.role || "user";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
        
        if (user.subscriptionStatus) {
          totalSubscriptions++;
          if (user.subscriptionStatus === "active" || user.subscriptionStatus === "trial") {
            activeSubscriptions++;
          }
        }
      });
      
      // Get generation stats
      const generationSnapshot = await adminDb.collection("generationLogs")
        .where("status", "==", "completed")
        .get();
      const totalGenerations = generationSnapshot.size;
      
      // Get most used instruments (from generation logs)
      const instrumentUsage: Record<string, number> = {};
      generationSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.instrument) {
          instrumentUsage[data.instrument] = (instrumentUsage[data.instrument] || 0) + 1;
        }
      });
      
      const mostUsedInstruments = Object.entries(instrumentUsage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));
      
      // Get module usage (from generation logs)
      const moduleUsage: Record<string, number> = {
        general: 0,
        horoscope: 0,
        therapy: 0,
      };
      
      generationSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.module) {
          moduleUsage[data.module] = (moduleUsage[data.module] || 0) + 1;
        } else {
          moduleUsage.general = (moduleUsage.general || 0) + 1;
        }
      });
      
      res.json({
        users: {
          total: users.length,
          byRole: roleCounts,
        },
        subscriptions: {
          total: totalSubscriptions,
          active: activeSubscriptions,
        },
        generations: {
          total: totalGenerations,
          mostUsedInstruments: mostUsedInstruments,
          byModule: moduleUsage,
        },
      });
    } catch (error: any) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // ========== SYSTEM SETTINGS ==========
  
  // Get system settings
  app.get("/api/admin/system-settings", requireAdmin, async (req, res) => {
    try {
      const settingsDoc = await adminDb.collection("systemSettings").doc("global").get();
      
      if (!settingsDoc.exists) {
        // Return defaults
        return res.json({
          modules: {
            educationalMusic: true,
            instrumentalEducation: true,
            musicGeneration: true,
            musicHoroscope: true,
            musicTherapy: true,
            artistLibrary: true,
            musicEBooks: true,
          },
          maintenanceMode: false,
          aiGenerationEnabled: true,
        });
      }
      
      res.json(settingsDoc.data());
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });

  // Update system settings
  app.put("/api/admin/system-settings", requireAdmin, async (req, res) => {
    try {
      const { modules, maintenanceMode, aiGenerationEnabled } = req.body;
      
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      if (modules !== undefined) updateData.modules = modules;
      if (maintenanceMode !== undefined) updateData.maintenanceMode = maintenanceMode;
      if (aiGenerationEnabled !== undefined) updateData.aiGenerationEnabled = aiGenerationEnabled;
      
      await adminDb.collection("systemSettings").doc("global").set(updateData, { merge: true });
      
      res.json({ success: true, message: "System settings updated successfully" });
    } catch (error: any) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ error: "Failed to update system settings" });
    }
  });

  // ========== NOTIFICATIONS ==========
  
  // Get all notifications
  app.get("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const snapshot = await adminDb.collection("notifications")
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();
      
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        scheduledFor: doc.data().scheduledFor?.toDate?.()?.toISOString(),
      }));
      
      res.json({ notifications });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Create notification
  app.post("/api/admin/notifications", requireAdmin, async (req, res) => {
    try {
      const { title, message, targetType, targetRole, targetUserId, scheduledFor } = req.body;
      
      if (!title || !message || !targetType) {
        return res.status(400).json({ error: "Title, message, and targetType are required" });
      }
      
      if (!["all", "role", "user"].includes(targetType)) {
        return res.status(400).json({ error: "targetType must be 'all', 'role', or 'user'" });
      }
      
      if (targetType === "role" && !targetRole) {
        return res.status(400).json({ error: "targetRole is required when targetType is 'role'" });
      }
      
      if (targetType === "user" && !targetUserId) {
        return res.status(400).json({ error: "targetUserId is required when targetType is 'user'" });
      }
      
      const notificationData = {
        title,
        message,
        targetType,
        targetRole: targetRole || null,
        targetUserId: targetUserId || null,
        scheduledFor: scheduledFor ? admin.firestore.Timestamp.fromDate(new Date(scheduledFor)) : null,
        sent: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      
      const docRef = await adminDb.collection("notifications").add(notificationData);
      
      res.json({
        success: true,
        id: docRef.id,
        message: "Notification created successfully",
      });
    } catch (error: any) {
      console.error("Error creating notification:", error);
      res.status(500).json({ error: "Failed to create notification" });
    }
  });

  // ========== SECURITY & LOGGING ==========
  
  // ========== CONTENT MODERATION ==========
  
  // Get pending content for moderation
  app.get("/api/admin/content/pending", requireAdmin, async (req, res) => {
    try {
      const contentType = req.query.type as string | undefined; // "course", "lesson", etc.
      
      let query: any = adminDb.collection("courses").where("status", "==", "pending");
      
      if (contentType === "lesson") {
        // For lessons, we need to check courses with pending lessons
        const coursesSnapshot = await adminDb.collection("courses").get();
        const pendingLessons: any[] = [];
        
        coursesSnapshot.docs.forEach((courseDoc) => {
          const courseData = courseDoc.data();
          if (courseData.modules && Array.isArray(courseData.modules)) {
            courseData.modules.forEach((module: any, moduleIndex: number) => {
              if (module.lessons && Array.isArray(module.lessons)) {
                module.lessons.forEach((lesson: any, lessonIndex: number) => {
                  if (lesson.status === "pending") {
                    pendingLessons.push({
                      id: `${courseDoc.id}_${moduleIndex}_${lessonIndex}`,
                      courseId: courseDoc.id,
                      courseTitle: courseData.title,
                      moduleTitle: module.title,
                      lessonTitle: lesson.title,
                      ...lesson,
                    });
                  }
                });
              }
            });
          }
        });
        
        return res.json({ items: pendingLessons });
      }
      
      const snapshot = await query.get();
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString(),
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString(),
      }));
      
      res.json({ items });
    } catch (error: any) {
      console.error("Error fetching pending content:", error);
      res.status(500).json({ error: "Failed to fetch pending content" });
    }
  });

  // Approve content
  app.post("/api/admin/content/:contentId/approve", requireAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      const { contentType } = req.body; // "course" or "lesson"
      
      if (contentType === "course") {
        await adminDb.collection("courses").doc(contentId).update({
          status: "live",
          approvedAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedBy: req.headers.authorization?.replace("Bearer ", "") || "admin",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (contentType === "lesson") {
        // For lessons, we need to update within the course structure
        const [courseId, moduleIndex, lessonIndex] = contentId.split("_");
        const courseRef = adminDb.collection("courses").doc(courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        
        if (courseData?.modules?.[parseInt(moduleIndex)]?.lessons?.[parseInt(lessonIndex)]) {
          courseData.modules[parseInt(moduleIndex)].lessons[parseInt(lessonIndex)].status = "published";
          courseData.modules[parseInt(moduleIndex)].lessons[parseInt(lessonIndex)].approvedAt = admin.firestore.FieldValue.serverTimestamp();
          
          await courseRef.update({
            modules: courseData.modules,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      res.json({ success: true, message: "Content approved successfully" });
    } catch (error: any) {
      console.error("Error approving content:", error);
      res.status(500).json({ error: "Failed to approve content" });
    }
  });

  // Reject content
  app.post("/api/admin/content/:contentId/reject", requireAdmin, async (req, res) => {
    try {
      const { contentId } = req.params;
      const { contentType, reason } = req.body;
      
      if (contentType === "course") {
        await adminDb.collection("courses").doc(contentId).update({
          status: "rejected",
          rejectionReason: reason || "",
          rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
          rejectedBy: req.headers.authorization?.replace("Bearer ", "") || "admin",
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else if (contentType === "lesson") {
        const [courseId, moduleIndex, lessonIndex] = contentId.split("_");
        const courseRef = adminDb.collection("courses").doc(courseId);
        const courseDoc = await courseRef.get();
        const courseData = courseDoc.data();
        
        if (courseData?.modules?.[parseInt(moduleIndex)]?.lessons?.[parseInt(lessonIndex)]) {
          courseData.modules[parseInt(moduleIndex)].lessons[parseInt(lessonIndex)].status = "rejected";
          courseData.modules[parseInt(moduleIndex)].lessons[parseInt(lessonIndex)].rejectionReason = reason || "";
          courseData.modules[parseInt(moduleIndex)].lessons[parseInt(lessonIndex)].rejectedAt = admin.firestore.FieldValue.serverTimestamp();
          
          await courseRef.update({
            modules: courseData.modules,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }
      
      res.json({ success: true, message: "Content rejected successfully" });
    } catch (error: any) {
      console.error("Error rejecting content:", error);
      res.status(500).json({ error: "Failed to reject content" });
    }
  });

  // Get security logs
  app.get("/api/admin/security-logs", requireAdmin, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const actionType = req.query.actionType as string | undefined;
      
      let query: any = adminDb.collection("securityLogs").orderBy("timestamp", "desc").limit(limit);
      
      if (actionType) {
        query = query.where("actionType", "==", actionType);
      }
      
      const snapshot = await query.get();
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString(),
      }));
      
      res.json({ logs });
    } catch (error: any) {
      console.error("Error fetching security logs:", error);
      res.status(500).json({ error: "Failed to fetch security logs" });
    }
  });

  // Get all role menu configurations (admin only - for management)
  app.get("/api/admin/role-menu-configs", requireAdmin, async (req, res) => {
    try {
      // Explicitly set content-type to JSON
      res.setHeader("Content-Type", "application/json");
      
      const snapshot = await adminDb.collection("roleMenuConfigs").get();
      const configs = snapshot.docs.map(doc => ({
        role: doc.id,
        menuItems: doc.data().menuItems || [],
      }));

      // If no configs exist, return empty array (frontend will initialize defaults)
      return res.json({ configs });
    } catch (error: any) {
      console.error("Error fetching role menu configs:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ error: "Failed to fetch role menu configurations" });
    }
  });

  // Get menu configuration for a specific role (public endpoint for dashboard)
  app.get("/api/role-menu-config/:role", async (req, res) => {
    try {
      // Explicitly set content-type to JSON before any operations
      res.setHeader("Content-Type", "application/json");
      
      const { role } = req.params;
      console.log(`[Role Menu Config] Fetching config for role: ${role}`);
      
      const doc = await adminDb.collection("roleMenuConfigs").doc(role).get();
      
      const responseData = doc.exists 
        ? { role, menuItems: doc.data()?.menuItems || [] }
        : { role, menuItems: [] };
      
      console.log(`[Role Menu Config] Returning config for ${role}:`, responseData);
      return res.json(responseData);
    } catch (error: any) {
      console.error("Error fetching role menu config:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ error: "Failed to fetch role menu configuration" });
    }
  });

  // Update role menu configuration
  app.put("/api/admin/role-menu-configs/:role", requireAdmin, async (req, res) => {
    try {
      // Explicitly set content-type to JSON
      res.setHeader("Content-Type", "application/json");
      
      const { role } = req.params;
      const { menuItems } = req.body;

      if (!menuItems || !Array.isArray(menuItems)) {
        return res.status(400).json({ error: "menuItems array is required" });
      }

      // Validate menu items structure
      for (const item of menuItems) {
        if (!item.path || !item.label || typeof item.enabled !== "boolean" || typeof item.order !== "number") {
          return res.status(400).json({ 
            error: "Each menu item must have path, label, enabled (boolean), and order (number)" 
          });
        }
      }

      const sessionId = req.headers.authorization?.replace("Bearer ", "") || (req as any).cookies?.adminSession;
      const session = sessionId ? adminSessions.get(sessionId) : null;
      const adminUserId = session?.userId || "unknown";

      // Save to Firestore
      await adminDb.collection("roleMenuConfigs").doc(role).set({
        role,
        menuItems,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: adminUserId,
      }, { merge: true });

      return res.json({ success: true, message: `Menu configuration for ${role} updated successfully` });
    } catch (error: any) {
      console.error("Error updating role menu config:", error);
      res.setHeader("Content-Type", "application/json");
      return res.status(500).json({ error: "Failed to update role menu configuration" });
    }
  });

  /**
   * Calculate Vedic Astrology (Sidereal with Lahiri Ayanamsa)
   * POST /api/calculate-vedic-astrology
   * 
   * This endpoint calculates accurate Vedic astrology details using:
   * - Vedic/Sidereal Astrology
   * - Lahiri Ayanamsa
   * - Actual planetary positions (Swiss Ephemeris)
   * 
   * Required inputs:
   * - dateOfBirth: DD-MM-YYYY or YYYY-MM-DD format
   * - timeOfBirth: HH:MM format (24-hour) or HH:MM AM/PM
   * - placeOfBirth: City, State, Country (for geo-resolution and timezone)
   */
  app.post("/api/calculate-vedic-astrology", async (req, res) => {
    try {
      const { dateOfBirth, timeOfBirth, placeOfBirth } = req.body;

      // Validation
      if (!dateOfBirth || !timeOfBirth || !placeOfBirth) {
        return res.status(400).json({
          error: "All fields are required: dateOfBirth, timeOfBirth, and placeOfBirth",
          code: "MISSING_FIELDS",
        });
      }

      // Import the calculation function
      const { calculateVedicAstrology } = await import("./vedic-astrology.js");

      // Perform the calculation
      const result = await calculateVedicAstrology(dateOfBirth, timeOfBirth, placeOfBirth);

      // Return the result
      res.json({
        zodiacSign: result.zodiacSign,
        rasi: result.rasi,
        calculationMethod: result.calculationMethod,
        confidence: result.confidence,
        message: result.message,
        sunLongitude: result.sunLongitude,
        moonLongitude: result.moonLongitude,
      });
    } catch (error: any) {
      console.error("Vedic astrology calculation error:", error);
      res.status(500).json({
        error: error.message || "Failed to calculate Vedic astrology",
        code: "CALCULATION_ERROR",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
