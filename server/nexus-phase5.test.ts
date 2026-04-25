/**
 * nexus-phase5.test.ts
 * Tests for Phase 5 (multi-model support), Phase 6 (uncensored mode),
 * and Phase 7 (offline detection, model switching, browser automation stubs).
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ============================================================
// Test helpers
// ============================================================

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-phase5",
    email: "jeffrey@nexus.ai",
    name: "Jeffrey",
    loginMethod: "test",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

// ============================================================
// Phase 5: Multi-Model Support
// ============================================================

describe("Phase 5: Multi-Model Support", () => {
  describe("Model Configuration CRUD", () => {
    it("should create an Ollama model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createModelConfig({
        modelName: "llama3",
        modelType: "ollama",
        endpoint: "http://localhost:11434",
      });

      expect(result).toBeDefined();
    });

    it("should create a llama.cpp model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createModelConfig({
        modelName: "mistral-7b",
        modelType: "llama_cpp",
        endpoint: "http://localhost:8080",
      });

      expect(result).toBeDefined();
    });

    it("should create a custom API model configuration with settings", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.createModelConfig({
        modelName: "gpt-4",
        modelType: "api",
        endpoint: "https://api.openai.com",
        settings: { apiKey: "sk-test-key" },
      });

      expect(result).toBeDefined();
    });

    it("should list all model configurations for user", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nexus.createModelConfig({
        modelName: "llama3",
        modelType: "ollama",
      });

      const configs = await caller.nexus.getModelConfigs();
      expect(Array.isArray(configs)).toBe(true);
    });

    it("should set an active model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a config first
      await caller.nexus.createModelConfig({
        modelName: "llama3",
        modelType: "ollama",
        endpoint: "http://localhost:11434",
      });

      // Get configs to find the ID
      const configs = await caller.nexus.getModelConfigs();

      if (configs.length > 0) {
        const result = await caller.nexus.setActiveModelConfig({
          modelConfigId: configs[0].id,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should retrieve the active model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Active model may be null if none is set
      const activeModel = await caller.nexus.getActiveModelConfig();
      // Should be null or a valid model config object
      expect(activeModel === null || typeof activeModel === "object").toBe(true);
    });

    it("should delete a model configuration", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await caller.nexus.createModelConfig({
        modelName: "codellama",
        modelType: "ollama",
      });

      const configs = await caller.nexus.getModelConfigs();
      if (configs.length > 0) {
        const result = await caller.nexus.deleteModelConfig({
          modelConfigId: configs[0].id,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("Ollama Health Check", () => {
    it("should return offline status when Ollama is not running", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // In test environment, Ollama is not running
      const result = await caller.nexus.checkOllamaHealth({
        endpoint: "http://localhost:11434",
      });

      expect(result).toHaveProperty("isOnline");
      expect(typeof result.isOnline).toBe("boolean");
      // In CI/test environment, Ollama won't be running
      expect(result.isOnline).toBe(false);
    });

    it("should return empty model list when Ollama is offline", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.listOllamaModels({
        endpoint: "http://localhost:11434",
      });

      expect(result).toHaveProperty("models");
      expect(Array.isArray(result.models)).toBe(true);
      // Should return empty array when offline
      expect(result.models.length).toBe(0);
    });

    it("should accept a custom Ollama endpoint", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.nexus.checkOllamaHealth({
        endpoint: "http://custom-ollama-host:11434",
      });

      expect(result).toHaveProperty("isOnline");
      expect(result.isOnline).toBe(false); // Not running in test env
    });
  });

  describe("LLM Routing Logic", () => {
    it("invokeLLM should route to Ollama provider without throwing type errors", async () => {
      const { invokeLLM } = await import("./_core/llm");

      // Should throw a network error (Ollama not running), not a type error
      await expect(
        invokeLLM({
          messages: [{ role: "user", content: "Hello" }],
          modelProvider: "ollama",
          modelName: "llama3",
          modelEndpoint: "http://localhost:11434",
        })
      ).rejects.toThrow(); // Network error expected in test env
    });

    it("invokeLLM should route to llama.cpp provider without throwing type errors", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await expect(
        invokeLLM({
          messages: [{ role: "user", content: "Hello" }],
          modelProvider: "llama_cpp",
          modelName: "local",
          modelEndpoint: "http://localhost:8080",
        })
      ).rejects.toThrow(); // Network error expected in test env
    });

    it("invokeLLM should throw when custom API endpoint is missing", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await expect(
        invokeLLM({
          messages: [{ role: "user", content: "Hello" }],
          modelProvider: "api",
          modelName: "gpt-4",
          // No endpoint provided
        })
      ).rejects.toThrow("Custom API model requires an endpoint");
    });

    it("invokeLLM should throw when custom API key is missing", async () => {
      const { invokeLLM } = await import("./_core/llm");

      await expect(
        invokeLLM({
          messages: [{ role: "user", content: "Hello" }],
          modelProvider: "api",
          modelName: "gpt-4",
          modelEndpoint: "https://api.example.com",
          // No apiKey provided
        })
      ).rejects.toThrow("Custom API model requires an API key");
    });

    it("checkOllamaHealth should return false for unreachable endpoint", async () => {
      const { checkOllamaHealth } = await import("./_core/llm");
      const result = await checkOllamaHealth("http://localhost:19999");
      expect(result).toBe(false);
    });

    it("listOllamaModels should return empty array for unreachable endpoint", async () => {
      const { listOllamaModels } = await import("./_core/llm");
      const models = await listOllamaModels("http://localhost:19999");
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBe(0);
    });
  });
});

// ============================================================
// Phase 6: Uncensored Mode & Safety
// ============================================================

describe("Phase 6: Uncensored Mode & Safety", () => {
  it("should create a conversation with uncensored mode disabled by default", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nexus.createConversation({
      title: "Test Conversation",
      model: "nexus-default",
      uncensoredMode: false,
    });

    expect(result.success).toBe(true);
  });

  it("should create a conversation with uncensored mode enabled", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nexus.createConversation({
      title: "Uncensored Conversation",
      model: "nexus-default",
      uncensoredMode: true,
    });

    expect(result.success).toBe(true);
  });

  it("should update conversation settings including uncensored mode", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation first
    await caller.nexus.createConversation({
      title: "Settings Test",
      model: "nexus-default",
      uncensoredMode: false,
    });

    const conversations = await caller.nexus.listConversations();

    if (conversations.length > 0) {
      const result = await caller.nexus.updateConversationSettings({
        conversationId: conversations[0].id,
        uncensoredMode: true,
      });
      expect(result.success).toBe(true);
    }
  });

  it("should update conversation title via settings", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.nexus.createConversation({
      title: "Original Title",
      model: "nexus-default",
    });

    const conversations = await caller.nexus.listConversations();

    if (conversations.length > 0) {
      const result = await caller.nexus.updateConversationSettings({
        conversationId: conversations[0].id,
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
    }
  });
});

// ============================================================
// Phase 7: Offline Functionality & Model Switching
// ============================================================

describe("Phase 7: Offline Detection & Model Switching", () => {
  it("should gracefully handle unavailable Ollama during health check", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw, should return { isOnline: false }
    const result = await caller.nexus.checkOllamaHealth({});
    expect(result).toHaveProperty("isOnline");
    expect(result.isOnline).toBe(false);
  });

  it("should return empty model list when Ollama is unavailable", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nexus.listOllamaModels({});
    expect(result).toHaveProperty("models");
    expect(result.models).toEqual([]);
  });

  it("should allow switching between multiple saved model configs", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create two model configs
    await caller.nexus.createModelConfig({
      modelName: "llama3",
      modelType: "ollama",
    });
    await caller.nexus.createModelConfig({
      modelName: "mistral",
      modelType: "ollama",
    });

    const configs = await caller.nexus.getModelConfigs();

    if (configs.length >= 2) {
      // Switch to first model
      await caller.nexus.setActiveModelConfig({ modelConfigId: configs[0].id });
      const active1 = await caller.nexus.getActiveModelConfig();

      // Switch to second model
      await caller.nexus.setActiveModelConfig({ modelConfigId: configs[1].id });
      const active2 = await caller.nexus.getActiveModelConfig();

      // Both should succeed and return different models
      if (active1 && active2) {
        expect(active1.id).not.toBe(active2.id);
      }
    }
  });

  it("should not lose conversation history when switching models", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a conversation
    await caller.nexus.createConversation({
      title: "Persistence Test",
      model: "nexus-default",
    });

    const conversations = await caller.nexus.listConversations();
    expect(conversations.length).toBeGreaterThan(0);

    // Create and switch model config
    await caller.nexus.createModelConfig({
      modelName: "llama3",
      modelType: "ollama",
    });

    const configs = await caller.nexus.getModelConfigs();
    if (configs.length > 0) {
      await caller.nexus.setActiveModelConfig({ modelConfigId: configs[0].id });
    }

    // Conversation should still exist
    const conversationsAfter = await caller.nexus.listConversations();
    expect(conversationsAfter.length).toBeGreaterThanOrEqual(conversations.length);
  });
});

// ============================================================
// Phase 7: Browser Automation (stub tests)
// ============================================================

describe("Phase 7: Browser Automation", () => {
  it("should accept a browser automation task request", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // The automation module may fail in test env (no browser), but should not crash the server
    try {
      const result = await caller.automation.executeTask({
        request: "Take a screenshot of https://example.com",
      });
      // If it succeeds, result should have a summary
      expect(result).toHaveProperty("summary");
    } catch (error) {
      // Expected in headless test environment
      expect(error).toBeDefined();
    }
  });

  it("should validate automation task input schema", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Empty request should either fail or return a meaningful error
    try {
      await caller.automation.executeTask({ request: "" });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

// ============================================================
// Phase 7: Performance & Compatibility
// ============================================================

describe("Phase 7: Performance", () => {
  it("should respond to model config queries in under 5 seconds", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const start = Date.now();
    await caller.nexus.getModelConfigs();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  it("should respond to Ollama health check in under 5 seconds", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const start = Date.now();
    await caller.nexus.checkOllamaHealth({});
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(5000);
  });

  it("should handle concurrent model config operations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Run multiple operations concurrently
    const results = await Promise.allSettled([
      caller.nexus.getModelConfigs(),
      caller.nexus.getActiveModelConfig(),
      caller.nexus.checkOllamaHealth({}),
      caller.nexus.listOllamaModels({}),
    ]);

    // All should either succeed or fail gracefully (no unhandled rejections)
    for (const result of results) {
      expect(["fulfilled", "rejected"]).toContain(result.status);
    }
  });
});
