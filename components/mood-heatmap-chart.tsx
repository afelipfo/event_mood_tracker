"use client";

import { useMemo } from "react";
import type { MoodSnapshot } from "@/hooks/use-mood-timeline";

const EMOTIONS = [
  "happy",
  "neutral",
  "surprised",
  "sad",
  "angry",
  "bored",
] as const;

const EMOTION_LABELS: Record<(typeof EMOTIONS)[number], string> = {
  happy: "Happy",
  neutral: "Neutral",
  surprised: "Surprised",
  sad: "Sad",
  angry: "Angry",
  bored: "Bored",
};

/** HSL hue + saturation for each emotion (lightness/opacity will vary) */
const EMOTION_HSL: Record<(typeof EMOTIONS)[number], [number, number]> = {
  happy: [160, 84],
  neutral: [215, 14],
  surprised: [38, 92],
  sad: [217, 91],
  angry: [0, 84],
  bored: [270, 50],
};

interface MoodHeatmapChartProps {
  data: MoodSnapshot[];
}

export function MoodHeatmapChart({ data }: MoodHeatmapChartProps) {
  /** Pre-compute the max value across all cells for relative scaling */
  const maxValue = useMemo(() => {
    let max = 0;
    for (const snapshot of data) {
      for (const emotion of EMOTIONS) {
        if (snapshot[emotion] > max) max = snapshot[emotion];
      }
    }
    return max || 1; // avoid division by zero
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
        <p className="text-center text-sm text-muted-foreground px-4">
          Mood heatmap will appear here after the first 30 seconds of tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `4rem repeat(${data.length}, minmax(2.5rem, 1fr))`,
          gridTemplateRows: `1.5rem repeat(${EMOTIONS.length}, 2rem)`,
        }}
      >
        {/* Top-left empty corner */}
        <div />

        {/* Column headers (time labels) */}
        {data.map((snapshot) => (
          <div
            key={snapshot.label}
            className="flex items-end justify-center text-[10px] text-muted-foreground truncate px-0.5"
          >
            {snapshot.label}
          </div>
        ))}

        {/* Rows: one per emotion */}
        {EMOTIONS.map((emotion) => (
          <>
            {/* Row label */}
            <div
              key={`label-${emotion}`}
              className="flex items-center text-xs text-muted-foreground pr-2 justify-end"
            >
              {EMOTION_LABELS[emotion]}
            </div>

            {/* Cells */}
            {data.map((snapshot) => {
              const value = snapshot[emotion];
              const intensity = value / maxValue;
              const [h, s] = EMOTION_HSL[emotion];

              return (
                <div
                  key={`${emotion}-${snapshot.label}`}
                  className="rounded-sm transition-colors group relative"
                  style={{
                    backgroundColor: `hsla(${h}, ${s}%, 50%, ${intensity * 0.9 + 0.05})`,
                  }}
                  title={`${EMOTION_LABELS[emotion]} at ${snapshot.label}: ${value}%`}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap rounded bg-popover border border-border px-2 py-1 text-[10px] text-popover-foreground shadow-md">
                    {EMOTION_LABELS[emotion]}: {value}%
                  </div>
                </div>
              );
            })}
          </>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-px">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map((opacity) => (
            <div
              key={opacity}
              className="h-3 w-5 rounded-sm"
              style={{
                backgroundColor: `hsla(215, 50%, 50%, ${opacity})`,
              }}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
