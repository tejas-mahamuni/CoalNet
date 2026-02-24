import { motion, useScroll } from "framer-motion";
import { useRef } from "react";
import { 
  Activity, 
  Brain, 
  TrendingDown, 
  ArrowRight, 
  Leaf, 
  Zap,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const DemoPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const steps = [
    {
      icon: Activity,
      title: "Step 1: Real-time Monitoring",
      description: "Our system connects to IoT sensors and activity logs to track emissions across Fuel, Electricity, Transport, and Methane leaks.",
      benefit: "Eliminates blind spots in your carbon footprint.",
      color: "bg-blue-500",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800",
    },
    {
      icon: Brain,
      title: "Step 2: AI Forecasting",
      description: "Advanced ARIMA and neural network models analyze historical trends to predict future emission surges up to 30 days in advance.",
      benefit: "Enables proactive mitigation instead of reactive fixes.",
      color: "bg-purple-500",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
    },
    {
      icon: Leaf,
      title: "Step 3: Reduction Pathways",
      description: "The AI suggests specific operational changes—like switching to EV transport or optimizing ventilation—to stay within your carbon budget.",
      benefit: "Scientific roadmap to achieve net-zero mining.",
      color: "bg-emerald-500",
      image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800",
    },
  ];

  return (
    <div ref={containerRef} className="min-h-[500vh] bg-background text-foreground relative">
      {/* Fixed Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center sticky top-0 px-4 bg-background z-[10]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center space-y-6 max-w-4xl"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full border border-white/10 text-primary mb-4">
             <Zap className="w-4 h-4" />
             <span className="text-sm font-medium uppercase tracking-wider">Product Walkthrough</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-bold tracking-tight">
            The CoalNet <span className="text-gradient">Advantage</span>
          </h1>
          <h2 className="sr-only">Main Demo Headline</h2>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
            Scroll down to see how we transform raw mining data into sustainable success.
          </p>
          <div className="flex gap-4 justify-center pt-8">
             <motion.div
               animate={{ y: [0, 10, 0] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="w-6 h-10 border-2 border-primary/30 rounded-full flex items-start justify-center p-1"
             >
               <div className="w-1.5 h-1.5 bg-primary rounded-full" />
             </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Storytelling Steps */}
      <div className="relative">
        {steps.map((step, index) => {
          return (
            <section
              key={index}
              className="h-screen flex items-center justify-center sticky top-0 overflow-hidden bg-background"
              style={{ zIndex: 20 + index }}
            >
              <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
                {/* Text Content */}
                <div className="space-y-8 order-2 md:order-1">
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="space-y-6"
                  >
                    <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold">{step.title}</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-3 p-4 glass-effect border border-white/10 rounded-2xl bg-white/5">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <p className="text-sm font-medium">{step.benefit}</p>
                    </div>
                  </motion.div>
                </div>

                {/* Visual Content */}
                <div className="relative order-1 md:order-2">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, rotate: index % 2 === 0 ? 5 : -5 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video md:aspect-square"
                  >
                    <img
                      src={step.image}
                      alt={step.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </motion.div>
                  {/* Decorative Blobs */}
                  <div className={`absolute -top-10 -right-10 w-48 h-48 ${step.color} opacity-20 filter blur-[80px] rounded-full`} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Final CTA Section */}
      <section className="h-screen flex items-center justify-center sticky top-0 bg-background border-t border-white/5 z-[50]">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center space-y-12 max-w-3xl px-4"
        >
          <div className="space-y-4">
            <h2 className="text-5xl font-bold">Start Your Journey to <span className="text-emerald-500 underline decoration-primary/30">Zero</span></h2>
            <p className="text-lg text-muted-foreground">
              Empower your mining site with the intelligence it needs to thrive in a Net Zero world.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-primary/40 transition-all text-center group">
               <ShieldCheck className="w-12 h-12 text-blue-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
               <h3 className="font-bold text-xl mb-2">Compliance Ready</h3>
               <p className="text-sm text-muted-foreground">ISO certified tracking and automated regulatory reporting.</p>
            </div>
            <div className="glass-effect p-8 rounded-3xl border border-white/10 hover:border-emerald-400/40 transition-all text-center group">
               <TrendingDown className="w-12 h-12 text-emerald-500 mx-auto mb-4 group-hover:scale-110 transition-transform" />
               <h3 className="font-bold text-xl mb-2">Cost Savings</h3>
               <p className="text-sm text-muted-foreground">Reduced fuel consumption through AI operational optimization.</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Button size="xl" className="group" onClick={() => navigate("/auth")}>
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button size="xl" variant="outline" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Background elements */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30">
         <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px]" />
         <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[150px]" />
      </div>
    </div>
  );
};

export default DemoPage;
