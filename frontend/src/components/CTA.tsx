import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px]" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-scale-in">
          {/* Icon */}
          <div className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 animate-float">
            <Leaf className="w-10 h-10 text-primary" />
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-6xl font-bold">
            Ready to Achieve
            <span className="text-gradient"> Net Zero?</span>
          </h2>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Join leading coal mining operations across India in their journey towards sustainable, compliant, and transparent emission management
          </p>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center py-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">SDG 13</div>
              <div className="text-sm text-muted-foreground">Climate Action</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">ISO</div>
              <div className="text-sm text-muted-foreground">Compliant</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-4xl font-bold text-gradient mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Support</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="hero" size="xl" className="group">
              Get Started Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl">
              Schedule a Demo
            </Button>
          </div>

          {/* Trust Badge */}
          <p className="text-sm text-muted-foreground pt-8">
            Trusted by <span className="font-semibold text-foreground">500+</span> mining operations across India
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
