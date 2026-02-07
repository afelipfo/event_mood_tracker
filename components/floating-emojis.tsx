"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Emotion } from "@/hooks/use-emotion-tracking";

const EMOTION_EMOJIS: Record<Emotion, string[]> = {
  happy: ["😊", "🎉", "😄", "✨"],
  surprised: ["😮", "😲", "🤯", "⚡"],
  sad: ["😢", "😿", "💧", "🥺"],
  angry: ["😠", "🔥", "💢", "😤"],
  neutral: ["😐", "🫥"],
  bored: ["😴", "🥱", "💤"],
};

/** Max concurrent floating emojis on screen */
const MAX_EMOJIS = 12;
/** How often (ms) a new emoji spawns */
const SPAWN_INTERVAL_MS = 400;

/**
 * Purely visual component — spawns floating emoji <span> elements
 * that drift upward when a dominant emotion is detected.
 * No logic changes; just reads the current emotion.
 */
export function FloatingEmojis({ emotion }: { emotion: Emotion | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const countRef = useRef(0);

  const spawnEmoji = useCallback(() => {
    const container = containerRef.current;
    if (!container || !emotion) return;
    if (countRef.current >= MAX_EMOJIS) return;

    const emojis = EMOTION_EMOJIS[emotion];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const span = document.createElement("span");
    span.textContent = emoji;
    span.className = "floating-emoji";
    span.style.left = `${Math.random() * 100}%`;
    span.style.animationDuration = `${2.5 + Math.random() * 2}s`;
    span.style.fontSize = `${1.4 + Math.random() * 1.2}rem`;

    countRef.current += 1;

    span.addEventListener("animationend", () => {
      span.remove();
      countRef.current -= 1;
    });

    container.appendChild(span);
  }, [emotion]);

  useEffect(() => {
    if (!emotion) return;

    const id = setInterval(spawnEmoji, SPAWN_INTERVAL_MS);
    return () => clearInterval(id);
  }, [emotion, spawnEmoji]);

  // Reset count when emotion goes null (tracking stops)
  useEffect(() => {
    if (!emotion) {
      countRef.current = 0;
    }
  }, [emotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    />
  );
}
