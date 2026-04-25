/* Nexus.tsx
   Minimal Nexus AI Assistant - Voice-like conversational interface
   Features: Avatar, text input, voice-like responses, OpenClaw code execution
*/
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Mic, MicOff, Code2, Play } from "lucide-react";
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

export default function Nexus() {
  const { user, logout, loading: authLoading } = useAuth();
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [responses, setResponses] = useState<Response[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const responseEndRef = useRef<HTMLDivElement>(null);

  // Create new conversation on load
  const createConvMutation = trpc.nexus.createConversation.useMutation();
  const sendMessageMutation = trpc.nexus.sendMessage.useMutation();

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
            // For now, use a placeholder ID - in production, return actual ID from mutation
            setCurrentConversationId(1);
          },
        }
      );
    }
  }, [user, currentConversationId, createConvMutation]);

  // Auto-scroll to latest response
  useEffect(() => {
    responseEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [responses]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversationId || isThinking) return;

    const userMessage = input;
    setInput("");
    setIsThinking(true);
    setIsListening(false);

    // Add user response to display
    setResponses(prev => [...prev, { text: userMessage, isCode: false }]);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        message: userMessage,
      });

      // Parse response for code blocks
      const responseText = response.response;
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
      const matches = Array.from(responseText.matchAll(codeBlockRegex));

      if (matches.length > 0) {
        // Has code blocks
        let lastIndex = 0;
        matches.forEach(match => {
          const beforeCode = responseText.substring(lastIndex, match.index);
          if (beforeCode.trim()) {
            setResponses(prev => [...prev, { text: beforeCode, isCode: false }]);
          }

          setResponses(prev => [...prev, {
            text: match[2],
            isCode: true,
            codeLanguage: match[1] || "javascript",
            codeOutput: "",
          }]);

          lastIndex = match.index! + match[0].length;
        });

        const afterCode = responseText.substring(lastIndex);
        if (afterCode.trim()) {
          setResponses(prev => [...prev, { text: afterCode, isCode: false }]);
        }
      } else {
        // No code blocks, just text
        setResponses(prev => [...prev, { text: responseText, isCode: false }]);
      }
    } catch (error) {
      console.error("Error:", error);
      setResponses(prev => [...prev, { text: "Sorry, I encountered an error. Please try again.", isCode: false }]);
    } finally {
      setIsThinking(false);
    }
  };

  const executeCodeMutation = trpc.nexus.executeCode.useMutation();

  const handleExecuteCode = async (code: string, language: string, index: number) => {
    try {
      const result = await executeCodeMutation.mutateAsync({
        code,
        language,
      });

      const output = result.success
        ? result.output
        : `Error: ${result.error}`;

      setResponses(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].codeOutput = output;
        }
        return updated;
      });
    } catch (error) {
      console.error("Code execution error:", error);
      setResponses(prev => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index].codeOutput = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
        }
        return updated;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <p className="text-metal-silver">Please log in to access Nexus</p>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-void text-metal-silver overflow-hidden flex flex-col">
      <ParticleField />

      {/* Header */}
      <div className="relative z-20 border-b border-cyan-400/20 bg-void-2/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-glow-blue">NEXUS</h1>
            <p className="text-xs text-metal-silver/60">Your AI Assistant</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-metal-silver">{user.name || "User"}</p>
              <p className="text-xs text-metal-silver/60">{user.email}</p>
            </div>
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="text-metal-silver hover:text-cyan-400 hover:bg-cyan-400/10"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left: Avatar Panel */}
        <div className="hidden lg:flex flex-col w-1/3 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6 overflow-hidden">
          <NexusAvatar isThinking={isThinking} isListening={isListening} />
          <div className="mt-6 text-center space-y-2">
            <h2 className="text-lg font-semibold text-cyan-400">Nexus</h2>
            <p className="text-xs text-metal-silver/60">Advanced AI Assistant</p>
            <div className="pt-4 flex justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-yellow-400 animate-pulse" : "bg-cyan-400"}`} />
              <span className="text-xs text-cyan-400">{isThinking ? "Thinking..." : "Ready"}</span>
            </div>
          </div>
        </div>

        {/* Right: Conversation Panel */}
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm overflow-hidden flex flex-col">
          {/* Responses area */}
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
                <div key={idx} className="space-y-2 animate-fade-in-up">
                  {response.isCode ? (
                    <div className="bg-void-3 border border-cyan-400/30 rounded-lg overflow-hidden">
                      <div className="bg-void-3/50 px-4 py-2 flex items-center justify-between border-b border-cyan-400/20">
                        <span className="text-xs text-cyan-400 font-mono">{response.codeLanguage}</span>
                        <Button
                          onClick={() => handleExecuteCode(response.text, response.codeLanguage || "javascript", idx)}
                          size="sm"
                          className="bg-cyan-600 hover:bg-cyan-500 text-black text-xs h-7"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Execute
                        </Button>
                      </div>
                      <pre className="p-4 text-xs text-metal-silver overflow-x-auto font-mono">
                        <code>{response.text}</code>
                      </pre>
                      {response.codeOutput && (
                        <div className="bg-green-900/20 border-t border-green-400/30 px-4 py-3">
                          <p className="text-xs text-green-300 font-mono">{response.codeOutput}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-metal-silver text-sm leading-relaxed">
                      <Streamdown>{response.text}</Streamdown>
                    </div>
                  )}
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

          {/* Input area */}
          <div className="border-t border-cyan-400/20 p-4 bg-void-2/50 backdrop-blur-sm">
            <div className="flex gap-3 items-end">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && !isThinking && handleSendMessage()}
                placeholder="Talk to Nexus..."
                disabled={isThinking || !currentConversationId}
                className="flex-1 bg-void-3 border-cyan-400/30 text-metal-silver placeholder-metal-silver/40 focus:border-cyan-400/60 focus:ring-cyan-400/30"
              />
              <Button
                onClick={() => setIsListening(!isListening)}
                variant="outline"
                size="icon"
                className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isThinking || !input.trim() || !currentConversationId}
                className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold px-6"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
