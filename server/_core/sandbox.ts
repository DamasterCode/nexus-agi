/* sandbox.ts
   Virtual sandbox environment for Nexus with terminal access
*/
import { execSync, spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";

const SANDBOX_ROOT = "/home/ubuntu/nexus-sandbox";
const MAX_OUTPUT_SIZE = 50000; // 50KB max output

/**
 * Initialize Nexus sandbox environment
 */
export async function initializeSandbox(): Promise<void> {
  try {
    await fs.mkdir(SANDBOX_ROOT, { recursive: true });
    await fs.mkdir(path.join(SANDBOX_ROOT, "projects"), { recursive: true });
    await fs.mkdir(path.join(SANDBOX_ROOT, "scripts"), { recursive: true });
    await fs.mkdir(path.join(SANDBOX_ROOT, "data"), { recursive: true });
  } catch (error) {
    console.error("Failed to initialize sandbox:", error);
  }
}

/**
 * Execute shell command in sandbox
 */
export async function executeCommand(
  command: string,
  workingDir: string = SANDBOX_ROOT,
  timeout: number = 30000
): Promise<{
  success: boolean;
  output: string;
  error?: string;
  exitCode?: number;
  executionTime: number;
}> {
  const startTime = Date.now();

  try {
    // Validate working directory is within sandbox
    const resolvedDir = path.resolve(workingDir);
    if (!resolvedDir.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: directory outside sandbox");
    }

    // Execute command with timeout
    const output = execSync(command, {
      cwd: resolvedDir,
      timeout,
      maxBuffer: MAX_OUTPUT_SIZE,
      encoding: "utf-8",
    });

    return {
      success: true,
      output: output.trim(),
      executionTime: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      output: "",
      error: errorMessage,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * List files in directory
 */
export async function listDirectory(dirPath: string = SANDBOX_ROOT): Promise<{
  success: boolean;
  files: Array<{
    name: string;
    type: "file" | "directory";
    size?: number;
    modified?: string;
  }>;
  error?: string;
}> {
  try {
    const resolvedPath = path.resolve(dirPath);
    if (!resolvedPath.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: directory outside sandbox");
    }

    const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(resolvedPath, entry.name);
        const stats = await fs.stat(fullPath);
        return {
          name: entry.name,
          type: entry.isDirectory() ? ("directory" as const) : ("file" as const),
          size: entry.isFile() ? stats.size : undefined,
          modified: stats.mtime.toISOString(),
        };
      })
    );

    return { success: true, files };
  } catch (error) {
    return {
      success: false,
      files: [],
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Read file contents
 */
export async function readFile(filePath: string): Promise<{
  success: boolean;
  content?: string;
  error?: string;
}> {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: file outside sandbox");
    }

    const content = await fs.readFile(resolvedPath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Write file contents
 */
export async function writeFile(filePath: string, content: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: file outside sandbox");
    }

    // Ensure directory exists
    const dir = path.dirname(resolvedPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(resolvedPath, content, "utf-8");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Delete file or directory
 */
export async function deleteFile(filePath: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: file outside sandbox");
    }

    const stats = await fs.stat(resolvedPath);
    if (stats.isDirectory()) {
      await fs.rm(resolvedPath, { recursive: true, force: true });
    } else {
      await fs.unlink(resolvedPath);
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get file/directory info
 */
export async function getFileInfo(filePath: string): Promise<{
  success: boolean;
  info?: {
    path: string;
    type: "file" | "directory";
    size: number;
    created: string;
    modified: string;
    permissions: string;
  };
  error?: string;
}> {
  try {
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(SANDBOX_ROOT)) {
      throw new Error("Access denied: file outside sandbox");
    }

    const stats = await fs.stat(resolvedPath);
    return {
      success: true,
      info: {
        path: resolvedPath,
        type: stats.isDirectory() ? "directory" : "file",
        size: stats.size,
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        permissions: stats.mode.toString(8),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get sandbox statistics
 */
export async function getSandboxStats(): Promise<{
  rootPath: string;
  diskUsage?: {
    used: string;
    available: string;
  };
}> {
  try {
    const result = await executeCommand("du -sh . && df -h .", SANDBOX_ROOT);
    return {
      rootPath: SANDBOX_ROOT,
      diskUsage: result.success ? { used: result.output.split("\n")[0], available: result.output.split("\n")[1] } : undefined,
    };
  } catch (error) {
    return { rootPath: SANDBOX_ROOT };
  }
}

// Initialize sandbox on module load
initializeSandbox().catch(console.error);
