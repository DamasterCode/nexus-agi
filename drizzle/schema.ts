import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Conversations table — stores chat sessions with Nexus
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull().default("New Conversation"),
  model: varchar("model", { length: 128 }).notNull().default("qwen3.5-9b"),
  uncensoredMode: boolean("uncensoredMode").notNull().default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table — stores individual chat messages
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Tasks table — stores tasks assigned to Nexus
 */
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).notNull().default("pending"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull().default("medium"),
  assignedTo: varchar("assignedTo", { length: 128 }).notNull().default("nexus"),
  result: text("result"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

/**
 * Learning logs table — tracks AI improvements and code changes
 */
export const learningLogs = mysqlTable("learningLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId"),
  improvementType: mysqlEnum("improvementType", ["code_generation", "code_review", "bug_fix", "optimization", "documentation"]).notNull(),
  originalCode: text("originalCode"),
  improvedCode: text("improvedCode"),
  suggestion: text("suggestion"),
  feedback: text("feedback"),
  rating: int("rating"), // 1-5 rating
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LearningLog = typeof learningLogs.$inferSelect;
export type InsertLearningLog = typeof learningLogs.$inferInsert;

/**
 * Model configurations table — stores available models and their settings
 */
export const modelConfigs = mysqlTable("modelConfigs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  modelName: varchar("modelName", { length: 128 }).notNull(),
  modelType: mysqlEnum("modelType", ["ollama", "llama_cpp", "api", "local"]).notNull(),
  endpoint: varchar("endpoint", { length: 512 }),
  isActive: boolean("isActive").notNull().default(false),
  isOffline: boolean("isOffline").notNull().default(false),
  settings: json("settings"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModelConfig = typeof modelConfigs.$inferSelect;
export type InsertModelConfig = typeof modelConfigs.$inferInsert;
