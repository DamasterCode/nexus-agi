/* NexusSimple.tsx
   Clean Nexus AI Assistant with terminal sandbox access
*/
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Send, Terminal } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import NexusAvatar from "@/components/NexusAvatar";
import ParticleField from "@/components/ParticleField";

interface Response {
  text: string;
  isCode?: boolean;
  codeLanguage?: string;
  codeOutput?: string;
}

interface TerminalLine {
  type: "command" | "output" | "error" | "info";
  content: string;
}

export default function NexusSimple() {
  const { user, logout, loading: authLoading } = useAuth();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "info", content: "Nexus Terminal - Type 'help' for commands" },
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const responseEndRef = useRef<HTMLDivElement>(null);

  const createConvMutation = trpc.nexus.createConversation.useMutation();
  const sendMessageMutation = trpc.nexus.sendMessage.useMutation();
  const executeCommandMutation = trpc.nexus.executeCommand.useMutation();

  useEffect(() => {
    if (user && !currentConversationId) {
      createConvMutation.mutate(
        {
          title: `Chat with ${user.name || "Jeffrey"}`,
          model: "qwen3.5-9b",
          uncensoredMode: false,
        },
        {
          onSuccess: () => {
            setCurrentConversationId(1);
          },
          onError: (error) => {
            console.error("Failed to create conversation:", error);
            setCurrentConversationId(1);
          },
        }
      );
    }
  }, [user, currentConversationId, createConvMutation]);

  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversationId || isThinking) return;

    const userMessage = input;
    setInput("");
    setIsThinking(true);

    setResponses(prev => [...prev, { text: userMessage, isCode: false }]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        message: userMessage,
      });

      setResponses(prev => [...prev, { text: response.response, isCode: false }]);
    } catch (error) {
      setResponses(prev => [...prev, { text: "Sorry, I encountered an error.", isCode: false }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput.trim()) return;

    const cmd = terminalInput;
    setTerminalInput("");
    setTerminalLines(prev => [...prev, { type: "command", content: `$ ${cmd}` }]);

    try {
      const result = await executeCommandMutation.mutateAsync({
        command: cmd,
      });

      if (result.success) {
        setTerminalLines(prev => [...prev, { type: "output", content: result.output || "(no output)" }]);
      } else {
        setTerminalLines(prev => [...prev, { type: "error", content: `Error: ${result.error}` }]);
      }
    } catch (error) {
      setTerminalLines(prev => [...prev, { type: "error", content: `Error: ${error instanceof Error ? error.message : "Unknown error"}` }]);
    }
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-void text-metal-silver overflow-hidden flex flex-col">
      <ParticleField />

      {/* Header */}
      <div className="relative z-20 border-b border-cyan-400/20 bg-void-2/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-glow-blue">NEXUS</h1>
          <p className="text-xs text-metal-silver/60">Your AI Assistant - Master: {user?.name}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowTerminal(!showTerminal)}
            variant="outline"
            className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
          >
            <Terminal className="w-4 h-4 mr-2" />
            {showTerminal ? "Chat" : "Terminal"}
          </Button>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-metal-silver hover:text-cyan-400"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left: Avatar */}
        <div className="hidden lg:flex flex-col w-1/3 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6">
          <NexusAvatar isThinking={isThinking} isListening={false} />
          <div className="mt-6 text-center space-y-2">
            <h2 className="text-lg font-semibold text-cyan-400">Nexus</h2>
            <p className="text-xs text-metal-silver/60">Advanced AI Assistant</p>
            <div className="pt-4 flex justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-yellow-400 animate-pulse" : "bg-cyan-400"}`} />
              <span className="text-xs text-cyan-400">{isThinking ? "Thinking..." : "Ready"}</span>
            </div>
          </div>
        </div>

        {/* Right: Chat or Terminal */}
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm overflow-hidden flex flex-col">
          {!showTerminal ? (
            <>
              {/* Chat responses */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {responses.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <p className="text-metal-silver/60 text-sm">Start a conversation with Nexus</p>
                      <p className="text-metal-silver/40 text-xs mt-2">Ask for help, code, or anything else</p>
                    </div>
                  </div>
                ) : (
                  responses.map((response, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-metal-silver text-sm leading-relaxed">
                        <Streamdown>{response.text}</Streamdown>
                      </div>
                    </div>
                  ))
                )}
                {isThinking && (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Nexus is thinking...</span>
                  </div>
                )}
                <div ref={responseEndRef} />
              </div>

              {/* Chat input */}
              <div className="border-t border-cyan-400/20 p-4 bg-void-2/50 flex gap-3">
                <Input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && !isThinking && handleSendMessage()}
                  placeholder="Talk to Nexus..."
                  disabled={isThinking || !currentConversationId}
                  className="flex-1 bg-void-3 border-cyan-400/30 text-metal-silver placeholder-metal-silver/40"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isThinking || !input.trim() || !currentConversationId}
                  className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Terminal output */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1 bg-void-3">
                {terminalLines.map((line, idx) => {
                  const colorClass = {
                    command: "text-cyan-400",
                    output: "text-metal-silver",
                    error: "text-red-400",
                    info: "text-yellow-400",
                  }[line.type];
                  return (
                    <div key={idx} className={colorClass}>
                      {line.content}
                    </div>
                  );
                })}
              </div>

              {/* Terminal input */}
              <div className="border-t border-cyan-400/20 p-3 bg-void-2/50 flex gap-2">
                <span className="text-cyan-400 font-mono">$</span>
                <Input
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  onKeyPress={e => e.key === "Enter" && handleTerminalCommand()}
                  placeholder="Enter command..."
                  className="flex-1 bg-void-3 border-0 text-metal-silver placeholder-metal-silver/40 focus:ring-0 font-mono text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
