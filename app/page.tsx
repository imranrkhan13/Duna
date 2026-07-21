import { AudioUploader } from "@/components/AudioUploader";
import { TryLiveDemo } from "@/components/demo/TryLiveDemo";
import { Footer } from "@/components/marketing/Footer";
import { Hero } from "@/components/marketing/Hero";
import { Navbar } from "@/components/marketing/Navbar";
import { StatsGrid } from "@/components/marketing/StatCard";
import { Section } from "@/components/ui/Section";

export default function Home() {
  return (
    <main className="bg-noise min-h-screen">
      <Navbar />
      <Hero />
      <TryLiveDemo />
      <TrustSection />
      <Section className="py-20" id="pricing">
        <StatsGrid />
      </Section>
      <Section
        className="pb-24"
        description="A guided assessment workspace with consent, passage setup, recording or upload, and a premium learner report."
        eyebrow="Product"
        id="product"
        title="Designed for high-stakes pronunciation assessment."
      >
        <AudioUploader />
      </Section>
      <Footer />
    </main>
  );
}
