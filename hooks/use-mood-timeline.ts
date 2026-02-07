"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EmotionCounts } from "./use-emotion-tracking";

const EMOTIONS = ["happy", "neutral", "surprised", "sad", "angry", "bored"] as const;
const SNAPSHOT_INTERVAL_MS = 30_000; // 30 seconds

export interface MoodSnapshot {
  timestamp: number;
  label: string;
  happy: number;
  neutral: number;
  surprised: number;
  sad: number;
  angry: number;
  bored: number;
}

/**
 * Tracks mood over time by taking periodic snapshots of emotion distribution.
 *
 * SECURITY: All data is ephemeral (in-memory only). No localStorage, no
 * sessionStorage, no persistence. Data dies with the component/tab.
 * Timestamps use relative session offsets, not absolute Date.now() values,
 * to prevent temporal correlation attacks.
 */
export function useMoodTimeline(
  emotionCounts: EmotionCounts,
  isTracking: boolean
) {
  const [timeline, setTimeline] = useState<MoodSnapshot[]>([]);

  const prevCountsRef = useRef<EmotionCounts>({
    happy: 0,
    neutral: 0,
    surprised: 0,
    sad: 0,
    angry: 0,
    bored: 0,
  });
  const currentCountsRef = useRef<EmotionCounts>(emotionCounts);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minuteRef = useRef(0);

  // Keep ref in sync with the latest emotion counts
  useEffect(() => {
    currentCountsRef.current = emotionCounts;
  }, [emotionCounts]);

  const takeSnapshot = useCallback(() => {
    const current = currentCountsRef.current;
    const prev = prevCountsRef.current;

    let totalDelta = 0;
    const deltas: Record<string, number> = {};
    for (const emotion of EMOTIONS) {
      deltas[emotion] = current[emotion] - prev[emotion];
      totalDelta += deltas[emotion];
    }

    // Skip if no new detections occurred in this interval
    if (totalDelta === 0) return;

    minuteRef.current += 1;

    // Format label as relative offset m:ss (e.g. "0:30", "1:00", "1:30")
    // SECURITY: No absolute timestamps — only relative session offsets
    const totalSeconds = minuteRef.current * 30;
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const label = `${mins}:${secs.toString().padStart(2, "0")}`;

    const snapshot: MoodSnapshot = {
      timestamp: totalSeconds, // relative seconds since session start, NOT Date.now()
      label,
      happy: Math.round((deltas.happy / totalDelta) * 100),
      neutral: Math.round((deltas.neutral / totalDelta) * 100),
      surprised: Math.round((deltas.surprised / totalDelta) * 100),
      sad: Math.round((deltas.sad / totalDelta) * 100),
      angry: Math.round((deltas.angry / totalDelta) * 100),
      bored: Math.round((deltas.bored / totalDelta) * 100),
    };

    prevCountsRef.current = { ...current };

    // SECURITY: Data stored only in React state (ephemeral, in-memory)
    setTimeline((prev) => [...prev, snapshot]);
  }, []);

  // Start/stop the snapshot interval based on tracking state
  useEffect(() => {
    if (!isTracking) return;

    // Reset for new session
    minuteRef.current = 0;
    prevCountsRef.current = { ...currentCountsRef.current };
    setTimeline([]);

    intervalRef.current = setInterval(takeSnapshot, SNAPSHOT_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Capture any remaining data when tracking ends
      takeSnapshot();
    };
  }, [isTracking, takeSnapshot]);

  // SECURITY: No localStorage load on mount — data is ephemeral by design

  const clearTimeline = useCallback(() => {
    setTimeline([]);
    minuteRef.current = 0;
  }, []);

  return { timeline, clearTimeline };
}
