import Hero from "@/components/Hero";
import LiveTicker from "@/components/LiveTicker";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import CoalMinesMap from "@/components/CoalMinesMap";
import Dashboard from "@/components/Dashboard";
import ImpactCards from "@/components/ImpactCards";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <LiveTicker />
      <Features />
      <HowItWorks />
      <CoalMinesMap />
      <Dashboard />
      <ImpactCards />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
