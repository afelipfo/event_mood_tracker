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
      <TabsList className="w-full">
        <TabsTrigger value="timeline" className="flex-1">
          Timeline
        </TabsTrigger>
        <TabsTrigger value="heatmap" className="flex-1">
          Heatmap
        </TabsTrigger>
      </TabsList>
      <TabsContent value="timeline">
        <MoodTimelineChart data={data} />
      </TabsContent>
      <TabsContent value="heatmap">
        <MoodHeatmapChart data={data} />
      </TabsContent>
    </Tabs>
  );
}
