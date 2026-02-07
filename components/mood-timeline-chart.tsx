"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MoodSnapshot } from "@/hooks/use-mood-timeline";

/** Colors matched to the global emotion palette */
const chartConfig = {
  happy: { label: "Happy", color: "hsl(43, 96%, 58%)" },
  neutral: { label: "Neutral", color: "hsl(220, 12%, 50%)" },
  surprised: { label: "Surprised", color: "hsl(32, 95%, 55%)" },
  sad: { label: "Sad", color: "hsl(215, 60%, 50%)" },
  angry: { label: "Angry", color: "hsl(348, 72%, 52%)" },
  bored: { label: "Bored", color: "hsl(270, 50%, 58%)" },
} satisfies ChartConfig;

const EMOTION_KEYS = Object.keys(chartConfig) as Array<
  keyof typeof chartConfig
>;

interface MoodTimelineChartProps {
  data: MoodSnapshot[];
}

export function MoodTimelineChart({ data }: MoodTimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]">
        <p className="text-center text-xs text-muted-foreground/60 px-4">
          Timeline will appear after the first 30 seconds of tracking.
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-56 w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsla(220, 10%, 50%, 0.08)"
        />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
          width={36}
          tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => `${label} elapsed`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        {EMOTION_KEYS.map((emotion) => (
          <Line
            key={emotion}
            type="monotone"
            dataKey={emotion}
            stroke={`var(--color-${emotion})`}
            strokeWidth={1.5}
            dot={{ r: 2.5, strokeWidth: 0 }}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
