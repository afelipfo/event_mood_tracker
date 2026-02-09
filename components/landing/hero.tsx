"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

const MOCK_EMOTIONS = [
  { label: "Happy", pct: 42, color: "bg-[hsl(43,96%,58%)]" },
  { label: "Surprised", pct: 24, color: "bg-[hsl(32,95%,55%)]" },
  { label: "Neutral", pct: 18, color: "bg-[hsl(220,12%,50%)]" },
  { label: "Sad", pct: 10, color: "bg-[hsl(215,60%,50%)]" },
  { label: "Angry", pct: 4, color: "bg-[hsl(348,72%,52%)]" },
  { label: "Bored", pct: 2, color: "bg-[hsl(270,50%,58%)]" },
];

export function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-20">
      {/* Radial glow behind hero */}
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[900px] rounded-full bg-primary/[0.07] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            AI-Powered Emotion Detection
          </span>
        </div>

        {/* Headline */}
        <h1
          className="animate-fade-in font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-7xl lg:text-8xl"
          style={{ animationDelay: "100ms", animationFillMode: "backwards" }}
        >
          Feel the Pulse
          <br />
          of Every <span className="text-primary">Room</span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
        >
          Real-time audience emotion analysis powered by AI. Understand
          engagement, detect mood shifts, and get actionable insights — all
          running privately in your browser.
        </p>

        {/* CTA buttons */}
        <div
          className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          style={{ animationDelay: "350ms", animationFillMode: "backwards" }}
        >
          <Link
            href="/track"
            className="group flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_-8px_hsl(38,92%,55%,0.4)]"
          >
            Start Tracking Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="rounded-full border border-white/[0.08] bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-foreground/80 transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.06]"
          >
            See How It Works
          </a>
        </div>

        {/* Trust signals */}
        <p
          className="animate-fade-in mt-6 text-xs text-muted-foreground/50"
          style={{ animationDelay: "450ms", animationFillMode: "backwards" }}
        >
          No sign-up required · 100% client-side · Zero data stored
        </p>
      </div>

      {/* ── Dashboard Mockup ── */}
      <div
        className="animate-slide-up relative z-10 mx-auto mt-16 w-full max-w-5xl px-4"
        style={{ animationDelay: "550ms", animationFillMode: "backwards" }}
      >
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-1 shadow-2xl shadow-primary/[0.06] backdrop-blur-sm">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.04] px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
              <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
            </div>
            <div className="ml-4 flex-1 rounded-md bg-white/[0.04] px-3 py-1">
              <span className="text-[10px] text-muted-foreground/50">
                eventmood.app/track
              </span>
            </div>
          </div>

          {/* Dashboard content */}
          <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-5">
            {/* Video preview area */}
            <div className="relative col-span-1 aspect-video overflow-hidden rounded-xl border border-white/[0.06] bg-card md:col-span-3">
              {/* Scanning line */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="scan-line absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              </div>

              {/* Face silhouette */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  <div className="h-24 w-20 rounded-[40%] border-2 border-dashed border-primary/25 sm:h-32 sm:w-28" />
                  <div className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 border-primary/40" />
                  <div className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-primary/40" />
                  <div className="absolute -bottom-2 -right-2 h-4 w-4 border-b-2 border-r-2 border-primary/40" />
                  <div className="absolute -bottom-2 -left-2 h-4 w-4 border-b-2 border-l-2 border-primary/40" />
                  <div className="absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-full bg-primary/10 px-3 py-1 backdrop-blur-sm">
                    <span className="text-[11px] font-medium text-primary">
                      Happy 😊
                    </span>
                  </div>
                </div>
              </div>

              {/* Live badge */}
              <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/80 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/[0.06]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-medium text-foreground/70">
                  LIVE
                </span>
              </div>

              {/* Face count badge */}
              <div className="absolute right-3 top-3 rounded-full bg-card/80 px-2.5 py-1 backdrop-blur-sm ring-1 ring-white/[0.06]">
                <span className="text-[10px] font-medium text-foreground/70">
                  1 face detected
                </span>
              </div>
            </div>

            {/* Stats sidebar */}
            <div className="col-span-1 flex flex-col gap-3 md:col-span-2">
              {/* Engagement score */}
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
                <p className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Engagement
                </p>
                <p className="mt-1 font-serif text-3xl text-primary">82</p>
                <p className="text-[10px] text-muted-foreground/60">/100</p>
              </div>

              {/* Emotion bars */}
              <div className="flex-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <p className="mb-3 text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  Live Distribution
                </p>
                <div className="space-y-2">
                  {MOCK_EMOTIONS.map((e) => (
                    <div key={e.label} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-foreground/60">
                          {e.label}
                        </span>
                        <span className="text-[10px] tabular-nums text-muted-foreground/60">
                          {e.pct}%
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-white/[0.04]">
                        <div
                          className={`h-full rounded-full ${e.color} mock-bar-animate`}
                          style={{ width: `${e.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Glow under mockup */}
        <div className="pointer-events-none absolute -bottom-8 left-1/2 h-32 w-3/4 -translate-x-1/2 rounded-full bg-primary/[0.06] blur-[80px]" />
      </div>

      {/* Scroll indicator */}
      <div
        className="animate-fade-in absolute bottom-8 left-1/2 -translate-x-1/2"
        style={{ animationDelay: "900ms", animationFillMode: "backwards" }}
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">
            Scroll
          </span>
          <div className="h-8 w-[1px] bg-gradient-to-b from-muted-foreground/20 to-transparent" />
        </div>
      </div>
    </section>
  );
}
