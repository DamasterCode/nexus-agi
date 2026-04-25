import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.

// ============================================================
// NEXUS AI ASSISTANT QUERIES
// ============================================================

import { and, desc } from "drizzle-orm";
import { conversations, messages, tasks, learningLogs, modelConfigs } from "../drizzle/schema";

export async function createConversation(userId: number, title: string, model: string, uncensoredMode: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(conversations).values({
    userId,
    title,
    model,
    uncensoredMode,
  });
  
  return result;
}

export async function getConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt));
}

export async function updateConversationSettings(
  conversationId: number,
  userId: number,
  uncensoredMode?: boolean,
  title?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateData: Record<string, unknown> = {};
  if (uncensoredMode !== undefined) updateData.uncensoredMode = uncensoredMode;
  if (title !== undefined) updateData.title = title;

  if (Object.keys(updateData).length === 0) return;

  return db.update(conversations)
    .set(updateData)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}

export async function getConversationById(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.select().from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  
  return result.length > 0 ? result[0] : null;
}

export async function addMessage(conversationId: number, role: "user" | "assistant" | "system", content: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(messages).values({
    conversationId,
    role,
    content,
    metadata,
  });
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
}

export async function createTask(userId: number, title: string, description?: string, conversationId?: number, priority: "low" | "medium" | "high" | "urgent" = "medium") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(tasks).values({
    userId,
    conversationId,
    title,
    description,
    priority,
  });
}

export async function getTasks(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function updateTaskStatus(taskId: number, status: "pending" | "in_progress" | "completed" | "failed", result?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: Record<string, unknown> = { status };
  if (status === "completed") {
    updateData.completedAt = new Date();
  }
  if (result) {
    updateData.result = result;
  }
  
  return db.update(tasks).set(updateData).where(eq(tasks.id, taskId));
}

export async function addLearningLog(userId: number, improvementType: string, originalCode?: string, improvedCode?: string, suggestion?: string, conversationId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(learningLogs).values({
    userId,
    conversationId,
    improvementType: improvementType as any,
    originalCode,
    improvedCode,
    suggestion,
  });
}

export async function getLearningLogs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(learningLogs)
    .where(eq(learningLogs.userId, userId))
    .orderBy(desc(learningLogs.createdAt));
}

export async function getModelConfigs(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(modelConfigs)
    .where(eq(modelConfigs.userId, userId));
}

export async function createModelConfig(userId: number, modelName: string, modelType: string, endpoint?: string, settings?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.insert(modelConfigs).values({
    userId,
    modelName,
    modelType: modelType as any,
    endpoint,
    settings,
  });
}

export async function setActiveModelConfig(userId: number, modelConfigId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Deactivate all models for this user
  await db.update(modelConfigs)
    .set({ isActive: false })
    .where(eq(modelConfigs.userId, userId));

  // Activate the selected model
  return db.update(modelConfigs)
    .set({ isActive: true })
    .where(and(eq(modelConfigs.id, modelConfigId), eq(modelConfigs.userId, userId)));
}

export async function getActiveModelConfig(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(modelConfigs)
    .where(and(eq(modelConfigs.userId, userId), eq(modelConfigs.isActive, true)))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

export async function deleteModelConfig(userId: number, modelConfigId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.delete(modelConfigs)
    .where(and(eq(modelConfigs.id, modelConfigId), eq(modelConfigs.userId, userId)));
}
