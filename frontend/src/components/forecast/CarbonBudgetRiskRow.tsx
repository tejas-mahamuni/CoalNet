import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface CarbonBudgetData {
  annualBudgetKg: number;
  ytdEmissionsKg: number;
  budgetUsedPct: number;
  remainingBudgetKg: number;
  estimatedBreachDate: string | null;
}

interface Props {
  carbonBudget: CarbonBudgetData;
  riskLevel: "low" | "medium" | "high";
  trendDescription: string;
}

const CarbonBudgetRiskRow = ({ carbonBudget, riskLevel, trendDescription }: Props) => {
  const { budgetUsedPct, remainingBudgetKg, estimatedBreachDate } = carbonBudget;

  // SVG arc parameters
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees
  const filledLength = arcLength * (Math.min(budgetUsedPct, 100) / 100);

  const riskConfig = {
    low: { color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/20", icon: CheckCircle2, label: "Low Risk" },
    medium: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", icon: AlertTriangle, label: "Medium Risk" },
    high: { color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", icon: AlertTriangle, label: "High Risk" },
  };

  const risk = riskConfig[riskLevel];
  const RiskIcon = risk.icon;

  const formatLargeNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Carbon Budget Meter */}
      <Card className="glass-effect border-white/20 hover:border-emerald-500/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-emerald-500" />
            </div>
            Carbon Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            {/* Circular Progress Arc */}
            <div className="relative w-[180px] h-[150px]">
              <svg width="180" height="150" viewBox="0 0 180 150" className="transform">
                {/* Background arc */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="10"
                  strokeDasharray={`${arcLength} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(135, 90, 90)"
                />
                {/* Filled arc */}
                <motion.circle
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={
                    budgetUsedPct > 80 ? "#ef4444" :
                    budgetUsedPct > 50 ? "#f59e0b" : "#22c55e"
                  }
                  strokeWidth="10"
                  strokeDasharray={`${filledLength} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(135, 90, 90)"
                  initial={{ strokeDasharray: `0 ${circumference}` }}
                  animate={{ strokeDasharray: `${filledLength} ${circumference}` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <motion.span
                  className="text-3xl font-bold"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {budgetUsedPct.toFixed(1)}%
                </motion.span>
                <span className="text-xs text-muted-foreground">used</span>
              </div>
            </div>

            {/* Budget stats */}
            <div className="w-full grid grid-cols-2 gap-3 mt-4">
              <div className="text-center p-3 rounded-xl bg-muted/20">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-green-400">{formatLargeNumber(remainingBudgetKg)}</p>
                <p className="text-xs text-muted-foreground">kg CO₂e</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/20">
                <p className="text-xs text-muted-foreground">YTD Used</p>
                <p className="text-lg font-bold">{formatLargeNumber(carbonBudget.ytdEmissionsKg)}</p>
                <p className="text-xs text-muted-foreground">kg CO₂e</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Card */}
      <Card className={`glass-effect border-white/20 hover:${risk.border} transition-colors`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className={`w-8 h-8 ${risk.bg} rounded-lg flex items-center justify-center`}>
              <RiskIcon className={`w-4 h-4 ${risk.color}`} />
            </div>
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Risk Level Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className={`flex items-center justify-center gap-3 p-6 rounded-2xl ${risk.bg} border ${risk.border}`}
          >
            <RiskIcon className={`w-8 h-8 ${risk.color}`} />
            <div>
              <p className={`text-2xl font-bold ${risk.color}`}>{risk.label}</p>
              <p className="text-sm text-muted-foreground">Based on trend analysis</p>
            </div>
          </motion.div>

          {/* Trend description */}
          <div className="p-3 rounded-xl bg-muted/20">
            <p className="text-sm">{trendDescription}</p>
          </div>

          {/* Breach date */}
          {estimatedBreachDate && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <Clock className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Estimated Budget Breach</p>
                <p className="text-lg font-bold">
                  {new Date(estimatedBreachDate).toLocaleDateString("en-US", {
                    month: "long", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CarbonBudgetRiskRow;
