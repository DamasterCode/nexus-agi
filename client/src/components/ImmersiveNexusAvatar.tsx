import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ImmersiveNexusAvatarProps {
  isListening?: boolean;
  isThinking?: boolean;
  isSpeaking?: boolean;
}

export default function ImmersiveNexusAvatar({
  isListening = false,
  isThinking = false,
  isSpeaking = false,
}: ImmersiveNexusAvatarProps) {
  const [eyeGlow, setEyeGlow] = useState(1);
  
  // Animate eye glow based on state
  useEffect(() => {
    if (isListening || isSpeaking) {
      const interval = setInterval(() => {
        setEyeGlow(0.7 + Math.random() * 0.3);
      }, 100);
      return () => clearInterval(interval);
    } else if (isThinking) {
      setEyeGlow(0.5);
    } else {
      setEyeGlow(0.8);
    }
  }, [isListening, isThinking, isSpeaking]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background Glow Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute w-64 h-64 rounded-full border border-cyan-400/20 blur-sm"
        />
        <motion.div
          animate={{
            scale: [1.2, 1.8, 1.2],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
          className="absolute w-80 h-80 rounded-full border border-cyan-400/10 blur-md"
        />
      </div>

      {/* Main Robot Head Container */}
      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 w-64 h-80 flex items-center justify-center"
      >
        {/* Robot Head Image */}
        <div className="relative">
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663598653965/N9RAHEFsUhefV3TbgDhddM/ai-avatar-SPcWxyWUvbFBB6wUXmFdAY.webp"
            alt="Nexus AI"
            className="w-56 h-72 object-cover rounded-3xl shadow-[0_0_50px_rgba(0,180,255,0.3)]"
            style={{
              filter: isListening || isSpeaking 
                ? "brightness(1.1) contrast(1.1)" 
                : "brightness(0.9) contrast(1.0)",
              transition: "filter 0.5s ease",
            }}
          />
          
          {/* Glowing Eyes Overlay */}
          <div className="absolute top-[32%] left-[28%] w-[12%] h-[8%] bg-cyan-400 rounded-full blur-[6px] mix-blend-screen pointer-events-none"
               style={{ opacity: eyeGlow * (isListening || isSpeaking ? 1 : 0.6) }} />
          <div className="absolute top-[32%] right-[28%] w-[12%] h-[8%] bg-cyan-400 rounded-full blur-[6px] mix-blend-screen pointer-events-none"
               style={{ opacity: eyeGlow * (isListening || isSpeaking ? 1 : 0.6) }} />
          
          {/* Eye Pupils (Bright Center) */}
          <div className="absolute top-[34%] left-[31%] w-[6%] h-[4%] bg-white rounded-full blur-[1px] mix-blend-screen pointer-events-none"
               style={{ opacity: eyeGlow }} />
          <div className="absolute top-[34%] right-[31%] w-[6%] h-[4%] bg-white rounded-full blur-[1px] mix-blend-screen pointer-events-none"
               style={{ opacity: eyeGlow }} />

          {/* Circuit Trace Glows */}
          <AnimatePresence>
            {(isListening || isThinking || isSpeaking) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.4 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none"
              >
                {/* SVG Overlay for animated circuit lines */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <motion.path
                    d="M50 10 L50 25 M30 20 L40 30 M70 20 L60 30"
                    stroke="#00b4ff"
                    strokeWidth="0.5"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Thinking Indicator (Floating Nodes) */}
        {isThinking && (
          <div className="absolute -top-10 flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
                className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(0,180,255,0.8)]"
              />
            ))}
          </div>
        )}
      </motion.div>

      {/* Speaking Waveform Overlay */}
      {isSpeaking && (
        <div className="absolute bottom-10 w-48 h-12 flex items-end justify-center gap-1 pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: [4, Math.random() * 30 + 10, 4],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                delay: i * 0.05,
              }}
              className="w-1 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(0,180,255,0.6)]"
            />
          ))}
        </div>
      )}
    </div>
  );
}
