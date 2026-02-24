import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Zap,
  Leaf,
  Wind,
  Gauge,
  TrendingDown,
  TrendingUp,
  Flame,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lightbulb,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
  Route,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mine {
  _id: string;
  name: string;
}

interface EmissionRecord {
  _id: string;
  date: string;
  fuel_used: number;
  electricity_used: number;
  explosives_used: number;
  transport_fuel_used: number;
  methane_emissions_ch4: number;
  methane_emissions_co2e: number;
  total_carbon_emission: number;
  scope1: number;
  scope2: number;
  scope3: number;
}

interface ForecastEntry {
  date: string;
  predicted: number;
  upper_bound: number;
  lower_bound: number;
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedCounter = ({
  value,
  suffix = "",
  decimals = 1,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + eased * (end - start));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return (
    <span>
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

// ─── Pathway Presets ──────────────────────────────────────────────────────────
const PATHWAY_PRESETS = [
  {
    name: "Conservative",
    ev: 15,
    renewable: 20,
    methane: 25,
    efficiency: 8,
    desc: "Low-risk incremental improvements",
    icon: Shield,
    color: "text-blue-400",
  },
  {
    name: "Balanced",
    ev: 40,
    renewable: 50,
    methane: 45,
    efficiency: 15,
    desc: "Moderate investment, strong results",
    icon: Target,
    color: "text-emerald-400",
  },
  {
    name: "Aggressive",
    ev: 80,
    renewable: 85,
    methane: 75,
    efficiency: 25,
    desc: "Maximum reduction, high investment",
    icon: Sparkles,
    color: "text-amber-400",
  },
  {
    name: "Net Zero 2030",
    ev: 95,
    renewable: 100,
    methane: 90,
    efficiency: 30,
    desc: "Full decarbonization pathway",
    icon: Leaf,
    color: "text-green-400",
  },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const PathwaysPage = () => {
  const { toast } = useToast();

  // State
  const [mines, setMines] = useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = useState("");
  const [emissions, setEmissions] = useState<EmissionRecord[]>([]);
  const [forecast, setForecast] = useState<ForecastEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [simMode, setSimMode] = useState<"historical" | "future" | "combined">(
    "combined"
  );

  // Slider state
  const [evAdoption, setEvAdoption] = useState(0);
  const [renewablePct, setRenewablePct] = useState(0);
  const [methaneCapture, setMethaneCapture] = useState(0);
  const [efficiency, setEfficiency] = useState(0);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setPlaybackStep] = useState(0);

  // ─── Fetch mines ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMines();
        if (Array.isArray(data)) {
          setMines(data);
          if (data.length > 0) setSelectedMineId(data[0]._id);
        }
      } catch (e) {
        console.error("Error fetching mines:", e);
      }
    })();
  }, []);

  // ─── Fetch emissions + forecast when mine changes ──────────────────────────
  useEffect(() => {
    if (!selectedMineId) return;
    (async () => {
      setLoading(true);
      try {
        const [emData, fcData] = await Promise.all([
          api.getMineEmissions(selectedMineId),
          api.getForecast(selectedMineId, 14).catch(() =>
            api.generateForecast(selectedMineId, 14)
          ),
        ]);
        setEmissions(emData || []);
        setForecast(fcData?.forecast_data || []);
      } catch (e) {
        console.error("Error:", e);
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedMineId]);

  const selectedMineName =
    mines.find((m) => m._id === selectedMineId)?.name || "Mine";

  // ─── Derived analytics ────────────────────────────────────────────────────
  const mineProfile = useMemo(() => {
    if (!emissions.length) return null;
    const sorted = [...emissions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const total = sorted.reduce(
      (s, e) => s + (e.total_carbon_emission || 0),
      0
    );
    const recent30 = sorted.slice(-30);
    const avgDaily =
      recent30.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) /
      (recent30.length || 1);
    const prev30 = sorted.slice(-60, -30);
    const prevAvg =
      prev30.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) /
      (prev30.length || 1);
    const growthPct = prevAvg > 0 ? ((avgDaily - prevAvg) / prevAvg) * 100 : 0;

    // Source breakdown
    const fuelTotal =
      sorted.reduce((s, e) => s + (e.fuel_used || 0) * 2.68, 0);
    const elecTotal =
      sorted.reduce((s, e) => s + (e.electricity_used || 0) * 0.82, 0);
    const methaneTotal = sorted.reduce(
      (s, e) => s + (e.methane_emissions_co2e || 0),
      0
    );
    const transportTotal =
      sorted.reduce((s, e) => s + (e.transport_fuel_used || 0) * 2.68, 0);
    const explosivesTotal =
      sorted.reduce((s, e) => s + (e.explosives_used || 0) * 0.316, 0);

    const sources = [
      { name: "Fuel", value: fuelTotal, color: "#f97316" },
      { name: "Electricity", value: elecTotal, color: "#eab308" },
      { name: "Methane", value: methaneTotal, color: "#14b8a6" },
      { name: "Transport", value: transportTotal, color: "#8b5cf6" },
      { name: "Explosives", value: explosivesTotal, color: "#ef4444" },
    ];

    const topSource = [...sources].sort((a, b) => b.value - a.value)[0];

    // Annualized budget estimate (based on avg daily × 365)
    const annualBudget = avgDaily * 365 * 0.9; // 10% reduction target
    const ytd = total;

    return {
      total,
      avgDaily,
      growthPct,
      sources,
      topSource,
      sorted,
      annualBudget,
      ytd,
      recordCount: sorted.length,
    };
  }, [emissions]);

  // ─── Reduction calculation ────────────────────────────────────────────────
  const reductionFactor = useMemo(() => {
    const evR = evAdoption * 0.002;
    const renR = renewablePct * 0.003;
    const methR = methaneCapture * 0.0025;
    const effR = efficiency * 0.005;
    return Math.min(evR + renR + methR + effR, 0.85);
  }, [evAdoption, renewablePct, methaneCapture, efficiency]);

  const totalReductionPct = Math.round(reductionFactor * 100);

  // ─── Simulation chart data ────────────────────────────────────────────────
  const lifecycleData = useMemo(() => {
    const result: {
      date: string;
      baseline: number;
      simulated: number;
      type: string;
    }[] = [];

    if (
      (simMode === "historical" || simMode === "combined") &&
      mineProfile?.sorted
    ) {
      // Aggregate to weekly for historical
      const weekly: Record<string, number[]> = {};
      mineProfile.sorted.forEach((e) => {
        const d = new Date(e.date);
        const key = `W${Math.ceil(d.getDate() / 7)}-${d.toLocaleDateString(
          "en-US",
          { month: "short", year: "2-digit" }
        )}`;
        if (!weekly[key]) weekly[key] = [];
        weekly[key].push(e.total_carbon_emission || 0);
      });
      Object.entries(weekly).forEach(([date, vals]) => {
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length / 1000;
        result.push({
          date,
          baseline: parseFloat(avg.toFixed(2)),
          simulated: parseFloat((avg * (1 - reductionFactor)).toFixed(2)),
          type: "historical",
        });
      });
    }

    if (
      (simMode === "future" || simMode === "combined") &&
      forecast.length > 0
    ) {
      forecast.forEach((f) => {
        const baseline = f.predicted / 1000;
        result.push({
          date: new Date(f.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          baseline: parseFloat(baseline.toFixed(2)),
          simulated: parseFloat(
            (baseline * (1 - reductionFactor)).toFixed(2)
          ),
          type: "forecast",
        });
      });
    }

    return result;
  }, [mineProfile, forecast, reductionFactor, simMode]);

  // ─── Savings calculation ──────────────────────────────────────────────────
  const savings = useMemo(() => {
    if (!lifecycleData.length) return { total: 0, daily: 0, annual: 0 };
    const totalBaseline = lifecycleData.reduce((s, d) => s + d.baseline, 0);
    const totalSim = lifecycleData.reduce((s, d) => s + d.simulated, 0);
    const saved = totalBaseline - totalSim;
    return {
      total: saved,
      daily: saved / lifecycleData.length,
      annual: (saved / lifecycleData.length) * 365,
    };
  }, [lifecycleData]);

  // ─── Carbon budget ────────────────────────────────────────────────────────
  const carbonBudget = useMemo(() => {
    if (!mineProfile) return null;
    const budget = mineProfile.annualBudget / 1000; // tonnes
    const used = (mineProfile.ytd / 1000) * (1 - reductionFactor);
    const pct = budget > 0 ? (used / budget) * 100 : 0;
    const remaining = Math.max(budget - used, 0);
    const avgDailyReduced =
      (mineProfile.avgDaily / 1000) * (1 - reductionFactor);
    const daysLeft =
      avgDailyReduced > 0 ? Math.ceil(remaining / avgDailyReduced) : null;
    return { budget, used, pct: Math.min(pct, 100), remaining, daysLeft };
  }, [mineProfile, reductionFactor]);

  // ─── Recommendations ─────────────────────────────────────────────────────
  const recommendations = useMemo(() => {
    if (!mineProfile) return [];
    const recs: {
      title: string;
      desc: string;
      impact: string;
      priority: "high" | "medium" | "low";
      icon: typeof Leaf;
    }[] = [];

    const sorted = [...mineProfile.sources].sort((a, b) => b.value - a.value);

    if (sorted[0]?.name === "Fuel") {
      recs.push({
        title: "EV Fleet Transition",
        desc: "Replace diesel haulers with electric alternatives. Phase 1: short-haul vehicles.",
        impact: "−15-25% fuel emissions",
        priority: "high",
        icon: Zap,
      });
    }
    if (sorted[0]?.name === "Electricity" || sorted[1]?.name === "Electricity") {
      recs.push({
        title: "Solar + Wind Deployment",
        desc: "Install on-site renewable generation. Start with solar canopies on admin buildings.",
        impact: "−20-35% grid emissions",
        priority: "high",
        icon: Wind,
      });
    }
    if (sorted[0]?.name === "Methane" || sorted[1]?.name === "Methane") {
      recs.push({
        title: "Methane Capture System",
        desc: "Deploy ventilation air methane (VAM) capture with oxidation technology.",
        impact: "−40-60% methane leaks",
        priority: "high",
        icon: Leaf,
      });
    }

    recs.push({
      title: "Energy Efficiency Audit",
      desc: "Optimize ventilation, lighting, and conveyor systems with IoT monitoring.",
      impact: "−8-12% overall energy",
      priority: "medium",
      icon: Gauge,
    });

    recs.push({
      title: "Transport Route Optimization",
      desc: "Use AI-optimized haul routes and reduce idle time with fleet management.",
      impact: "−10-15% transport fuel",
      priority: "medium",
      icon: Route,
    });

    if (mineProfile.growthPct > 5) {
      recs.push({
        title: "Emission Growth Alert",
        desc: `Emissions trending up ${mineProfile.growthPct.toFixed(1)}% vs last month. Investigate production changes.`,
        impact: "Requires immediate attention",
        priority: "high",
        icon: AlertTriangle,
      });
    }

    return recs;
  }, [mineProfile]);

  // ─── Preset handler ───────────────────────────────────────────────────────
  const applyPreset = useCallback(
    (preset: (typeof PATHWAY_PRESETS)[0]) => {
      setEvAdoption(preset.ev);
      setRenewablePct(preset.renewable);
      setMethaneCapture(preset.methane);
      setEfficiency(preset.efficiency);
      toast({
        title: `${preset.name} Pathway Applied`,
        description: preset.desc,
      });
    },
    [toast]
  );

  // ─── Scenario playback ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setPlaybackStep((prev) => {
        const next = prev + 1;
        if (next > 10) {
          setIsPlaying(false);
          return 10;
        }
        // Gradually increase sliders
        const factor = next / 10;
        setEvAdoption(Math.round(80 * factor));
        setRenewablePct(Math.round(85 * factor));
        setMethaneCapture(Math.round(70 * factor));
        setEfficiency(Math.round(25 * factor));
        return next;
      });
    }, 800);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const resetSimulation = () => {
    setEvAdoption(0);
    setRenewablePct(0);
    setMethaneCapture(0);
    setEfficiency(0);
    setPlaybackStep(0);
    setIsPlaying(false);
  };

  const handleSliderChange = useCallback(
    (setter: (v: number) => void) => (value: number[]) => setter(value[0]),
    []
  );

  const sliders = [
    {
      label: "EV Fleet Adoption",
      icon: Zap,
      value: evAdoption,
      onChange: setEvAdoption,
      max: 100,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      track: "bg-yellow-500",
    },
    {
      label: "Renewable Energy",
      icon: Wind,
      value: renewablePct,
      onChange: setRenewablePct,
      max: 100,
      color: "text-green-400",
      bg: "bg-green-500/10",
      track: "bg-green-500",
    },
    {
      label: "Methane Capture",
      icon: Leaf,
      value: methaneCapture,
      onChange: setMethaneCapture,
      max: 100,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      track: "bg-teal-500",
    },
    {
      label: "Efficiency Gains",
      icon: Gauge,
      value: efficiency,
      onChange: setEfficiency,
      max: 30,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      track: "bg-blue-500",
    },
  ];

  // ─── Carbon Budget SVG Arc ────────────────────────────────────────────────
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75;
  const filledLength = arcLength * ((carbonBudget?.pct || 0) / 100);

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Optimization Pathways
            </h1>
            <p className="text-muted-foreground">
              Simulate reduction scenarios, explore recommendations, and plan
              your decarbonization journey
            </p>
          </div>
          <div className="w-64">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Active Mine
            </Label>
            <Select value={selectedMineId} onValueChange={setSelectedMineId}>
              <SelectTrigger className="glass-effect border-white/10">
                <SelectValue placeholder="Select a mine…" />
              </SelectTrigger>
              <SelectContent>
                {mines.map((m) => (
                  <SelectItem key={m._id} value={m._id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}

        {!loading && selectedMineId && mineProfile && (
          <div className="space-y-8">
            {/* ── Step 12: Mine Digital Profile ──────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Current Emission",
                  value: mineProfile.avgDaily / 1000,
                  suffix: " t/day",
                  icon: Flame,
                  color: "text-orange-400",
                  bg: "bg-orange-500/10",
                },
                {
                  label: "Forecast Trend",
                  value: Math.abs(mineProfile.growthPct),
                  suffix: "%",
                  prefix: mineProfile.growthPct >= 0 ? "+" : "−",
                  icon: mineProfile.growthPct >= 0 ? TrendingUp : TrendingDown,
                  color:
                    mineProfile.growthPct > 0
                      ? "text-red-400"
                      : "text-green-400",
                  bg:
                    mineProfile.growthPct > 0
                      ? "bg-red-500/10"
                      : "bg-green-500/10",
                },
                {
                  label: "Reduction Potential",
                  value: savings.annual,
                  suffix: " t/yr",
                  icon: Leaf,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Top Source",
                  textValue: mineProfile.topSource?.name || "—",
                  icon: BarChart3,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                },
              ].map((card, i) => (
                <Card
                  key={i}
                  className="glass-effect border-white/10 hover:border-primary/30 transition-all hover:scale-[1.02]"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-8 h-8 ${card.bg} rounded-lg flex items-center justify-center`}
                      >
                        <card.icon className={`w-4 h-4 ${card.color}`} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {card.label}
                      </span>
                    </div>
                    {"textValue" in card ? (
                      <p className={`text-2xl font-bold ${card.color}`}>
                        {card.textValue}
                      </p>
                    ) : (
                      <p className={`text-2xl font-bold ${card.color}`}>
                        {"prefix" in card && card.prefix}
                        <AnimatedCounter
                          value={card.value!}
                          suffix={card.suffix}
                        />
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* ── Step 13: Simulation Mode Toggle ────────────────────────── */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm text-muted-foreground font-medium">
                Simulation Mode:
              </span>
              {(
                [
                  { key: "historical", label: "Historical" },
                  { key: "future", label: "Future" },
                  { key: "combined", label: "Combined" },
                ] as const
              ).map((mode) => (
                <Button
                  key={mode.key}
                  variant={simMode === mode.key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSimMode(mode.key)}
                  className="text-xs h-8"
                >
                  {mode.label}
                </Button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPlaybackStep(0);
                    setIsPlaying(true);
                  }}
                  disabled={isPlaying}
                  className="text-xs h-8"
                >
                  <Play className="w-3 h-3 mr-1" />
                  Playback
                </Button>
                {isPlaying && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(false)}
                    className="text-xs h-8"
                  >
                    <Pause className="w-3 h-3 mr-1" />
                    Pause
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetSimulation}
                  className="text-xs h-8"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {/* ── Step 14–16: Pathway Controls + Lifecycle Chart ──────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Controls */}
              <Card className="glass-effect border-white/10 overflow-hidden">
                {reductionFactor > 0 && (
                  <div
                    className="absolute inset-0 pointer-events-none rounded-xl transition-opacity duration-700"
                    style={{
                      background: `radial-gradient(ellipse at bottom, hsl(142 71% 45% / ${Math.min(
                        reductionFactor * 0.15,
                        0.12
                      )}), transparent 70%)`,
                    }}
                  />
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-white" />
                      </div>
                      Pathway Controls
                    </CardTitle>
                    <div
                      className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                        totalReductionPct > 30
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : totalReductionPct > 0
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                          : "bg-muted/30 text-muted-foreground border border-white/10"
                      }`}
                    >
                      {totalReductionPct > 0
                        ? `−${totalReductionPct}%`
                        : "0%"}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 relative">
                  {/* Preset buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    {PATHWAY_PRESETS.map((p) => (
                      <Button
                        key={p.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(p)}
                        className="text-xs h-8 justify-start gap-1.5 border-white/10 hover:border-primary/30"
                      >
                        <p.icon className={`w-3 h-3 ${p.color}`} />
                        {p.name}
                      </Button>
                    ))}
                  </div>

                  <div className="border-t border-white/5 pt-4 space-y-4">
                    {sliders.map((s) => (
                      <div key={s.label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-6 h-6 ${s.bg} rounded flex items-center justify-center`}
                            >
                              <s.icon className={`w-3 h-3 ${s.color}`} />
                            </div>
                            <span className="text-xs font-medium">
                              {s.label}
                            </span>
                          </div>
                          <span className={`text-xs font-bold ${s.color}`}>
                            {s.value}
                            {s.max === 30 ? "%" : "%"}
                          </span>
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
                  </div>

                  {/* Savings card */}
                  {reductionFactor > 0 && (
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 space-y-2">
                      <p className="text-xs text-green-400 font-semibold">
                        Estimated Savings
                      </p>
                      <p className="text-2xl font-bold text-green-400">
                        <AnimatedCounter
                          value={savings.total}
                          suffix=" t CO₂e"
                        />
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{savings.annual.toFixed(0)} t/year annualized
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Right: Lifecycle Chart */}
              <Card className="glass-effect border-white/10 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Lifecycle Simulation
                  </CardTitle>
                  <CardDescription>
                    {simMode === "historical"
                      ? "Historical emissions with simulated reduction applied"
                      : simMode === "future"
                      ? "Forecast emissions with reduction pathway"
                      : "Full historical + forecast lifecycle view"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={lifecycleData}
                        margin={{ top: 10, right: 20, left: 10, bottom: 30 }}
                      >
                        <defs>
                          <linearGradient
                            id="baseGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#ef4444"
                              stopOpacity={0.15}
                            />
                            <stop
                              offset="95%"
                              stopColor="#ef4444"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                          <linearGradient
                            id="simGrad"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#22c55e"
                              stopOpacity={0.2}
                            />
                            <stop
                              offset="95%"
                              stopColor="#22c55e"
                              stopOpacity={0.02}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 9, fill: "#888" }}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "#888" }}
                          axisLine={false}
                          label={{
                            value: "t CO₂e",
                            angle: -90,
                            position: "insideLeft",
                            style: { fontSize: 10, fill: "#888" },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                          }}
                          formatter={((value: any, name: string) => [
                            `${Number(value).toFixed(2)} t CO₂e`,
                            name === "baseline"
                              ? "Baseline"
                              : "With Reduction",
                          ]) as any}
                        />
                        <Area
                          type="monotone"
                          dataKey="baseline"
                          fill="url(#baseGrad)"
                          stroke="none"
                        />
                        <Line
                          type="monotone"
                          dataKey="baseline"
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          dot={false}
                          name="baseline"
                        />
                        {reductionFactor > 0 && (
                          <>
                            <Area
                              type="monotone"
                              dataKey="simulated"
                              fill="url(#simGrad)"
                              stroke="none"
                            />
                            <Line
                              type="monotone"
                              dataKey="simulated"
                              stroke="#22c55e"
                              strokeWidth={2.5}
                              dot={false}
                              name="simulated"
                            />
                          </>
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 mt-3">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-8 h-0.5 bg-red-500 border-dashed border-t-2 border-red-500" />
                      <span className="text-muted-foreground">Baseline</span>
                    </div>
                    {reductionFactor > 0 && (
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-8 h-0.5 bg-green-500" />
                        <span className="text-muted-foreground">
                          With Reduction (−{totalReductionPct}%)
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── Step 17–18: Recommendation Engine + Carbon Budget ───────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recommendations */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                    </div>
                    Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-generated pathways based on {selectedMineName}'s emission
                    profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all hover:scale-[1.01] cursor-default ${
                        rec.priority === "high"
                          ? "bg-red-500/5 border-red-500/15"
                          : rec.priority === "medium"
                          ? "bg-amber-500/5 border-amber-500/15"
                          : "bg-blue-500/5 border-blue-500/15"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            rec.priority === "high"
                              ? "bg-red-500/10"
                              : rec.priority === "medium"
                              ? "bg-amber-500/10"
                              : "bg-blue-500/10"
                          }`}
                        >
                          <rec.icon
                            className={`w-4 h-4 ${
                              rec.priority === "high"
                                ? "text-red-400"
                                : rec.priority === "medium"
                                ? "text-amber-400"
                                : "text-blue-400"
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{rec.title}</p>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                rec.priority === "high"
                                  ? "bg-red-500/20 text-red-400"
                                  : rec.priority === "medium"
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-blue-500/20 text-blue-400"
                              }`}
                            >
                              {rec.priority}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {rec.desc}
                          </p>
                          <p className="text-xs font-medium text-green-400 mt-1.5 flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            {rec.impact}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Carbon Budget */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-emerald-500" />
                    </div>
                    Carbon Budget
                  </CardTitle>
                  <CardDescription>
                    Estimated annual budget based on 10% reduction target
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {carbonBudget && (
                    <div className="flex flex-col items-center">
                      {/* Gauge */}
                      <div className="relative w-[180px] h-[150px]">
                        <svg
                          width="180"
                          height="150"
                          viewBox="0 0 180 150"
                        >
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
                          <circle
                            cx="90"
                            cy="90"
                            r={radius}
                            fill="none"
                            stroke={
                              carbonBudget.pct > 80
                                ? "#ef4444"
                                : carbonBudget.pct > 50
                                ? "#f59e0b"
                                : "#22c55e"
                            }
                            strokeWidth="10"
                            strokeDasharray={`${filledLength} ${circumference}`}
                            strokeDashoffset={0}
                            strokeLinecap="round"
                            transform="rotate(135, 90, 90)"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                          <span className="text-3xl font-bold">
                            {carbonBudget.pct.toFixed(1)}%
                          </span>
                          <span className="text-xs text-muted-foreground">
                            budget used
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="w-full grid grid-cols-2 gap-3 mt-4">
                        <div className="text-center p-3 rounded-xl bg-muted/20">
                          <p className="text-xs text-muted-foreground">
                            Remaining
                          </p>
                          <p className="text-lg font-bold text-green-400">
                            {carbonBudget.remaining.toFixed(0)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            t CO₂e
                          </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-muted/20">
                          <p className="text-xs text-muted-foreground">
                            Days Until Breach
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              (carbonBudget.daysLeft || 999) < 60
                                ? "text-red-400"
                                : "text-blue-400"
                            }`}
                          >
                            {carbonBudget.daysLeft || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">days</p>
                        </div>
                      </div>

                      {/* Risk indicator */}
                      <div
                        className={`w-full mt-4 p-3 rounded-xl border flex items-center gap-3 ${
                          carbonBudget.pct > 80
                            ? "bg-red-500/5 border-red-500/20"
                            : carbonBudget.pct > 50
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-green-500/5 border-green-500/20"
                        }`}
                      >
                        {carbonBudget.pct > 80 ? (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        ) : carbonBudget.pct > 50 ? (
                          <Clock className="w-5 h-5 text-amber-400" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              carbonBudget.pct > 80
                                ? "text-red-400"
                                : carbonBudget.pct > 50
                                ? "text-amber-400"
                                : "text-green-400"
                            }`}
                          >
                            {carbonBudget.pct > 80
                              ? "High Risk — Approaching budget limit"
                              : carbonBudget.pct > 50
                              ? "Medium Risk — Monitor closely"
                              : "On Track — Within budget"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {reductionFactor > 0
                              ? `With −${totalReductionPct}% pathway applied`
                              : "Adjust pathways to see impact"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ── Step 19: Reduction Impact Summary ──────────────────────── */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">
                  Reduction Impact Summary
                </CardTitle>
                <CardDescription>
                  Breakdown of emission reduction by source category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source reduction bars */}
                  <div className="space-y-4">
                    {mineProfile.sources.map((src) => {
                      const reducedValue = src.value * (1 - reductionFactor);
                      const savedPct =
                        src.value > 0
                          ? ((src.value - reducedValue) / src.value) * 100
                          : 0;
                      return (
                        <div key={src.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-sm"
                                style={{ backgroundColor: src.color }}
                              />
                              {src.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {(src.value / 1000).toFixed(1)}t →{" "}
                              <span className="text-green-400 font-medium">
                                {(reducedValue / 1000).toFixed(1)}t
                              </span>
                            </span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${100 - savedPct}%`,
                                backgroundColor: src.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Source contribution chart */}
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={mineProfile.sources.map((s) => ({
                          name: s.name,
                          baseline: parseFloat((s.value / 1000).toFixed(2)),
                          reduced: parseFloat(
                            ((s.value * (1 - reductionFactor)) / 1000).toFixed(2)
                          ),
                          color: s.color,
                        }))}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="rgba(255,255,255,0.05)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: "#888" }}
                          axisLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={{ fontSize: 11, fill: "#ccc" }}
                          axisLine={false}
                          width={80}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 10,
                          }}
                          formatter={((v: any) => [
                            `${Number(v).toFixed(2)} t CO₂e`,
                            "",
                          ]) as any}
                        />
                        <Bar
                          dataKey="baseline"
                          fill="#ef444480"
                          radius={[0, 4, 4, 0]}
                          name="Baseline"
                        />
                        <Bar
                          dataKey="reduced"
                          fill="#22c55e"
                          radius={[0, 4, 4, 0]}
                          name="Reduced"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Step 20: Narrative Timeline ────────────────────────────── */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Decarbonization Narrative
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-6 space-y-6">
                  {/* Timeline line */}
                  <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gradient-to-b from-red-500 via-amber-500 to-green-500" />

                  {[
                    {
                      phase: "Current State",
                      desc: `${selectedMineName} emits ${(
                        mineProfile.avgDaily / 1000
                      ).toFixed(1)} t CO₂e/day. Top source: ${
                        mineProfile.topSource?.name
                      }.`,
                      color: "bg-red-500",
                      textColor: "text-red-400",
                    },
                    {
                      phase: "Quick Wins (0–6 months)",
                      desc:
                        evAdoption > 0 || efficiency > 0
                          ? `Deploy energy audits (${efficiency}% efficiency) and begin EV trials (${evAdoption}% fleet).`
                          : "Adjust sliders above to see your pathway plan.",
                      color: "bg-amber-500",
                      textColor: "text-amber-400",
                    },
                    {
                      phase: "Scaling (6–18 months)",
                      desc:
                        renewablePct > 0 || methaneCapture > 0
                          ? `Scale renewables to ${renewablePct}% and methane capture to ${methaneCapture}%.`
                          : "Set renewable and methane capture targets to plan this phase.",
                      color: "bg-yellow-500",
                      textColor: "text-yellow-400",
                    },
                    {
                      phase: "Target State",
                      desc:
                        reductionFactor > 0
                          ? `Achieve −${totalReductionPct}% reduction. Save ~${savings.annual.toFixed(
                              0
                            )} t CO₂e/year.`
                          : "Configure pathway controls to see the projected outcome.",
                      color: "bg-green-500",
                      textColor: "text-green-400",
                    },
                  ].map((step, i) => (
                    <div key={i} className="relative flex gap-4">
                      <div
                        className={`w-5 h-5 ${step.color} rounded-full flex-shrink-0 -ml-6 mt-0.5 border-2 border-background`}
                      />
                      <div>
                        <p
                          className={`text-sm font-semibold ${step.textColor}`}
                        >
                          {step.phase}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {!loading && !selectedMineId && (
          <div className="flex items-center justify-center py-20">
            <Card className="glass-effect border-white/10 max-w-lg text-center">
              <CardContent className="pt-8 pb-8">
                <Route className="h-16 w-16 text-primary mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">
                  Select a mine above to explore optimization pathways.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PathwaysPage;
