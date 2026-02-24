import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import {
  Loader2,
  Download,
  Upload,
  FileText,
  CheckCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Zap,
  Fuel,
  Bomb,
  Truck,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

// ─── Helpers ────────────────────────────────────────────────────────────────

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
    const steps = 40;
    const increment = end / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplay(end);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <span className="tabular-nums">
      {display.toFixed(decimals)}
      {suffix}
    </span>
  );
};

const sourceColors: Record<string, string> = {
  Fuel: "#f97316",
  Electricity: "#eab308",
  Methane: "#ef4444",
  Transport: "#3b82f6",
  Explosives: "#8b5cf6",
};

const pieColors = ["#8b5cf6", "#3b82f6", "#10b981", "#ef4444"];

// ─── Component ──────────────────────────────────────────────────────────────

const InputPage = () => {
  const { toast } = useToast();
  const [mines, setMines] = useState<any[]>([]);
  const [selectedMineId, setSelectedMineId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mineEmissions, setMineEmissions] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("manual");
  const [timeView, setTimeView] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );

  // CSV upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table state
  const [sortField, setSortField] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    fuel_used: "",
    electricity_used: "",
    explosives_used: "",
    transport_fuel_used: "",
  });

  // ─── Fetch mines ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await api.getMines();
        if (Array.isArray(data)) setMines(data);
      } catch (e) {
        console.error("Error fetching mines:", e);
      }
    })();
  }, []);

  // ─── Fetch emissions when mine changes ────────────────────────────────────
  useEffect(() => {
    if (!selectedMineId) {
      setMineEmissions([]);
      return;
    }
    (async () => {
      try {
        const data = await api.getMineEmissions(selectedMineId);
        setMineEmissions(data);
      } catch (e) {
        console.error("Error fetching emissions:", e);
        setMineEmissions([]);
      }
    })();
  }, [selectedMineId]);

  const selectedMineName =
    mines.find((m) => m._id === selectedMineId)?.name || "Mine";

  // ─── Derived analytics ────────────────────────────────────────────────────
  const analytics = useMemo(() => {
    if (!mineEmissions.length) return null;

    const sorted = [...mineEmissions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const totalEmission = sorted.reduce(
      (s, e) => s + (e.total_carbon_emission || 0),
      0
    );

    // Monthly aggregation to find highest month
    const monthMap: Record<string, number> = {};
    sorted.forEach((e) => {
      const key = new Date(e.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthMap[key] = (monthMap[key] || 0) + (e.total_carbon_emission || 0);
    });
    const highestMonth = Object.entries(monthMap).sort(
      (a, b) => b[1] - a[1]
    )[0];

    // Scope distribution
    const scope1 = sorted.reduce((s, e) => s + (e.scope1 || 0), 0);
    const scope2 = sorted.reduce((s, e) => s + (e.scope2 || 0), 0);
    const scope3 = sorted.reduce((s, e) => s + (e.scope3 || 0), 0);
    const methane = sorted.reduce(
      (s, e) => s + (e.methane_emissions_co2e || 0),
      0
    );

    // Trend: compare last 7 days average vs previous 7 days
    const recent = sorted.slice(-7);
    const prev = sorted.slice(-14, -7);
    const recentAvg =
      recent.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) /
      (recent.length || 1);
    const prevAvg =
      prev.reduce((s, e) => s + (e.total_carbon_emission || 0), 0) /
      (prev.length || 1);
    const trendPct = prevAvg > 0 ? ((recentAvg - prevAvg) / prevAvg) * 100 : 0;

    // Source contribution
    const fuelTotal = sorted.reduce((s, e) => s + (e.fuel_used || 0) * 2.68, 0);
    const elecTotal = sorted.reduce(
      (s, e) => s + (e.electricity_used || 0) * 0.82,
      0
    );
    const methaneTotal = methane;
    const transportTotal = sorted.reduce(
      (s, e) => s + (e.transport_fuel_used || 0) * 2.68,
      0
    );
    const explosivesTotal = sorted.reduce(
      (s, e) => s + (e.explosives_used || 0) * 0.316,
      0
    );

    // Historical insights
    const dailyEmissions = sorted.map((e) => ({
      date: new Date(e.date),
      emission: e.total_carbon_emission || 0,
    }));
    let maxSpike = { date: "", increase: 0 };
    let mostStable = { period: "", variance: Infinity };

    for (let i = 1; i < dailyEmissions.length; i++) {
      const increase =
        dailyEmissions[i].emission - dailyEmissions[i - 1].emission;
      if (increase > maxSpike.increase) {
        maxSpike = {
          date: dailyEmissions[i].date.toLocaleDateString(),
          increase,
        };
      }
    }

    // Sliding window of 7 for stability
    for (let i = 0; i <= dailyEmissions.length - 7; i++) {
      const window = dailyEmissions.slice(i, i + 7);
      const mean =
        window.reduce((s, e) => s + e.emission, 0) / window.length;
      const variance =
        window.reduce((s, e) => s + Math.pow(e.emission - mean, 2), 0) /
        window.length;
      if (variance < mostStable.variance) {
        mostStable = {
          period: `${window[0].date.toLocaleDateString()} – ${window[
            window.length - 1
          ].date.toLocaleDateString()}`,
          variance,
        };
      }
    }

    return {
      totalEmission,
      highestMonth,
      scope1,
      scope2,
      scope3,
      methane,
      trendPct,
      sources: [
        { name: "Fuel", value: fuelTotal, color: sourceColors.Fuel },
        {
          name: "Electricity",
          value: elecTotal,
          color: sourceColors.Electricity,
        },
        { name: "Methane", value: methaneTotal, color: sourceColors.Methane },
        {
          name: "Transport",
          value: transportTotal,
          color: sourceColors.Transport,
        },
        {
          name: "Explosives",
          value: explosivesTotal,
          color: sourceColors.Explosives,
        },
      ],
      scopeBreakdown: [
        { name: "Scope 1", value: scope1 },
        { name: "Scope 2", value: scope2 },
        { name: "Scope 3", value: scope3 },
        { name: "Methane", value: methane },
      ],
      maxSpike,
      mostStable,
      sorted,
    };
  }, [mineEmissions]);

  // ─── Time-aggregated trend data ───────────────────────────────────────────
  const trendData = useMemo(() => {
    if (!analytics?.sorted.length) return [];
    const sorted = analytics.sorted;

    if (timeView === "daily") {
      return sorted.map((e: any) => ({
        date: new Date(e.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        emission: (e.total_carbon_emission || 0) / 1000,
      }));
    }

    const groupMap: Record<string, number[]> = {};
    sorted.forEach((e: any) => {
      const d = new Date(e.date);
      const key =
        timeView === "weekly"
          ? `W${Math.ceil(d.getDate() / 7)}-${d.toLocaleDateString("en-US", {
              month: "short",
            })}`
          : d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
      if (!groupMap[key]) groupMap[key] = [];
      groupMap[key].push(e.total_carbon_emission || 0);
    });

    return Object.entries(groupMap).map(([date, vals]) => ({
      date,
      emission: vals.reduce((a, b) => a + b, 0) / 1000,
    }));
  }, [analytics, timeView]);

  // ─── Filtered & sorted table ──────────────────────────────────────────────
  const filteredEmissions = useMemo(() => {
    let data = [...mineEmissions];

    // Date filter
    if (dateFilter.from) {
      data = data.filter(
        (e) => new Date(e.date) >= new Date(dateFilter.from)
      );
    }
    if (dateFilter.to) {
      data = data.filter((e) => new Date(e.date) <= new Date(dateFilter.to));
    }

    // Sort
    data.sort((a, b) => {
      const aVal = sortField === "date" ? new Date(a.date).getTime() : a[sortField] || 0;
      const bVal = sortField === "date" ? new Date(b.date).getTime() : b[sortField] || 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });

    return data;
  }, [mineEmissions, dateFilter, sortField, sortDir]);

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!selectedRows.size) return;
    toast({
      title: "Bulk Delete",
      description: `${selectedRows.size} records selected for deletion. (Backend endpoint required)`,
    });
    setSelectedRows(new Set());
  };

  const handleExport = async () => {
    if (!selectedMineId) return;
    setIsExporting(true);
    try {
      const blob = await api.exportMineEmissions(selectedMineId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedMineName}_emissions.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({ title: "Exported!", description: "CSV download started." });
    } catch (e) {
      toast({
        title: "Export Error",
        description: "Failed to export data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    if (!selectedMineId || !formData.date) {
      toast({
        title: "Validation Error",
        description: "Please select a mine and date.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    try {
      const result = await api.addEmission({
        mineId: selectedMineId,
        date: formData.date,
        fuel_used: parseFloat(formData.fuel_used),
        electricity_used: parseFloat(formData.electricity_used),
        explosives_used: parseFloat(formData.explosives_used),
        transport_fuel_used: parseFloat(formData.transport_fuel_used),
      });
      setSubmissionResult({
        totalEmissions: result.total_carbon_emission,
        methaneEmissions: result.methane_emissions_co2e,
        scopeBreakdown: [
          { name: "Scope 1", value: result.scope1 },
          { name: "Scope 2", value: result.scope2 },
          { name: "Scope 3", value: result.scope3 },
          { name: "Methane", value: result.methane_emissions_co2e },
        ],
      });
      toast({ title: "Success!", description: "Emission data submitted." });
      setFormData((prev) => ({
        ...prev,
        fuel_used: "",
        electricity_used: "",
        explosives_used: "",
        transport_fuel_used: "",
      }));
      const updated = await api.getMineEmissions(selectedMineId);
      setMineEmissions(updated);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.error || "Submission failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // CSV Upload handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
      setUploadResult(null);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && (file.type === "text/csv" || file.name.endsWith(".csv"))) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedMineId) {
      toast({
        title: "Missing info",
        description: "Select a mine and a CSV file.",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    try {
      const result = await api.uploadCSV(selectedFile, selectedMineId);
      setUploadResult(result);
      toast({
        title: "Upload successful",
        description: `Processed ${result.recordsProcessed} records.`,
      });
      const updated = await api.getMineEmissions(selectedMineId);
      setMineEmissions(updated);
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.response?.data?.error || "Upload error.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 px-4 md:px-8 pb-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Data Intelligence
            </h1>
            <p className="text-muted-foreground">
              Input, upload, and analyze mine emission records
            </p>
          </div>
          <div className="w-64">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Active Mine
            </Label>
            <Select value={selectedMineId} onValueChange={(v) => { setSelectedMineId(v); setSubmissionResult(null); setUploadResult(null); }}>
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

        {/* ── Step 1: Unified Data Intake (Tabs) ───────────────────────────── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="glass-effect border border-white/10 p-1">
            <TabsTrigger value="manual" className="data-[state=active]:bg-primary/20">
              Manual Entry
            </TabsTrigger>
            <TabsTrigger value="csv" className="data-[state=active]:bg-primary/20">
              CSV Upload
            </TabsTrigger>
          </TabsList>

          {/* ── Manual Entry ─────────────────────────────────────────────── */}
          <TabsContent value="manual" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle>Enter Emission Data</CardTitle>
                  <CardDescription>
                    Record daily consumption for {selectedMineName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        required
                        className="glass-effect border-white/10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fuel_used">
                          <Fuel className="inline w-3.5 h-3.5 mr-1 text-orange-400" />
                          Fuel (L)
                        </Label>
                        <Input
                          id="fuel_used"
                          type="number"
                          placeholder="e.g. 1000"
                          value={formData.fuel_used}
                          onChange={handleInputChange}
                          required
                          className="glass-effect border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="electricity_used">
                          <Zap className="inline w-3.5 h-3.5 mr-1 text-yellow-400" />
                          Electricity (kWh)
                        </Label>
                        <Input
                          id="electricity_used"
                          type="number"
                          placeholder="e.g. 5000"
                          value={formData.electricity_used}
                          onChange={handleInputChange}
                          required
                          className="glass-effect border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="explosives_used">
                          <Bomb className="inline w-3.5 h-3.5 mr-1 text-purple-400" />
                          Explosives (kg)
                        </Label>
                        <Input
                          id="explosives_used"
                          type="number"
                          placeholder="e.g. 100"
                          value={formData.explosives_used}
                          onChange={handleInputChange}
                          required
                          className="glass-effect border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transport_fuel_used">
                          <Truck className="inline w-3.5 h-3.5 mr-1 text-blue-400" />
                          Transport Fuel (L)
                        </Label>
                        <Input
                          id="transport_fuel_used"
                          type="number"
                          placeholder="e.g. 300"
                          value={formData.transport_fuel_used}
                          onChange={handleInputChange}
                          required
                          className="glass-effect border-white/10"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading || !selectedMineId}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                          Submitting…
                        </>
                      ) : (
                        "Submit Emission Data"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Emission Preview */}
              {submissionResult && (
                <Card className="glass-effect border-white/10 animate-fade-in">
                  <CardHeader>
                    <CardTitle>Emission Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center p-4 rounded-xl bg-primary/10">
                        <p className="text-2xl font-bold text-primary">
                          {(submissionResult.totalEmissions / 1000).toFixed(2)} t
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total CO₂e
                        </p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-red-500/10">
                        <p className="text-2xl font-bold text-red-400">
                          {(submissionResult.methaneEmissions / 1000).toFixed(2)}{" "}
                          t
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Methane CO₂e
                        </p>
                      </div>
                    </div>
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={submissionResult.scopeBreakdown}
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            innerRadius={40}
                            dataKey="value"
                            label={({ name, percent }: any) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {submissionResult.scopeBreakdown.map(
                              (_: any, i: number) => (
                                <Cell key={i} fill={pieColors[i]} />
                              )
                            )}
                          </Pie>
                          <Tooltip
                            formatter={(v: any) => [
                              `${(v / 1000).toFixed(2)} t CO₂e`,
                              "",
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── CSV Upload ────────────────────────────────────────────────── */}
          <TabsContent value="csv" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle>Upload CSV Dataset</CardTitle>
                  <CardDescription>
                    Bulk import emission records for {selectedMineName}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div
                    className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer group"
                    onDrop={handleDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold mb-1">
                      {selectedFile
                        ? selectedFile.name
                        : "Drop your CSV file here"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      or click to browse
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                      <FileText className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={handleUpload}
                      disabled={
                        !selectedFile || !selectedMineId || isUploading
                      }
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading…
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload CSV
                        </>
                      )}
                    </Button>
                    {selectedFile && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedFile(null);
                          setUploadResult(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 border-t border-white/5 pt-4">
                    <p className="font-semibold">Required CSV columns:</p>
                    <p>
                      <code>Date</code>, <code>Fuel Used (L)</code>,{" "}
                      <code>Electricity Used (kWh)</code>,{" "}
                      <code>Explosives Used (kg)</code>,{" "}
                      <code>Transport Fuel Used (L)</code>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {uploadResult && (
                <Card className="glass-effect border-white/10 animate-fade-in">
                  <CardHeader>
                    <CardTitle>Upload Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="mb-4">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Upload successful!</strong>
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-xl">
                        <div className="text-2xl font-bold text-primary">
                          {uploadResult.recordsProcessed}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Records
                        </div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-xl">
                        <div className="text-2xl font-bold text-green-400">
                          {uploadResult.totalEmissions?.toFixed(1)} kg
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total CO₂e
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>


        </Tabs>

        {/* ── Analytics Section (Steps 3–6) — shows when mine is selected ─── */}
        {selectedMineId && analytics && (
          <div className="space-y-8 animate-fade-in">
            {/* ── Step 3: Historical Summary Cards ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-effect border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total Emission
                    </span>
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold">
                    <AnimatedCounter
                      value={analytics.totalEmission / 1000}
                      suffix=" t"
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    CO₂e across all records
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Highest Month
                    </span>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold">
                    {analytics.highestMonth?.[0] || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.highestMonth
                      ? `${(analytics.highestMonth[1] / 1000).toFixed(1)} t CO₂e`
                      : "No data"}
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-effect border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      Scope Distribution
                    </span>
                    <div className="flex gap-0.5">
                      {analytics.scopeBreakdown.map((s: any, i: number) => (
                        <div
                          key={i}
                          className="w-2 h-4 rounded-sm"
                          style={{
                            backgroundColor: pieColors[i],
                            opacity:
                              0.4 +
                              (s.value / analytics.totalEmission) * 0.6,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {analytics.scopeBreakdown.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs"
                      >
                        <span className="text-muted-foreground">
                          {s.name}
                        </span>
                        <span className="font-medium">
                          {((s.value / analytics.totalEmission) * 100).toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-effect border-white/10 hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                      7-Day Trend
                    </span>
                    {analytics.trendPct > 2 ? (
                      <TrendingUp className="w-4 h-4 text-red-400" />
                    ) : analytics.trendPct < -2 ? (
                      <TrendingDown className="w-4 h-4 text-green-400" />
                    ) : (
                      <Minus className="w-4 h-4 text-yellow-400" />
                    )}
                  </div>
                  <p
                    className={`text-2xl font-bold ${
                      analytics.trendPct > 0
                        ? "text-red-400"
                        : analytics.trendPct < 0
                        ? "text-green-400"
                        : "text-yellow-400"
                    }`}
                  >
                    {analytics.trendPct > 0 ? "+" : ""}
                    <AnimatedCounter
                      value={analytics.trendPct}
                      suffix="%"
                    />
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    vs previous week
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* ── Step 4: Historical Trend Graph ───────────────────────── */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Emission Timeline</CardTitle>
                  <div className="flex gap-1">
                    {(["daily", "weekly", "monthly"] as const).map((v) => (
                      <Button
                        key={v}
                        variant={timeView === v ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTimeView(v)}
                        className="capitalize text-xs h-7"
                      >
                        {v}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="emGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#8b5cf6"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="#8b5cf6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#888" }}
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
                          background: "rgba(0,0,0,0.8)",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 8,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="emission"
                        stroke="#8b5cf6"
                        fill="url(#emGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* ── Step 5 + 6: Source Contribution & Historical Insights ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Source Contribution */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle>Source Contribution</CardTitle>
                  <CardDescription>
                    Estimated emissions by source type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.sources} layout="vertical">
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
                            background: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 8,
                          }}
                          formatter={(v: any) => [
                            `${(v / 1000).toFixed(2)} t CO₂e`,
                            "",
                          ]}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {analytics.sources.map((s: any, i: number) => (
                            <Cell key={i} fill={s.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Insight Panel */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Historical Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                    <p className="text-xs text-red-400 font-semibold uppercase mb-1">
                      Largest Spike
                    </p>
                    <p className="text-sm">
                      {analytics.maxSpike.date
                        ? `+${(analytics.maxSpike.increase / 1000).toFixed(
                            1
                          )} t CO₂e on ${analytics.maxSpike.date}`
                        : "No spikes detected"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10">
                    <p className="text-xs text-green-400 font-semibold uppercase mb-1">
                      Most Stable Period
                    </p>
                    <p className="text-sm">
                      {analytics.mostStable.period || "Insufficient data"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <p className="text-xs text-blue-400 font-semibold uppercase mb-1">
                      Recommended Pathway
                    </p>
                    <p className="text-sm">
                      {(() => {
                        const top = [...analytics.sources].sort((a: any, b: any) => b.value - a.value)[0]?.name;
                        if (top === "Fuel") return "Consider EV fleet adoption to reduce fuel-driven emissions.";
                        if (top === "Electricity") return "Transition to renewable energy sources for significant reduction.";
                        if (top === "Methane") return "Invest in methane capture technology for highest impact.";
                        return "Explore multi-source efficiency improvements.";
                      })()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ── Records Table — always visible at bottom when mine is selected ── */}
        {selectedMineId && (
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>
                  {selectedMineName} — Emission Records
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Input
                    type="date"
                    placeholder="From"
                    value={dateFilter.from}
                    onChange={(e) =>
                      setDateFilter((p) => ({ ...p, from: e.target.value }))
                    }
                    className="w-36 h-8 text-xs glass-effect border-white/10"
                  />
                  <span className="text-muted-foreground text-xs">to</span>
                  <Input
                    type="date"
                    placeholder="To"
                    value={dateFilter.to}
                    onChange={(e) =>
                      setDateFilter((p) => ({ ...p, to: e.target.value }))
                    }
                    className="w-36 h-8 text-xs glass-effect border-white/10"
                  />
                  {selectedRows.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete ({selectedRows.size})
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 mr-1" />
                        CSV
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">
                        <input
                          type="checkbox"
                          className="accent-primary"
                          checked={
                            filteredEmissions.length > 0 &&
                            selectedRows.size === filteredEmissions.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRows(
                                new Set(
                                  filteredEmissions.map((em) => em._id)
                                )
                              );
                            } else {
                              setSelectedRows(new Set());
                            }
                          }}
                        />
                      </TableHead>
                      {[
                        { key: "date", label: "Date" },
                        { key: "fuel_used", label: "Fuel (L)" },
                        { key: "electricity_used", label: "Electricity (kWh)" },
                        { key: "explosives_used", label: "Explosives (kg)" },
                        { key: "methane_emissions_ch4", label: "Methane (CH4)" },
                        { key: "transport_fuel_used", label: "Transport (L)" },
                        { key: "total_carbon_emission", label: "Total CO₂e (kg)" },
                      ].map((col) => (
                        <TableHead
                          key={col.key}
                          className="cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleSort(col.key)}
                        >
                          {col.label}{" "}
                          {sortField === col.key &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmissions.length > 0 ? (
                      filteredEmissions.map((em) => (
                        <TableRow
                          key={em._id}
                          className={
                            selectedRows.has(em._id) ? "bg-primary/5" : ""
                          }
                        >
                          <TableCell>
                            <input
                              type="checkbox"
                              className="accent-primary"
                              checked={selectedRows.has(em._id)}
                              onChange={() => toggleRow(em._id)}
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(em.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{em.fuel_used}</TableCell>
                          <TableCell>{em.electricity_used}</TableCell>
                          <TableCell>{em.explosives_used}</TableCell>
                          <TableCell>
                            {em.methane_emissions_ch4?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>{em.transport_fuel_used}</TableCell>
                          <TableCell>
                            {em.total_carbon_emission?.toFixed(2) || "0.00"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-muted-foreground py-8"
                        >
                          No records found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default InputPage;
