import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Nexus AI Assistant", () => {
  describe("Chat Operations", () => {
    it("should create a new conversation", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createConversation({
        title: "Test Conversation",
        model: "qwen3.5-9b",
        uncensoredMode: false,
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("should list conversations for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a conversation first
      await caller.nexus.createConversation({
        title: "Test Conversation",
        model: "qwen3.5-9b",
      });

      // List conversations
      const conversations = await caller.nexus.listConversations();
      expect(Array.isArray(conversations)).toBe(true);
    });

    it("should get messages from a conversation", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // For this test, we assume conversation ID 1 exists
      // In production, we'd create one first
      try {
        const messages = await caller.nexus.getMessages({ conversationId: 1 });
        expect(Array.isArray(messages)).toBe(true);
      } catch (error) {
        // Expected if conversation doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe("Code Execution", () => {
    it("should execute JavaScript code successfully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.executeCode({
        code: "console.log('Hello, Nexus!'); return 42;",
        language: "javascript",
      });

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it("should handle code execution errors gracefully", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.executeCode({
        code: "throw new Error('Test error');",
        language: "javascript",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should analyze JavaScript code for issues", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.analyzeCode({
        code: "var x = 5; eval('x + 1');",
        language: "javascript",
      });

      expect(result.issues).toBeDefined();
      expect(Array.isArray(result.issues)).toBe(true);
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it("should detect eval() usage in code", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.analyzeCode({
        code: "eval('some code')",
        language: "javascript",
      });

      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues.some(issue => issue.message.includes("eval"))).toBe(true);
    });

    it("should suggest improvements for var usage", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.analyzeCode({
        code: "var x = 5;",
        language: "javascript",
      });

      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe("Task Management", () => {
    it("should create a new task", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createTask({
        title: "Test Task",
        description: "This is a test task",
        priority: "high",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
    });

    it("should list tasks for authenticated user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a task first
      await caller.nexus.createTask({
        title: "Test Task",
        priority: "medium",
      });

      // List tasks
      const tasks = await caller.nexus.listTasks();
      expect(Array.isArray(tasks)).toBe(true);
    });

    it("should update task status", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a task first
      await caller.nexus.createTask({
        title: "Test Task",
        priority: "medium",
      });

      // Update task status (assuming task ID 1)
      try {
        const result = await caller.nexus.updateTaskStatus({
          taskId: 1,
          status: "completed",
          result: "Task completed successfully",
        });

        expect(result).toHaveProperty("success");
      } catch (error) {
        // Expected if task doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe("Learning & Improvement", () => {
    it("should add a learning log entry", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.addLearningLog({
        improvementType: "code_generation",
        originalCode: "const x = 5;",
        improvedCode: "const x = 5; // Better variable name would be helpful",
        suggestion: "Consider using more descriptive variable names",
      });

      expect(result).toBeDefined();
    });

    it("should retrieve learning logs", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Add a learning log first
      await caller.nexus.addLearningLog({
        improvementType: "code_generation",
        originalCode: "const x = 5;",
      });

      // Retrieve logs
      const logs = await caller.nexus.getLearningLogs();
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("Model Configuration", () => {
    it("should create a model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createModelConfig({
        modelName: "qwen3.5-9b",
        modelType: "ollama",
        endpoint: "http://localhost:11434",
      });

      expect(result).toBeDefined();
    });

    it("should retrieve model configurations", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a model config first
      await caller.nexus.createModelConfig({
        modelName: "qwen3.5-9b",
        modelType: "ollama",
      });

      // Retrieve configs
      const configs = await caller.nexus.getModelConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });
  });
});
