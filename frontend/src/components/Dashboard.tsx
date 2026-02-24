import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, PieChart, TrendingUp, Activity, CheckCircle2, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Content */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full border border-white/10"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Interactive Dashboards</span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-bold"
            >
              Visualize Your
              <span className="text-gradient"> Carbon Footprint</span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-muted-foreground leading-relaxed"
            >
              Transform complex emission data into actionable insights with our intuitive dashboards. Track trends, compare periods, and make data-driven decisions to achieve your sustainability goals.
            </motion.p>

            <div className="space-y-4">
              {[
                { icon: PieChart, color: "text-primary", bg: "bg-primary/10", title: "Category Breakdown", desc: "Visualize emissions by fuel, electricity, methane, and transport" },
                { icon: TrendingUp, color: "text-secondary", bg: "bg-secondary/10", title: "Trend Analysis", desc: "Identify patterns and forecast future emission trajectories" },
                { icon: Activity, color: "text-accent", bg: "bg-accent/10", title: "Live Tracking", desc: "Real-time updates on AQI and operational emission levels" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                variant="hero" 
                size="lg" 
                className="group shadow-xl shadow-primary/20"
                onClick={() => navigate("/dashboard")}
              >
                Explore Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          </div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 glass-effect p-2">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={dashboardPreview}
                  alt="CoalNet Zero Dashboard Interface"
                  className="w-full h-auto transform hover:scale-105 transition-transform duration-700"
                />
                {/* Overlay Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 pointer-events-none" />
              </div>
            </div>

            {/* Floating Stats Cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 glass-effect p-4 rounded-xl shadow-xl border border-white/20 z-20"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-glow-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider">Live Network</span>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -bottom-10 -left-6 glass-effect p-5 rounded-2xl shadow-xl border border-white/20 z-20 bg-white/5 backdrop-blur-2xl"
            >
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-emerald-500" />
                 </div>
                 <div className="text-2xl font-bold">-32%</div>
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Efficiency Gain
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
