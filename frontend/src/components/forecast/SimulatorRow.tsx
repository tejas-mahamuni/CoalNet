import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { Zap, Leaf, Wind, Gauge, TrendingDown } from "lucide-react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area
} from "recharts";

interface ForecastEntry {
  date: string;
  predicted: number;
  upper_bound: number;
  lower_bound: number;
}

interface Props {
  forecastData: ForecastEntry[];
}

const SimulatorRow = ({ forecastData }: Props) => {
  const [evAdoption, setEvAdoption] = useState(0);
  const [renewablePct, setRenewablePct] = useState(0);
  const [methaneCapture, setMethaneCapture] = useState(0);
  const [efficiency, setEfficiency] = useState(0);

  // Calculate combined reduction factor from sliders
  const reductionFactor = useMemo(() => {
    // Each pathway contributes proportionally to total reduction
    const evReduction = evAdoption * 0.002; // max 20% from EV
    const renewableReduction = renewablePct * 0.003; // max 30% from renewables
    const methaneReduction = methaneCapture * 0.0025; // max 25% from methane capture
    const efficiencyReduction = efficiency * 0.005; // max 15% from efficiency (0-30 range)
    return Math.min(evReduction + renewableReduction + methaneReduction + efficiencyReduction, 0.85);
  }, [evAdoption, renewablePct, methaneCapture, efficiency]);

  const totalReductionPct = Math.round(reductionFactor * 100);

  // Build chart data with baseline and simulated curves
  const chartData = useMemo(() => {
    if (!forecastData || forecastData.length === 0) return [];
    return forecastData.map((f) => ({
      date: new Date(f.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      baseline: Math.round(f.predicted),
      simulated: Math.round(f.predicted * (1 - reductionFactor)),
      upper_bound: Math.round(f.upper_bound),
      lower_bound: Math.round(f.lower_bound * (1 - reductionFactor)),
    }));
  }, [forecastData, reductionFactor]);

  // Total savings
  const totalBaseline = forecastData.reduce((s, f) => s + f.predicted, 0);
  const totalSimulated = totalBaseline * (1 - reductionFactor);
  const totalSaved = totalBaseline - totalSimulated;

  const sliders = [
    { label: "EV Adoption", icon: Zap, value: evAdoption, onChange: setEvAdoption, max: 100, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { label: "Renewable %", icon: Wind, value: renewablePct, onChange: setRenewablePct, max: 100, color: "text-green-500", bgColor: "bg-green-500/10" },
    { label: "Methane Capture", icon: Leaf, value: methaneCapture, onChange: setMethaneCapture, max: 100, color: "text-teal-500", bgColor: "bg-teal-500/10" },
    { label: "Efficiency", icon: Gauge, value: efficiency, onChange: setEfficiency, max: 30, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  ];

  const handleSliderChange = useCallback((setter: (v: number) => void) => {
    return (value: number[]) => setter(value[0]);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
      <Card className="glass-effect border-white/20 overflow-hidden">
        {/* Glow overlay based on reduction */}
        {reductionFactor > 0 && (
          <div
            className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-700"
            style={{
              background: `radial-gradient(ellipse at bottom, hsl(142 71% 45% / ${Math.min(reductionFactor * 0.15, 0.12)}), transparent 70%)`,
            }}
          />
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              What-If Scenario Simulator
            </CardTitle>
            {/* Reduction badge */}
            <motion.div
              key={totalReductionPct}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className={`px-4 py-2 rounded-full text-sm font-bold ${
                totalReductionPct > 30
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : totalReductionPct > 0
                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                  : "bg-muted/30 text-muted-foreground border border-white/10"
              }`}
            >
              {totalReductionPct > 0 ? `−${totalReductionPct}% Reduction` : "Adjust Sliders"}
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Sliders */}
            <div className="space-y-5">
              {sliders.map((s) => (
                <div key={s.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 ${s.bgColor} rounded flex items-center justify-center`}>
                        <s.icon className={`w-3 h-3 ${s.color}`} />
                      </div>
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${s.color}`}>{s.value}%</span>
                  </div>
                  <Slider
                    value={[s.value]}
                    onValueChange={handleSliderChange(s.onChange)}
                    max={s.max}
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              ))}

              {/* Savings card */}
              {reductionFactor > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mt-4"
                >
                  <p className="text-xs text-green-400 mb-1">Estimated Savings</p>
                  <p className="text-2xl font-bold text-green-400">
                    {Math.round(totalSaved).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">kg CO₂e over forecast period</p>
                </motion.div>
              )}
            </div>

            {/* Right: Dual Forecast Chart */}
            <div className="lg:col-span-2 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 30 }}>
                  <defs>
                    <linearGradient id="baselineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="simulatedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 10 }}
                    label={{ value: "kg CO₂e", angle: -90, position: "insideLeft", style: { fontSize: 11 } }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "10px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
                    }}
                    formatter={((value: number, name: string) => {
                      const labels: Record<string, string> = {
                        baseline: "Baseline",
                        simulated: "Simulated",
                      };
                      return [`${value.toLocaleString()} kg CO₂e`, labels[name] || name];
                    }) as any}
                  />
                  <Legend />

                  {/* Baseline area + line */}
                  <Area type="monotone" dataKey="baseline" fill="url(#baselineGrad)" stroke="none" name="baseline" legendType="none" />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={{ r: 2, fill: "#ef4444" }}
                    name="baseline"
                  />

                  {/* Simulated area + line */}
                  {reductionFactor > 0 && (
                    <>
                      <Area type="monotone" dataKey="simulated" fill="url(#simulatedGrad)" stroke="none" name="simulated" legendType="none" />
                      <Line
                        type="monotone"
                        dataKey="simulated"
                        stroke="#22c55e"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                        name="simulated"
                      />
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SimulatorRow;
