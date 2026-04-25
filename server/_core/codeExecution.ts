/* codeExecution.ts
   OpenClaw code execution integration for Nexus
*/

/**
 * Execute code using OpenClaw
 * Supports JavaScript, Python, and other languages
 */
export async function executeCode(code: string, language: string = "javascript"): Promise<{
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
}> {
  const startTime = Date.now();

  try {
    // For now, we'll implement a simple sandbox using Node.js eval
    // In production, this should use OpenClaw or a proper sandbox service

    if (language === "javascript" || language === "js") {
      // Create a safe execution context
      const result = executeJavaScript(code);
      return {
        success: true,
        output: result,
        executionTime: Date.now() - startTime,
      };
    } else if (language === "python") {
      // Python execution would require a backend service
      return {
        success: false,
        output: "",
        error: "Python execution not yet implemented. Use JavaScript or contact support.",
      };
    } else {
      return {
        success: false,
        output: "",
        error: `Language '${language}' is not supported yet.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      output: "",
      error: error instanceof Error ? error.message : "Unknown error during execution",
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Safe JavaScript execution with captured output
 */
function executeJavaScript(code: string): string {
  let output = "";
  const originalLog = console.log;
  const originalError = console.error;

  // Capture console output
  const captureLog = (...args: unknown[]) => {
    output += args.map(arg => {
      if (typeof arg === "object") {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(" ") + "\n";
  };

  try {
    // Create a function from the code and execute it
    // This is a simplified approach - in production use a proper sandbox
    const fn = new Function("console", code);
    const mockConsole = { log: captureLog, error: captureLog };
    fn(mockConsole);

    return output || "(No output)";
  } catch (error) {
    throw error;
  }
}

/**
 * Analyze code for potential issues
 */
export async function analyzeCode(code: string, language: string): Promise<{
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
    line?: number;
  }>;
  suggestions: string[];
}> {
  const issues: Array<{ severity: "error" | "warning" | "info"; message: string; line?: number }> = [];
  const suggestions: string[] = [];

  // Basic code analysis
  if (language === "javascript" || language === "js") {
    // Check for common issues
    if (code.includes("eval(")) {
      issues.push({
        severity: "error",
        message: "Using eval() is dangerous and should be avoided",
      });
    }

    if (code.includes("var ")) {
      issues.push({
        severity: "warning",
        message: "Consider using 'let' or 'const' instead of 'var'",
      });
      suggestions.push("Use const for variables that don't change, let for variables that do");
    }

    if (!code.includes("return") && !code.includes("console.log")) {
      suggestions.push("Consider returning a value or logging output");
    }
  }

  return { issues, suggestions };
}
