/* CircuitLines.tsx
   Design: Cyberpunk Minimalism — animated circuit-trace SVG decorations
*/
export default function CircuitLines({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top-left corner circuit traces */}
      <path
        d="M0 40 L30 40 L30 20 L60 20 L60 50 L90 50"
        stroke="#00b4ff"
        strokeWidth="0.8"
        strokeDasharray="300"
        strokeDashoffset="0"
        opacity="0.35"
        style={{
          animation: "circuit-trace 4s ease-in-out infinite",
        }}
      />
      <path
        d="M0 70 L20 70 L20 90 L50 90 L50 110"
        stroke="#00b4ff"
        strokeWidth="0.6"
        strokeDasharray="200"
        strokeDashoffset="0"
        opacity="0.25"
        style={{
          animation: "circuit-trace 5s ease-in-out infinite 1s",
        }}
      />
      {/* Circuit nodes */}
      <circle cx="30" cy="40" r="2" fill="#00b4ff" opacity="0.4" />
      <circle cx="60" cy="20" r="1.5" fill="#00b4ff" opacity="0.3" />
      <circle cx="50" cy="90" r="2" fill="#00b4ff" opacity="0.35" />
      <circle cx="20" cy="70" r="1.5" fill="#00b4ff" opacity="0.3" />
      {/* Horizontal scan line */}
      <path
        d="M0 130 L80 130"
        stroke="#00b4ff"
        strokeWidth="0.5"
        opacity="0.2"
        strokeDasharray="4 8"
      />
    </svg>
  );
}
