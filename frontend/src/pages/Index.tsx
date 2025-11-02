import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Dashboard from "@/components/Dashboard";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import CoalMinesMap from "@/components/CoalMinesMap";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <CoalMinesMap />
      <Dashboard />
      <CTA />
      <Footer />
    </div>
  );
};

export default Index;
