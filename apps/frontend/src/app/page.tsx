import { LandingNavbar } from "@/components/landing/navbar";
import { LandingHero } from "@/components/landing/hero";
import { LandingInteractiveDemo } from "@/components/landing/interactive-demo";
import { LandingQuickCalculator } from "@/components/landing/quick-calculator";
import { LandingFeaturesGrid } from "@/components/landing/features-grid";
import { LandingFaq } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingInteractiveDemo />
        <LandingQuickCalculator />
        <LandingFeaturesGrid />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  );
}
