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

const chartConfig = {
  happy: { label: "Happy", color: "hsl(160, 84%, 39%)" },
  neutral: { label: "Neutral", color: "hsl(215, 14%, 64%)" },
  surprised: { label: "Surprised", color: "hsl(38, 92%, 50%)" },
  sad: { label: "Sad", color: "hsl(217, 91%, 60%)" },
  angry: { label: "Angry", color: "hsl(0, 84%, 60%)" },
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
      <div className="flex h-48 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
        <p className="text-center text-sm text-muted-foreground px-4">
          Mood timeline will appear here after the first 30 seconds of tracking.
        </p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <LineChart data={data} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
          width={40}
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
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}
