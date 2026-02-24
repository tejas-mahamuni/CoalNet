import { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  Shield,
  Clock,
  MapPin,
  Flame,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Settings,
  LogOut,
  Leaf,
  Zap,
  Target,
  Sparkles,
  Brain,
  ChevronRight,
  Star,
  StarOff,
  Activity,
  Eye,
  Plus,
  Route,
  Monitor,
  Moon,
  Sun,
  Globe,
} from "lucide-react";

// ─── Animated Counter ─────────────────────────────────────────────────────────
const AnimatedCounter = ({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = value;
    const duration = 1400;
    let startTime: number;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(eased * end);
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

// ─── Types ────────────────────────────────────────────────────────────────────
interface Mine {
  _id: string;
  name: string;
  location?: string;
  state?: string;
}

interface EmissionRecord {
  date: string;
  total_carbon_emission: number;
  fuel_used: number;
  electricity_used: number;
  methane_emissions_co2e: number;
  transport_fuel_used: number;
  explosives_used: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
const UserPage = () => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // State
  const [mines, setMines] = useState<Mine[]>([]);
  const [allEmissions, setAllEmissions] = useState<
    { mineId: string; records: EmissionRecord[] }[]
  >([]);
  const [pinnedMines, setPinnedMines] = useState<Set<string>>(() => {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("pinnedMines") || "[]")
      );
    } catch {
      return new Set();
    }
  });

  // Preferences
  const [defaultMine, setDefaultMine] = useState(
    () => localStorage.getItem("defaultMine") || ""
  );
  const [defaultHorizon, setDefaultHorizon] = useState(
    () => localStorage.getItem("defaultHorizon") || "14"
  );
  const [preferredUnit, setPreferredUnit] = useState(
    () => localStorage.getItem("preferredUnit") || "tonnes"
  );
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);

  // ─── Fetch mines + emissions ──────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const minesData = await api.getMines();
        if (Array.isArray(minesData)) {
          setMines(minesData);
          // Fetch emissions for all mines in parallel
          const emissionsData = await Promise.all(
            minesData.map(async (m: Mine) => {
              try {
                const records = await api.getMineEmissions(m._id);
                return { mineId: m._id, records: records || [] };
              } catch {
                return { mineId: m._id, records: [] };
              }
            })
          );
          setAllEmissions(emissionsData);
        }
      } catch (e) {
        console.error("Error fetching data:", e);
      }
    })();
  }, []);

  // ─── Save preferences to localStorage ────────────────────────────────────
  useEffect(() => {
    localStorage.setItem("defaultMine", defaultMine);
  }, [defaultMine]);
  useEffect(() => {
    localStorage.setItem("defaultHorizon", defaultHorizon);
  }, [defaultHorizon]);
  useEffect(() => {
    localStorage.setItem("preferredUnit", preferredUnit);
  }, [preferredUnit]);
  useEffect(() => {
    localStorage.setItem("pinnedMines", JSON.stringify([...pinnedMines]));
  }, [pinnedMines]);

  // ─── Derived analytics ────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRecords = allEmissions.reduce(
      (s, m) => s + m.records.length,
      0
    );
    const allRecords = allEmissions.flatMap((m) => m.records);
    const totalEmission = allRecords.reduce(
      (s, r) => s + (r.total_carbon_emission || 0),
      0
    );

    // Last upload date
    const sortedDates = allRecords
      .map((r) => new Date(r.date).getTime())
      .sort((a, b) => b - a);
    const lastUpload = sortedDates[0]
      ? new Date(sortedDates[0]).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Never";

    // Source breakdown across all mines
    const fuelTotal = allRecords.reduce(
      (s, r) => s + (r.fuel_used || 0) * 2.68,
      0
    );
    const elecTotal = allRecords.reduce(
      (s, r) => s + (r.electricity_used || 0) * 0.82,
      0
    );
    const methaneTotal = allRecords.reduce(
      (s, r) => s + (r.methane_emissions_co2e || 0),
      0
    );
    const transportTotal = allRecords.reduce(
      (s, r) => s + (r.transport_fuel_used || 0) * 2.68,
      0
    );

    const topSource = [
      { name: "Fuel", value: fuelTotal },
      { name: "Electricity", value: elecTotal },
      { name: "Methane", value: methaneTotal },
      { name: "Transport", value: transportTotal },
    ].sort((a, b) => b.value - a.value)[0];

    // Recent trend (last 7 days vs prev 7)
    const sorted = [...allRecords].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recent = sorted.slice(-7);
    const prev = sorted.slice(-14, -7);
    const recentAvg =
      recent.reduce((s, r) => s + (r.total_carbon_emission || 0), 0) /
      (recent.length || 1);
    const prevAvg =
      prev.reduce((s, r) => s + (r.total_carbon_emission || 0), 0) /
      (prev.length || 1);
    const trendPct = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

    return {
      totalRecords,
      totalEmission,
      lastUpload,
      minesMonitored: mines.length,
      topSource,
      trendPct,
    };
  }, [allEmissions, mines]);

  // ─── User insight ─────────────────────────────────────────────────────────
  const insight = useMemo(() => {
    if (!stats.topSource) return null;
    const insights: string[] = [];

    if (stats.topSource.name === "Electricity") {
      insights.push(
        "Your monitored mines show electricity-driven emissions as the dominant source. Consider solar installations."
      );
    } else if (stats.topSource.name === "Fuel") {
      insights.push(
        "Fuel combustion is the highest contributor across your mines. EV fleet transition could cut emissions by 20%+."
      );
    } else if (stats.topSource.name === "Methane") {
      insights.push(
        "Methane leakage is the primary concern. Deploying VAM capture technology is recommended."
      );
    }

    if (stats.trendPct > 5) {
      insights.push(
        `Emissions are trending up ${stats.trendPct.toFixed(1)}% this week. Investigate production changes.`
      );
    } else if (stats.trendPct < -5) {
      insights.push(
        `Good news — emissions declined ${Math.abs(stats.trendPct).toFixed(1)}% this week.`
      );
    }

    return insights;
  }, [stats]);

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    const list: {
      type: "warning" | "danger" | "info";
      title: string;
      desc: string;
    }[] = [];

    if (stats.trendPct > 10) {
      list.push({
        type: "danger",
        title: "Emission Spike Detected",
        desc: `Weekly emissions up ${stats.trendPct.toFixed(1)}%. Review recent operational changes.`,
      });
    }

    mines.forEach((m) => {
      const mineData = allEmissions.find((e) => e.mineId === m._id);
      if (mineData && mineData.records.length > 0) {
        const recent = mineData.records.slice(-7);
        const avg =
          recent.reduce((s, r) => s + (r.total_carbon_emission || 0), 0) /
          (recent.length || 1);
        if (avg > 50000) {
          list.push({
            type: "warning",
            title: `${m.name} — High Emission`,
            desc: `Averaging ${(avg / 1000).toFixed(1)} t CO₂e/day. Consider running a simulation.`,
          });
        }
      }
    });

    if (list.length === 0) {
      list.push({
        type: "info",
        title: "All Clear",
        desc: "No critical alerts. All mines operating within expected parameters.",
      });
    }

    return list;
  }, [stats, mines, allEmissions]);

  // ─── Recent activity timeline ─────────────────────────────────────────────
  const activityTimeline = useMemo(() => {
    const activities: { action: string; detail: string; time: string; icon: typeof Flame }[] = [];

    allEmissions.forEach((m) => {
      const mine = mines.find((mi) => mi._id === m.mineId);
      if (m.records.length > 0 && mine) {
        const latest = [...m.records].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )[0];
        activities.push({
          action: "Data Recorded",
          detail: `${mine.name} — ${(latest.total_carbon_emission / 1000).toFixed(1)} t CO₂e`,
          time: new Date(latest.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          icon: Plus,
        });
      }
    });

    // Simulated activities
    activities.push({
      action: "Forecast Generated",
      detail: "14-day ARIMA forecast for all mines",
      time: "Today",
      icon: Brain,
    });
    activities.push({
      action: "Pathway Simulated",
      detail: "Balanced pathway (−35% reduction)",
      time: "Today",
      icon: Route,
    });

    return activities.slice(0, 8);
  }, [allEmissions, mines]);

  // ─── Recommended action ──────────────────────────────────────────────────
  const aiRecommendation = useMemo(() => {
    if (!mines.length) return null;

    // Find mine with highest recent emissions
    let topMine = mines[0];
    let topAvg = 0;
    mines.forEach((m) => {
      const data = allEmissions.find((e) => e.mineId === m._id);
      if (data) {
        const recent = data.records.slice(-7);
        const avg =
          recent.reduce((s, r) => s + (r.total_carbon_emission || 0), 0) /
          (recent.length || 1);
        if (avg > topAvg) {
          topAvg = avg;
          topMine = m;
        }
      }
    });

    return {
      action: `Run pathway simulation for ${topMine.name}`,
      reason: `Highest recent emissions at ${(topAvg / 1000).toFixed(1)} t CO₂e/day`,
      mine: topMine,
    };
  }, [mines, allEmissions]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const togglePin = (mineId: string) => {
    setPinnedMines((prev) => {
      const next = new Set(prev);
      next.has(mineId) ? next.delete(mineId) : next.add(mineId);
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logged out", description: "See you again!" });
    } catch {
      toast({
        title: "Error",
        description: "Failed to log out.",
        variant: "destructive",
      });
    }
  };

  // ─── User data ────────────────────────────────────────────────────────────
  const displayName = currentUser?.displayName || "User";
  const email = currentUser?.email || "";
  const photoURL = currentUser?.photoURL;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const lastLogin = currentUser?.metadata?.lastSignInTime
    ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }
      )
    : "Unknown";
  const createdAt = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* ═══════════════════════════════════════════════════════════════════
            ROW 1: User Overview Card
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="glass-effect border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-emerald-500/5 pointer-events-none" />
          <CardContent className="relative pt-8 pb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar with glow */}
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl scale-150" />
                {photoURL ? (
                  <img
                    src={photoURL}
                    alt={displayName}
                    className="relative w-24 h-24 rounded-full border-2 border-primary/50 object-cover"
                  />
                ) : (
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-3xl font-bold text-white border-2 border-primary/50">
                    {initials}
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-background" />
              </div>

              {/* User info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold mb-1">{displayName}</h1>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5 justify-center md:justify-start">
                    <Mail className="w-3.5 h-3.5" /> {email}
                  </span>
                  <span className="flex items-center gap-1.5 justify-center md:justify-start">
                    <Shield className="w-3.5 h-3.5" /> Platform Analyst
                  </span>
                  <span className="flex items-center gap-1.5 justify-center md:justify-start">
                    <Clock className="w-3.5 h-3.5" /> Last login: {lastLogin}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-3 justify-center md:justify-start">
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {stats.minesMonitored} mines monitored
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Member since {createdAt}
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10"
                  onClick={() => navigate("/dashboard")}
                >
                  <BarChart3 className="w-3.5 h-3.5 mr-1.5" /> Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs border-white/10"
                  onClick={() => navigate("/pathways")}
                >
                  <Route className="w-3.5 h-3.5 mr-1.5" /> Pathways
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 2: Activity Summary Stats
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Records",
              value: stats.totalRecords,
              icon: FileText,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
            {
              label: "Last Data Upload",
              textValue: stats.lastUpload,
              icon: Clock,
              color: "text-amber-400",
              bg: "bg-amber-500/10",
            },
            {
              label: "Mines Monitored",
              value: stats.minesMonitored,
              icon: MapPin,
              color: "text-purple-400",
              bg: "bg-purple-500/10",
            },
            {
              label: "Total Analyzed",
              value: stats.totalEmission / 1000,
              suffix: " t",
              icon: Flame,
              color: "text-orange-400",
              bg: "bg-orange-500/10",
              decimals: 0,
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
                  <p className={`text-xl font-bold ${card.color}`}>
                    {card.textValue}
                  </p>
                ) : (
                  <p className={`text-2xl font-bold ${card.color}`}>
                    <AnimatedCounter
                      value={card.value!}
                      suffix={card.suffix || ""}
                      decimals={card.decimals || 0}
                    />
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 3: Assigned Mines + User Insight Panel
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Assigned / Favorite Mines */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                My Mines
              </CardTitle>
              <CardDescription>
                Pin favorites for quick access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {mines.map((m) => {
                const isPinned = pinnedMines.has(m._id);
                const mineData = allEmissions.find(
                  (e) => e.mineId === m._id
                );
                const recordCount = mineData?.records.length || 0;
                const recentAvg =
                  mineData && mineData.records.length > 0
                    ? mineData.records
                        .slice(-7)
                        .reduce(
                          (s, r) => s + (r.total_carbon_emission || 0),
                          0
                        ) / Math.min(mineData.records.length, 7)
                    : 0;

                return (
                  <div
                    key={m._id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-muted/20 ${
                      isPinned ? "bg-primary/5 border border-primary/15" : "border border-transparent"
                    }`}
                  >
                    <button
                      onClick={() => togglePin(m._id)}
                      className="flex-shrink-0 hover:scale-110 transition-transform"
                    >
                      {isPinned ? (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <StarOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recordCount} records •{" "}
                        {recentAvg > 0
                          ? `${(recentAvg / 1000).toFixed(1)} t/day avg`
                          : "No data"}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => navigate("/visualization")}
                        title="Forecast"
                      >
                        <Brain className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => navigate("/pathways")}
                        title="Pathways"
                      >
                        <Route className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* User Insight Panel */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </div>
                AI Insights
              </CardTitle>
              <CardDescription>
                Personalized analysis across all your mines
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {insight &&
                insight.map((text, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/10"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{text}</p>
                    </div>
                  </div>
                ))}

              {/* Trend summary */}
              <div
                className={`p-4 rounded-xl border ${
                  stats.trendPct > 0
                    ? "bg-red-500/5 border-red-500/10"
                    : "bg-green-500/5 border-green-500/10"
                }`}
              >
                <div className="flex items-center gap-3">
                  {stats.trendPct > 0 ? (
                    <TrendingUp className="w-5 h-5 text-red-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-green-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {stats.trendPct > 0
                        ? `Emissions trending up ${stats.trendPct.toFixed(1)}%`
                        : `Emissions down ${Math.abs(stats.trendPct).toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Compared to previous 7-day period
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Recommendation */}
              {aiRecommendation && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-blue-500/5 border border-primary/15">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-primary font-semibold uppercase mb-1">
                        Recommended Action
                      </p>
                      <p className="text-sm font-medium">
                        {aiRecommendation.action}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {aiRecommendation.reason}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-xs h-7 border-primary/20"
                        onClick={() => navigate("/pathways")}
                      >
                        <ChevronRight className="w-3 h-3 mr-1" /> Go to
                        Pathways
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 4: Notifications + Preferences
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Notification / Alert Center */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <Bell className="w-4 h-4 text-red-400" />
                </div>
                Alert Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                    alert.type === "danger"
                      ? "bg-red-500/5 border-red-500/15"
                      : alert.type === "warning"
                      ? "bg-amber-500/5 border-amber-500/15"
                      : "bg-green-500/5 border-green-500/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {alert.type === "danger" ? (
                      <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                    ) : alert.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-semibold">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {alert.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Personal Preferences */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-blue-400" />
                </div>
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Default Mine */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Default Mine
                </Label>
                <Select value={defaultMine} onValueChange={setDefaultMine}>
                  <SelectTrigger className="glass-effect border-white/10 h-9">
                    <SelectValue placeholder="Select default mine…" />
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

              {/* Default Horizon */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Default Forecast Horizon
                </Label>
                <Select value={defaultHorizon} onValueChange={setDefaultHorizon}>
                  <SelectTrigger className="glass-effect border-white/10 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preferred Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Preferred Unit
                </Label>
                <Select value={preferredUnit} onValueChange={setPreferredUnit}>
                  <SelectTrigger className="glass-effect border-white/10 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tonnes">Tonnes CO₂e</SelectItem>
                    <SelectItem value="kg">Kilograms CO₂e</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {darkMode ? (
                    <Moon className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Sun className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">Dark Mode</span>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Notifications</span>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 5: Activity Timeline + Impact Section
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Timeline */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-400" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4 max-h-[320px] overflow-y-auto pr-2">
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-emerald-500/50 to-transparent" />
                {activityTimeline.map((act, i) => (
                  <div key={i} className="relative flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center -ml-6 flex-shrink-0 mt-0.5">
                      <act.icon className="w-2.5 h-2.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{act.action}</p>
                        <span className="text-[10px] text-muted-foreground ml-2 flex-shrink-0">
                          {act.time}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {act.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Achievement / Impact Section */}
          <Card className="glass-effect border-white/10 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-emerald-400" />
                </div>
                Your Impact
              </CardTitle>
              <CardDescription>
                The story of your carbon intelligence journey
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {[
                {
                  label: "Total Emission Analyzed",
                  value: stats.totalEmission / 1000,
                  suffix: " t CO₂e",
                  icon: Eye,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                  border: "border-blue-500/15",
                },
                {
                  label: "Potential Reduction Identified",
                  value: (stats.totalEmission / 1000) * 0.35,
                  suffix: " t CO₂e",
                  icon: TrendingDown,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                  border: "border-emerald-500/15",
                },
                {
                  label: "Carbon Saved (Simulations)",
                  value: (stats.totalEmission / 1000) * 0.12,
                  suffix: " t CO₂e",
                  icon: Leaf,
                  color: "text-green-400",
                  bg: "bg-green-500/10",
                  border: "border-green-500/15",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-4 p-4 rounded-xl ${item.bg} border ${item.border}`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.bg}`}
                  >
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                      {item.label}
                    </p>
                    <p className={`text-xl font-bold ${item.color}`}>
                      <AnimatedCounter
                        value={item.value}
                        suffix={item.suffix}
                        decimals={0}
                      />
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ROW 6: Security Section
        ═══════════════════════════════════════════════════════════════════ */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 bg-slate-500/10 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-slate-400" />
              </div>
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Google connected */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-white/5">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Google Sign-In</p>
                  <p className="text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Connected
                  </p>
                </div>
              </div>

              {/* Last device */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/10 border border-white/5">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Last Login Device</p>
                  <p className="text-xs text-muted-foreground">
                    {navigator.userAgent.includes("Windows")
                      ? "Windows PC"
                      : navigator.userAgent.includes("Mac")
                      ? "Mac"
                      : "Mobile"}{" "}
                    — {lastLogin}
                  </p>
                </div>
              </div>

              {/* Logout */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sign Out</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="mt-1 text-xs h-7"
                    onClick={handleLogout}
                  >
                    Logout from all devices
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserPage;
