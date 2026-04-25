/**
 * NexusVoiceFirst.tsx
 * Voice-first AI assistant interface with always-listening capability
 * Like Alexa - always listening for voice commands
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut, MessageSquare, Volume2, VolumeX, Zap, Settings } from "lucide-react";
import { trpc } from "@/lib/trpc";
import ParticleField from "@/components/ParticleField";
import VoiceWaveform from "@/components/VoiceWaveform";
import VoiceSettings from "@/components/VoiceSettings";
import NexusAvatar from "@/components/NexusAvatar";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";

interface TaskResult {
  id: string;
  request: string;
  status: "pending" | "executing" | "completed" | "error";
  summary: string;
  timestamp: Date;
}

export default function NexusVoiceFirst() {
  const { user, logout, loading: authLoading } = useAuth();
  
  // Voice and TTS
  const [voiceLanguage, setVoiceLanguage] = useState("en-US");
  const [speechRate, setSpeechRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [autoSpeak, setAutoSpeak] = useState(true);
  
  // UI State
  const [showChat, setShowChat] = useState(false);
  const [tasks, setTasks] = useState<TaskResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [alwaysListening, setAlwaysListening] = useState(true);
  
  // Voice recognition - always listening
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

  // Auto-start listening on mount
  const startedRef = useRef(false);
  useEffect(() => {
    if (isVoiceSupported && alwaysListening && !isListening && !startedRef.current) {
      startedRef.current = true;
      startListening();
    }
  }, [isVoiceSupported, alwaysListening, isListening, startListening]);

  // Handle voice input
  useEffect(() => {
    if (transcript && !isListening && !isProcessing) {
      handleVoiceCommand(transcript);
      resetTranscript();
      // Restart listening after a short delay
      if (alwaysListening) {
        setTimeout(() => {
          try {
            startListening();
          } catch (err) {
            // Ignore errors, will retry on next cycle
          }
        }, 1000);
      }
    }
  }, [transcript, isListening, alwaysListening, isProcessing, resetTranscript, startListening]);

  const handleVoiceCommand = async (command: string) => {
    if (!command.trim() || isProcessing) return;

    setIsProcessing(true);
    const taskId = Math.random().toString(36).substring(7);
    
    // Add task to list
    setTasks(prev => [...prev, {
      id: taskId,
      request: command,
      status: "pending",
      summary: "Processing your request...",
      timestamp: new Date(),
    }]);

      // Speak acknowledgment
      if (autoSpeak && isTTSSupported && command.length < 100) {
        try {
          speak(`Processing: ${command}`);
        } catch (err) {
          // Ignore speak errors
        }
      }

    try {
      const result = await executeTaskMutation.mutateAsync({
        request: command,
      });

      // Update task status
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: "completed", summary: result.summary }
          : t
      ));

      // Speak result
      if (autoSpeak && isTTSSupported && result.summary.length < 200) {
        try {
          speak(result.summary);
        } catch (err) {
          // Ignore speak errors
        }
      }

      setLastSpokenText(result.summary);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to process request";
      
      setTasks(prev => prev.map(t => 
        t.id === taskId 
          ? { ...t, status: "error", summary: errorMsg }
          : t
      ));

      if (autoSpeak && isTTSSupported && errorMsg.length < 100) {
        try {
          speak(`Error: ${errorMsg}`);
        } catch (err) {
          // Ignore speak errors
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleAlwaysListening = () => {
    if (alwaysListening) {
      stopListening();
      setAlwaysListening(false);
      startedRef.current = false;
    } else {
      setAlwaysListening(true);
      startedRef.current = false;
      setTimeout(() => startListening(), 200);
    }
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
          <div className={`w-3 h-3 rounded-full ${alwaysListening ? "bg-cyan-400 animate-pulse" : "bg-metal-silver/40"}`} />
          <div>
            <h1 className="text-2xl font-bold text-glow-blue">NEXUS</h1>
            <p className="text-xs text-metal-silver/60">Master: {user?.name} • Always Listening</p>
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
              >
                {autoSpeak ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </>
          )}
          <Button
            onClick={() => setShowChat(!showChat)}
            variant="outline"
            className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            {showChat ? "Voice" : "Chat"}
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

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        {!showChat ? (
          // Voice-First Interface
          <div className="max-w-4xl w-full space-y-8">
            {/* Avatar and Voice Status */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              {/* Avatar */}
              <div className="w-64 h-64 rounded-lg border border-cyan-400/30 bg-void-2/50 backdrop-blur-sm p-4 overflow-hidden flex items-center justify-center">
                <NexusAvatar isThinking={isProcessing} isListening={alwaysListening} />
              </div>

              {/* Status and Controls */}
              <div className="flex-1 space-y-6 max-w-md">
                {/* Status */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      alwaysListening 
                        ? isProcessing 
                          ? "bg-yellow-400 animate-pulse" 
                          : "bg-cyan-400 animate-pulse"
                        : "bg-metal-silver/40"
                    }`} />
                    <span className="text-lg font-semibold text-cyan-400">
                      {alwaysListening 
                        ? isProcessing 
                          ? "Processing..." 
                          : "Listening..." 
                        : "Standby"}
                    </span>
                  </div>
                  <p className="text-sm text-metal-silver/60">
                    {alwaysListening 
                      ? "Nexus is always listening for your commands" 
                      : "Click to enable listening"}
                  </p>
                </div>

                {/* Always Listening Toggle */}
                <Button
                  onClick={toggleAlwaysListening}
                  className={`w-full py-6 text-lg font-semibold transition-all ${
                    alwaysListening
                      ? "bg-cyan-600 hover:bg-cyan-500 text-black"
                      : "bg-metal-silver/20 hover:bg-metal-silver/30 text-metal-silver"
                  }`}
                >
                  {alwaysListening ? "🎤 Always Listening" : "🔇 Enable Listening"}
                </Button>

                {/* Interim Transcript */}
                {interimTranscript && (
                  <div className="bg-void-3 border border-cyan-400/30 rounded-lg p-4">
                    <p className="text-sm text-cyan-400 italic">
                      "{interimTranscript}"
                    </p>
                  </div>
                )}

                {/* Voice Waveform */}
                {(isListening || isSpeaking) && (
                  <div>
                    <VoiceWaveform 
                      isListening={alwaysListening && isListening} 
                      isSpeaking={isSpeaking} 
                      barCount={16}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Task History */}
            {tasks.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Recent Tasks ({tasks.length})
                </h3>
                {tasks.slice().reverse().map(task => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-lg border transition-all text-sm ${
                      task.status === "completed"
                        ? "bg-green-600/10 border-green-400/30"
                        : task.status === "error"
                        ? "bg-red-600/10 border-red-400/30"
                        : "bg-cyan-600/10 border-cyan-400/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1">
                        <p className="font-medium text-metal-silver">{task.request}</p>
                        <p className="text-xs text-metal-silver/60">{task.summary}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {task.status === "pending" && (
                          <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        )}
                        {task.status === "completed" && (
                          <div className="w-4 h-4 rounded-full bg-green-400" />
                        )}
                        {task.status === "error" && (
                          <div className="w-4 h-4 rounded-full bg-red-400" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Last Response */}
            {lastSpokenText && (
              <div className="bg-void-3 border border-cyan-400/20 rounded-lg p-4">
                <p className="text-xs text-metal-silver/60 mb-2">Last Response:</p>
                <p className="text-sm text-metal-silver">{lastSpokenText}</p>
              </div>
            )}
          </div>
        ) : (
          // Chat Interface (Secondary)
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-cyan-400 mx-auto opacity-50" />
              <p className="text-metal-silver/60">Chat interface coming soon...</p>
              <Button
                onClick={() => setShowChat(false)}
                className="bg-cyan-600 hover:bg-cyan-500"
              >
                Back to Voice
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
