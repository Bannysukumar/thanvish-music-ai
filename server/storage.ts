import {
  type Composition,
  type InsertComposition,
  type LearningModule,
  type InsertLearningModule,
  type BlogPost,
  type InsertBlogPost,
  type ContactSubmission,
  type InsertContactSubmission,
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getComposition(id: string): Promise<Composition | undefined>;
  getAllCompositions(): Promise<Composition[]>;
  createComposition(composition: InsertComposition): Promise<Composition>;
  updateComposition(id: string, updates: Partial<InsertComposition>): Promise<Composition | undefined>;

  getLearningModule(id: string): Promise<LearningModule | undefined>;
  getAllLearningModules(): Promise<LearningModule[]>;
  createLearningModule(module: InsertLearningModule): Promise<LearningModule>;

  getBlogPost(id: string): Promise<BlogPost | undefined>;
  getAllBlogPosts(): Promise<BlogPost[]>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;

  getContactSubmission(id: string): Promise<ContactSubmission | undefined>;
  getAllContactSubmissions(): Promise<ContactSubmission[]>;
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
}

export class MemStorage implements IStorage {
  private compositions: Map<string, Composition>;
  private learningModules: Map<string, LearningModule>;
  private blogPosts: Map<string, BlogPost>;
  private contactSubmissions: Map<string, ContactSubmission>;

  constructor() {
    this.compositions = new Map();
    this.learningModules = new Map();
    this.blogPosts = new Map();
    this.contactSubmissions = new Map();

    this.seedData();
  }

  private seedData() {
    const modules: InsertLearningModule[] = [
      {
        title: "Introduction to Ragas",
        description: "Learn the fundamentals of ragas, the melodic frameworks that define Indian classical music",
        category: "raga",
        level: "beginner",
        duration: 45,
        lessonCount: 8,
        thumbnailUrl: "",
        content: "Complete introduction to ragas covering theory and practice.",
      },
      {
        title: "Mastering Teental",
        description: "Deep dive into Teental, the most important 16-beat rhythmic cycle in Hindustani music",
        category: "tala",
        level: "intermediate",
        duration: 60,
        lessonCount: 12,
        thumbnailUrl: "",
        content: "Comprehensive guide to Teental with practice exercises.",
      },
      {
        title: "Sitar Techniques for Beginners",
        description: "Essential techniques and exercises for learning to play the sitar",
        category: "technique",
        level: "beginner",
        duration: 90,
        lessonCount: 15,
        thumbnailUrl: "",
        content: "Step-by-step sitar instruction from basics to intermediate level.",
      },
      {
        title: "Carnatic Compositions: Kritis",
        description: "Study the structured devotional compositions that form the heart of Carnatic music",
        category: "composition",
        level: "intermediate",
        duration: 75,
        lessonCount: 10,
        thumbnailUrl: "",
        content: "Analysis and performance of classical kritis.",
      },
      {
        title: "Advanced Improvisation in Raga Yaman",
        description: "Explore sophisticated improvisation techniques in one of the most popular evening ragas",
        category: "raga",
        level: "advanced",
        duration: 120,
        lessonCount: 20,
        thumbnailUrl: "",
        content: "Advanced improvisation methods and performance strategies.",
      },
      {
        title: "Tabla Fundamentals",
        description: "Master the basics of tabla playing including bols, strokes, and basic compositions",
        category: "technique",
        level: "beginner",
        duration: 50,
        lessonCount: 10,
        thumbnailUrl: "",
        content: "Essential tabla techniques for beginners.",
      },
    ];

    modules.forEach((module) => {
      const id = randomUUID();
      this.learningModules.set(id, { ...module, id, thumbnailUrl: module.thumbnailUrl || null });
    });

    const posts: InsertBlogPost[] = [
      {
        title: "Understanding the Soul of Indian Classical Music",
        excerpt: "Explore the philosophical foundations and spiritual dimensions that make classical music a profound art form",
        content: "Full article content here...",
        category: "Theory",
        author: "Dr. Priya Sharma",
        readTime: 8,
        featuredImage: "",
        featured: true,
        publishedAt: new Date("2024-10-15").toISOString(),
      },
      {
        title: "Getting Started with AI Music Generation",
        excerpt: "A beginner's guide to using AI tools for creating authentic classical compositions",
        content: "Full tutorial content here...",
        category: "Tutorial",
        author: "Rahul Mehta",
        readTime: 5,
        featuredImage: "",
        featured: false,
        publishedAt: new Date("2024-10-20").toISOString(),
      },
      {
        title: "The History of Hindustani Classical Music",
        excerpt: "Journey through centuries of musical evolution from ancient traditions to modern practice",
        content: "Full historical overview here...",
        category: "History",
        author: "Dr. Anita Desai",
        readTime: 12,
        featuredImage: "",
        featured: false,
        publishedAt: new Date("2024-10-10").toISOString(),
      },
      {
        title: "Top 5 Ragas for Beginners",
        excerpt: "Start your classical music journey with these accessible and beautiful ragas",
        content: "Full guide here...",
        category: "Tutorial",
        author: "Vikram Singh",
        readTime: 6,
        featuredImage: "",
        featured: false,
        publishedAt: new Date("2024-10-25").toISOString(),
      },
      {
        title: "Carnatic Music Festivals Around the World",
        excerpt: "Discover the vibrant festival culture celebrating South Indian classical music globally",
        content: "Full article here...",
        category: "Culture",
        author: "Lakshmi Iyer",
        readTime: 7,
        featuredImage: "",
        featured: false,
        publishedAt: new Date("2024-10-18").toISOString(),
      },
    ];

    posts.forEach((post) => {
      const id = randomUUID();
      this.blogPosts.set(id, { 
        ...post, 
        id, 
        featuredImage: post.featuredImage || null,
        featured: post.featured ?? false 
      });
    });
  }

  async getComposition(id: string): Promise<Composition | undefined> {
    return this.compositions.get(id);
  }

  async getAllCompositions(): Promise<Composition[]> {
    return Array.from(this.compositions.values());
  }

  async createComposition(insertComposition: InsertComposition): Promise<Composition> {
    const id = randomUUID();
    const composition: Composition = { 
      ...insertComposition, 
      id,
      description: insertComposition.description || null,
      audioUrl: insertComposition.audioUrl || null
    };
    this.compositions.set(id, composition);
    return composition;
  }

  async updateComposition(id: string, updates: Partial<InsertComposition>): Promise<Composition | undefined> {
    const existing = this.compositions.get(id);
    if (!existing) {
      return undefined;
    }
    const updated: Composition = {
      ...existing,
      ...updates,
      id, // Ensure ID doesn't change
      description: updates.description !== undefined ? updates.description : existing.description,
      audioUrl: updates.audioUrl !== undefined ? updates.audioUrl : existing.audioUrl,
    };
    this.compositions.set(id, updated);
    return updated;
  }

  async getLearningModule(id: string): Promise<LearningModule | undefined> {
    return this.learningModules.get(id);
  }

  async getAllLearningModules(): Promise<LearningModule[]> {
    return Array.from(this.learningModules.values());
  }

  async createLearningModule(insertModule: InsertLearningModule): Promise<LearningModule> {
    const id = randomUUID();
    const module: LearningModule = { 
      ...insertModule, 
      id,
      thumbnailUrl: insertModule.thumbnailUrl || null
    };
    this.learningModules.set(id, module);
    return module;
  }

  async getBlogPost(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async getAllBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const post: BlogPost = { 
      ...insertPost, 
      id,
      featuredImage: insertPost.featuredImage || null,
      featured: insertPost.featured ?? false
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async getContactSubmission(id: string): Promise<ContactSubmission | undefined> {
    return this.contactSubmissions.get(id);
  }

  async getAllContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values()).sort((a, b) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  }

  async createContactSubmission(
    insertSubmission: InsertContactSubmission
  ): Promise<ContactSubmission> {
    const id = randomUUID();
    const submission: ContactSubmission = { ...insertSubmission, id };
    this.contactSubmissions.set(id, submission);
    return submission;
  }
}

export const storage = new MemStorage();
