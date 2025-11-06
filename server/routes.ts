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

      // Start music generation (async - returns taskId)
      const { taskId } = await generateMusicComposition(validatedData);

      // Create composition with pending status
      const composition = await storage.createComposition({
        title: `${validatedData.raga} in ${validatedData.tala}`,
        raga: validatedData.raga,
        tala: validatedData.tala,
        instruments: validatedData.instruments,
        tempo: validatedData.tempo,
        mood: validatedData.mood,
        description: `Generating ${validatedData.raga} composition in ${validatedData.tala} with ${validatedData.instruments.join(", ")}`,
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
      const taskId = callbackData.taskId || callbackData.task_id || callbackData.data?.task_id;
      const status = callbackData.status || (callbackData.code === 200 ? "complete" : "failed");
      
      // Extract audio URLs from the callback structure
      // API.box callback format: { code, msg, data: { task_id, audio_list: [{ audio_url, stream_audio_url, title, ... }] } }
      let audioUrl: string | undefined;
      let audioUrls: string[] | undefined;
      let title: string | undefined;

      if (callbackData.data?.audio_list && Array.isArray(callbackData.data.audio_list) && callbackData.data.audio_list.length > 0) {
        // New format: audio_list array
        const firstAudio = callbackData.data.audio_list[0];
        audioUrl = firstAudio.audio_url || firstAudio.stream_audio_url || firstAudio.source_audio_url;
        audioUrls = callbackData.data.audio_list.map((audio: any) => 
          audio.audio_url || audio.stream_audio_url || audio.source_audio_url
        ).filter(Boolean);
        title = firstAudio.title;
      } else {
        // Fallback to old format
        audioUrl = callbackData.audioUrl || callbackData.audio_url;
        audioUrls = callbackData.audioUrls || callbackData.audio_urls;
        title = callbackData.title;
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

      // If generation is complete, update the composition
      if (status === "complete" && (audioUrl || (audioUrls && audioUrls.length > 0))) {
        const composition = await storage.getComposition(compositionId);
        if (composition) {
          const finalAudioUrl = audioUrl || (audioUrls && audioUrls[0]);
          await storage.updateComposition(compositionId, {
            audioUrl: finalAudioUrl || null,
            title: title || composition.title,
          });
          console.log(`[API.box] Updated composition ${compositionId} with audio URL: ${finalAudioUrl}`);
        }
      } else {
        console.log(`[API.box] Callback received for taskId ${taskId} but no audio URL yet (status: ${status})`);
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

  const httpServer = createServer(app);

  return httpServer;
}
