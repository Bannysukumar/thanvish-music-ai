import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateMusicComposition } from "./openai";
import {
  musicGenerationRequestSchema,
  insertContactSubmissionSchema,
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/generate-music", async (req, res) => {
    try {
      const validatedData = musicGenerationRequestSchema.parse(req.body);

      const aiResult = await generateMusicComposition(validatedData);

      const composition = await storage.createComposition({
        title: aiResult.title,
        raga: validatedData.raga,
        tala: validatedData.tala,
        instruments: validatedData.instruments,
        tempo: validatedData.tempo,
        mood: validatedData.mood,
        description: aiResult.description,
        audioUrl: null,
      });

      res.json({
        ...composition,
        notation: aiResult.notation,
      });
    } catch (error: any) {
      console.error("Music generation error:", error);
      
      // Determine appropriate status code based on error type
      let statusCode = 400;
      if (error.message?.includes("quota") || error.message?.includes("rate limit")) {
        statusCode = 429; // Too Many Requests
      } else if (error.message?.includes("authentication") || error.message?.includes("API key")) {
        statusCode = 401; // Unauthorized
      } else if (error.message?.includes("unavailable")) {
        statusCode = 503; // Service Unavailable
      }
      
      res.status(statusCode).json({
        error: error.message || "Failed to generate music composition",
        code: error.code || "GENERATION_ERROR",
      });
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
