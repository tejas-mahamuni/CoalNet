import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Leaf, Gauge } from "lucide-react";

interface SummaryData {
  currentEmission: number;
  forecastGrowthPct: number;
  reductionPotential: number;
  carbonIntensity: number;
}

interface Props {
  summary: SummaryData;
}

const useCountUp = (end: number, duration: number = 1500, delay: number = 0) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      let startTime: number;
      const animate = (ts: number) => {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(eased * end);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [end, duration, delay]);
  return value;
};

const MineSummaryRow = ({ summary }: Props) => {
  const animatedEmission = useCountUp(summary.currentEmission, 1500, 200);
  const animatedGrowth = useCountUp(Math.abs(summary.forecastGrowthPct), 1200, 400);
  const animatedReduction = useCountUp(summary.reductionPotential, 1400, 600);
  const animatedIntensity = useCountUp(summary.carbonIntensity, 1300, 800);

  const cards = [
    {
      label: "Current Emission",
      value: `${Math.round(animatedEmission).toLocaleString()}`,
      unit: "kg CO₂e/day",
      icon: Flame,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderHover: "hover:border-orange-500/30",
      gradient: "from-orange-500/10 to-red-500/5",
    },
    {
      label: "Forecast Growth",
      value: `${summary.forecastGrowthPct >= 0 ? "+" : "-"}${animatedGrowth.toFixed(1)}%`,
      unit: "vs last 30 days",
      icon: TrendingUp,
      color: summary.forecastGrowthPct > 0 ? "text-red-400" : "text-green-400",
      bgColor: summary.forecastGrowthPct > 0 ? "bg-red-500/10" : "bg-green-500/10",
      borderHover: summary.forecastGrowthPct > 0 ? "hover:border-red-500/30" : "hover:border-green-500/30",
      gradient: summary.forecastGrowthPct > 0 ? "from-red-500/10 to-orange-500/5" : "from-green-500/10 to-emerald-500/5",
    },
    {
      label: "Reduction Potential",
      value: `${Math.round(animatedReduction).toLocaleString()}`,
      unit: "kg CO₂e savings",
      icon: Leaf,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderHover: "hover:border-emerald-500/30",
      gradient: "from-emerald-500/10 to-green-500/5",
    },
    {
      label: "Carbon Intensity",
      value: animatedIntensity.toFixed(2),
      unit: "kg CO₂e / L fuel",
      icon: Gauge,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderHover: "hover:border-blue-500/30",
      gradient: "from-blue-500/10 to-indigo-500/5",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.6 }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * idx + 1.0 }}
          >
            <Card className={`glass-effect border-white/20 ${card.borderHover} transition-all hover:scale-[1.02]`}>
              {/* Glass gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} rounded-xl pointer-events-none`} />
              <CardContent className="p-5 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <card.icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{card.unit}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MineSummaryRow;
