import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Lightbulb, TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface Driver {
  name: string;
  weight: number;
  direction: string;
}

interface TrendData {
  direction: "rising" | "falling" | "stable";
  slope: number;
  description: string;
}

interface Props {
  drivers: Driver[];
  trend: TrendData;
  seasonalityPresent: boolean;
  modelOrder: number[];
  modelAic: number;
}

const ExplainabilityRow = ({ drivers, trend, seasonalityPresent, modelOrder, modelAic }: Props) => {
  const TrendIcon = trend.direction === "rising" ? TrendingUp :
                    trend.direction === "falling" ? TrendingDown : Minus;

  const trendColor = trend.direction === "rising" ? "text-red-400" :
                     trend.direction === "falling" ? "text-green-400" : "text-blue-400";

  const maxWeight = Math.max(...drivers.map(d => d.weight), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-purple-500" />
            </div>
            Forecast Explainability
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Driver Importance Bars */}
            <div className="lg:col-span-2 space-y-3">
              <p className="text-sm text-muted-foreground mb-3">Emission Driver Importance</p>
              {drivers.map((driver, idx) => (
                <motion.div
                  key={driver.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx + 0.5 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{driver.name}</span>
                    <span className="text-sm font-bold text-purple-400">{driver.weight}%</span>
                  </div>
                  <div className="w-full h-3 bg-muted/30 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, hsl(270 70% 50% / 0.8), hsl(200 90% 50% / 0.6))`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(driver.weight / maxWeight) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.15 * idx + 0.5 }}
                    />
                  </div>
                  {idx === 0 && (
                    <p className="text-xs text-muted-foreground">
                      {driver.name} drives {driver.weight}% of emissions
                    </p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Right: Trend + Model Info */}
            <div className="space-y-4">
              {/* Trend Direction */}
              <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                <p className="text-xs text-muted-foreground mb-2">Trend Direction</p>
                <div className="flex items-center gap-2">
                  <TrendIcon className={`w-6 h-6 ${trendColor}`} />
                  <span className={`text-lg font-bold capitalize ${trendColor}`}>
                    {trend.direction}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{trend.description}</p>
              </div>

              {/* Seasonality Badge */}
              <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                <p className="text-xs text-muted-foreground mb-2">Seasonality</p>
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-5 h-5 ${seasonalityPresent ? "text-amber-400" : "text-muted-foreground"}`} />
                  <span className="text-sm font-medium">
                    {seasonalityPresent ? "Pattern Detected" : "No Clear Pattern"}
                  </span>
                </div>
              </div>

              {/* Model Info */}
              <div className="p-4 rounded-xl bg-muted/20 border border-white/5">
                <p className="text-xs text-muted-foreground mb-2">Model Info</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Type: </span>
                    <span className="font-medium">ARIMA</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Order: </span>
                    <span className="font-medium">({modelOrder.join(", ")})</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">AIC: </span>
                    <span className="font-medium">{modelAic.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ExplainabilityRow;
