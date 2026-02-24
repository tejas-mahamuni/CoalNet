import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { GitCompare, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ComposedChart, Area
} from "recharts";
import { api } from "@/lib/api";

interface Mine {
  _id: string;
  name: string;
}

interface Props {
  mines: Mine[];
  horizon: number;
  currentMineId: string;
}

const LINE_COLORS = ["#8b5cf6", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

const MultiMineComparisonRow = ({ mines, horizon, currentMineId }: Props) => {
  const [selectedMines, setSelectedMines] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Auto-select current mine + first available mine
  useEffect(() => {
    if (currentMineId && mines.length > 1) {
      const otherMine = mines.find(m => m._id !== currentMineId);
      if (otherMine) {
        setSelectedMines([currentMineId, otherMine._id]);
      }
    }
  }, [currentMineId, mines]);

  const fetchComparison = useCallback(async () => {
    if (selectedMines.length < 2) return;
    setLoading(true);
    try {
      const result = await api.compareMineForecasts(selectedMines, horizon);
      setComparisonData(result);
    } catch (err) {
      console.error("Comparison error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedMines, horizon]);

  useEffect(() => {
    if (selectedMines.length >= 2) fetchComparison();
  }, [selectedMines, fetchComparison]);

  const toggleMine = (mineId: string) => {
    setSelectedMines(prev => {
      if (prev.includes(mineId)) {
        return prev.filter(id => id !== mineId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, mineId];
    });
  };

  // Build chart data from comparison results (with upper/lower bounds)
  const minesWithData = comparisonData?.comparison?.filter((c: any) => c.hasForecast && c.forecast_data.length > 0) || [];

  const chartData = (() => {
    if (minesWithData.length === 0) return [];

    const maxLen = Math.max(...minesWithData.map((c: any) => c.forecast_data.length));
    const data = [];

    for (let i = 0; i < maxLen; i++) {
      const point: any = {};
      let dateSet = false;
      minesWithData.forEach((c: any) => {
        if (i < c.forecast_data.length) {
          if (!dateSet) {
            point.date = new Date(c.forecast_data[i].date).toLocaleDateString("en-US", {
              month: "short", day: "numeric",
            });
            dateSet = true;
          }
          point[c.mineName] = Math.round(c.forecast_data[i].predicted);
          point[`${c.mineName}_upper`] = Math.round(c.forecast_data[i].upper_bound);
          point[`${c.mineName}_lower`] = Math.round(c.forecast_data[i].lower_bound);
          // Range for Area fill (recharts needs [low, high] array)
          point[`${c.mineName}_range`] = [
            Math.round(c.forecast_data[i].lower_bound),
            Math.round(c.forecast_data[i].upper_bound),
          ];
        }
      });
      if (dateSet) data.push(point);
    }

    return data;
  })();

  // Numerical comparison stats
  const comparisonStats = minesWithData.map((mine: any, idx: number) => {
    const forecasts = mine.forecast_data || [];
    const predicted = forecasts.map((f: any) => f.predicted);
    const total = predicted.reduce((s: number, v: number) => s + v, 0);
    const avg = predicted.length > 0 ? total / predicted.length : 0;
    const max = predicted.length > 0 ? Math.max(...predicted) : 0;
    const min = predicted.length > 0 ? Math.min(...predicted) : 0;
    const firstVal = predicted[0] || 0;
    const lastVal = predicted[predicted.length - 1] || 0;
    const trendPct = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;

    return {
      name: mine.mineName,
      color: LINE_COLORS[idx % LINE_COLORS.length],
      totalEmission: Math.round(total),
      avgDaily: Math.round(avg),
      peakDay: Math.round(max),
      minDay: Math.round(min),
      trendPct: Math.round(trendPct * 10) / 10,
      accuracy: mine.model_accuracy,
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.6 }}
    >
      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                <GitCompare className="w-4 h-4 text-indigo-500" />
              </div>
              Multi-Mine Forecast Comparison
            </CardTitle>
            {comparisonData?.highestEmitter && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-sm">
                <Crown className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-400 font-medium">{comparisonData.highestEmitter}</span>
                <span className="text-muted-foreground text-xs">highest emitter</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Mine selector chips */}
          <div className="flex flex-wrap gap-2 mb-5">
            {mines.map((mine) => {
              const isSelected = selectedMines.includes(mine._id);
              const colorIdx = selectedMines.indexOf(mine._id);
              return (
                <button
                  key={mine._id}
                  onClick={() => toggleMine(mine._id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                    isSelected
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/10 bg-transparent text-muted-foreground hover:bg-white/5"
                  }`}
                  style={isSelected && colorIdx >= 0 ? {
                    borderColor: LINE_COLORS[colorIdx % LINE_COLORS.length] + "60",
                    backgroundColor: LINE_COLORS[colorIdx % LINE_COLORS.length] + "15",
                  } : {}}
                >
                  {isSelected && colorIdx >= 0 && (
                    <span
                      className="inline-block w-2 h-2 rounded-full mr-1.5"
                      style={{ backgroundColor: LINE_COLORS[colorIdx % LINE_COLORS.length] }}
                    />
                  )}
                  {mine.name}
                </button>
              );
            })}
          </div>

          {/* Comparison Chart */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full" />
              <p className="text-sm text-muted-foreground">Generating & comparing forecasts...</p>
              <p className="text-xs text-muted-foreground/60">This may take a moment if forecasts haven't been cached yet.</p>
            </div>
          ) : chartData.length > 0 ? (
            <>
              {/* Chart with confidence bands */}
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <defs>
                      {minesWithData.map((mine: any, idx: number) => (
                        <linearGradient key={`grad-${mine.mineName}`} id={`band-${idx}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={LINE_COLORS[idx % LINE_COLORS.length]} stopOpacity={0.15} />
                          <stop offset="100%" stopColor={LINE_COLORS[idx % LINE_COLORS.length]} stopOpacity={0.03} />
                        </linearGradient>
                      ))}
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
                      }}
                      formatter={((value: number | number[] | undefined, name: string) => {
                        if (Array.isArray(value)) return null; // hide range entries
                        if (name.endsWith("_range") || name.endsWith("_upper") || name.endsWith("_lower")) return null;
                        return [`${(value ?? 0).toLocaleString()} kg CO₂e`, name];
                      }) as any}
                    />
                    <Legend
                      formatter={(value: string) => {
                        // Hide band/range legend entries
                        if (value.includes("_range") || value.includes("_upper") || value.includes("_lower") || value.includes("Band")) return "";
                        return value;
                      }}
                    />
                    {/* Confidence bands (Area) */}
                    {minesWithData.map((mine: any, idx: number) => (
                      <Area
                        key={`band-${mine.mineName}`}
                        type="monotone"
                        dataKey={`${mine.mineName}_range`}
                        fill={`url(#band-${idx})`}
                        stroke="none"
                        name={`${mine.mineName} Band`}
                        legendType="none"
                        animationDuration={800}
                      />
                    ))}
                    {/* Main forecast lines (curved) */}
                    {minesWithData.map((mine: any, idx: number) => (
                      <Line
                        key={mine.mineName}
                        type="monotone"
                        dataKey={mine.mineName}
                        stroke={LINE_COLORS[idx % LINE_COLORS.length]}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: LINE_COLORS[idx % LINE_COLORS.length] }}
                        activeDot={{ r: 5 }}
                        name={mine.mineName}
                        animationDuration={800 + idx * 300}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Numerical Comparison Table */}
              {comparisonStats.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                    Numerical Comparison
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Mine</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Total (kg)</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Avg/Day</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Peak Day</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Min Day</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Trend</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">MAE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {comparisonStats.map((stat: any, idx: number) => (
                          <motion.tr
                            key={stat.name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            className="border-b border-white/5 hover:bg-white/5 transition-colors"
                          >
                            <td className="py-3 px-4 font-medium flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                                style={{ backgroundColor: stat.color }}
                              />
                              {stat.name}
                            </td>
                            <td className="text-right py-3 px-4 font-mono">
                              {stat.totalEmission.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4 font-mono">
                              {stat.avgDaily.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4 font-mono text-red-400">
                              {stat.peakDay.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4 font-mono text-green-400">
                              {stat.minDay.toLocaleString()}
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                                stat.trendPct > 1
                                  ? "text-red-400 bg-red-500/10"
                                  : stat.trendPct < -1
                                  ? "text-green-400 bg-green-500/10"
                                  : "text-slate-400 bg-slate-500/10"
                              }`}>
                                {stat.trendPct > 1 ? <TrendingUp className="w-3 h-3" /> :
                                 stat.trendPct < -1 ? <TrendingDown className="w-3 h-3" /> :
                                 <Minus className="w-3 h-3" />}
                                {stat.trendPct > 0 ? "+" : ""}{stat.trendPct}%
                              </span>
                            </td>
                            <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                              {stat.accuracy?.mae ? `${Math.round(stat.accuracy.mae)}` : "—"}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <GitCompare className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>{selectedMines.length < 2
                ? "Select at least 2 mines to compare forecasts."
                : "No forecast data available for selected mines. Generate forecasts first."
              }</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MultiMineComparisonRow;
