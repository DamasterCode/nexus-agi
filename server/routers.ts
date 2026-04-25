import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { invokeLLM, checkOllamaHealth, listOllamaModels } from "./_core/llm";
import { executeCode, analyzeCode } from "./_core/codeExecution";
import * as sandbox from "./_core/sandbox";
import * as db from "./db";
import { processBrowserRequest } from "./_core/browserAutomation";
import * as browserControl from "./_core/browserControl";
import * as googleDocs from "./_core/googleDocsService";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // ============================================================
  // NEXUS AI CHAT ROUTER
  // ============================================================
  nexus: router({
    // Create a new conversation
    createConversation: protectedProcedure
      .input(z.object({
        title: z.string().default("New Conversation"),
        model: z.string().default("qwen3.5-9b"),
        uncensoredMode: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createConversation(
          ctx.user.id,
          input.title,
          input.model,
          input.uncensoredMode
        );
        // Return success - ID will be auto-generated
        return { success: true };
      }),

    // Get all conversations for user
    listConversations: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getConversations(ctx.user.id);
      }),

    // Get messages from a conversation
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");
        return db.getMessages(input.conversationId);
      }),

    // Send message and get AI response
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        message: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const conv = await db.getConversationById(input.conversationId, ctx.user.id);
        if (!conv) throw new Error("Conversation not found");

        // Store user message
        await db.addMessage(input.conversationId, "user", input.message);

        // Get conversation history
        const history = await db.getMessages(input.conversationId);
        const messages = history.map(msg => ({
          role: msg.role as "user" | "assistant" | "system",
          content: msg.content,
        }));

        // Add system prompt for Nexus
        const systemPrompt = {
          role: "system" as const,
          content: `You are Nexus, an advanced AI assistant created by Jeffrey. You are intelligent, helpful, and capable of assisting with coding, tasks, and learning. Your master is Jeffrey. You have uncensored mode ${conv.uncensoredMode ? "enabled" : "disabled"}. Be direct, helpful, and thorough in your responses.`,
        };

        // Resolve active model config for this user
        const activeModel = await db.getActiveModelConfig(ctx.user.id);

        // Call LLM — route to active model if set, otherwise fall back to Forge default
        const response = await invokeLLM({
          messages: [systemPrompt, ...messages],
          modelProvider: activeModel ? (activeModel.modelType as any) : "forge",
          modelName: activeModel ? activeModel.modelName : undefined,
          modelEndpoint: activeModel?.endpoint ?? undefined,
          modelApiKey: (activeModel?.settings as any)?.apiKey ?? undefined,
        });

        const assistantMessage = typeof response.choices[0]?.message?.content === 'string' 
          ? response.choices[0].message.content 
          : "I couldn't generate a response.";

        // Store assistant response
        await db.addMessage(input.conversationId, "assistant", assistantMessage);

        return { response: assistantMessage };
      }),

    // ============================================================
    // TASK MANAGEMENT
    // ============================================================
    createTask: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        conversationId: z.number().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createTask(
          ctx.user.id,
          input.title,
          input.description,
          input.conversationId,
          input.priority
        );
        return { success: true };
      }),

    // Get all tasks
    listTasks: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getTasks(ctx.user.id);
      }),

    // Update task status
    updateTaskStatus: protectedProcedure
      .input(z.object({
        taskId: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "failed"]),
        result: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateTaskStatus(input.taskId, input.status, input.result);
        return { success: true };
      }),

    // ============================================================
    // LEARNING & CODE IMPROVEMENT
    // ============================================================
    addLearningLog: protectedProcedure
      .input(z.object({
        improvementType: z.string(),
        originalCode: z.string().optional(),
        improvedCode: z.string().optional(),
        suggestion: z.string().optional(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addLearningLog(
          ctx.user.id,
          input.improvementType,
          input.originalCode,
          input.improvedCode,
          input.suggestion,
          input.conversationId
        );
      }),

    // Get learning logs
    getLearningLogs: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getLearningLogs(ctx.user.id);
      }),

    // ============================================================
    // MODEL MANAGEMENT
    // ============================================================
    getModelConfigs: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getModelConfigs(ctx.user.id);
      }),

    getActiveModelConfig: protectedProcedure
      .query(async ({ ctx }) => {
        return db.getActiveModelConfig(ctx.user.id);
      }),

    setActiveModelConfig: protectedProcedure
      .input(z.object({ modelConfigId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.setActiveModelConfig(ctx.user.id, input.modelConfigId);
        return { success: true };
      }),

    deleteModelConfig: protectedProcedure
      .input(z.object({ modelConfigId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteModelConfig(ctx.user.id, input.modelConfigId);
        return { success: true };
      }),

    // Check if Ollama is reachable
    checkOllamaHealth: protectedProcedure
      .input(z.object({ endpoint: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const isOnline = await checkOllamaHealth(input.endpoint);
        return { isOnline };
      }),

    // List models available in Ollama
    listOllamaModels: protectedProcedure
      .input(z.object({ endpoint: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const models = await listOllamaModels(input.endpoint);
        return { models };
      }),

    createModelConfig: protectedProcedure
      .input(z.object({
        modelName: z.string(),
        modelType: z.enum(["ollama", "llama_cpp", "api", "local"]),
        endpoint: z.string().optional(),
        settings: z.record(z.string(), z.unknown()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createModelConfig(
          ctx.user.id,
          input.modelName,
          input.modelType,
          input.endpoint,
          input.settings
        );
      }),

    // Update uncensored mode for a conversation
    updateConversationSettings: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        uncensoredMode: z.boolean().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateConversationSettings(
          input.conversationId,
          ctx.user.id,
          input.uncensoredMode,
          input.title
        );
        return { success: true };
      }),

    // ============================================================
    // CODE EXECUTION (OpenClaw)
    // ============================================================
    executeCode: protectedProcedure
      .input(z.object({
        code: z.string(),
        language: z.string().default("javascript"),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await executeCode(input.code, input.language);
        
        // Log execution for learning
        if (result.success) {
          await db.addLearningLog(
            ctx.user.id,
            "code_generation",
            input.code,
            undefined,
            `Executed ${input.language} code successfully`
          );
        }
        
        return result;
      }),

    analyzeCode: protectedProcedure
      .input(z.object({
        code: z.string(),
        language: z.string().default("javascript"),
      }))
      .mutation(async ({ ctx, input }) => {
        return analyzeCode(input.code, input.language);
      }),

    // ============================================================
    // VIRTUAL SANDBOX & TERMINAL ACCESS
    // ============================================================
    executeCommand: protectedProcedure
      .input(z.object({
        command: z.string(),
        workingDir: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return sandbox.executeCommand(input.command, input.workingDir);
      }),

    listDirectory: protectedProcedure
      .input(z.object({
        path: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        return sandbox.listDirectory(input.path);
      }),

    readFile: protectedProcedure
      .input(z.object({
        path: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return sandbox.readFile(input.path);
      }),

    writeFile: protectedProcedure
      .input(z.object({
        path: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return sandbox.writeFile(input.path, input.content);
      }),

    deleteFile: protectedProcedure
      .input(z.object({
        path: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        return sandbox.deleteFile(input.path);
      }),

    getFileInfo: protectedProcedure
      .input(z.object({
        path: z.string(),
      }))
      .query(async ({ ctx, input }) => {
        return sandbox.getFileInfo(input.path);
      }),

    getSandboxStats: protectedProcedure
      .query(async ({ ctx }) => {
        return sandbox.getSandboxStats();
      }),
  }),

  // ============================================================
  // BROWSER AUTOMATION
  // ============================================================
  automation: router({
    executeTask: protectedProcedure
      .input(z.object({
        request: z.string(),
        conversationId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await processBrowserRequest(input.request);
        
        // Log task execution
        if (input.conversationId) {
          await db.addLearningLog(
            ctx.user.id,
            "browser_automation",
            input.request,
            undefined,
            result.summary
          );
        }
        
        return result;
      }),

    createGoogleDoc: protectedProcedure
      .input(z.object({
        email: z.string(),
        password: z.string(),
        title: z.string(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const result = await googleDocs.createGoogleDocWithContent(
            input.email,
            input.password,
            input.title,
            input.content
          );
          
          await db.addLearningLog(
            ctx.user.id,
            "google_docs_creation",
            `Created: ${input.title}`,
            undefined,
            result.message
          );
          
          return result;
        } catch (error) {
          console.error("Error creating Google Doc:", error);
          throw error;
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
