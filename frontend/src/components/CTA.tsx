import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px]" />

      <div className="container mx-auto relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="inline-flex w-20 h-20 items-center justify-center rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20"
          >
            <Leaf className="w-10 h-10 text-primary animate-pulse" />
          </motion.div>

          {/* Heading */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold"
          >
            Ready to Achieve
            <span className="text-gradient"> Net Zero?</span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            Join leading coal mining operations across India in their journey towards sustainable, compliant, and transparent emission management
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-8 justify-center items-center py-8"
          >
            <div className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-gradient mb-1">SDG 13</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Climate Action</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-gradient mb-1">ISO 14064</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Compliant</div>
            </div>
            <div className="hidden sm:block w-px h-16 bg-white/10" />
            <div className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Leaf className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-gradient mb-1">Net Zero</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest">Future Ready</div>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              variant="hero"
              size="xl"
              className="group"
              onClick={() => navigate("/auth")}
            >
              Start Monitoring
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="border-white/20 hover:bg-white/5"
              onClick={() => navigate("/demo")}
            >
              Watch Video Demo
            </Button>
          </motion.div>

          {/* Trust Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-sm text-muted-foreground pt-8"
          >
            Trusted by <span className="font-semibold text-foreground">500+</span> mining operations across India
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default CTA;
