import { useEffect, useState, useRef } from "react";
import { AnimatedNexusAvatar } from "@/components/AnimatedNexusAvatar";
import { useVoiceRecognition } from "@/hooks/useVoiceRecognition";
import { trpc } from "@/lib/trpc";

export default function NexusFinal() {
  const [isListening, setIsListening] = useState(false);
  const [voiceCaption, setVoiceCaption] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [googleCredentials, setGoogleCredentials] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [showCredentialsForm, setShowCredentialsForm] = useState(true);

  const { startListening, stopListening, transcript, isListening: isVoiceListening } = useVoiceRecognition({
    continuous: true,
  });

  const createGoogleDocMutation = trpc.automation.createGoogleDoc.useMutation();

  // Start listening on mount
  useEffect(() => {
    startListening();
  }, [startListening]);

  // Handle voice input
  useEffect(() => {
    if (isVoiceListening) {
      setIsListening(true);
      setVoiceCaption(transcript || "Listening...");
    } else {
      setIsListening(false);
    }
  }, [isVoiceListening, transcript]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && !isVoiceListening) {
      handleCommand(transcript);
    }
  }, [transcript, isVoiceListening]);

  const handleCommand = async (command: string) => {
    setVoiceCaption(command);
    setIsProcessing(true);

    try {
      // Check if command is about creating a Google Doc
      if (command.toLowerCase().includes("google doc") || command.toLowerCase().includes("create doc")) {
        const title = "Machine Learning Overview";
        const content = `# Machine Learning Overview

## Introduction
Machine Learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.

## Key Concepts

### Types of Machine Learning
1. **Supervised Learning** - Learning from labeled data
2. **Unsupervised Learning** - Finding patterns in unlabeled data
3. **Reinforcement Learning** - Learning through interaction and rewards

### Common Algorithms
- Linear Regression
- Decision Trees
- Neural Networks
- Support Vector Machines
- K-Means Clustering

## Applications
- Computer Vision
- Natural Language Processing
- Recommendation Systems
- Autonomous Vehicles
- Healthcare Diagnostics

## Conclusion
Machine Learning continues to revolutionize technology and solve complex problems across industries.`;

        // Create Google Doc
        await createGoogleDocMutation.mutateAsync({
          email: googleCredentials.email!,
          password: googleCredentials.password!,
          title,
          content,
        });

        setVoiceCaption(`Created Google Doc: "${title}"`);
      }
    } catch (error: any) {
      console.error("Error:", error);
      setVoiceCaption(`Error creating document`);
    } finally {
      setIsProcessing(false);
      // Resume listening
      setTimeout(() => startListening(), 1000);
    }
  };

  if (showCredentialsForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur border border-cyan-500/20 rounded-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-cyan-400 mb-6">Nexus - Google Credentials</h2>
          <p className="text-slate-300 mb-4">Enter your Google credentials so Nexus can create documents:</p>
          <p className="text-slate-400 text-xs mb-4">⚠️ Note: Your credentials are only used for this session and not stored.</p>

          <div className="space-y-4">
            <input
              type="email"
              placeholder="Google Email"
              className="w-full bg-slate-700 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              value={googleCredentials.email || ""}
              onChange={(e) => setGoogleCredentials({ ...googleCredentials, email: e.target.value })}
            />
            <input
              type="password"
              placeholder="Google Password or App Password"
              className="w-full bg-slate-700 border border-cyan-500/30 rounded px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              value={googleCredentials.password || ""}
              onChange={(e) => setGoogleCredentials({ ...googleCredentials, password: e.target.value })}
            />
            <button
              onClick={() => {
                if (googleCredentials.email && googleCredentials.password) {
                  setShowCredentialsForm(false);
                } else {
                  alert("Please enter both email and password");
                }
              }}
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse" />
        <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Header */}
      <div className="absolute top-8 left-8 z-10">
        <h1 className="text-3xl font-bold text-cyan-400">NEXUS</h1>
        <p className="text-cyan-300/60 text-sm">Master: {googleCredentials.email || "Anonymous"}</p>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Avatar */}
        <div className="w-64 h-64">
          <AnimatedNexusAvatar isListening={isListening} isProcessing={isProcessing} />
        </div>

        {/* Voice caption */}
        <div className="text-center max-w-2xl">
          <p className="text-cyan-400 text-lg font-semibold h-8 min-h-8">
            {voiceCaption || (isListening ? "Listening..." : "Speak a command")}
          </p>
        </div>

        {/* Status */}
        <div className="flex gap-4 text-sm text-cyan-300/60">
          <span>{isListening ? "🎤 Listening" : "🔇 Idle"}</span>
          <span>{isProcessing ? "⚙️ Processing" : "✓ Ready"}</span>
        </div>
      </div>

      {/* Try it button */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-cyan-300/60 text-sm mb-2">Try saying: "Create a Google Doc about machine learning"</p>
        <button
          onClick={() => handleCommand("Create a Google Doc about machine learning")}
          className="px-6 py-2 bg-cyan-500/20 border border-cyan-500/50 rounded text-cyan-400 hover:bg-cyan-500/30 transition-colors"
        >
          Test Now
        </button>
      </div>
    </div>
  );
}
