import { Navbar } from "@/components/Navbar";
import { HighwayIntro } from "@/components/intro/HighwayIntro";
import { Hero } from "@/components/Hero";
import { ProblemSection } from "@/components/ProblemSection";
import { SolutionSection } from "@/components/SolutionSection";
import { HowItWorks } from "@/components/HowItWorks";
import { PrivateSection } from "@/components/PrivateSection";
import { BusinessSection } from "@/components/BusinessSection";
import { TrustSection } from "@/components/TrustSection";
import { DropsSection } from "@/components/DropsSection";
import { CommunitySection } from "@/components/CommunitySection";
import { ImpactSection } from "@/components/ImpactSection";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      {/* Runs before the page paints: covers the viewport (see html[data-intro]
          in globals.css) so the hero never flashes before the highway intro.
          The intro plays on every page load unless the visitor prefers reduced
          motion. HighwayIntro takes the cover over once hydrated. */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            '(function(){try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;document.documentElement.setAttribute("data-intro","")}catch(e){}})()',
        }}
      />
      <HighwayIntro />
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <HowItWorks />
        <PrivateSection />
        <BusinessSection />
        <TrustSection />
        <DropsSection />
        <CommunitySection />
        <ImpactSection />
        <WaitlistForm />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
