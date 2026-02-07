import { FadeInSection } from "./fade-in-section";

const STATS = [
  { value: "6", label: "Emotions Detected" },
  { value: "<50ms", label: "Detection Speed" },
  { value: "100%", label: "Client-Side" },
  { value: "0 bytes", label: "Data Stored" },
];

export function StatsBar() {
  return (
    <section className="relative border-y border-white/[0.04] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <FadeInSection>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-serif text-3xl tracking-tight text-primary sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
