"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { EmotionCounts } from "./use-emotion-tracking";

const EMOTIONS = ["happy", "neutral", "surprised", "sad", "angry"] as const;
const SNAPSHOT_INTERVAL_MS = 60_000; // 1 minute
const STORAGE_KEY = "mood-timeline";

export interface MoodSnapshot {
  timestamp: number;
  label: string;
  happy: number;
  neutral: number;
  surprised: number;
  sad: number;
  angry: number;
}

/**
 * Tracks mood over time by taking periodic snapshots of emotion distribution.
 *
 * Each snapshot captures the emotion percentages for the *interval* since the
 * previous snapshot (not cumulative), giving a clear picture of how mood
 * evolves during the event. Snapshots are persisted to localStorage.
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

    const snapshot: MoodSnapshot = {
      timestamp: Date.now(),
      label: `${minuteRef.current}m`,
      happy: Math.round((deltas.happy / totalDelta) * 100),
      neutral: Math.round((deltas.neutral / totalDelta) * 100),
      surprised: Math.round((deltas.surprised / totalDelta) * 100),
      sad: Math.round((deltas.sad / totalDelta) * 100),
      angry: Math.round((deltas.angry / totalDelta) * 100),
    };

    prevCountsRef.current = { ...current };

    setTimeline((prev) => {
      const updated = [...prev, snapshot];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // localStorage might be full or unavailable
      }
      return updated;
    });
  }, []);

  // Start/stop the snapshot interval based on tracking state
  useEffect(() => {
    if (!isTracking) return;

    // Reset for new session
    minuteRef.current = 0;
    prevCountsRef.current = { ...currentCountsRef.current };
    setTimeline([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }

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

  // Load persisted timeline on mount (survives page refresh)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as MoodSnapshot[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTimeline(parsed);
          minuteRef.current = parsed.length;
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  const clearTimeline = useCallback(() => {
    setTimeline([]);
    minuteRef.current = 0;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch { }
  }, []);

  return { timeline, clearTimeline };
}
