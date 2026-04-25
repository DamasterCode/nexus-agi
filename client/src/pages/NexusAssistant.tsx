import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, MessageSquare, Volume2, VolumeX, Zap, Mic, MicOff, Terminal, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ParticleField from "@/components/ParticleField";
import VoiceWaveform from "@/components/VoiceWaveform";
import VoiceSettings from "@/components/VoiceSettings";
import ImmersiveNexusAvatar from "@/components/ImmersiveNexusAvatar";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { motion, AnimatePresence } from "framer-motion";
import { Streamdown } from "streamdown";

interface Message {
  id: string;
  text: string;
  role: "user" | "assistant";
  timestamp: Date;
}

export default function NexusAssistant() {
  const { user, logout, loading: authLoading } = useAuth();
  
  // Voice and TTS Settings
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // UI State
  const [showChat, setShowChat] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [alwaysListening, setAlwaysListening] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Voice recognition
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported: isVoiceSupported,
  } = useVoiceRecognition({ language: voiceLanguage, continuous: true });

  // Text-to-speech
  const {
    speak,
    stop: stopSpeaking,
    isSpeaking,
    isSupported: isTTSSupported,
  } = useTextToSpeech({ rate: speechRate, pitch: 1, volume: volume, language: voiceLanguage });

  // API mutations
  const executeTaskMutation = trpc.automation.executeTask.useMutation();

  // Auto-start listening
  useEffect(() => {
    if (isVoiceSupported && alwaysListening && !isListening) {
      startListening();
    }
  }, [isVoiceSupported, alwaysListening, isListening, startListening]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleCommand(transcript);
      resetTranscript();
      if (alwaysListening) {
        setTimeout(() => startListening(), 1000);
      }
    }
  }, [transcript, isListening, alwaysListening, isProcessing]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCommand = async (text: string) => {
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      text,
      role: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await executeTaskMutation.mutateAsync({ request: text });
      
      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(7),
        text: result.summary,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (autoSpeak && isTTSSupported) {
        speak(result.summary);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "I encountered an error processing that.";
      setMessages(prev => [...prev, {
        id: "err",
        text: errorMsg,
        role: "assistant",
        timestamp: new Date(),
      }]);
      if (autoSpeak) speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    handleCommand(chatInput);
    setChatInput("");
  };

  if (authLoading) {
    return (
      <div className="w-full h-screen bg-[#0a0e14] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#0a0e14] text-[#b0bec5] overflow-hidden flex flex-col font-['Space_Grotesk']">
      <ParticleField />
      
      {/* Header */}
      <header className="relative z-30 border-b border-cyan-400/20 bg-[#0f1520]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${alwaysListening ? "bg-cyan-400 shadow-[0_0_10px_rgba(0,180,255,0.8)]" : "bg-gray-600"}`} />
            {alwaysListening && <div className="absolute inset-0 w-3 h-3 rounded-full bg-cyan-400 animate-ping opacity-75" />}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tighter text-white flex items-center gap-2">
              NEXUS <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">ASSISTANT</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-cyan-400/60">Biopunk Neural Interface v4.2</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <VoiceSettings
            language={voiceLanguage}
            speechRate={speechRate}
            volume={volume}
            onLanguageChange={setVoiceLanguage}
            onSpeechRateChange={setSpeechRate}
            onVolumeChange={setVolume}
          />
          <Button
            onClick={() => setAutoSpeak(!autoSpeak)}
            variant="outline"
            size="sm"
            className={`border-cyan-400/30 ${autoSpeak ? "text-cyan-400 bg-cyan-400/10" : "text-gray-500"}`}
          >
            {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            onClick={() => setShowChat(!showChat)}
            variant="outline"
            size="sm"
            className={`border-cyan-400/30 ${showChat ? "text-cyan-400 bg-cyan-400/10" : "text-gray-500"}`}
          >
            {showChat ? <Mic className="w-4 h-4 mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
            {showChat ? "Voice Mode" : "Chatbot"}
          </Button>
          <Button onClick={logout} variant="ghost" size="sm" className="text-gray-500 hover:text-white">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="relative z-20 flex-1 flex overflow-hidden">
        {/* Left Side: Immersive Assistant (Always visible or large in voice mode) */}
        <div className={`flex-1 flex flex-col items-center justify-center transition-all duration-700 ${showChat ? "w-1/2 opacity-40 scale-90" : "w-full"}`}>
          <div className="relative w-full max-w-2xl aspect-square flex items-center justify-center">
            <ImmersiveNexusAvatar 
              isListening={isListening} 
              isThinking={isProcessing} 
              isSpeaking={isSpeaking} 
            />
            
            {/* Status Text Overlay */}
            <div className="absolute bottom-10 text-center space-y-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isProcessing ? "thinking" : isListening ? "listening" : "idle"}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-cyan-400 font-medium tracking-widest uppercase text-xs"
                >
                  {isProcessing ? "Analyzing Neural Patterns..." : isListening ? "Listening for Command..." : "System Ready"}
                </motion.div>
              </AnimatePresence>
              
              {/* Captions for voice mode */}
              {!showChat && (interimTranscript || transcript) && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="max-w-md mx-auto px-6 py-3 bg-black/40 backdrop-blur-sm border border-cyan-400/20 rounded-xl text-white text-sm italic"
                >
                  "{interimTranscript || transcript}"
                </motion.div>
              )}
            </div>
          </div>

          {/* Voice Waveform at bottom */}
          <div className="w-full max-w-md px-10 pb-10">
            <VoiceWaveform isListening={isListening} isSpeaking={isSpeaking} barCount={32} />
          </div>
        </div>

        {/* Right Side: Chatbot Panel (Slide in) */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-1/2 border-l border-cyan-400/20 bg-[#0f1520]/90 backdrop-blur-xl flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]"
            >
              <div className="p-4 border-b border-cyan-400/10 flex items-center justify-between">
                <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3 h-3" /> Neural Log
                </h2>
                <span className="text-[10px] text-gray-500 uppercase">Encrypted Session</span>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide" ref={chatContainerRef}>
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                    <Zap className="w-12 h-12 mb-4 text-cyan-400" />
                    <p className="text-sm">No neural logs found.<br/>Initiate conversation via voice or text.</p>
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-cyan-500/10 border border-cyan-500/30 text-white rounded-tr-none" 
                        : "bg-gray-800/50 border border-gray-700 text-[#b0bec5] rounded-tl-none"
                    }`}>
                      <div className="text-xs font-bold mb-1 opacity-50 uppercase tracking-tighter">
                        {msg.role === "user" ? "Master" : "Nexus"}
                      </div>
                      <div className="text-sm leading-relaxed">
                        <Streamdown>{msg.text}</Streamdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-2xl rounded-tl-none">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 border-t border-cyan-400/10">
                <form onSubmit={handleChatSubmit} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a command..."
                    className="w-full bg-black/40 border border-cyan-400/20 rounded-xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-cyan-400/50 transition-all placeholder:text-gray-600"
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim() || isProcessing}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg transition-colors disabled:opacity-30"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Status Bar */}
      <footer className="relative z-30 px-6 py-2 border-t border-cyan-400/10 bg-[#0a0e14] flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-600">
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500" /> Neural Link: Stable
          </span>
          <span className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-cyan-500" /> Latency: 24ms
          </span>
        </div>
        <div>© 2026 Nexus AGI Systems • All Rights Reserved</div>
      </footer>
    </div>
  );
}
