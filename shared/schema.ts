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
  raga: z.string().min(1, "Raga is required"),
  tala: z.string().min(1, "Tala is required"),
  instruments: z.array(z.string()).min(1, "At least one instrument is required"),
  tempo: z.number().min(40).max(200),
  mood: z.string().min(1, "Mood is required"),
  gender: z.string().optional(), // Optional voice gender preference
  language: z.string().optional(), // Optional language for lyrics/vocals
  prompt: z.string().optional(), // Optional custom prompt from user
});

export type MusicGenerationRequest = z.infer<typeof musicGenerationRequestSchema>;
