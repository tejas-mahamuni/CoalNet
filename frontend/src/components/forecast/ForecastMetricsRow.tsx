import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Target, Activity, BarChart3, Cpu } from "lucide-react";

interface Props {
  mae: number;
  rmse: number;
  mape: number | null;
  confidenceScore: number; // 0-100, derived from confidence band width
  modelType: string;
}

const useCountUp = (end: number, duration: number = 1200, delay: number = 0) => {
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

const ForecastMetricsRow = ({ mae, rmse, mape, confidenceScore, modelType }: Props) => {
  const animatedRmse = useCountUp(rmse, 1200, 500);
  const animatedMape = useCountUp(mape ?? 0, 1200, 700);
  const animatedConfidence = useCountUp(confidenceScore, 1500, 900);

  const metrics = [
    {
      label: "MAPE",
      value: mape !== null ? `${animatedMape.toFixed(1)}%` : "N/A",
      description: "Mean Absolute Percentage Error",
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderHover: "hover:border-purple-500/30",
    },
    {
      label: "RMSE",
      value: animatedRmse.toFixed(1),
      description: "Root Mean Square Error",
      icon: Activity,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderHover: "hover:border-blue-500/30",
    },
    {
      label: "Confidence",
      value: `${animatedConfidence.toFixed(0)}%`,
      description: "Forecast confidence score",
      icon: BarChart3,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderHover: "hover:border-green-500/30",
    },
    {
      label: "Model",
      value: modelType,
      description: `MAE: ${mae.toFixed(1)}`,
      icon: Cpu,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      borderHover: "hover:border-amber-500/30",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.0, duration: 0.6 }}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * idx + 0.8 }}
          >
            <Card className={`glass-effect border-white/20 ${metric.borderHover} transition-colors`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${metric.bgColor} rounded-lg flex items-center justify-center`}>
                    <metric.icon className={`w-5 h-5 ${metric.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{metric.label}</span>
                </div>
                <p className="text-2xl font-bold">{metric.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{metric.description}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default ForecastMetricsRow;
