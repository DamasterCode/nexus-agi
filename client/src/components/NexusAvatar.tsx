/* NexusAvatar.tsx
   Nexus AI Avatar with animated breathing, eye glow, and pulsing rings
*/
import { useEffect, useRef } from "react";

interface NexusAvatarProps {
  isListening?: boolean;
  isThinking?: boolean;
}

export default function NexusAvatar({ isListening = false, isThinking = false }: NexusAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center">
      {/* Animated glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-glow-ring-1 absolute w-40 h-40 rounded-full border border-cyan-400/40" />
        <div className="animate-glow-ring-2 absolute w-40 h-40 rounded-full border border-cyan-400/30" />
        <div className="animate-glow-ring-3 absolute w-40 h-40 rounded-full border border-cyan-400/20" />
      </div>

      {/* Avatar image with breathing animation */}
      <div className={`relative z-10 animate-avatar-breathe ${isThinking ? "animate-pulse" : ""}`}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663598653965/N9RAHEFsUhefV3TbgDhddM/ai-avatar-SPcWxyWUvbFBB6wUXmFdAY.webp"
          alt="Nexus AI Avatar"
          className="w-48 h-64 object-cover rounded-lg shadow-2xl"
          style={{
            filter: isListening ? "brightness(1.2) drop-shadow(0 0 20px rgba(0, 180, 255, 0.8))" : "drop-shadow(0 0 10px rgba(0, 180, 255, 0.4))",
            transition: "filter 0.3s ease-in-out",
          }}
        />

        {/* Status indicator */}
        {(isListening || isThinking) && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/60 px-3 py-2 rounded-full backdrop-blur-sm border border-cyan-400/50">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-status-blink" />
            <span className="text-xs text-cyan-400 font-medium">
              {isListening ? "Listening..." : "Thinking..."}
            </span>
          </div>
        )}
      </div>

      {/* Decorative circuit lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Corner circuit traces */}
        <path
          d="M20 200 L80 200 L80 150 L120 150"
          stroke="#00b4ff"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 4"
        />
        <path
          d="M380 200 L320 200 L320 150 L280 150"
          stroke="#00b4ff"
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="4 4"
        />
        {/* Circuit nodes */}
        <circle cx="80" cy="200" r="2" fill="#00b4ff" opacity="0.4" />
        <circle cx="80" cy="150" r="1.5" fill="#00b4ff" opacity="0.3" />
        <circle cx="320" cy="200" r="2" fill="#00b4ff" opacity="0.4" />
        <circle cx="320" cy="150" r="1.5" fill="#00b4ff" opacity="0.3" />
      </svg>
    </div>
  );
}
