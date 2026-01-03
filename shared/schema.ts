import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Music Composition Schema
export const compositions = pgTable("compositions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  raga: text("raga").notNull(),
  tala: text("tala").notNull(),
  instruments: text("instruments").array().notNull(),
  tempo: integer("tempo").notNull(),
  mood: text("mood").notNull(),
  audioUrl: text("audio_url"),
  description: text("description"),
});

export const insertCompositionSchema = createInsertSchema(compositions).omit({
  id: true,
});

export type InsertComposition = z.infer<typeof insertCompositionSchema>;
export type Composition = typeof compositions.$inferSelect;

// Learning Module Schema
export const learningModules = pgTable("learning_modules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // raga, tala, composition, technique
  level: text("level").notNull(), // beginner, intermediate, advanced
  duration: integer("duration").notNull(), // in minutes
  lessonCount: integer("lesson_count").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  content: text("content").notNull(),
});

export const insertLearningModuleSchema = createInsertSchema(learningModules).omit({
  id: true,
});

export type InsertLearningModule = z.infer<typeof insertLearningModuleSchema>;
export type LearningModule = typeof learningModules.$inferSelect;

// Blog Post Schema
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  readTime: integer("read_time").notNull(), // in minutes
  featuredImage: text("featured_image"),
  featured: boolean("featured").default(false),
  publishedAt: text("published_at").notNull(),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

// Contact Submission Schema
export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  submittedAt: text("submitted_at").notNull(),
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
});

export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;

// Music Generation Request Schema (for API)
export const musicGenerationRequestSchema = z.object({
  generationMode: z.enum(["voice_only", "instrumental_only", "full_music"], {
    errorMap: () => ({ message: "Generation mode is required. Please select Voice Only, Instrumental Only, or Full Music." })
  }),
  raga: z.string().optional(),
  tala: z.string().optional(),
  instruments: z.array(z.string()).optional(),
  tempo: z.number().min(40).max(200).optional(),
  mood: z.string().optional(),
  gender: z.string().optional(), // Optional voice gender preference
  language: z.string().optional(), // Optional language for lyrics/vocals
  prompt: z.string().optional(), // Optional custom prompt from user
}).refine((data) => {
  // Voice Only mode: requires customPrompt, optional gender and language
  if (data.generationMode === "voice_only") {
    return !!(data.prompt && data.prompt.trim().length > 0);
  }
  // Instrumental Only mode: requires raga, tala, instruments, tempo, mood
  if (data.generationMode === "instrumental_only") {
    return !!(data.raga && data.tala && data.instruments && data.instruments.length > 0 && data.tempo && data.mood);
  }
  // Full Music mode: requires all fields
  if (data.generationMode === "full_music") {
    return !!(data.raga && data.tala && data.instruments && data.instruments.length > 0 && data.tempo && data.mood && data.prompt && data.prompt.trim().length > 0);
  }
  return true;
}, {
  message: "Required fields are missing for the selected generation mode."
});

export type MusicGenerationRequest = z.infer<typeof musicGenerationRequestSchema>;
