import { motion } from "framer-motion";
import { Upload, Brain, BarChart3, FileDown, ArrowRight } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Data",
    description: "Import your mining operation data via CSV or manual entry — fuel, electricity, transport, explosives usage",
    color: "from-purple-500 to-violet-500",
    glowColor: "purple",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "ARIMA models analyze patterns, detect anomalies, and generate accurate emission forecasts with confidence intervals",
    color: "from-pink-500 to-rose-500",
    glowColor: "pink",
  },
  {
    icon: BarChart3,
    title: "Dashboard Insights",
    description: "Interactive dashboards with heatmaps, AQI reports, mine comparisons, and what-if scenario simulations",
    color: "from-blue-500 to-cyan-500",
    glowColor: "blue",
  },
  {
    icon: FileDown,
    title: "Reports & Action",
    description: "Generate PDF reports, track carbon budgets, and implement AI-recommended reduction pathways for net zero",
    color: "from-emerald-500 to-green-500",
    glowColor: "emerald",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px]" />

      <div className="container mx-auto relative z-10 max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mb-6 border border-white/10">
            <ArrowRight className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            From Data to <span className="text-gradient">Net Zero</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Four simple steps to transform your mining operations
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-16 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-emerald-500/30" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center"
            >
              {/* Step number */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-6 z-10`}
              >
                <step.icon className="w-9 h-9 text-white" />
                <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border-2 border-white/20 flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </div>
              </motion.div>

              {/* Arrow between steps (mobile) */}
              {i < steps.length - 1 && (
                <div className="md:hidden my-2">
                  <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                </div>
              )}

              <h3 className="text-lg font-bold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
