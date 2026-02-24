import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2, Brain, TrendingUp, Target, Activity,
  Calendar, Info, CheckCircle2, Clock, BarChart3
} from "lucide-react";
import {
  Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Area, ComposedChart
} from 'recharts';
import { motion } from 'framer-motion';
import ChartWrapper from "@/components/ui/ChartWrapper";

// Row 4-11 components
import AnomalySeasonalityRow from "@/components/forecast/AnomalySeasonalityRow";
import SimulatorRow from "@/components/forecast/SimulatorRow";
import CarbonBudgetRiskRow from "@/components/forecast/CarbonBudgetRiskRow";
import ExplainabilityRow from "@/components/forecast/ExplainabilityRow";
import MultiMineComparisonRow from "@/components/forecast/MultiMineComparisonRow";
import ForecastMetricsRow from "@/components/forecast/ForecastMetricsRow";
import MineSummaryRow from "@/components/forecast/MineSummaryRow";
import ReportDownloadRow from "@/components/forecast/ReportDownloadRow";

interface ForecastEntry {
  date: string;
  predicted: number;
  upper_bound: number;
  lower_bound: number;
}

interface ForecastResult {
  source: string;
  forecast_data: ForecastEntry[];
  model_accuracy: { mae: number; rmse: number };
  model_params: { order: number[]; aic: number };
  data_points_used: number;
  generated_at: string;
  expires_at: string;
}

const VisualizationPage = () => {
  const { toast } = useToast();
  const [selectedMine, setSelectedMine] = useState<string>("");
  const [mines, setMines] = useState<any[]>([]);
  const [horizon, setHorizon] = useState<number>(7);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [_loading, _setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [_insightsLoading, setInsightsLoading] = useState(false);

  // Fetch mines
  useEffect(() => {
    const fetchMines = async () => {
      try {
        const data = await api.getMines();
        setMines(data);
      } catch (error) {
        console.error("Error fetching mines:", error);
        toast({ title: "Error", description: "Could not fetch mines.", variant: "destructive" });
      }
    };
    fetchMines();
  }, [toast]);

  // Fetch historical data when mine changes
  useEffect(() => {
    if (selectedMine) {
      fetchHistoricalData();
      setForecast(null);
    }
  }, [selectedMine]);

  const fetchHistoricalData = async () => {
    try {
      const data = await api.getVisualizationData(selectedMine);
      setHistoricalData(data?.emissionsTrend || []);
    } catch (error) {
      console.error("Error fetching historical data:", error);
    }
  };

  // Fetch forecast insights
  const fetchInsights = useCallback(async (mineId: string, h: number) => {
    setInsightsLoading(true);
    try {
      const data = await api.getForecastInsights(mineId, h);
      setInsights(data);
    } catch (err) {
      console.warn("Insights unavailable:", err);
      setInsights(null);
    } finally {
      setInsightsLoading(false);
    }
  }, []);

  const generateForecast = async () => {
    if (!selectedMine) return;
    setGenerating(true);
    try {
      const result = await api.generateForecast(selectedMine, horizon);
      setForecast(result);
      toast({
        title: "Forecast Generated",
        description: `${horizon}-day ARIMA forecast ready (${result.source === 'cache' ? 'from cache' : 'freshly generated'}).`,
      });
      // Auto-fetch insights after forecast generation
      fetchInsights(selectedMine, horizon);
    } catch (error: any) {
      const msg = error?.response?.data?.error || "Failed to generate forecast. Is the ML service running?";
      toast({ title: "Forecast Error", description: msg, variant: "destructive" });
      console.error("Forecast error:", error);
    } finally {
      setGenerating(false);
    }
  };

  // Build combined chart data (historical + forecast)
  const chartData = (() => {
    if (!forecast) return [];

    const last30Historical = historicalData.slice(-30).map((d: any) => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: d.totalEmissions,
      predicted: null as number | null,
      upper_bound: null as number | null,
      lower_bound: null as number | null,
      type: 'historical'
    }));

    const forecastEntries = forecast.forecast_data.map((f) => ({
      date: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      actual: null as number | null,
      predicted: Math.round(f.predicted),
      upper_bound: Math.round(f.upper_bound),
      lower_bound: Math.round(f.lower_bound),
      type: 'forecast'
    }));

    return [...last30Historical, ...forecastEntries];
  })();


  const selectedMineName = mines.find(m => m._id === selectedMine)?.name || '';

  return (
    <div className="min-h-screen pt-24 px-4 pb-8">
      <div className="container mx-auto max-w-[1400px] space-y-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-effect p-6 rounded-2xl border border-white/20"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">AI Emission Forecasting</h1>
                <p className="text-muted-foreground">ARIMA-based carbon emission predictions</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedMine} onValueChange={setSelectedMine}>
                <SelectTrigger className="w-[200px] glass-effect">
                  <SelectValue placeholder="Select a mine..." />
                </SelectTrigger>
                <SelectContent>
                  {mines.map((mine) => (
                    <SelectItem key={mine._id} value={mine._id}>{mine.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={String(horizon)} onValueChange={(v) => setHorizon(Number(v))}>
                <SelectTrigger className="w-[140px] glass-effect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={generateForecast}
                disabled={!selectedMine || generating}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Brain className="w-4 h-4 mr-2" /> Generate Forecast</>
                )}
              </Button>
            </div>
          </div>
        </motion.div>


        {/* No mine selected */}
        {!selectedMine && (
          <Card className="glass-effect border-white/20">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Brain className="w-20 h-20 mx-auto mb-4 text-purple-500 opacity-40" />
                <h3 className="text-xl font-semibold mb-2">Select a Mine</h3>
                <p className="text-muted-foreground">Choose a mine and click "Generate Forecast" to predict future emissions</p>
              </div>
            </CardContent>
          </Card>
        )}


        {/* Forecast results */}
        {selectedMine && forecast && (
          <>
            {/* Model Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="glass-effect border-white/20 hover:border-purple-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                        <Target className="w-5 h-5 text-purple-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">MAE (Accuracy)</span>
                    </div>
                    <p className="text-2xl font-bold">{forecast.model_accuracy.mae.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Mean Absolute Error</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="glass-effect border-white/20 hover:border-blue-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Activity className="w-5 h-5 text-blue-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">RMSE</span>
                    </div>
                    <p className="text-2xl font-bold">{forecast.model_accuracy.rmse.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Root Mean Square Error</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="glass-effect border-white/20 hover:border-green-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-green-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">Data Points</span>
                    </div>
                    <p className="text-2xl font-bold">{forecast.data_points_used}</p>
                    <p className="text-xs text-muted-foreground mt-1">Used for training</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="glass-effect border-white/20 hover:border-amber-500/30 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className="text-sm text-muted-foreground">ARIMA Order</span>
                    </div>
                    <p className="text-2xl font-bold">({forecast.model_params.order.join(', ')})</p>
                    <p className="text-xs text-muted-foreground mt-1">AIC: {forecast.model_params.aic.toFixed(1)}</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>


            {/* Main Forecast Chart */}
            <ChartWrapper title="Actual vs. Predicted Emissions" icon={<TrendingUp className="w-4 h-4 text-purple-500" />}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-500" />
                        Actual vs. Predicted Emissions — {selectedMineName}
                      </CardTitle>
                      <CardDescription>
                        Last 30 days historical + {horizon}-day ARIMA forecast with 95% confidence interval
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {forecast.source === 'cache' ? (
                        <><Clock className="w-3 h-3" /> From cache</>
                      ) : (
                        <><CheckCircle2 className="w-3 h-3 text-green-500" /> Freshly generated</>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="h-[420px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                      <defs>
                        <linearGradient id="confidenceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 11 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        tick={{ fontSize: 11 }}
                        label={{ value: 'kg CO₂e', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '10px',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }}
                        formatter={((value: any, name: any) => {
                          if (!value) return ['-', name];
                          const labels: Record<string, string> = {
                            actual: 'Historical',
                            predicted: 'Predicted',
                            upper_bound: 'Upper Bound',
                            lower_bound: 'Lower Bound',
                          };
                          return [`${(value ?? 0).toLocaleString()} kg CO₂e`, labels[name] || name];
                        }) as any}
                      />
                      <Legend />

                      {/* Confidence band */}
                      <Area
                        type="monotone"
                        dataKey="upper_bound"
                        stroke="none"
                        fill="url(#confidenceGrad)"
                        fillOpacity={1}
                        name="upper_bound"
                        legendType="none"
                      />
                      <Area
                        type="monotone"
                        dataKey="lower_bound"
                        stroke="none"
                        fill="hsl(var(--background))"
                        fillOpacity={1}
                        name="lower_bound"
                        legendType="none"
                      />

                      {/* Historical line */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#3b82f6"
                        strokeWidth={2.5}
                        dot={{ r: 2, fill: '#3b82f6' }}
                        name="actual"
                        connectNulls={false}
                      />

                      {/* Forecast line */}
                      <Line
                        type="monotone"
                        dataKey="predicted"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        strokeDasharray="6 3"
                        dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }}
                        name="predicted"
                        connectNulls={false}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
            </ChartWrapper>


            {/* Forecast Table */}
            <ChartWrapper title="Forecast Details" icon={<Info className="w-4 h-4 text-blue-500" />}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-500" />
                    Forecast Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Predicted (kg CO₂e)</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Lower Bound</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Upper Bound</th>
                          <th className="text-right py-3 px-4 font-medium text-muted-foreground">Confidence Range</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.forecast_data.map((entry, idx) => {
                          const range = entry.upper_bound - entry.lower_bound;
                          return (
                            <motion.tr
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.02 * idx }}
                              className="border-b border-white/5 hover:bg-white/5 transition-colors"
                            >
                              <td className="py-3 px-4 font-medium">
                                {new Date(entry.date).toLocaleDateString('en-US', {
                                  weekday: 'short', month: 'short', day: 'numeric'
                                })}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-purple-400">
                                {Math.round(entry.predicted).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-green-400">
                                {Math.round(entry.lower_bound).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-red-400">
                                {Math.round(entry.upper_bound).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-muted-foreground">
                                ±{Math.round(range / 2).toLocaleString()}
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            </ChartWrapper>


            {/* ═══════════════ ROW 4-11: Forecast Intelligence Dashboard ═══════════════ */}

            {/* Section Divider */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex items-center gap-4 py-2"
            >
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              <span className="text-sm font-medium text-muted-foreground">Intelligence Dashboard</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
            </motion.div>

            {/* Row 4: Anomaly Detection + Seasonality */}
            <ChartWrapper title="Anomaly Detection & Seasonality">
            <AnomalySeasonalityRow
              anomalies={insights?.anomalies || []}
              seasonality={insights?.seasonality || { weekday_data: [], insight: 'Generate forecast to see insights', has_pattern: false }}
            />
            </ChartWrapper>

            {/* Row 5: What-If Scenario Simulator */}
            <ChartWrapper title="What-If Scenario Simulator">
            <SimulatorRow forecastData={forecast.forecast_data} />
            </ChartWrapper>

            {/* Row 6: Carbon Budget + Risk */}
            <ChartWrapper title="Carbon Budget & Risk Assessment">
            <CarbonBudgetRiskRow
              carbonBudget={insights?.carbonBudget || {
                annualBudgetKg: 500000000, ytdEmissionsKg: 0,
                budgetUsedPct: 0, remainingBudgetKg: 500000000, estimatedBreachDate: null,
              }}
              riskLevel={insights?.riskLevel || 'low'}
              trendDescription={insights?.trend?.description || 'Trend analysis unavailable.'}
            />
            </ChartWrapper>

            {/* Row 7: Explainability */}
            <ChartWrapper title="Model Explainability">
            <ExplainabilityRow
              drivers={insights?.drivers || []}
              trend={insights?.trend || { direction: 'stable', slope: 0, description: 'Trend unavailable.' }}
              seasonalityPresent={insights?.seasonality?.has_pattern || false}
              modelOrder={forecast.model_params.order}
              modelAic={forecast.model_params.aic}
            />
            </ChartWrapper>

            {/* Row 8: Multi-Mine Comparison */}
            <ChartWrapper title="Multi-Mine Forecast Comparison">
            <MultiMineComparisonRow
              mines={mines}
              horizon={horizon}
              currentMineId={selectedMine}
            />
            </ChartWrapper>

            {/* Row 9: Forecast Metrics */}
            <ChartWrapper title="Forecast Metrics">
            <ForecastMetricsRow
              mae={forecast.model_accuracy.mae}
              rmse={forecast.model_accuracy.rmse}
              mape={insights?.mape || null}
              confidenceScore={Math.max(0, Math.min(100,
                100 - (forecast.forecast_data.reduce((s, f) => s + (f.upper_bound - f.lower_bound), 0) /
                forecast.forecast_data.reduce((s, f) => s + f.predicted, 0)) * 50
              ))}
              modelType="ARIMA"
            />
            </ChartWrapper>

            {/* Row 10: Mine Summary Intelligence */}
            <ChartWrapper title="Mine Summary Intelligence">
            <MineSummaryRow
              summary={insights?.summary || {
                currentEmission: 0, forecastGrowthPct: 0,
                reductionPotential: 0, carbonIntensity: 0,
              }}
            />
            </ChartWrapper>

            {/* Row 11: Report Download */}
            <ChartWrapper title="Report Download">
            <ReportDownloadRow
              mineId={selectedMine}
              mineName={selectedMineName}
              horizon={horizon}
            />
            </ChartWrapper>
          </>
        )}


        {/* Selected mine but no forecast yet */}
        {selectedMine && !forecast && !generating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="glass-effect border-white/20">
              <CardContent className="flex items-center justify-center py-16">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-40" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Forecast</h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Generate Forecast" to create a {horizon}-day ARIMA prediction for {selectedMineName}
                  </p>
                  <Alert className="max-w-md mx-auto text-left">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Requires at least 30 days of emission data. The ML service must be running on port 5001.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Loading state */}
        {generating && (
          <Card className="glass-effect border-white/20">
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-purple-500" />
                <h3 className="text-xl font-semibold mb-2">Training ARIMA Model...</h3>
                <p className="text-muted-foreground">Fitting model to historical data and generating predictions</p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
};

export default VisualizationPage;
