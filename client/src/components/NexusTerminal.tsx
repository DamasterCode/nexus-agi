/* NexusTerminal.tsx
   Terminal interface for Nexus sandbox environment
*/
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Terminal, Trash2, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface TerminalLine {
  type: "command" | "output" | "error" | "info";
  content: string;
  timestamp: Date;
}

export default function NexusTerminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "info",
      content: "Nexus Terminal v1.0 - Virtual Sandbox Environment",
      timestamp: new Date(),
    },
    {
      type: "info",
      content: "Type 'help' for available commands",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentDir, setCurrentDir] = useState("/home/ubuntu/nexus-sandbox");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  const executeCommandMutation = trpc.nexus.executeCommand.useMutation();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim()) return;

    setIsExecuting(true);
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    // Add command to output
    setLines(prev => [...prev, { type: "command", content: `$ ${cmd}`, timestamp: new Date() }]);

    try {
      // Handle built-in commands
      if (cmd === "help") {
        const helpText = `
Available Commands:
  ls, dir          - List directory contents
  pwd              - Print working directory
  cd <path>        - Change directory
  cat <file>       - Read file contents
  echo <text>      - Print text
  mkdir <dir>      - Create directory
  rm <path>        - Delete file or directory
  clear            - Clear terminal
  help             - Show this help message
  whoami           - Show current user
  date             - Show current date/time
  node <file>      - Execute Node.js file
  npm <cmd>        - Run npm command
  git <cmd>        - Run git command
`;
        setLines(prev => [...prev, { type: "info", content: helpText, timestamp: new Date() }]);
      } else if (cmd === "clear") {
        setLines([]);
      } else if (cmd === "pwd") {
        setLines(prev => [...prev, { type: "output", content: currentDir, timestamp: new Date() }]);
      } else if (cmd.startsWith("cd ")) {
        const newDir = cmd.substring(3).trim();
        setCurrentDir(newDir);
        setLines(prev => [...prev, { type: "info", content: `Changed directory to ${newDir}`, timestamp: new Date() }]);
      } else if (cmd === "ls" || cmd === "dir") {
        try {
          const result = await executeCommandMutation.mutateAsync({
            command: "ls -lah",
            workingDir: currentDir,
          });
          if (result.success) {
            setLines(prev => [...prev, { type: "output", content: result.output, timestamp: new Date() }]);
          } else {
            setLines(prev => [...prev, { type: "error", content: `Error: ${result.error}`, timestamp: new Date() }]);
          }
        } catch (error) {
          setLines(prev => [...prev, { type: "error", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: new Date() }]);
        }
      } else if (cmd === "whoami") {
        setLines(prev => [...prev, { type: "output", content: "nexus", timestamp: new Date() }]);
      } else if (cmd === "date") {
        setLines(prev => [...prev, { type: "output", content: new Date().toString(), timestamp: new Date() }]);
      } else {
        // Execute system command
        const result = await executeCommandMutation.mutateAsync({
          command: cmd,
          workingDir: currentDir,
        });

        if (result.success) {
          setLines(prev => [...prev, { type: "output", content: result.output || "(no output)", timestamp: new Date() }]);
        } else {
          setLines(prev => [...prev, { type: "error", content: `Error: ${result.error}`, timestamp: new Date() }]);
        }
      }
    } catch (error) {
      setLines(prev => [...prev, { type: "error", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`, timestamp: new Date() }]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommand(input);
      setInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const newIndex = historyIndex + 1;
      if (newIndex < commandHistory.length) {
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const getLineColor = (type: string) => {
    switch (type) {
      case "command":
        return "text-cyan-400";
      case "output":
        return "text-metal-silver";
      case "error":
        return "text-red-400";
      case "info":
        return "text-yellow-400";
      default:
        return "text-metal-silver";
    }
  };

  return (
    <div className="h-full flex flex-col bg-void-3 border border-cyan-400/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-void-2 border-b border-cyan-400/20 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-semibold text-cyan-400">Nexus Terminal</span>
          <span className="text-xs text-metal-silver/60 ml-4">{currentDir}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setLines([])}
            variant="ghost"
            size="sm"
            className="text-metal-silver/60 hover:text-cyan-400"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Terminal output */}
      <ScrollArea className="flex-1 p-4 font-mono text-sm">
        <div className="space-y-1">
          {lines.map((line, idx) => (
            <div key={idx} className={`${getLineColor(line.type)} whitespace-pre-wrap break-words`}>
              {line.content}
            </div>
          ))}
          {isExecuting && (
            <div className="flex items-center gap-2 text-cyan-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Executing...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t border-cyan-400/20 bg-void-2 p-3 flex gap-2">
        <span className="text-cyan-400 font-mono">$</span>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          disabled={isExecuting}
          className="flex-1 bg-void-3 border-0 text-metal-silver placeholder-metal-silver/40 focus:ring-0 font-mono text-sm"
        />
      </div>
    </div>
  );
}
