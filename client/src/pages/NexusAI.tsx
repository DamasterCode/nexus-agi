/* NexusAI.tsx
   Enhanced Nexus with real AI responses, context awareness, voice recognition, and text-to-speech
*/
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, LogOut, Send, Terminal, Zap, Copy, Check, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Streamdown } from "streamdown";
import { trpc } from "@/lib/trpc";
import NexusAvatar from "@/components/NexusAvatar";
import ParticleField from "@/components/ParticleField";
import VoiceWaveform from "@/components/VoiceWaveform";
import VoiceSettings from "@/components/VoiceSettings";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
  isCode?: boolean;
  codeLanguage?: string;
}

interface TerminalLine {
  type: "command" | "output" | "error" | "info";
  content: string;
}

export default function NexusAI() {
  const { user, logout, loading: authLoading } = useAuth();
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { type: "info", content: "Nexus Terminal - Type 'help' for commands" },
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice recognition and text-to-speech
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported,
  } = useVoiceRecognition({ language: "en-US", continuous: false });

  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isTTSSupported,
  } = useTextToSpeech({ rate: speechRate, pitch: 1, volume: volume, language: voiceLanguage });

  const createConvMutation = trpc.nexus.createConversation.useMutation();
  const sendMessageMutation = trpc.nexus.sendMessage.useMutation();
  const executeCommandMutation = trpc.nexus.executeCommand.useMutation();

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening) {
      setInput(transcript);
      resetTranscript();
    }
  }, [transcript, isListening, resetTranscript]);

  // Initialize conversation
  useEffect(() => {
    if (user && !initialized) {
      setInitialized(true);
      
      // Show welcome message immediately
      const welcomeText = `Hello ${user.name}! I'm Nexus, your advanced AI assistant. I can help you with:

• **Answering questions** - Ask me anything
• **Writing code** - I'll help with programming  
• **Analyzing problems** - Let's think through challenges
• **Terminal access** - Execute commands in my sandbox
• **Learning** - I improve from our conversations

What can I help you with today?`;

      setMessages([{
        id: "welcome",
        text: welcomeText,
        role: "assistant",
        timestamp: new Date(),
      }]);
      
      // Create conversation in background
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
  }, [user, initialized, createConvMutation]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !currentConversationId || isThinking) return;

    const userMessage = input;
    const messageId = Math.random().toString(36).substring(7);
    
    // Add user message
    setMessages(prev => [...prev, {
      id: messageId,
      text: userMessage,
      role: "user",
      timestamp: new Date(),
    }]);

    setInput("");
    setIsThinking(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        conversationId: currentConversationId,
        message: userMessage,
      });

      // Add assistant response
      const assistantId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, {
        id: assistantId,
        text: response.response,
        role: "assistant",
        timestamp: new Date(),
      }]);

      // Auto-speak response if enabled
      if (autoSpeak && isTTSSupported) {
        speak(response.response);
      }
    } catch (error) {
      const errorId = Math.random().toString(36).substring(7);
      setMessages(prev => [...prev, {
        id: errorId,
        text: "I encountered an error processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
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

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen bg-void flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto" />
          <p className="text-cyan-400 text-lg">Initializing Nexus...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-void text-metal-silver overflow-hidden flex flex-col">
      <ParticleField />

      {/* Header */}
      <div className="relative z-20 border-b border-cyan-400/20 bg-void-2/50 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h1 className="text-2xl font-bold text-glow-blue">NEXUS</h1>
            <p className="text-xs text-metal-silver/60">Master: {user?.name}</p>
          </div>
        </div>
        <div className="flex gap-3">
          {isTTSSupported && (
            <>
              <VoiceSettings
                language={voiceLanguage}
                speechRate={speechRate}
                volume={volume}
                onLanguageChange={setVoiceLanguage}
                onSpeechRateChange={setSpeechRate}
                onVolumeChange={setVolume}
              />
              <Button
                onClick={() => {
                  setAutoSpeak(!autoSpeak);
                  if (isSpeaking) stopSpeaking();
                }}
                variant="outline"
                className={`border-cyan-400/30 transition-all ${
                  autoSpeak ? "text-cyan-400 bg-cyan-400/10" : "text-metal-silver/60"
                }`}
                title={autoSpeak ? "Auto-speak enabled" : "Auto-speak disabled"}
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </>
          )}
          <Button
            onClick={() => setShowTerminal(!showTerminal)}
            variant="outline"
            className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-all"
          >
            <Terminal className="w-4 h-4 mr-2" />
            {showTerminal ? "Chat" : "Terminal"}
          </Button>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="text-metal-silver hover:text-cyan-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left: Avatar Panel */}
        <div className="hidden lg:flex flex-col w-1/3 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm p-6 overflow-hidden">
          <NexusAvatar isThinking={isThinking} isListening={isListening} />
          <div className="mt-6 text-center space-y-3 animate-fade-in">
            <h2 className="text-lg font-semibold text-cyan-400">Nexus AI</h2>
            <p className="text-xs text-metal-silver/60">Advanced Conversational Assistant</p>
            
            {/* Status indicators */}
            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isThinking ? "bg-yellow-400 animate-pulse" : isListening ? "bg-red-400 animate-pulse" : "bg-cyan-400"}`} />
                <span className="text-xs text-cyan-400">
                  {isThinking ? "Thinking..." : isListening ? "Listening..." : "Ready"}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-metal-silver/60">
                <Zap className="w-3 h-3" />
                <span>Context Aware</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="pt-4 border-t border-cyan-400/20 space-y-2 text-xs">
              <div className="flex justify-between text-metal-silver/60">
                <span>Messages:</span>
                <span className="text-cyan-400">{messages.length}</span>
              </div>
              <div className="flex justify-between text-metal-silver/60">
                <span>Conversation:</span>
                <span className="text-cyan-400">{currentConversationId || "Init..."}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chat or Terminal */}
        <div className="flex-1 rounded-lg border border-cyan-400/20 bg-void-2/50 backdrop-blur-sm overflow-hidden flex flex-col">
          {!showTerminal ? (
            <>
              {/* Messages area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 animate-fade-in-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div
                      className={`max-w-md lg:max-w-lg px-4 py-3 rounded-lg border transition-all hover:border-cyan-400/60 ${
                        msg.role === "user"
                          ? "bg-cyan-600/20 border-cyan-400/30 text-metal-silver"
                          : "bg-void-3 border-cyan-400/20 text-metal-silver"
                      }`}
                    >
                      <div className="text-sm leading-relaxed">
                        <Streamdown>{msg.text}</Streamdown>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-cyan-400/10">
                        <span className="text-xs text-metal-silver/40">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                        {msg.role === "assistant" && (
                          <div className="flex gap-2">
                            {isTTSSupported && (
                              <Button
                                onClick={() => speak(msg.text)}
                                size="sm"
                                variant="ghost"
                                className="h-6 px-2 text-xs text-metal-silver/60 hover:text-cyan-400"
                              >
                                <Volume2 className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              onClick={() => copyToClipboard(msg.id, msg.text)}
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-metal-silver/60 hover:text-cyan-400"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex gap-4 animate-fade-in-up">
                    <div className="bg-void-3 border border-cyan-400/20 rounded-lg px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                      <span className="text-sm text-cyan-400">Nexus is thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Voice waveform */}
              {(isListening || isSpeaking) && (
                <div className="px-6 pb-4">
                  <VoiceWaveform isListening={isListening} isSpeaking={isSpeaking} />
                </div>
              )}

              {/* Input area */}
              <div className="border-t border-cyan-400/20 p-4 bg-void-2/50 space-y-3">
                {isListening && (
                  <div className="text-sm text-cyan-400 text-center">
                    {interimTranscript || "Listening..."}
                  </div>
                )}
                <div className="flex gap-3">
                  {isVoiceSupported && (
                    <Button
                      onClick={handleVoiceInput}
                      disabled={isThinking}
                      className={`transition-all ${
                        isListening
                          ? "bg-red-600 hover:bg-red-500"
                          : "bg-cyan-600 hover:bg-cyan-500"
                      } text-black font-semibold px-4`}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === "Enter" && !isThinking && handleSendMessage()}
                    placeholder="Ask Nexus anything..."
                    disabled={isThinking || !currentConversationId}
                    className="flex-1 bg-void-3 border-cyan-400/30 text-metal-silver placeholder-metal-silver/40 focus:border-cyan-400/60 focus:ring-cyan-400/30 transition-all"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isThinking || !input.trim() || !currentConversationId}
                    className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold px-6 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-metal-silver/40 flex items-center gap-2">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>Context-aware responses • Voice & text input • Real-time processing</span>
                </div>
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
                    <div key={idx} className={`${colorClass} animate-fade-in`}>
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
