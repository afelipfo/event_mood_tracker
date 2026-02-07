"use client";

import type { Emotion } from "@/hooks/use-emotion-tracking";

/**
 * Weight each emotion by its "engagement" value:
 *   happy (1.0) and surprised (0.8) = high engagement
 *   neutral (0.5) = mid engagement
 *   bored (0.15), sad (0.1), angry (0.0) = low engagement
 *
 * Score = Σ(weight_i × percentage_i), where percentages sum to ~100.
 */
const ENGAGEMENT_WEIGHTS: Record<Emotion, number> = {
  happy: 1.0,
  surprised: 0.8,
  neutral: 0.5,
  bored: 0.15,
  sad: 0.1,
  angry: 0.0,
};

function computeEngagementScore(
  emotionPercentages: Record<Emotion, number>,
): number {
  let score = 0;
  for (const [emotion, pct] of Object.entries(emotionPercentages)) {
    score += (ENGAGEMENT_WEIGHTS[emotion as Emotion] ?? 0) * pct;
  }
  return Math.round(Math.min(100, Math.max(0, score)));
}

function scoreColor(score: number): string {
  if (score >= 70) return "hsl(152, 60%, 48%)"; // green
  if (score >= 40) return "hsl(40, 90%, 55%)"; // amber
  return "hsl(0, 72%, 56%)"; // red
}

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Low";
  return "Very Low";
}

// --- SVG constants ---
const SIZE = 150;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface EngagementScoreGaugeProps {
  emotionPercentages: Record<Emotion, number>;
}

export function EngagementScoreGauge({
  emotionPercentages,
}: EngagementScoreGaugeProps) {
  const score = computeEngagementScore(emotionPercentages);
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = scoreColor(score);

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      {/* Ring + centered score */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
          aria-label={`Engagement score: ${score} out of 100`}
          role="img"
        >
          {/* Background track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={STROKE}
          />
          {/* Animated progress arc */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score number centered inside the ring */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold transition-colors duration-500"
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            / 100
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className="text-sm font-semibold transition-colors duration-500"
        style={{ color }}
      >
        {scoreLabel(score)}
      </span>
      <span className="text-xs text-muted-foreground">Engagement Score</span>
    </div>
  );
}
