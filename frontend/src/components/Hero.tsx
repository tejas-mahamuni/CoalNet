import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, TrendingDown } from "lucide-react";
import heroImage from "@/assets/hero-mining.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Sustainable coal mining facility with renewable energy"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/80 to-background/95" />
      </div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-[120px] animate-float" style={{ animationDelay: "1s" }} />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 mx-auto">
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Powering India's Net Zero Journey</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="block">CoalNet</span>
            <span className="text-gradient">Zero</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            The unified platform to quantify, monitor, and manage carbon emissions across India's coal mining operations
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button variant="hero" size="xl" className="group">
              Start Monitoring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl">
              View Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 max-w-4xl mx-auto">
            <div className="glass-effect p-6 rounded-2xl smooth-transition hover:scale-105">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-6 h-6 text-primary" />
                <span className="text-4xl font-bold text-gradient">40%</span>
              </div>
              <p className="text-sm text-muted-foreground">Average Emission Reduction</p>
            </div>
            <div className="glass-effect p-6 rounded-2xl smooth-transition hover:scale-105" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Leaf className="w-6 h-6 text-secondary" />
                <span className="text-4xl font-bold text-gradient">500+</span>
              </div>
              <p className="text-sm text-muted-foreground">Active Mining Sites</p>
            </div>
            <div className="glass-effect p-6 rounded-2xl smooth-transition hover:scale-105" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-4xl font-bold text-gradient">24/7</span>
              </div>
              <p className="text-sm text-muted-foreground">Real-time Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
          <div className="w-1.5 h-3 bg-primary rounded-full mt-2 animate-glow-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
