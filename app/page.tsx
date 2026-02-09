import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { StatsBar } from "@/components/landing/stats-bar";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <CtaSection />
      <Footer />
    </>
  );
}
