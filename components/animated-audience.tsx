"use client";

import { useMemo } from "react";
import type { Emotion } from "@/hooks/use-emotion-tracking";

// ---------------------------------------------------------------------------
// Deterministic seeded random (replaces ALL Math.random() usage)
// ---------------------------------------------------------------------------

function seededRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function seededRandFromPair(a: number, b: number): number {
  return seededRand(a * 127.1 + b * 311.7);
}

// ---------------------------------------------------------------------------
// Color palettes & Constants
// ---------------------------------------------------------------------------

const SKIN_TONES = [
  "#FFDBB4", "#EDB98A", "#D08B5B", "#C68642", "#F0C8A0",
];

const HAIR_COLORS = [
  "#2C1B0E", "#090806", "#5A3214", "#8B6914", "#D4A44C",
  "#E6CEA8", "#4ECDC4",
];

const SHIRT_COLORS = [
  "#34D399", "#60A5FA", "#A78BFA", "#FBBF24", "#FB7185",
  "#818CF8", "#2DD4BF", "#FB923C", "#22D3EE", "#F472B6",
  "#94A3B8", "#A3E635", "#10B981", "#3B82F6", "#8B5CF6"
];

const GLASSES_COLORS = ["#1a1a2e", "#4B5563", "#92400E", "#000000", "#DC2626"];
const HAT_COLORS = ["#1F2937", "#DC2626", "#2563EB", "#D97706", "#059669", "#FFFFFF"];
const GLOW_COLORS = ["#00FF00", "#FF00FF", "#00FFFF", "#FFFF00"];
const CONFETTI_COLORS = ["#ff0", "#f0f", "#0ff", "#f00", "#0f0"];

// ---------------------------------------------------------------------------
// Utility: darken a hex color by a factor (0..1)
// ---------------------------------------------------------------------------

function darkenHex(hex: string, factor: number): string {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.substring(0, 2), 16) * factor);
  const g = Math.round(parseInt(h.substring(2, 4), 16) * factor);
  const b = Math.round(parseInt(h.substring(4, 6), 16) * factor);
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PersonLayout {
  row: number;
  x: number;
  baseY: number;
  scale: number;
  index: number;
}

interface PersonAppearance {
  skinTone: string;
  earTone: string; // pre-darkened skin
  hairColor: string;
  shirtColor: string;
  hairStyle: number;
  shirtStyle: number;
  hasGlasses: boolean;
  glassesColor: string;
  facialHair: number;
  headwear: number;
  headwearColor: string;
  propType: number;
  propColor: string;
  propHand: "left" | "right"; // deterministic: prop goes to ONE hand only
}

interface FaceExpression {
  eyeRadiusX: number;
  eyeRadiusY: number;
  eyeOffsetY: number;
  browRotateLeft: number;
  browRotateRight: number;
  browOffsetY: number;
  mouthPath: string;
  cheeksOpacity: number;
}

// ---------------------------------------------------------------------------
// Layout builder (fully deterministic)
// ---------------------------------------------------------------------------

function buildAudienceLayout(): PersonLayout[] {
  const people: PersonLayout[] = [];
  let globalIndex = 0;

  const rows: { count: number; startX: number; span: number; baseY: number; scale: number; jitter: number }[] = [
    { count: 11, startX: 35, span: 630, baseY: 60, scale: 0.5, jitter: 10 },
    { count: 10, startX: 50, span: 600, baseY: 110, scale: 0.7, jitter: 15 },
    { count: 9, startX: 65, span: 570, baseY: 170, scale: 0.9, jitter: 20 },
    { count: 8, startX: 80, span: 540, baseY: 240, scale: 1.15, jitter: 25 },
  ];

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const { count, startX, span, baseY, scale, jitter } = rows[rowIdx];
    for (let i = 0; i < count; i++) {
      const jitterOffset = (seededRandFromPair(globalIndex, rowIdx) - 0.5) * jitter;
      people.push({
        row: 3 - rowIdx,
        x: startX + (i * span) / (count - 1) + jitterOffset,
        baseY,
        scale,
        index: globalIndex++,
      });
    }
  }

  return people;
}

// ---------------------------------------------------------------------------
// Appearance generator (fully deterministic)
// ---------------------------------------------------------------------------

function getPersonAppearance(index: number): PersonAppearance {
  const rand = (seed: number) => seededRandFromPair(index, seed);

  const hairStyle = Math.floor(rand(1) * 8);
  const hasGlasses = rand(2) < 0.25;
  const shirtStyle = Math.floor(rand(3) * 5);
  const facialHair = rand(4) < 0.3 ? Math.floor(rand(4.5) * 4) + 1 : 0;
  const headwear = rand(5) < 0.25 ? Math.floor(rand(5.5) * 3) + 1 : 0;
  const propType = rand(6) < 0.35 ? Math.floor(rand(6.5) * 3) + 1 : 0;
  const propColor = GLOW_COLORS[Math.floor(rand(7) * GLOW_COLORS.length)];
  const propHand: "left" | "right" = rand(13) < 0.5 ? "left" : "right";
  const skinTone = SKIN_TONES[Math.floor(rand(8) * SKIN_TONES.length)];

  return {
    skinTone,
    earTone: darkenHex(skinTone, 0.88),
    hairColor: HAIR_COLORS[Math.floor(rand(9) * HAIR_COLORS.length)],
    shirtColor: SHIRT_COLORS[Math.floor(rand(10) * SHIRT_COLORS.length)],
    hairStyle,
    shirtStyle,
    hasGlasses,
    glassesColor: GLASSES_COLORS[Math.floor(rand(11) * GLASSES_COLORS.length)],
    facialHair,
    headwear,
    headwearColor: HAT_COLORS[Math.floor(rand(12) * HAT_COLORS.length)],
    propType,
    propColor,
    propHand,
  };
}

// ---------------------------------------------------------------------------
// Pre-computed confetti positions (deterministic, computed once)
// ---------------------------------------------------------------------------

const CONFETTI_COUNT = 20;

interface ConfettiParticle {
  cx: number;
  cy: number;
  color: string;
  delay: number;
}

function buildConfetti(): ConfettiParticle[] {
  const particles: ConfettiParticle[] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    particles.push({
      cx: seededRandFromPair(i, 100) * 700,
      cy: seededRandFromPair(i, 200) * 280,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay: seededRandFromPair(i, 300) * 2,
    });
  }
  return particles;
}

// ---------------------------------------------------------------------------
// Face expressions
// ---------------------------------------------------------------------------

function getFaceExpression(emotion: Emotion): FaceExpression {
  switch (emotion) {
    case "happy":
      return {
        eyeRadiusX: 1.2, eyeRadiusY: 0.9, eyeOffsetY: 0,
        browRotateLeft: 0, browRotateRight: 0, browOffsetY: -0.5,
        mouthPath: "M -3.5 -0.5 Q 0 4 3.5 -0.5",
        cheeksOpacity: 0.6,
      };
    case "surprised":
      return {
        eyeRadiusX: 1.8, eyeRadiusY: 1.9, eyeOffsetY: -0.8,
        browRotateLeft: 0, browRotateRight: 0, browOffsetY: -3,
        mouthPath: "M -1.8 1 Q -1.8 4.5 0 4.5 Q 1.8 4.5 1.8 1 Q 1.8 -1.5 0 -1.5 Q -1.8 -1.5 -1.8 1",
        cheeksOpacity: 0.4,
      };
    case "sad":
      return {
        eyeRadiusX: 1.2, eyeRadiusY: 1.2, eyeOffsetY: 0.5,
        browRotateLeft: 15, browRotateRight: -15, browOffsetY: 0,
        mouthPath: "M -3 2.5 Q 0 -1.5 3 2.5",
        cheeksOpacity: 0,
      };
    case "angry":
      return {
        eyeRadiusX: 1.4, eyeRadiusY: 0.8, eyeOffsetY: 0.3,
        browRotateLeft: -25, browRotateRight: 25, browOffsetY: 0.5,
        mouthPath: "M -3 1.5 Q 0 -0.5 3 1.5",
        cheeksOpacity: 0.2,
      };
    case "neutral":
    default:
      return {
        eyeRadiusX: 1.2, eyeRadiusY: 1.2, eyeOffsetY: 0,
        browRotateLeft: 0, browRotateRight: 0, browOffsetY: 0,
        mouthPath: "M -2.5 1 L 2.5 1",
        cheeksOpacity: 0,
      };
  }
}

// ---------------------------------------------------------------------------
// Animation helpers
// ---------------------------------------------------------------------------

function getStaggerDelay(index: number): number {
  const seed = (index * 19 + 7) % 100;
  return -((seed / 100) * 2000);
}

function getPersonVariant(index: number): number {
  return index % 3;
}

function getAnimationClasses({ emotion, variant }: { emotion: Emotion; variant: number }): {
  bodyClass: string;
  headClass: string;
  leftArmClass: string;
  rightArmClass: string;
} {
  switch (emotion) {
    case "happy":
      if (variant === 0) return { bodyClass: "audience-bounce", headClass: "audience-head-nod", leftArmClass: "audience-raise-arms", rightArmClass: "audience-raise-arms" };
      if (variant === 1) return { bodyClass: "audience-bounce", headClass: "audience-head-nod", leftArmClass: "audience-clap-left", rightArmClass: "audience-clap-right" };
      return { bodyClass: "audience-wave", headClass: "audience-head-nod", leftArmClass: "audience-raise-arms", rightArmClass: "audience-raise-arms" };
    case "surprised":
      return { bodyClass: "audience-surprise-jump", headClass: "", leftArmClass: "audience-surprise-arms", rightArmClass: "audience-surprise-arms" };
    case "sad":
      return { bodyClass: "audience-slump", headClass: "", leftArmClass: "audience-slump-arms", rightArmClass: "audience-slump-arms" };
    case "angry":
      return { bodyClass: "audience-shake", headClass: "", leftArmClass: "audience-shake-arms", rightArmClass: "audience-shake-arms" };
    case "neutral":
    default:
      return { bodyClass: "audience-idle", headClass: "", leftArmClass: "audience-idle-arms", rightArmClass: "audience-idle-arms" };
  }
}

// ---------------------------------------------------------------------------
// Sub-Components (SVGs)
// ---------------------------------------------------------------------------

function FacialHairSvg({ type, color, rx, ry }: { type: number; color: string; rx: number; ry: number }) {
  switch (type) {
    case 1: // Stubble
      return <path d={`M ${-rx*0.8} ${ry*0.2} Q 0 ${ry*1.1} ${rx*0.8} ${ry*0.2} L ${rx*0.8} ${ry*0.5} Q 0 ${ry*1.4} ${-rx*0.8} ${ry*0.5} Z`} fill={color} opacity={0.4} />;
    case 2: // Mustache
      return <path d="M -3 5 Q 0 4 3 5 Q 0 6 -3 5" fill={color} stroke="rgba(0,0,0,0.15)" strokeWidth={0.5} />;
    case 3: // Full Beard
      return <path d={`M ${-rx*0.9} 0 L ${-rx*0.9} ${ry*0.5} Q 0 ${ry*1.6} ${rx*0.9} ${ry*0.5} L ${rx*0.9} 0 Q ${rx*0.5} ${ry*0.8} ${rx*0.3} 6 L ${-rx*0.3} 6 Q ${-rx*0.5} ${ry*0.8} ${-rx*0.9} 0`} fill={color} />;
    case 4: // Goatee
      return <path d="M -2.5 7 Q 0 11 2.5 7 L 2.5 5 Q 0 6 -2.5 5 Z" fill={color} />;
    default: return null;
  }
}

function HeadwearSvg({ type, color, rx, ry }: { type: number; color: string; rx: number; ry: number }) {
  const brimColor = darkenHex(color === "#FFFFFF" ? "#DDDDDD" : color, 0.85);
  switch (type) {
    case 1: // Baseball Cap
      return (
        <g transform={`translate(0, ${-ry * 0.5})`}>
          <path d={`M ${-rx*1.1} 0 Q 0 ${-ry*1.2} ${rx*1.1} 0 Z`} fill={color} />
          <path d={`M ${-rx*1.2} 0 Q 0 ${ry*0.4} ${rx*1.2} 0`} fill={brimColor} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
        </g>
      );
    case 2: // Beanie
      return (
        <g transform={`translate(0, ${-ry * 0.4})`}>
          <path d={`M ${-rx*1.05} ${ry*0.2} Q 0 ${-ry*1.3} ${rx*1.05} ${ry*0.2} Q 0 ${ry*0.4} ${-rx*1.05} ${ry*0.2}`} fill={color} />
          <path d={`M ${-rx*1.05} ${ry*0.2} Q 0 ${ry*0.5} ${rx*1.05} ${ry*0.2} L ${rx*1.05} ${ry*0.45} Q 0 ${ry*0.75} ${-rx*1.05} ${ry*0.45} Z`} fill={brimColor} />
        </g>
      );
    case 3: // Headband
      return <path d={`M ${-rx*1.02} ${-ry*0.4} Q 0 ${-ry*0.7} ${rx*1.02} ${-ry*0.4} L ${rx*1.02} ${-ry*0.1} Q 0 ${-ry*0.4} ${-rx*1.02} ${-ry*0.1} Z`} fill={color} />;
    default: return null;
  }
}

function PropSvg({ type, color, emotion, isLeftHand }: { type: number; color: string; emotion: Emotion; isLeftHand: boolean }) {
  const isExcited = emotion === "happy" || emotion === "surprised";
  const flipX = isLeftHand ? -1 : 1;

  switch (type) {
    case 1: // Smartphone
      return (
        <g transform={`scale(${flipX}, 1) translate(-3, -12) rotate(-10)`}>
          <rect x={0} y={0} width={6} height={10} rx={1} fill="#111" />
          <rect x={0.5} y={0.5} width={5} height={9} fill="#fff" opacity={0.8} />
          <circle cx={3} cy={3} r={1.5} fill="white" className="audience-phone-flash" opacity={0} />
        </g>
      );
    case 2: // Glow stick
      if (!isExcited) return null;
      return (
        <g transform={`scale(${flipX}, 1) translate(-1.5, -16) rotate(-15)`}>
          <rect x={0} y={0} width={3} height={16} rx={1.5} fill={color} className="audience-glow-stick" />
        </g>
      );
    case 3: // Sign -- handle starts at the hand (y=0), sign sits above
      if (emotion !== "happy" && emotion !== "angry") return null;
      return (
        <g transform={`scale(${flipX}, 1)`}>
          {/* Handle: from hand upward */}
          <rect x={-1} y={-22} width={2} height={22} fill="#8D5524" rx={0.5} />
          {/* Sign face: above the handle */}
          <rect x={-8} y={-34} width={16} height={12} rx={1} fill="#fff" stroke="#ccc" strokeWidth={0.5} />
          {/* Scribble text lines */}
          <path d="M -5 -30 L 5 -30" stroke="#555" strokeWidth={0.8} strokeDasharray="2,1" />
          <path d="M -4 -27 L 4 -27" stroke="#555" strokeWidth={0.8} strokeDasharray="1.5,1" />
        </g>
      );
    default: return null;
  }
}

function HairSvg({ style, color, rx, ry, headwear }: { style: number; color: string; rx: number; ry: number; headwear: number }) {
  const isHat = headwear === 1 || headwear === 2;

  if (isHat) {
    if (style === 3) {
      return <g><circle cx={-rx} cy={0} r={rx*0.4} fill={color} /><circle cx={rx} cy={0} r={rx*0.4} fill={color} /></g>;
    }
    if (style === 4 || style === 2 || style === 6) {
      return <path d={`M ${-rx} 0 L ${-rx*1.2} ${ry} L ${-rx*0.8} ${ry*1.5} L 0 ${ry*0.5} L ${rx*0.8} ${ry*1.5} L ${rx*1.2} ${ry} L ${rx} 0`} fill={color} />;
    }
    return <path d={`M ${-rx} 0 L ${-rx} ${ry*0.5} L ${-rx*0.8} 0 M ${rx} 0 L ${rx} ${ry*0.5} L ${rx*0.8} 0`} stroke={color} strokeWidth={2} fill="none" />;
  }

  switch (style) {
    case 0: return <path d={`M ${-rx} 0 Q ${-rx} ${-ry*1.2} 0 ${-ry*1.2} Q ${rx} ${-ry*1.2} ${rx} 0 L ${rx} ${-ry*0.2} Q ${rx} ${-ry} 0 ${-ry} Q ${-rx} ${-ry} ${-rx} ${-ry*0.2} Z`} fill={color} />;
    case 1: return <path d={`M ${-rx} ${-ry*0.2} Q ${-rx*0.8} ${-ry*1.5} ${-rx*0.3} ${-ry*1.2} Q 0 ${-ry*1.6} ${rx*0.3} ${-ry*1.2} Q ${rx*0.8} ${-ry*1.5} ${rx} ${-ry*0.2} L ${rx} 0 Q ${rx} ${-ry} 0 ${-ry} Q ${-rx} ${-ry} ${-rx} 0 Z`} fill={color} />;
    case 2: return <path d={`M ${-rx*1.1} ${ry*0.8} L ${-rx*1.1} ${-ry*0.5} Q ${-rx} ${-ry*1.3} 0 ${-ry*1.3} Q ${rx} ${-ry*1.3} ${rx*1.1} ${-ry*0.5} L ${rx*1.1} ${ry*0.8} Q ${rx*0.5} ${ry*0.6} ${rx*0.5} 0 L ${rx*0.5} ${-ry*0.5} Q 0 ${-ry*0.8} ${-rx*0.5} ${-ry*0.5} L ${-rx*0.5} 0 Q ${-rx*0.5} ${ry*0.6} ${-rx*1.1} ${ry*0.8}`} fill={color} />;
    case 3: return <ellipse cx={0} cy={-ry*0.4} rx={rx*1.3} ry={ry*1.3} fill={color} />;
    case 4: return <path d={`M ${-rx*1.15} ${ry*1.5} L ${-rx*1.15} ${-ry*0.5} Q ${-rx} ${-ry*1.4} 0 ${-ry*1.4} Q ${rx} ${-ry*1.4} ${rx*1.15} ${-ry*0.5} L ${rx*1.15} ${ry*1.5} Q ${rx} ${ry*1.5} ${rx*0.8} 0 L ${rx*0.8} ${-ry*0.5} Q 0 ${-ry} ${-rx*0.8} ${-ry*0.5} L ${-rx*0.8} 0 Q ${-rx} ${ry*1.5} ${-rx*1.15} ${ry*1.5}`} fill={color} />;
    case 5: return <path d={`M ${-rx*1.05} 0 Q ${-rx} ${-ry*1.3} ${rx*0.4} ${-ry*0.8} Q ${rx*1.05} ${-ry*0.5} ${rx*1.05} 0 L ${rx*0.9} 0 Q ${rx} ${-ry} 0 ${-ry} Q ${-rx} ${-ry} ${-rx*0.9} 0 Z`} fill={color} />;
    case 6: return <g><circle cx={0} cy={-ry*1.2} r={rx*0.5} fill={color} /><path d={`M ${-rx*1.05} 0 Q ${-rx} ${-ry*1.2} 0 ${-ry*1.2} Q ${rx} ${-ry*1.2} ${rx*1.05} 0 L ${rx} 0 Q ${rx} ${-ry} 0 ${-ry} Q ${-rx} ${-ry} ${-rx} 0 Z`} fill={color} /></g>;
    case 7: default: return <path d={`M ${-rx*1.1} 0 L ${-rx*1.2} ${-ry*0.5} L ${-rx*0.5} ${-ry*1.4} L 0 ${-ry*1.3} L ${rx*0.5} ${-ry*1.4} L ${rx*1.2} ${-ry*0.5} L ${rx*1.1} 0 L ${rx} 0 Q ${rx} ${-ry} 0 ${-ry} Q ${-rx} ${-ry} ${-rx} 0 Z`} fill={color} />;
  }
}

function GlassesSvg({ color, rx }: { color: string; rx: number }) {
  const fw = rx * 2.2;
  const lr = rx * 0.45;
  return (
    <g fill="none" stroke={color} strokeWidth={0.8}>
      <circle cx={-fw/4 - 0.5} cy={-1} r={lr} fill={color === "#1a1a2e" ? "rgba(0,0,0,0.5)" : "none"} />
      <circle cx={fw/4 + 0.5} cy={-1} r={lr} fill={color === "#1a1a2e" ? "rgba(0,0,0,0.5)" : "none"} />
      <line x1={-fw/4 + lr} y1={-1} x2={fw/4 - lr} y2={-1} />
      <line x1={-fw/4 - lr} y1={-1} x2={-fw/2} y2={-2} />
      <line x1={fw/4 + lr} y1={-1} x2={fw/2} y2={-2} />
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main Audience Component
// ---------------------------------------------------------------------------

export function AnimatedAudience({ emotion }: { emotion: Emotion | null }) {
  const layout = useMemo(() => buildAudienceLayout(), []);
  const confetti = useMemo(() => buildConfetti(), []);
  const effectiveEmotion = emotion ?? "neutral";
  const isPartyMode = effectiveEmotion === "happy" || effectiveEmotion === "surprised";

  return (
    <div
      className="relative flex w-full items-end justify-center overflow-hidden rounded-lg border border-border bg-gray-900 py-4"
      aria-hidden="true"
    >
      <div className="absolute inset-0 pointer-events-none opacity-50 audience-spotlights" />

      <svg
        viewBox="0 0 700 280"
        className="relative z-10 h-48 w-full max-w-4xl shrink-0 sm:h-56 md:h-72"
        preserveAspectRatio="xMidYMax meet"
      >
        {layout.map((person) => (
          <PersonDetailed
            key={person.index}
            layout={person}
            emotion={effectiveEmotion}
            variant={getPersonVariant(person.index)}
            animationDelay={getStaggerDelay(person.index)}
            appearance={getPersonAppearance(person.index)}
          />
        ))}

        {isPartyMode && (
          <g>
            {confetti.map((p, i) => (
              <circle
                key={i}
                cx={p.cx}
                cy={p.cy}
                r={2}
                fill={p.color}
                className="audience-confetti-particle"
                style={{ animationDelay: `${p.delay}s` }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detailed Person Component
// ---------------------------------------------------------------------------

function PersonDetailed({
  layout,
  emotion,
  variant,
  animationDelay,
  appearance,
}: {
  layout: PersonLayout;
  emotion: Emotion;
  variant: number;
  animationDelay: number;
  appearance: PersonAppearance;
}) {
  const { x, baseY, scale } = layout;
  const {
    skinTone, earTone, hairColor, shirtColor, hairStyle,
    hasGlasses, glassesColor, shirtStyle,
    facialHair, headwear, headwearColor,
    propType, propColor, propHand
  } = appearance;

  const headRx = 9.5;
  const headRy = 10.5;
  const headCy = -26;
  const face = getFaceExpression(emotion);
  const { bodyClass, headClass, leftArmClass, rightArmClass } = getAnimationClasses({ emotion, variant });

  const armLength = 16;
  const shoulderX = 8;
  const shoulderY = -12;
  const torsoWidth = 22;

  const showLeftProp = propType > 0 && propHand === "left";
  const showRightProp = propType > 0 && propHand === "right";

  return (
    <g style={{ transform: `translate(${x}px, ${baseY}px) scale(${scale})` }}>
      <g className={bodyClass} style={{ animationDelay: `${animationDelay}ms` }}>

        {/* Torso */}
        <g>
          <rect x={-torsoWidth/2} y={-18} width={torsoWidth} height={30} rx={4} ry={4} fill={shirtColor} />
          <g opacity="0.15">
            {shirtStyle === 2 && <path d="M -11 -14 H 11 M -11 -8 H 11 M -11 -2 H 11" stroke="black" strokeWidth={2} fill="none" />}
            {shirtStyle === 3 && <g fill="black"><circle cx={-5} cy={-12} r={1} /><circle cx={5} cy={-12} r={1} /><circle cx={0} cy={-6} r={1} /><circle cx={-6} cy={0} r={1} /><circle cx={6} cy={0} r={1} /></g>}
            {shirtStyle === 4 && <path d="M 0 -10 L 3 -2 L -3 -2 Z" fill="black" />}
          </g>
        </g>

        {/* Neck */}
        <rect x={-3.5} y={-22} width={7} height={6} fill={skinTone} />
        <ellipse cx={0} cy={-18} rx={4} ry={1.5} fill="rgba(0,0,0,0.15)" />

        {/* Left arm */}
        <g className={leftArmClass} style={{ transformOrigin: `${-shoulderX}px ${shoulderY}px`, animationDelay: `${animationDelay}ms` }}>
          <line x1={-shoulderX} y1={shoulderY} x2={-shoulderX - armLength} y2={shoulderY + armLength} stroke={skinTone} strokeWidth={4} strokeLinecap="round" />
          <circle cx={-shoulderX - armLength} cy={shoulderY + armLength} r={3} fill={skinTone} />
          {showLeftProp && (
            <g transform={`translate(${-shoulderX - armLength}, ${shoulderY + armLength})`}>
              <PropSvg type={propType} color={propColor} emotion={emotion} isLeftHand={true} />
            </g>
          )}
        </g>

        {/* Right arm */}
        <g className={rightArmClass} style={{ transformOrigin: `${shoulderX}px ${shoulderY}px`, animationDelay: `${animationDelay}ms` }}>
          <line x1={shoulderX} y1={shoulderY} x2={shoulderX + armLength} y2={shoulderY + armLength} stroke={skinTone} strokeWidth={4} strokeLinecap="round" />
          <circle cx={shoulderX + armLength} cy={shoulderY + armLength} r={3} fill={skinTone} />
          {showRightProp && (
            <g transform={`translate(${shoulderX + armLength}, ${shoulderY + armLength})`}>
              <PropSvg type={propType} color={propColor} emotion={emotion} isLeftHand={false} />
            </g>
          )}
        </g>

        {/* Head Group */}
        <g className={headClass} style={{ transformOrigin: `0px ${headCy}px` }}>
          {/* Chin shadow */}
          <ellipse cx={0} cy={headCy + headRy} rx={5} ry={1.5} fill="rgba(0,0,0,0.1)" />
          {/* Ears (darkened color, NO filter) */}
          <ellipse cx={-headRx} cy={headCy} rx={2} ry={3} fill={earTone} />
          <ellipse cx={headRx} cy={headCy} rx={2} ry={3} fill={earTone} />
          {/* Head */}
          <ellipse cx={0} cy={headCy} rx={headRx} ry={headRy} fill={skinTone} />

          {/* Facial Hair */}
          <g transform={`translate(0, ${headCy})`}>
            <FacialHairSvg type={facialHair} color={hairColor} rx={headRx} ry={headRy} />
          </g>

          {/* Cheeks */}
          <g style={{ opacity: face.cheeksOpacity }}>
            <circle cx={-5} cy={headCy + 3} r={2.5} fill="#ffb7b2" />
            <circle cx={5} cy={headCy + 3} r={2.5} fill="#ffb7b2" />
          </g>

          {/* Hair */}
          <g transform={`translate(0, ${headCy})`}>
            <HairSvg style={hairStyle} color={hairColor} rx={headRx} ry={headRy} headwear={headwear} />
          </g>

          {/* Eyes */}
          <g transform={`translate(-3.5, ${headCy + 0.5 + face.eyeOffsetY})`} className="audience-eye-blink" style={{ animationDelay: `${animationDelay + 1200}ms` }}>
            <ellipse rx={face.eyeRadiusX} ry={face.eyeRadiusY} fill="#1a1a2e" />
            <circle cx={face.eyeRadiusX * 0.3} cy={-face.eyeRadiusY * 0.3} r={0.5} fill="white" opacity={0.8} />
          </g>
          <g transform={`translate(3.5, ${headCy + 0.5 + face.eyeOffsetY})`} className="audience-eye-blink" style={{ animationDelay: `${animationDelay + 1400}ms` }}>
            <ellipse rx={face.eyeRadiusX} ry={face.eyeRadiusY} fill="#1a1a2e" />
            <circle cx={face.eyeRadiusX * 0.3} cy={-face.eyeRadiusY * 0.3} r={0.5} fill="white" opacity={0.8} />
          </g>

          {/* Eyebrows */}
          <g>
            <line x1={-5.5} y1={headCy - 3.5 + face.browOffsetY} x2={-1.5} y2={headCy - 3.5 + face.browOffsetY} stroke="#1a1a2e" strokeWidth={0.8} strokeLinecap="round" transform={`rotate(${face.browRotateLeft}, -3.5, ${headCy - 3.5})`} />
            <line x1={1.5} y1={headCy - 3.5 + face.browOffsetY} x2={5.5} y2={headCy - 3.5 + face.browOffsetY} stroke="#1a1a2e" strokeWidth={0.8} strokeLinecap="round" transform={`rotate(${face.browRotateRight}, 3.5, ${headCy - 3.5})`} />
          </g>

          {/* Glasses */}
          {hasGlasses && (
            <g transform={`translate(0, ${headCy + 0.5})`}>
              <GlassesSvg color={glassesColor} rx={headRx} />
            </g>
          )}

          {/* Mouth */}
          <g transform={`translate(0, ${headCy + 6})`}>
            <path d={face.mouthPath} fill={emotion === "surprised" ? "#1a1a2e" : "none"} stroke="#1a1a2e" strokeWidth={0.8} strokeLinecap="round" />
          </g>

          {/* Headwear (top layer) */}
          {headwear > 0 && (
            <g transform={`translate(0, ${headCy})`}>
              <HeadwearSvg type={headwear} color={headwearColor} rx={headRx} ry={headRy} />
            </g>
          )}
        </g>
      </g>
    </g>
  );
}
