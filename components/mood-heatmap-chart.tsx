"use client";

import { useMemo, Fragment } from "react";
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

/** HSL hue + saturation for each emotion -- matched to the global palette */
const EMOTION_HSL: Record<(typeof EMOTIONS)[number], [number, number]> = {
  happy: [43, 96],
  neutral: [220, 12],
  surprised: [32, 95],
  sad: [215, 60],
  angry: [348, 72],
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
    return max || 1;
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]">
        <p className="text-center text-xs text-muted-foreground/60 px-4">
          Heatmap will appear after the first 30 seconds of tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `3.5rem repeat(${data.length}, minmax(2rem, 1fr))`,
          gridTemplateRows: `1.25rem repeat(${EMOTIONS.length}, 1.75rem)`,
        }}
      >
        {/* Top-left empty corner */}
        <div />

        {/* Column headers (time labels) */}
        {data.map((snapshot) => (
          <div
            key={snapshot.label}
            className="flex items-end justify-center text-[9px] text-muted-foreground/50 truncate px-0.5"
          >
            {snapshot.label}
          </div>
        ))}

        {/* Rows: one per emotion */}
        {EMOTIONS.map((emotion) => (
          <Fragment key={emotion}>
            {/* Row label */}
            <div
              key={`label-${emotion}`}
              className="flex items-center text-[10px] text-muted-foreground pr-2 justify-end"
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
                  className="rounded-[3px] transition-colors group relative"
                  style={{
                    backgroundColor: `hsla(${h}, ${s}%, 55%, ${intensity * 0.85 + 0.04})`,
                  }}
                  title={`${EMOTION_LABELS[emotion]} at ${snapshot.label}: ${value}%`}
                >
                  {/* Hover tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 whitespace-nowrap rounded-md bg-card border border-white/[0.08] px-2 py-1 text-[9px] text-foreground/80 shadow-lg">
                    {EMOTION_LABELS[emotion]}: {value}%
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-1.5 text-[9px] text-muted-foreground/50">
        <span>Low</span>
        <div className="flex gap-px">
          {[0.08, 0.25, 0.45, 0.65, 0.85].map((opacity) => (
            <div
              key={opacity}
              className="h-2.5 w-4 rounded-[2px]"
              style={{
                backgroundColor: `hsla(38, 92%, 55%, ${opacity})`,
              }}
            />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
