# AI Assistant UI — Design Brainstorm

Inspired by: Silver humanoid robot with glowing blue circuit-traced face and luminous blue eyes.

---

<response>
<idea>
**Design Movement**: Cyberpunk Minimalism / Biopunk Chrome

**Core Principles**:
1. Deep dark void backgrounds contrasted with electric cyan-blue neon glows
2. Metallic silver surfaces with subtle brushed-metal texture overlays
3. Circuit-trace decorative lines as structural dividers and accents
4. Asymmetric split-panel layout: avatar left, chat right

**Color Philosophy**:
- Background: near-black charcoal (#0a0e14) — the void of space
- Primary accent: electric cyan-blue (#00b4ff / #0af) — the robot's glowing eyes
- Secondary: cool silver-grey (#b0bec5) — metallic sheen
- Glow: rgba(0,180,255,0.3) for bloom/halo effects
- Emotional intent: cold intelligence, precision, calm power

**Layout Paradigm**:
- Two-column asymmetric: left 35% avatar panel (dark, glowing), right 65% chat panel
- Avatar panel has animated pulsing glow rings around the robot face
- Chat panel has frosted-glass message bubbles with subtle border glow
- Input bar at bottom with scanning-line animation on focus

**Signature Elements**:
1. Animated concentric blue glow rings pulsing outward from avatar eyes
2. Circuit-board line decorations in corners/borders (SVG paths)
3. Typing indicator: three dots that pulse with cyan glow

**Interaction Philosophy**:
- Every hover triggers a subtle blue glow intensification
- Messages slide in from the side with a slight blur-to-sharp transition
- Send button has a "charge up" animation before firing

**Animation**:
- Avatar: continuous slow breathing scale (1.0→1.02), eye glow pulse (opacity 0.6→1.0, 2s loop)
- Messages: slide-in from right (user) / left (AI) with fade + slight Y translation
- Input focus: border glow expands outward
- Background: very slow particle drift (circuit nodes floating)

**Typography System**:
- Display/Name: "Orbitron" (geometric, futuristic, all-caps feel)
- Body/Chat: "Space Grotesk" (modern, readable, slightly technical)
- Monospace accents: "JetBrains Mono" for code snippets
</idea>
<probability>0.08</probability>
</response>

<response>
<idea>
**Design Movement**: Brutalist Sci-Fi / Industrial Terminal

**Core Principles**:
1. Raw, exposed structure — no rounded corners, sharp edges everywhere
2. Heavy typographic hierarchy with oversized labels
3. Scanline and CRT-monitor aesthetic overlaid on modern dark UI
4. Grid-based but deliberately broken — elements bleed outside their containers

**Color Philosophy**:
- Background: pure black (#000)
- Primary: harsh white (#fff) for text, electric blue (#0055ff) for accents
- Warning amber (#ffaa00) as tertiary for status indicators
- Emotional intent: raw machine intelligence, unfiltered data

**Layout Paradigm**:
- Terminal-style full-width layout with a top status bar
- Chat occupies 70% center, flanked by data panels
- Avatar is a wireframe/hologram rendering, not photorealistic

**Signature Elements**:
1. Scanline overlay (CSS repeating-linear-gradient)
2. Blinking cursor on AI responses
3. Glitch text effect on AI name/title

**Interaction Philosophy**:
- Keyboard-first design, minimal mouse affordances
- Responses appear character by character (typewriter)
- Errors shown as red terminal output

**Animation**:
- Glitch flicker on avatar every 8-12 seconds
- Typewriter text reveal for AI messages
- Scanline slow scroll animation

**Typography System**:
- Everything: "JetBrains Mono" — pure terminal aesthetic
- Size contrast: 48px headers vs 13px body
</idea>
<probability>0.05</probability>
</response>

<response>
<idea>
**Design Movement**: Holographic Glassmorphism / Neo-Futurism

**Core Principles**:
1. Layered translucent panels with heavy backdrop-blur
2. Iridescent color shifts — blue to teal to violet gradients
3. Floating card UI with depth shadows and light refraction
4. Centered hero layout with radial glow emanating from avatar

**Color Philosophy**:
- Background: deep navy-black gradient (#050a18 → #0d1b2a)
- Glass panels: rgba(255,255,255,0.04) with 1px rgba(255,255,255,0.12) borders
- Accent: shifting blue-cyan (#38bdf8 → #06b6d4)
- Glow halos: soft blue radial gradients
- Emotional intent: ethereal intelligence, dream-like precision

**Layout Paradigm**:
- Centered avatar at top with radial glow, chat below
- Glass morphism chat bubbles with iridescent borders
- Floating action buttons with hover lift effect

**Signature Elements**:
1. Radial aurora glow behind avatar (animated gradient rotation)
2. Glass bubbles with prismatic border shimmer
3. Particle constellation background (slow drift)

**Interaction Philosophy**:
- Hover: cards lift with increased blur and glow
- Click: ripple of light from click point
- Scroll: parallax depth on background layers

**Animation**:
- Aurora background: conic-gradient rotation (20s loop)
- Avatar: floating bob (translateY -8px, 3s ease-in-out loop)
- Message bubbles: scale from 0.95 + fade in
- Particle field: requestAnimationFrame canvas

**Typography System**:
- Display: "Syne" (geometric, distinctive)
- Body: "DM Sans" (clean, modern)
- Accent labels: "Space Mono" (technical feel)
</idea>
<probability>0.09</probability>
</response>

---

## Selected Design: **Cyberpunk Minimalism / Biopunk Chrome** (Response 1)

Deep dark void, electric cyan-blue glows, metallic silver, circuit-trace accents, asymmetric split-panel layout.
