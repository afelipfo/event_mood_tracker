import { Camera, Users, Sparkles, ShieldCheck } from "lucide-react";
import { FadeInSection } from "./fade-in-section";

const FEATURES = [
  {
    icon: Camera,
    title: "Real-Time Detection",
    description:
      "Advanced AI analyzes facial expressions frame by frame, delivering instant emotion classification with high accuracy.",
  },
  {
    icon: Users,
    title: "Multi-Face Tracking",
    description:
      "Simultaneously detect and track emotions across multiple faces in your audience for a comprehensive mood overview.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description:
      "Our integrated AI assistant interprets your session data and provides actionable recommendations to improve engagement.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy by Design",
    description:
      "All processing runs locally in your browser. No video, no images, no personal data ever leaves your device.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative px-6 py-32">
      <div className="mx-auto max-w-6xl">
        <FadeInSection className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
            Why Event Mood Tracker
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground sm:text-5xl">
            Everything you need to
            <br />
            <span className="text-primary">understand your audience</span>
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
            Built for event organizers, speakers, educators, and anyone who
            wants to gauge real-time audience engagement.
          </p>
        </FadeInSection>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <FadeInSection key={f.title} delay={i * 100}>
              <div className="glass-card group relative overflow-hidden p-8 transition-all duration-500 hover:border-primary/20 hover:bg-white/[0.04]">
                {/* Hover glow */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/[0.04] opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100" />

                <div className="relative">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
