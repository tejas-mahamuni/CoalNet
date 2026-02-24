import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Leaf, TrendingDown, Factory, Award } from "lucide-react";
import { api } from "@/lib/api";

const ImpactCards = () => {
  const [stats, setStats] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    api.getHomeStats().then(setStats).catch(console.error);
  }, []);

  const impacts = [
    {
      icon: TrendingDown,
      stat: stats ? `${stats.reductionPct}%` : "—%",
      title: "Emission Reduction Achieved",
      description: `Our AI-driven monitoring and ARIMA forecasting has enabled mining sites to reduce emissions by analyzing trends across ${stats?.activeMines || '20+'} active sites.`,
      color: "from-emerald-500 to-green-600",
      bgAccent: "emerald",
    },
    {
      icon: Factory,
      stat: stats ? `${stats.totalEmissions.toLocaleString()} t` : "— t",
      title: "Total CO₂ Emissions Tracked",
      description: "Comprehensive tracking across all Scope 1, 2, and 3 emissions — fuel combustion, electricity, transport, methane, and explosives — with daily granularity.",
      color: "from-blue-500 to-cyan-600",
      bgAccent: "blue",
    },
    {
      icon: Leaf,
      stat: "Net Zero",
      title: "Aligned with SDG 13",
      description: "CoalNet Zero is designed around UN Sustainable Development Goal 13 (Climate Action), helping India's coal sector transition to sustainable operations with science-backed reduction pathways.",
      color: "from-purple-500 to-violet-600",
      bgAccent: "purple",
    },
    {
      icon: Award,
      stat: "ISO 14064",
      title: "Compliance Ready",
      description: "All emission calculations follow ISO 14064 standards and IPCC emission factors. Reports are audit-ready and suitable for regulatory submissions across Indian and international frameworks.",
      color: "from-amber-500 to-orange-600",
      bgAccent: "amber",
    },
  ];

  // Auto-rotate
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % impacts.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [impacts.length]);

  const goTo = (dir: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActiveIndex((prev) => (prev + dir + impacts.length) % impacts.length);
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-muted/20">
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto relative z-10 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mb-6 border border-white/10">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium">Impact & Compliance</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Real <span className="text-gradient">Impact</span> at Scale
          </h2>
        </motion.div>

        {/* Carousel */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {impacts.map((impact, i) =>
              i === activeIndex ? (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.4 }}
                  className="glass-effect rounded-3xl border border-white/10 p-8 md:p-12"
                >
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    {/* Stat side */}
                    <div className="flex flex-col items-center md:items-start">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${impact.color} flex items-center justify-center mb-6`}
                      >
                        <impact.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl md:text-6xl font-extrabold text-gradient mb-2"
                      >
                        {impact.stat}
                      </motion.div>
                      <h3 className="text-xl font-bold mb-2">{impact.title}</h3>
                    </div>
                    {/* Description side */}
                    <div>
                      <p className="text-muted-foreground leading-relaxed text-lg">
                        {impact.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : null
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => goTo(-1)}
              className="p-2 rounded-full glass-effect border border-white/10 hover:border-white/30 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {impacts.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setActiveIndex(i); }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-8 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goTo(1)}
              className="p-2 rounded-full glass-effect border border-white/10 hover:border-white/30 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImpactCards;
