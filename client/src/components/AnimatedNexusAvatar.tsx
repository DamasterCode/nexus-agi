import React, { useEffect, useState } from "react";

interface AnimatedNexusAvatarProps {
  isListening?: boolean;
  isProcessing?: boolean;
}

export function AnimatedNexusAvatar({
  isListening = false,
  isProcessing = false,
}: AnimatedNexusAvatarProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);

  // Animate avatar movement
  useEffect(() => {
    const interval = setInterval(() => {
      // Random movement around screen
      const x = Math.sin(Date.now() / 2000) * 100;
      const y = Math.cos(Date.now() / 2500) * 80;
      const rot = (Date.now() / 50) % 360;
      const scl = 1 + Math.sin(Date.now() / 1500) * 0.1;

      setPosition({ x, y });
      setRotation(rot);
      setScale(scl);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main avatar container */}
      <div
        className="relative transition-all duration-100"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
        }}
      >
        {/* Glowing aura */}
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-300 ${
            isListening
              ? "bg-cyan-500/40 animate-pulse"
              : isProcessing
                ? "bg-cyan-400/30"
                : "bg-cyan-400/20"
          }`}
          style={{
            width: "200px",
            height: "200px",
            left: "-50px",
            top: "-50px",
          }}
        />

        {/* Avatar SVG - Stylized robot head */}
        <svg
          width="100"
          height="120"
          viewBox="0 0 100 120"
          className="relative z-10 drop-shadow-lg"
        >
          {/* Head */}
          <circle cx="50" cy="40" r="35" fill="#e0e7ff" stroke="#06b6d4" strokeWidth="2" />

          {/* Left eye */}
          <circle cx="35" cy="35" r="8" fill="#0e7490" />
          <circle
            cx="35"
            cy="35"
            r="5"
            fill="#06b6d4"
            className={isListening ? "animate-pulse" : ""}
          />
          <circle cx="36" cy="33" r="2" fill="#ffffff" />

          {/* Right eye */}
          <circle cx="65" cy="35" r="8" fill="#0e7490" />
          <circle
            cx="65"
            cy="35"
            r="5"
            fill="#06b6d4"
            className={isListening ? "animate-pulse" : ""}
          />
          <circle cx="66" cy="33" r="2" fill="#ffffff" />

          {/* Mouth */}
          <path
            d="M 40 50 Q 50 55 60 50"
            stroke="#06b6d4"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />

          {/* Antenna left */}
          <line x1="25" y1="10" x2="20" y2="0" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="20" cy="0" r="3" fill="#06b6d4" />

          {/* Antenna right */}
          <line x1="75" y1="10" x2="80" y2="0" stroke="#06b6d4" strokeWidth="2" />
          <circle cx="80" cy="0" r="3" fill="#06b6d4" />

          {/* Body */}
          <rect x="30" y="70" width="40" height="45" rx="5" fill="#e0e7ff" stroke="#06b6d4" strokeWidth="2" />

          {/* Chest panel */}
          <rect x="40" y="80" width="20" height="25" fill="#0e7490" stroke="#06b6d4" strokeWidth="1" />

          {/* Blinking animation */}
          {isListening && (
            <>
              <line x1="32" y1="35" x2="38" y2="35" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
              <line x1="62" y1="35" x2="68" y2="35" stroke="#06b6d4" strokeWidth="1" opacity="0.5" />
            </>
          )}
        </svg>

        {/* Processing indicator */}
        {isProcessing && (
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2">
          <div className="text-cyan-400 text-sm font-semibold animate-pulse">Listening...</div>
        </div>
      )}

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
