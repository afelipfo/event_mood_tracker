"use client";

import { useEmotionTracking } from "@/hooks/use-emotion-tracking";
import type { Emotion } from "@/hooks/use-emotion-tracking";
import { useMoodTimeline } from "@/hooks/use-mood-timeline";
import { MoodCharts } from "@/components/mood-charts";
import { FloatingEmojis } from "@/components/floating-emojis";
import { EngagementScoreGauge } from "@/components/engagement-score-gauge";
import { EventikChat } from "@/components/eventik-chat";

// Labels for each emotion to display in the UI
const EMOTION_LABELS: Record<Emotion, string> = {
  happy: "Happy",
  neutral: "Neutral",
  surprised: "Surprised",
  sad: "Sad",
  angry: "Angry",
  bored: "Bored",
};

// Simple color mapping for progress bars (Tailwind bg classes)
const EMOTION_COLORS: Record<Emotion, string> = {
  happy: "bg-emerald-500",
  neutral: "bg-slate-400",
  surprised: "bg-amber-500",
  sad: "bg-blue-500",
  angry: "bg-red-500",
  bored: "bg-purple-500",
};

export default function Page() {
  const {
    status,
    currentEmotion,
    totalDetections,
    emotionPercentages,
    dominantEventEmotion,
    emotionCounts,
    videoRef,
    startTracking,
    stopTracking,
    error,
    emotions,
    faceBoxes,
  } = useEmotionTracking();

  const { timeline } = useMoodTimeline(emotionCounts, status === "tracking");

  return (
    <>
      <FloatingEmojis emotion={status === "tracking" ? currentEmotion : null} />
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-2xl">
          {/* Application Title */}
          <h1 className="mb-2 text-center text-3xl font-bold tracking-tight text-foreground">
            Event Mood Tracker
          </h1>
          <p className="mb-8 text-center text-sm text-muted-foreground">
            Detect audience mood in real-time using facial expression analysis
          </p>

          {/* Error display */}
          {error && (
            <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* ========== IDLE STATE ========== */}
          {status === "idle" && (
            <div className="flex flex-col items-center gap-6">
              <p className="text-center text-muted-foreground">
                Click the button below to start tracking the mood of your
                audience using your webcam.
              </p>
              <button
                type="button"
                onClick={startTracking}
                className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Start Mood Tracking
              </button>
              <p className="text-center text-xs text-muted-foreground">
                No video or images are stored. Only aggregated emotion
                statistics are kept in memory.
              </p>
            </div>
          )}

          {/* 
          Video element is always rendered so videoRef is available when 
          the hook attaches the stream during the loading phase.
          It is hidden until we are in "loading" or "tracking" state.
        */}
          <div
            className={`relative aspect-video overflow-hidden rounded-md border border-border bg-muted ${status === "loading" || status === "tracking" ? "block" : "hidden"
              }`}
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              /* 
                      Using object-fill ensures that the video stretches to fill the container 100%. 
                      This guarantees that our percentage-based bounding boxes (calculated from source 
                      dimensions) align perfectly with the displayed video, even if it distorts slightly.
                    */
              className="absolute inset-0 h-full w-full object-fill"
              aria-label="Live webcam feed for emotion detection"
            />
            {status === "loading" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted/80">
                <p className="text-sm text-muted-foreground">
                  Loading face detection models...
                </p>
                <p className="text-xs text-muted-foreground">Please wait</p>
              </div>
            )}

            {/* Face Bounding Boxes Overlay */}
            {status === "tracking" &&
              faceBoxes.map((box, idx) => (
                <div
                  key={idx}
                  className="absolute border-2 border-primary/80 bg-primary/10 transition-all duration-100 ease-linear"
                  style={{
                    left: `${box.x}%`,
                    top: `${box.y}%`,
                    width: `${box.width}%`,
                    height: `${box.height}%`,
                  }}
                />
              ))}
          </div>

          {/* ========== TRACKING STATE ========== */}
          {status === "tracking" && (
            <div className="mt-6 flex flex-col gap-6">
              {/* Current dominant emotion */}
              {currentEmotion && (
                <div className="text-center">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Current Mood
                  </span>
                  <p className="mt-1 text-2xl font-bold text-foreground">
                    {EMOTION_LABELS[currentEmotion]}
                  </p>
                </div>
              )}

              {/* Engagement gauge + Live distribution side by side */}
              <div className="flex items-center gap-6">
                <EngagementScoreGauge emotionPercentages={emotionPercentages} />

                {/* Live emotion percentage distribution */}
                <div className="min-w-0 flex-1 space-y-3">
                  <h2 className="text-sm font-medium text-foreground">
                    Live Distribution
                  </h2>
                  {emotions.map((emotion) => (
                    <div key={emotion} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{EMOTION_LABELS[emotion]}</span>
                        <span>{emotionPercentages[emotion]}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${EMOTION_COLORS[emotion]}`}
                          style={{
                            width: `${emotionPercentages[emotion]}%`,
                          }}
                          role="progressbar"
                          aria-valuenow={emotionPercentages[emotion]}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${EMOTION_LABELS[emotion]} percentage`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mood timeline / heatmap charts */}
              <div className="space-y-2">
                <h2 className="text-sm font-medium text-foreground">
                  Mood Over Time
                </h2>
                <MoodCharts data={timeline} />
              </div>

              {/* Total detections counter */}
              <p className="text-center text-xs text-muted-foreground">
                Total detections: {totalDetections}
              </p>

              {/* End Event button */}
              <button
                type="button"
                onClick={stopTracking}
                className="w-full rounded-md border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-opacity hover:bg-muted"
              >
                End Event
              </button>
            </div>
          )}

          {/* ========== SUMMARY STATE ========== */}
          {status === "summary" && (
            <div className="flex flex-col gap-6">
              <h2 className="text-center text-xl font-semibold text-foreground">
                Event Summary
              </h2>

              {totalDetections === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No faces were detected during the event.
                </p>
              ) : (
                <>
                  {/* Total detections */}
                  <div className="rounded-md border border-border bg-muted/50 px-4 py-3 text-center">
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Total Detections
                    </span>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {totalDetections}
                    </p>
                  </div>

                  {/* Dominant mood of the event */}
                  {dominantEventEmotion && (
                    <div className="rounded-md border border-border bg-muted/50 px-4 py-3 text-center">
                      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Dominant Mood
                      </span>
                      <p className="mt-1 text-2xl font-bold text-foreground">
                        {EMOTION_LABELS[dominantEventEmotion]}
                      </p>
                    </div>
                  )}

                  {/* Engagement gauge + Emotion breakdown side by side */}
                  <div className="flex items-center gap-6">
                    <EngagementScoreGauge
                      emotionPercentages={emotionPercentages}
                    />

                    <div className="min-w-0 flex-1 space-y-3">
                      <h3 className="text-sm font-medium text-foreground">
                        Emotion Breakdown
                      </h3>
                      {emotions.map((emotion) => (
                        <div key={emotion} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{EMOTION_LABELS[emotion]}</span>
                            <span>{emotionPercentages[emotion]}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${EMOTION_COLORS[emotion]}`}
                              style={{
                                width: `${emotionPercentages[emotion]}%`,
                              }}
                              role="progressbar"
                              aria-valuenow={emotionPercentages[emotion]}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${EMOTION_LABELS[emotion]} percentage`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mood timeline / heatmap charts */}
                  {timeline.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium text-foreground">
                        Mood Over Time
                      </h3>
                      <MoodCharts data={timeline} />
                    </div>
                  )}

                  {/* Eventik Chatbot */}
                  <div className="space-y-2 mt-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Eventik Analysis
                    </h3>
                    <EventikChat
                      emotionCounts={emotionCounts}
                      totalDetections={totalDetections}
                      emotionPercentages={emotionPercentages}
                      dominantMood={
                        dominantEventEmotion
                          ? EMOTION_LABELS[dominantEventEmotion]
                          : null
                      }
                    />
                  </div>
                </>
              )}

              {/* Restart button to go back to idle state */}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                Start New Session
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
