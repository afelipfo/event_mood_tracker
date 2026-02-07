import Link from "next/link";
import { ArrowRight, Lock, Cpu, EyeOff } from "lucide-react";
import { FadeInSection } from "./fade-in-section";

const PRIVACY_BADGES = [
  {
    icon: Cpu,
    label: "100% Client-Side",
    detail: "All AI processing runs locally in your browser",
  },
  {
    icon: EyeOff,
    label: "No Data Stored",
    detail: "Video and images are never saved or transmitted",
  },
  {
    icon: Lock,
    label: "Private by Default",
    detail: "Only aggregated statistics exist in session memory",
  },
];

export function CtaSection() {
  return (
    <section id="privacy" className="relative px-6 py-32">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[700px] rounded-full bg-primary/[0.04] blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-4xl">
        {/* Privacy badges */}
        <FadeInSection>
          <div className="grid gap-4 sm:grid-cols-3">
            {PRIVACY_BADGES.map((badge) => (
              <div
                key={badge.label}
                className="glass-card flex flex-col items-center gap-3 p-6 text-center"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  {badge.label}
                </h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {badge.detail}
                </p>
              </div>
            ))}
          </div>
        </FadeInSection>

        {/* Final CTA */}
        <FadeInSection delay={200} className="mt-20 text-center">
          <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-5xl">
            Ready to understand
            <br />
            your <span className="text-primary">audience</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Start tracking emotions in real time. No sign-up, no installation,
            no data collection. Just open and go.
          </p>
          <div className="mt-8">
            <Link
              href="/track"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-10 py-4 text-sm font-medium text-primary-foreground transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_50px_-10px_hsl(38,92%,55%,0.5)]"
            >
              Launch Event Mood Tracker
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
