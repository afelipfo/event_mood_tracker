"use client";

import { useState } from "react";
import { useEmotionTracking } from "@/hooks/use-emotion-tracking";
import type { Emotion } from "@/hooks/use-emotion-tracking";
import { useMoodTimeline } from "@/hooks/use-mood-timeline";
import { MoodCharts } from "@/components/mood-charts";
import { FloatingEmojis } from "@/components/floating-emojis";
import { EngagementScoreGauge } from "@/components/engagement-score-gauge";
import { EventikChat } from "@/components/eventik-chat";

/* ── Emotion display config ── */
const EMOTION_LABELS: Record<Emotion, string> = {
  happy: "Happy",
  neutral: "Neutral",
  surprised: "Surprised",
  sad: "Sad",
  angry: "Angry",
  bored: "Bored",
};

const EMOTION_BAR_COLORS: Record<Emotion, string> = {
  happy: "bg-[hsl(43,96%,58%)]",
  neutral: "bg-[hsl(220,12%,50%)]",
  surprised: "bg-[hsl(32,95%,55%)]",
  sad: "bg-[hsl(215,60%,50%)]",
  angry: "bg-[hsl(348,72%,52%)]",
  bored: "bg-[hsl(270,50%,58%)]",
};

const EMOTION_GLOW_CLASS: Record<Emotion, string> = {
  happy: "emotion-glow-happy",
  neutral: "emotion-glow-neutral",
  surprised: "emotion-glow-surprised",
  sad: "emotion-glow-sad",
  angry: "emotion-glow-angry",
  bored: "emotion-glow-bored",
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
  const [showEmojis, setShowEmojis] = useState(true);

  const [saving, setSaving] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleEndEvent = async () => {
    stopTracking();
    setSaving(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalDetections,
          dominantMood: dominantEventEmotion,
          emotionPercentages,
          timelineData: timeline,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.session) {
          setSessionId(data.session.id);
        }
      }
    } catch (err) {
      console.error("Failed to save session:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <FloatingEmojis
        emotion={status === "tracking" && showEmojis ? currentEmotion : null}
      />
      <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {/* ── Error display ── */}
          {error && (
            <div className="mb-8 animate-fade-in rounded-xl border border-[hsl(348,72%,52%,0.2)] bg-[hsl(348,72%,52%,0.06)] px-5 py-4 text-sm text-[hsl(348,72%,80%)]">
              {error}
            </div>
          )}

          {/* ════════════════════════════════════════════
              IDLE STATE
          ════════════════════════════════════════════ */}
          {status === "idle" && (
            <div className="flex flex-col items-center gap-10">
              {/* Headline */}
              <div className="space-y-4 text-center">
                <p
                  className="animate-fade-in text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground"
                  style={{ animationDelay: "0ms" }}
                >
                  Real-time emotion analysis
                </p>
                <h1
                  className="animate-fade-in font-serif text-5xl leading-[1.1] tracking-tight text-foreground sm:text-6xl"
                  style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                >
                  Event Mood
                  <br />
                  <span className="text-primary">Tracker</span>
                </h1>
                <p
                  className="animate-fade-in mx-auto max-w-xs text-sm leading-relaxed text-muted-foreground"
                  style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
                >
                  Detect the emotional pulse of your audience through facial
                  expression analysis, live from your webcam.
                </p>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={startTracking}
                className="animate-fade-in group relative rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
                style={{ animationDelay: "350ms", animationFillMode: "backwards" }}
              >
                Begin Tracking
              </button>

              {/* Privacy footnote */}
              <p
                className="animate-fade-in text-center text-[11px] leading-relaxed text-muted-foreground/60"
                style={{ animationDelay: "450ms", animationFillMode: "backwards" }}
              >
                No video or images are stored.
                <br />
                Only aggregated statistics are kept in memory.
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════
              VIDEO ELEMENT
              Always rendered so videoRef is available
          ════════════════════════════════════════════ */}
          <div
            className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${
              status === "loading" || status === "tracking"
                ? "block"
                : "hidden"
            } ${
              currentEmotion
                ? EMOTION_GLOW_CLASS[currentEmotion]
                : "ambient-glow"
            }`}
          >
            {/* Border glow ring */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] -z-0" />

            <div
              className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card ${
                status === "loading" ? "aspect-video" : ""
              }`}
            >
              {/*
                The video is rendered as a block element at full width so its
                natural aspect ratio determines the container height. This
                avoids distortion on mobile cameras (which often output 4:3 or
                portrait feeds) and keeps percentage-based bounding boxes
                aligned perfectly.
              */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="block w-full"
                aria-label="Live webcam feed for emotion detection"
              />

              {/* Face Bounding Boxes Overlay */}
              {status === "tracking" &&
                faceBoxes.map((box, idx) => (
                  <div
                    key={idx}
                    className="absolute rounded-md border border-primary/60 bg-primary/[0.06] transition-all duration-100 ease-linear"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  />
                ))}

              {/* Loading overlay */}
              {status === "loading" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card/90 backdrop-blur-sm">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-primary animate-pulse-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Loading face detection models
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ════════════════════════════════════════════
              TRACKING STATE
          ════════════════════════════════════════════ */}
          {status === "tracking" && (
            <div className="mt-8 flex flex-col gap-8 animate-fade-in">
              {/* Current dominant emotion */}
              {currentEmotion && (
                <div className="text-center">
                  <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                    Current Mood
                  </p>
                  <p className="mt-2 font-serif text-4xl tracking-tight text-foreground">
                    {EMOTION_LABELS[currentEmotion]}
                  </p>
                </div>
              )}

              {/* Engagement gauge + Live distribution */}
              <div className="flex items-start gap-6">
                <EngagementScoreGauge emotionPercentages={emotionPercentages} />

                {/* Live emotion distribution */}
                <div className="glass-card min-w-0 flex-1 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Live Distribution
                    </h2>
                    <span className="text-[10px] tabular-nums text-muted-foreground/60">
                      {totalDetections} detections
                    </span>
                  </div>

                  <div className="space-y-3">
                    {emotions.map((emotion) => (
                      <div key={emotion} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-foreground/70">
                            {EMOTION_LABELS[emotion]}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {emotionPercentages[emotion]}%
                          </span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${EMOTION_BAR_COLORS[emotion]} ${
                              currentEmotion === emotion
                                ? "opacity-100"
                                : "opacity-60"
                            }`}
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
              </div>

              {/* Mood timeline / heatmap charts */}
              <div className="glass-card p-6 space-y-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Mood Over Time
                </h2>
                <MoodCharts data={timeline} />
              </div>

              {/* Toggle floating emojis */}
              <label className="flex items-center justify-center gap-3 cursor-pointer select-none">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Floating Emojis
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showEmojis}
                  onClick={() => setShowEmojis((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                    showEmojis ? "bg-primary" : "bg-white/[0.08]"
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform ${
                      showEmojis ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* End Event button */}
              <button
                type="button"
                onClick={handleEndEvent}
                disabled={saving}
                className="w-full rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-foreground disabled:opacity-50"
              >
                {saving ? "Saving..." : "End Session"}
              </button>
            </div>
          )}

          {/* ════════════════════════════════════════════
              SUMMARY STATE
          ════════════════════════════════════════════ */}
          {status === "summary" && (
            <div className="flex flex-col gap-8">
              {/* Header */}
              <div
                className="text-center animate-fade-in"
                style={{ animationDelay: "0ms" }}
              >
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
                  Session Complete
                </p>
                <h2 className="mt-2 font-serif text-3xl tracking-tight text-foreground">
                  Event Summary
                </h2>
              </div>

              {totalDetections === 0 ? (
                <p className="animate-fade-in text-center text-sm text-muted-foreground">
                  No faces were detected during the event.
                </p>
              ) : (
                <>
                  {/* Stats row */}
                  <div
                    className="grid grid-cols-2 gap-3 animate-fade-in"
                    style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
                  >
                    {/* Total detections */}
                    <div className="glass-card px-5 py-4 text-center">
                      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Detections
                      </p>
                      <p className="mt-1.5 text-3xl font-light tabular-nums text-foreground">
                        {totalDetections}
                      </p>
                    </div>

                    {/* Dominant mood */}
                    {dominantEventEmotion && (
                      <div className="glass-card px-5 py-4 text-center">
                        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                          Dominant
                        </p>
                        <p className="mt-1.5 font-serif text-2xl tracking-tight text-primary">
                          {EMOTION_LABELS[dominantEventEmotion]}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Engagement gauge + Emotion breakdown */}
                  <div
                    className="flex items-start gap-6 animate-slide-up"
                    style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
                  >
                    <EngagementScoreGauge emotionPercentages={emotionPercentages} />

                    <div
                      className="glass-card min-w-0 flex-1 p-6 space-y-4"
                    >
                      <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Emotion Breakdown
                      </h3>

                      <div className="space-y-3">
                        {emotions.map((emotion, i) => (
                          <div
                            key={emotion}
                            className="space-y-1.5 animate-fade-in"
                            style={{
                              animationDelay: `${350 + i * 80}ms`,
                              animationFillMode: "backwards",
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-foreground/70">
                                {EMOTION_LABELS[emotion]}
                              </span>
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {emotionPercentages[emotion]}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.04]">
                              <div
                                className={`h-full rounded-full ${EMOTION_BAR_COLORS[emotion]} ${
                                  dominantEventEmotion === emotion
                                    ? "opacity-100"
                                    : "opacity-50"
                                }`}
                                style={{
                                  width: `${emotionPercentages[emotion]}%`,
                                  animation: "bar-fill 0.8s ease-out",
                                  animationDelay: `${400 + i * 80}ms`,
                                  animationFillMode: "backwards",
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
                  </div>

                  {/* Mood timeline / heatmap charts */}
                  {timeline.length > 0 && (
                    <div
                      className="glass-card p-6 space-y-3 animate-slide-up"
                      style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
                    >
                      <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                        Mood Over Time
                      </h3>
                      <MoodCharts data={timeline} />
                    </div>
                  )}

                  {/* Eventik Chatbot */}
                  <div
                    className="glass-card p-6 space-y-3 animate-slide-up"
                    style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
                  >
                    <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Eventik Analysis
                    </h3>
                    <EventikChat sessionId={sessionId} />
                  </div>
                </>
              )}

              {/* New Session button */}
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="animate-fade-in w-full rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
                style={{ animationDelay: "500ms", animationFillMode: "backwards" }}
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
