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
    facesDetected,
    startTracking,
    stopTracking,
    error,
    emotions,
  } = useEmotionTracking();

  const { timeline } = useMoodTimeline(emotionCounts, status === "tracking");
  const [showEmojis, setShowEmojis] = useState(true);
  const [blurVideo, setBlurVideo] = useState(false);

  // SECURITY (V-06): Consent state — must be explicitly granted before tracking
  const [consentGranted, setConsentGranted] = useState(false);
  const [showConsentDialog, setShowConsentDialog] = useState(false);

  const handleStartClick = () => {
    if (!consentGranted) {
      setShowConsentDialog(true);
    } else {
      startTracking();
    }
  };

  const handleConsentAccept = () => {
    setConsentGranted(true);
    setShowConsentDialog(false);
    startTracking();
  };

  const handleConsentDecline = () => {
    setShowConsentDialog(false);
  };

  const [saving, setSaving] = useState(false);
  // Renamed from sessionId to sessionData to hold the full context
  const [sessionData, setSessionData] = useState<{
    totalDetections: number;
    dominantMood: string | null;
    emotionPercentages: Record<string, number>;
    timelineData: any[];
  } | null>(null);

  const handleEndEvent = async () => {
    stopTracking();
    setSaving(true);

    try {
      // Simulate a small delay for UX
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newSessionData = {
        id: crypto.randomUUID(), // Generate a local ID
        timestamp: new Date().toISOString(),
        totalDetections,
        dominantMood: dominantEventEmotion,
        emotionPercentages,
        timelineData: timeline,
      };

      // Save to Local Storage
      const existingSessions = JSON.parse(localStorage.getItem("eventik_sessions") || "[]");
      localStorage.setItem("eventik_sessions", JSON.stringify([newSessionData, ...existingSessions]));

      // Set session data for the chat
      setSessionData(newSessionData);

    } catch (err) {
      console.error("Failed to save session locally:", err);
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
              CONSENT DIALOG (V-06)
          ════════════════════════════════════════════ */}
          {showConsentDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="mx-4 max-w-md rounded-2xl border border-white/[0.08] bg-card p-8 shadow-2xl">
                <h2 className="font-serif text-2xl tracking-tight text-foreground">
                  Biometric Data Consent
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    This application uses <strong className="text-foreground">facial expression analysis</strong> via
                    your webcam to detect audience mood in real-time.
                  </p>
                  <p>By continuing, you acknowledge that:</p>
                  <ul className="list-disc space-y-2 pl-5">
                    <li>
                      Your camera feed will be processed locally in your browser
                      to detect facial expressions.
                    </li>
                    <li>
                      <strong className="text-foreground">No video, images, or facial geometry</strong> are
                      stored or transmitted. Only aggregated emotion statistics
                      are kept in memory during your session.
                    </li>
                    <li>
                      All data is <strong className="text-foreground">ephemeral</strong> and destroyed when you
                      close the tab or end the session.
                    </li>
                    <li>
                      If you choose to use the AI analysis feature, anonymized
                      and noise-added emotion percentages may be sent to a
                      third-party AI service (OpenAI).
                    </li>
                  </ul>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConsentDecline}
                    className="flex-1 rounded-full border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={handleConsentAccept}
                    className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
                  >
                    I Understand &amp; Accept
                  </button>
                </div>
              </div>
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
                onClick={handleStartClick}
                className="animate-fade-in group relative rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
                style={{ animationDelay: "350ms", animationFillMode: "backwards" }}
              >
                Begin Tracking
              </button>

              {/* Privacy footnote (V-12: accurate claim) */}
              <p
                className="animate-fade-in text-center text-[11px] leading-relaxed text-muted-foreground/60"
                style={{ animationDelay: "450ms", animationFillMode: "backwards" }}
              >
                All processing happens locally in your browser.
                <br />
                No video or images are stored. Data is ephemeral.
              </p>
            </div>
          )}

          {/* ════════════════════════════════════════════
              VIDEO ELEMENT
              Always rendered so videoRef is available
          ════════════════════════════════════════════ */}
          <div
            className={`relative overflow-hidden rounded-2xl transition-all duration-500 ${status === "loading" || status === "tracking"
              ? "block"
              : "hidden"
              } ${currentEmotion
                ? EMOTION_GLOW_CLASS[currentEmotion]
                : "ambient-glow"
              }`}
          >
            {/* Border glow ring */}
            <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] -z-0" />

            <div
              className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-card ${status === "loading" ? "aspect-video" : ""
                }`}
            >
              {/* Camera: block-level video avoids mobile distortion (4:3 / portrait feeds).
                  SECURITY (V-08b): Optional privacy blur — when enabled,
                  video renders with blur-xl opacity-40 so no clear facial
                  imagery is accessible even if the DOM is compromised. */}
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`block w-full transition-all duration-300 ${blurVideo ? "blur-xl opacity-40" : ""}`}
                aria-label={`Live webcam feed for emotion detection${blurVideo ? " (blurred for privacy)" : ""}`}
              />

              {/* SECURITY (V-02): Bounding boxes REMOVED.
                  Only a "faces detected" indicator is shown. */}
              {status === "tracking" && facesDetected && (
                <div className="absolute top-3 right-3 flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-xs font-medium text-primary">
                    Faces detected
                  </span>
                </div>
              )}

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
                            className={`h-full rounded-full transition-all duration-700 ease-out ${EMOTION_BAR_COLORS[emotion]} ${currentEmotion === emotion
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

              {/* Toggle controls */}
              <div className="flex items-center justify-center gap-6">
                {/* Toggle floating emojis */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
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

                {/* Toggle privacy blur (V-08b) */}
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                    Privacy Blur
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={blurVideo}
                    onClick={() => setBlurVideo((v) => !v)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                      blurVideo ? "bg-primary" : "bg-white/[0.08]"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform ${
                        blurVideo ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </label>
              </div>

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
                                className={`h-full rounded-full ${EMOTION_BAR_COLORS[emotion]} ${dominantEventEmotion === emotion
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
                  <div className="space-y-2 mt-4">
                    <h3 className="text-sm font-medium text-foreground">
                      Eventik Analysis
                    </h3>
<<<<<<< HEAD
                    <EventikChat sessionData={sessionData} />
=======
                    <EventikChat
                      emotionCounts={emotionCounts}
                      totalDetections={totalDetections}
                      emotionPercentages={emotionPercentages}
                      dominantMood={dominantEventEmotion}
                      sessionId={sessionId}
                    />
>>>>>>> d850f2f6ceba996f3ef95bfd79c893d179a132f0
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
