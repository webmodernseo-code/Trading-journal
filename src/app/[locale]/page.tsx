import { LandingNav } from './landing/LandingNav';
import { LandingHero } from './landing/LandingHero';
import { FeatureCards } from './landing/FeatureCards';
import { HowItWorks } from './landing/HowItWorks';
import { Testimonials } from './landing/Testimonials';
import { PricingSection } from './landing/PricingSection';
import { Faq } from './landing/Faq';
import { LandingFooter } from './landing/LandingFooter';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0c14]">
      <LandingNav />
      <LandingHero />
      <FeatureCards />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <Faq />
      <LandingFooter />
    </main>
  );
}
