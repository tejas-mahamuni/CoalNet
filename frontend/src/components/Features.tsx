import { Activity, BarChart3, Brain, FileDown, Leaf, TrendingUp, Wind, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, type Variants } from "framer-motion";

const features = [
  {
    icon: Activity,
    title: "Real-time Emission Tracking",
    description: "Monitor CO₂, CH₄, fuel, and electricity emissions across all mining operations with live updates",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderHover: "hover:border-purple-500/40",
  },
  {
    icon: BarChart3,
    title: "Activity-Wise Analytics",
    description: "Track emissions by category with daily, weekly, and monthly breakdowns for complete transparency",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderHover: "hover:border-blue-500/40",
  },
  {
    icon: Brain,
    title: "AI-Powered Forecasting",
    description: "Predict future emission trends using ARIMA models to identify potential surges early",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    borderHover: "hover:border-pink-500/40",
  },
  {
    icon: TrendingUp,
    title: "Interactive Dashboards",
    description: "Visualize data with beautiful charts, AQI reports, and heatmaps for data-driven decisions",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderHover: "hover:border-emerald-500/40",
  },
  {
    icon: FileDown,
    title: "PDF Report Generation",
    description: "Generate branded PDF reports with live chart screenshots for compliance and auditing",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderHover: "hover:border-amber-500/40",
  },
  {
    icon: Wind,
    title: "AQI Monitoring",
    description: "Mine-specific Air Quality Index derived from emission data with EPA-standard breakpoints",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    borderHover: "hover:border-cyan-500/40",
  },
  {
    icon: Leaf,
    title: "Reduction Pathways",
    description: "Get AI-recommended strategies for emission reduction with carbon budget tracking",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    borderHover: "hover:border-green-500/40",
  },
  {
    icon: Zap,
    title: "What-If Simulator",
    description: "Simulate scenarios to predict emission impact of operational changes before implementing them",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderHover: "hover:border-orange-500/40",
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1, 
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } 
  },
};

const Features = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mb-6 border border-white/10">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Comprehensive Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="text-gradient"> Achieve Net Zero</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete suite of tools to track, analyze, and reduce carbon emissions across your mining operations
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto"
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={itemVariants}>
              <Card className={`group border-white/10 transition-all duration-500 hover:scale-[1.04] hover:shadow-2xl ${feature.borderHover} bg-card/50 backdrop-blur-sm h-full`}>
                <CardContent className="p-6 space-y-4">
                  <motion.div
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                    transition={{ duration: 0.4 }}
                    className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </motion.div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;
