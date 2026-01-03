import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMusicComposition, getMusicGenerationStatus } from "./apibox";
import {
  musicGenerationRequestSchema,
  insertContactSubmissionSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Store taskId to compositionId mapping temporarily
  const taskIdToCompositionId = new Map<string, string>();
  
  // Cache to remember that API status endpoint doesn't exist (to avoid trying every time)
  let statusEndpointAvailable: boolean | null = null;

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
            return res.json({
              taskId,
              status: "complete",
              audioUrl: composition.audioUrl,
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

        res.json({
          taskId: status.data.taskId,
          status: status.data.status,
          audioUrl: status.data.audioUrl || (status.data.audioUrls && status.data.audioUrls[0]),
          audioUrls: status.data.audioUrls,
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
          // Only update if we have a valid, non-empty URL
          if (finalAudioUrl && finalAudioUrl.trim() !== "") {
            await storage.updateComposition(compositionId, {
              audioUrl: finalAudioUrl,
              title: title || composition.title,
            });
            console.log(`[API.box] ✅ Updated composition ${compositionId} with audio URL: ${finalAudioUrl}`);
            console.log(`[API.box] Title: ${title || composition.title}`);
          } else {
            console.log(`[API.box] Callback marked complete but no valid audio URL for taskId ${taskId}`);
          }
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

      // Return composition with completion status
      res.json({
        ...composition,
        taskId,
        isComplete: !!composition.audioUrl,
      });
    } catch (error: any) {
      console.error("Error fetching composition by taskId:", error);
      res.status(500).json({ error: "Failed to fetch composition" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
