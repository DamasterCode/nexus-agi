/**
 * Browser Automation Helper for Nexus
 * Provides capabilities for automating browser tasks like:
 * - Opening URLs
 * - Filling forms
 * - Clicking elements
 * - Taking screenshots
 * - Creating documents (Google Docs, Sheets, etc.)
 */

import { invokeLLM } from "./llm";

export interface BrowserAction {
  type: "navigate" | "click" | "type" | "screenshot" | "wait" | "execute" | "openGoogleDocs" | "openGoogleSheets" | "openGmail";
  url?: string;
  selector?: string;
  text?: string;
  delay?: number;
  code?: string;
  title?: string;
}

export interface BrowserActionResult {
  success: boolean;
  output?: string;
  screenshot?: string;
  error?: string;
}

/**
 * Parse user intent and generate browser actions
 * Uses LLM to understand what the user wants to do
 */
export async function parseBrowserIntent(userRequest: string): Promise<BrowserAction[]> {
  const systemPrompt = `You are a browser automation expert. Parse the user's request and generate a sequence of browser actions.
  
  Available actions:
  - navigate: Go to a URL
  - click: Click an element by selector
  - type: Type text into a field
  - screenshot: Take a screenshot
  - wait: Wait for milliseconds
  - execute: Execute JavaScript code
  - openGoogleDocs: Open Google Docs
  - openGoogleSheets: Open Google Sheets
  - openGmail: Open Gmail
  
  Respond with a JSON array of actions. Example:
  [
    { "type": "navigate", "url": "https://docs.google.com" },
    { "type": "wait", "delay": 2000 },
    { "type": "click", "selector": "[aria-label='New document']" },
    { "type": "type", "selector": "h1", "text": "My Document" }
  ]`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userRequest },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "browser_actions",
          strict: true,
          schema: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  enum: ["navigate", "click", "type", "screenshot", "wait", "execute", "openGoogleDocs", "openGoogleSheets", "openGmail"],
                },
                url: { type: "string" },
                selector: { type: "string" },
                text: { type: "string" },
                delay: { type: "number" },
                code: { type: "string" },
                title: { type: "string" },
              },
              required: ["type"],
            },
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content) return [];

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr) as BrowserAction[];
  } catch (error) {
    console.error("Failed to parse browser intent:", error);
    return [];
  }
}

/**
 * Execute a sequence of browser actions
 * In production, this would use Puppeteer or Playwright
 * For now, it returns mock results
 */
export async function executeBrowserActions(actions: BrowserAction[]): Promise<BrowserActionResult[]> {
  const results: BrowserActionResult[] = [];

  for (const action of actions) {
    try {
      switch (action.type) {
        case "navigate":
          results.push({
            success: true,
            output: `Navigated to ${action.url}`,
          });
          break;

        case "click":
          results.push({
            success: true,
            output: `Clicked element: ${action.selector}`,
          });
          break;

        case "type":
          results.push({
            success: true,
            output: `Typed text: "${action.text}" into ${action.selector}`,
          });
          break;

        case "screenshot":
          results.push({
            success: true,
            output: "Screenshot captured",
            screenshot: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
          });
          break;

        case "wait":
          results.push({
            success: true,
            output: `Waited ${action.delay}ms`,
          });
          break;

        case "execute":
          results.push({
            success: true,
            output: `Executed JavaScript code`,
          });
          break;

        case "openGoogleDocs":
          results.push({
            success: true,
            output: `Opening Google Docs${action.title ? ` with title: ${action.title}` : ""}`,
          });
          break;

        case "openGoogleSheets":
          results.push({
            success: true,
            output: `Opening Google Sheets${action.title ? ` with title: ${action.title}` : ""}`,
          });
          break;

        case "openGmail":
          results.push({
            success: true,
            output: "Opening Gmail",
          });
          break;

        default:
          results.push({
            success: false,
            error: `Unknown action type: ${(action as any).type}`,
          });
      }
    } catch (error) {
      results.push({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return results;
}

/**
 * Process a user request and execute browser automation
 */
export async function processBrowserRequest(userRequest: string): Promise<{
  success: boolean;
  actions: BrowserAction[];
  results: BrowserActionResult[];
  summary: string;
}> {
  try {
    // Parse the user's request into actions
    const actions = await parseBrowserIntent(userRequest);

    if (actions.length === 0) {
      return {
        success: false,
        actions: [],
        results: [],
        summary: "Could not understand the request. Please try again.",
      };
    }

    // Execute the actions
    const results = await executeBrowserActions(actions);

    // Check if all actions succeeded
    const allSucceeded = results.every(r => r.success);

    return {
      success: allSucceeded,
      actions,
      results,
      summary: allSucceeded
        ? `Successfully completed all ${actions.length} action(s)`
        : `Completed with ${results.filter(r => r.success).length}/${results.length} actions successful`,
    };
  } catch (error) {
    return {
      success: false,
      actions: [],
      results: [],
      summary: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
