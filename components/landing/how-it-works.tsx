import { FadeInSection } from "./fade-in-section";

const STEPS = [
  {
    num: "01",
    title: "Start a Session",
    description:
      "Click one button to grant camera access and begin real-time emotion tracking. No sign-up, no downloads.",
  },
  {
    num: "02",
    title: "Track Emotions Live",
    description:
      "Our AI detects faces and classifies emotions in real time. Watch engagement scores, mood distributions, and timelines update live.",
  },
  {
    num: "03",
    title: "Get AI Insights",
    description:
      "End your session to see a full summary. Our AI assistant analyzes the data and provides personalized recommendations.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative px-6 py-32">
      <div className="mx-auto max-w-5xl">
        <FadeInSection className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-primary">
            Simple & Powerful
          </p>
          <h2 className="mt-4 font-serif text-3xl tracking-tight text-foreground sm:text-5xl">
            Up and running in <span className="text-primary">seconds</span>
          </h2>
        </FadeInSection>

        <div className="relative mt-20 grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connecting line (desktop only) */}
          <div className="pointer-events-none absolute left-0 right-0 top-10 hidden h-[1px] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent md:block" />

          {STEPS.map((step, i) => (
            <FadeInSection key={step.num} delay={i * 150}>
              <div className="relative text-center">
                {/* Step number */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="font-serif text-3xl text-primary">
                    {step.num}
                  </span>
                </div>

                <h3 className="font-serif text-xl tracking-tight text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </FadeInSection>
          ))}
        </div>
      </div>
    </section>
  );
}
