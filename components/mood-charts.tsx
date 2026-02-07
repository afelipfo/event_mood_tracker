"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MoodTimelineChart } from "@/components/mood-timeline-chart";
import { MoodHeatmapChart } from "@/components/mood-heatmap-chart";
import type { MoodSnapshot } from "@/hooks/use-mood-timeline";

interface MoodChartsProps {
  data: MoodSnapshot[];
}

export function MoodCharts({ data }: MoodChartsProps) {
  return (
    <Tabs defaultValue="timeline">
      <TabsList className="w-full bg-white/[0.04] border border-white/[0.06]">
        <TabsTrigger
          value="timeline"
          className="flex-1 text-xs uppercase tracking-[0.15em] data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground"
        >
          Timeline
        </TabsTrigger>
        <TabsTrigger
          value="heatmap"
          className="flex-1 text-xs uppercase tracking-[0.15em] data-[state=active]:bg-white/[0.08] data-[state=active]:text-foreground"
        >
          Heatmap
        </TabsTrigger>
      </TabsList>
      <TabsContent value="timeline" className="mt-3">
        <MoodTimelineChart data={data} />
      </TabsContent>
      <TabsContent value="heatmap" className="mt-3">
        <MoodHeatmapChart data={data} />
      </TabsContent>
    </Tabs>
  );
}
