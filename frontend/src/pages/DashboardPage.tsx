// FULL RESTORE + FIXES (FINAL)
import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MapPin,
  Loader2,
  Maximize2,
  BarChart3,
  LineChart as LineChartIcon,
  Zap,
  Flame,
  Wind
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { motion } from 'framer-motion';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMine, setSelectedMine] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [chartType, setChartType] = useState<string>('line'); // 'line' or 'bar'
  const [methaneChartType, setMethaneChartType] = useState<string>('line'); // 'line' or 'bar'

  const [isChartMaximized, setIsChartMaximized] = useState(false);
  const [isMethaneChartMaximized, setIsMethaneChartMaximized] = useState(false);
  const [isPieChartMaximized, setIsPieChartMaximized] = useState(false);
  const [isLeaderboardMaximized, setIsLeaderboardMaximized] = useState(false);
  const [isWaterfallMaximized, setIsWaterfallMaximized] = useState(false);

  // AQI state
  const [aqiData, setAqiData] = useState<any>(null);
  const [aqiLoading, setAqiLoading] = useState(false);

  // Fetch AQI when a specific mine is selected
  useEffect(() => {
    if (selectedMine === 'all' || !mines.length) {
      setAqiData(null);
      return;
    }
    const selectedMineObj = mines.find((m: any) => m.name === selectedMine);
    if (!selectedMineObj) { setAqiData(null); return; }

    const fetchAqi = async () => {
      setAqiLoading(true);
      try {
        const data = await api.getAqi(selectedMineObj._id);
        setAqiData(data);
      } catch (err) {
        console.error('AQI fetch error:', err);
        setAqiData(null);
      } finally {
        setAqiLoading(false);
      }
    };
    fetchAqi();
  }, [selectedMine, mines]);

  // Color palette for pie chart
  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // Fetch mines
  useMemo(() => {
    const fetchMines = async () => {
      try {
        const data = await api.getMines();
        if (!Array.isArray(data)) {
          console.error('API returned non-array data for mines:', data); return;
        }
        setMines(data);
      } catch (error) {
        console.error('Error fetching mines:', error);
      }
    };
    fetchMines();
  }, []);

  // Fetch dashboard data
  useMemo(() => {
    const fetchDashboardData = async () => {
      if (!dashboardData) {
        setLoading(true);
      }

      try {
        const filters: any = {};
        if (selectedMine !== 'all') { // Ensure mineName is always sent, even if 'all'
          filters.mineName = selectedMine;
        }
        if (selectedPeriod !== 'all') {
          filters.period = selectedPeriod;
        }

        const data = await api.getDashboard(filters);
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedMine, selectedPeriod]);

  // Derived Statistics for Advanced Features
  const mineLeaderboard = useMemo(() => {
    if (!dashboardData?.chartData) return [];
    
    // Group by mine and calculate total emissions
    const mineStats = dashboardData.chartData.reduce((acc: any, item: any) => {
      if (!acc[item.mineName]) {
        acc[item.mineName] = 0;
      }
      acc[item.mineName] += item.totalEmissions;
      return acc;
    }, {});

    return Object.entries(mineStats)
      .map(([name, value]) => ({ name, value: (value as number) / 1000 })) // Convert to tonnes
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 10);
  }, [dashboardData]);

  const activityBreakdown = useMemo(() => {
    if (!dashboardData?.chartData) return [];
    
    // Use the fallback logic data if backend sends it, but recalculate safe sum here
    const stats = dashboardData.chartData.reduce((acc: any, item: any) => {
      acc.fuel += item.fuel_emission || 0;
      acc.electricity += item.electricity_emission || 0;
      acc.explosives += item.explosives_emission || 0;
      acc.transport += item.transport_emission || 0;
      acc.methane += item.methane_emissions_co2e || 0;
      return acc;
    }, { fuel: 0, electricity: 0, explosives: 0, transport: 0, methane: 0 });

    return [
      { name: 'Fuel', value: stats.fuel / 1000, fill: '#ef4444' },
      { name: 'Electricity', value: stats.electricity / 1000, fill: '#f59e0b' },
      { name: 'Explosives', value: stats.explosives / 1000, fill: '#8b5cf6' },
      { name: 'Transport', value: stats.transport / 1000, fill: '#3b82f6' },
      { name: 'Methane', value: stats.methane / 1000, fill: '#10b981' },
    ];
  }, [dashboardData]);

  const highestEmittingMine = useMemo(() => {
    if (!mineLeaderboard.length) return { name: 'N/A', value: 0 };
    return mineLeaderboard[0];
  }, [mineLeaderboard]);

  const heatmapData = useMemo(() => {
    if (!dashboardData?.chartData || !mines.length) return [];

    // Build a map from mine name to its state
    const mineStateMap: Record<string, string> = {};
    mines.forEach((m: any) => {
      mineStateMap[m.name] = m.state || 'Unknown';
    });

    // Calculate total emissions per mine
    const mineEmissions: Record<string, number> = {};
    dashboardData.chartData.forEach((item: any) => {
      if (!mineEmissions[item.mineName]) mineEmissions[item.mineName] = 0;
      mineEmissions[item.mineName] += item.totalEmissions;
    });

    // Group mines by state
    const stateGroups: Record<string, { mine: string; emissions: number }[]> = {};
    Object.entries(mineEmissions).forEach(([mineName, emissions]) => {
      const state = mineStateMap[mineName] || 'Unknown';
      if (!stateGroups[state]) stateGroups[state] = [];
      stateGroups[state].push({ mine: mineName, emissions: emissions as number });
    });

    // Sort mines within each state by emissions (desc)
    Object.values(stateGroups).forEach(group =>
      group.sort((a, b) => b.emissions - a.emissions)
    );

    return Object.entries(stateGroups)
      .map(([state, minesList]) => ({
        state,
        mines: minesList,
        totalEmissions: minesList.reduce((s, m) => s + m.emissions, 0),
      }))
      .sort((a, b) => b.totalEmissions - a.totalEmissions);
  }, [dashboardData, mines]);


  // Helper Components
  const CountUp = ({ value, prefix = '', suffix = '' }: { value: number, prefix?: string, suffix?: string }) => {
    return (
      <span className="tabular-nums">
        {prefix}{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}{suffix}
      </span>
    );
  };

  const KPICard = ({ title, value, suffix='', icon: Icon, trend, trendValue, color, delay }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="glass-effect border-white/20 hover:border-white/40 transition-colors relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
          <Icon className={`w-24 h-24 text-${color}-500`} />
        </div>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 bg-${color}-500/10 rounded-xl flex items-center justify-center`}>
              <Icon className={`w-6 h-6 text-${color}-500`} />
            </div>
            {trend && (
              <div className={`flex items-center space-x-1 text-sm ${trend === 'up' ? 'text-red-500' : 'text-green-500'}`}>
                {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{trendValue}%</span>
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-foreground">
              {typeof value === 'number' ? <CountUp value={value} suffix={suffix} /> : value}
            </h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Get chart title and data key based on selected period
  const getChartConfig = () => {
    switch (selectedPeriod) {
      case 'daily':
        return { title: 'Daily Emissions Trend', dataKey: 'period' };
      case 'weekly':
        return { title: 'Weekly Emissions Trend', dataKey: 'period' };
      case 'monthly':
        return { title: 'Monthly Emissions Trend', dataKey: 'period' };
      default:
        return { title: 'Emissions Trend', dataKey: 'period' };
    }
  };

  const chartConfig = getChartConfig();

  const renderEmissionsChart = (data: any[], config: any, type: string) => {
    const ChartComponent = type === 'bar' ? BarChart : LineChart;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey={config.dataKey}
            stroke="hsl(var(--muted-foreground))"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
          />
          <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
            formatter={(value: any) => [`${value?.toLocaleString()} tCO₂e`, 'Emissions']}
          />
          {type === 'bar' ? (
             <>
                <Bar dataKey="emissions" name="Actual" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="hsl(var(--primary-glow))" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
             </>
          ) : (
            <>
               <Line type="monotone" dataKey="emissions" stroke="hsl(var(--primary))" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} name="Actual" />
               <Line type="monotone" dataKey="target" stroke="hsl(var(--primary-glow))" strokeDasharray="5 5" strokeWidth={2} name="Target" />
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const renderMethaneChart = (data: any[], config: any, type: string) => {
     const ChartComponent = type === 'bar' ? BarChart : LineChart;
     
     return (
       <ResponsiveContainer width="100%" height="100%">
         <ChartComponent data={data}>
           <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
           <XAxis dataKey={config.dataKey} stroke="hsl(var(--muted-foreground))" height={60} tick={{ fontSize: 12 }} angle={-45} textAnchor="end" />
           <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 12 }} />
           <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }} formatter={(val: any) => [`${val} tCO₂e`, 'Methane']} />
           {type === 'bar' ? (
             <Bar dataKey="methane_co2e" fill="#10b981" radius={[4, 4, 0, 0]} name="Methane" />
           ) : (
             <Line type="monotone" dataKey="methane_co2e" stroke="#10b981" strokeWidth={3} dot={{r:4, fill:'#10b981'}} name="Methane" />
           )}
         </ChartComponent>
       </ResponsiveContainer>
     );
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load dashboard data.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 pb-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header & Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-effect p-6 rounded-2xl border border-white/20 flex flex-col md:flex-row justify-between items-center gap-4"
      >
        <div>
           <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
           <p className="text-muted-foreground">Real-time carbon emissions monitoring</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedMine} onValueChange={setSelectedMine}>
            <SelectTrigger className="w-[180px] glass-effect"><SelectValue placeholder="All Mines" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Mines</SelectItem>
              {mines.map(m => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[180px] glass-effect"><SelectValue placeholder="Monthly" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

       {/* Row 1: KPI Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Emissions" 
          value={(dashboardData.overview.totalEmissions / 1000).toFixed(1)} 
          suffix=" t"
          icon={TrendingUp} 
          color="red" 
          delay={0.1}
          trend="up"
          trendValue={2.4}
        />
        <KPICard 
          title="Highest Emitting Mine" 
          value={highestEmittingMine.name} 
          icon={Flame} 
          color="orange" 
          delay={0.2} 
        />
        <KPICard 
          title="Carbon Intensity" 
          value={0.85} 
          suffix=" t/t"
          icon={Zap} 
          color="yellow" 
          delay={0.3}
          trend="down"
          trendValue={5.1}
        />
        <KPICard 
          title="Active Mines" 
          value={dashboardData.overview.activeMines} 
          icon={MapPin} 
          color="blue" 
          delay={0.4} 
        />
      </div>

      {/* AQI Report — shown only when a specific mine is selected */}
      {selectedMine !== 'all' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass-effect border-white/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-green-500/5 pointer-events-none rounded-xl" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                    <Wind className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Air Quality Index (AQI)</CardTitle>
                    <CardDescription>
                      Estimated air quality near {selectedMine} based on emission data
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {aqiLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-muted-foreground">Calculating AQI...</span>
                </div>
              ) : aqiData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* AQI Gauge */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-white/10" style={{
                    background: `linear-gradient(135deg, ${aqiData.color}10, ${aqiData.color}05)`
                  }}>
                    <div className="relative w-36 h-36 rounded-full flex items-center justify-center mb-4" style={{
                      background: `conic-gradient(${aqiData.color} ${Math.min(aqiData.aqi / 5, 100)}%, transparent 0)`,
                      padding: '8px',
                    }}>
                      <div className="w-full h-full rounded-full bg-background flex flex-col items-center justify-center">
                        <span className="text-4xl font-bold" style={{ color: aqiData.color }}>{aqiData.aqi}</span>
                        <span className="text-xs text-muted-foreground">AQI</span>
                      </div>
                    </div>
                    <span className="text-lg font-bold mb-1" style={{ color: aqiData.color }}>
                      {aqiData.category}
                    </span>
                    <span className="text-xs text-muted-foreground text-center max-w-[200px]">
                      {aqiData.healthAdvice}
                    </span>
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">Dominant: <strong>{aqiData.dominantPollutant}</strong></span>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span>{aqiData.mine.location}, {aqiData.mine.state}</span>
                    </div>
                  </div>

                  {/* Pollutant Details Grid */}
                  <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'pm25', label: 'PM2.5', desc: 'Fine particles', maxVal: 250 },
                      { key: 'pm10', label: 'PM10', desc: 'Coarse particles', maxVal: 400 },
                      { key: 'so2', label: 'SO₂', desc: 'Sulfur dioxide', maxVal: 200 },
                      { key: 'no2', label: 'NO₂', desc: 'Nitrogen dioxide', maxVal: 200 },
                      { key: 'co', label: 'CO', desc: 'Carbon monoxide', maxVal: 10 },
                      { key: 'o3', label: 'O₃', desc: 'Ozone', maxVal: 150 },
                    ].map((pollutant) => {
                      const p = aqiData.pollutants[pollutant.key];
                      if (!p) return null;
                      const pct = Math.min(100, (p.value / pollutant.maxVal) * 100);
                      const hue = (1 - Math.min(1, pct / 100)) * 120;
                      const barColor = `hsl(${hue}, 70%, 50%)`;

                      return (
                        <div key={pollutant.key} className="p-4 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold">{pollutant.label}</span>
                            {p.subIndex !== undefined && (
                              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                                backgroundColor: `${barColor}20`, color: barColor
                              }}>
                                AQI {p.subIndex}
                              </span>
                            )}
                          </div>
                          <p className="text-2xl font-bold mb-1">{p.value} <span className="text-xs font-normal text-muted-foreground">{p.unit}</span></p>
                          <p className="text-xs text-muted-foreground mb-3">{pollutant.desc}</p>
                          {/* Bar */}
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: barColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wind className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Could not retrieve AQI data for this mine.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Row 2: Leaderboard & Scope Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2" initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.5}}>
          <Card className="glass-effect border-white/20 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Mine Leaderboard</CardTitle>
                <CardDescription>Top emitting mines (tCO₂e)</CardDescription>
              </div>
              <Dialog open={isLeaderboardMaximized} onOpenChange={setIsLeaderboardMaximized}>
                <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4" /></Button></DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>Mine Leaderboard</DialogTitle></DialogHeader>
                    <div className="flex-1 p-4 bg-white rounded-xl">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={mineLeaderboard} margin={{left: 100, right: 30}}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                          <Tooltip cursor={{fill: 'transparent'}} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                            {mineLeaderboard.map((_entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={`hsl(${0 + (index * 10)}, 80%, 50%)`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart layout="vertical" data={mineLeaderboard} margin={{left: 20}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12}} interval={0} />
                    <Tooltip 
                      contentStyle={{backgroundColor: 'hsl(var(--popover))', borderRadius: '8px'}} 
                      formatter={(val: any) => [`${val.toFixed(1)} t`, 'Emissions']}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                      {mineLeaderboard.map((_entry: any, index: number) => (
                         // Gradient from red to green implicitly via hue or static palette
                         <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : index < 7 ? '#f59e0b' : '#10b981'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div className="lg:col-span-1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.5}}>
           <Card className="glass-effect border-white/20 h-full">
            <CardHeader className="flex flex-row justify-between">
              <CardTitle>Emission Breakdown</CardTitle>
              <Dialog open={isPieChartMaximized} onOpenChange={setIsPieChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh] flex flex-col glass-effect"><div className="flex-1 bg-white rounded-xl"><ResponsiveContainer><PieChart><Pie data={dashboardData.scopeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={200} label>{dashboardData.scopeBreakdown.map((_e:any, i:number)=><Cell key={i} fill={pieColors[i%pieColors.length]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div></DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="h-[400px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={dashboardData.scopeBreakdown}
                     innerRadius={80}
                     outerRadius={120}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {dashboardData.scopeBreakdown.map((_entry: any, index: number) => (
                       <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                     ))}
                   </Pie>
                   <Tooltip />
                   <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-xl">
                     Total
                   </text>
                 </PieChart>
               </ResponsiveContainer>
               <div className="flex justify-center gap-4 text-xs mt-4 flex-wrap">
                  {dashboardData.scopeBreakdown.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: pieColors[index % pieColors.length]}} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* Row 3: Trends & Methane */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-effect border-white/20">
             <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>{chartConfig.title}</CardTitle>
                  <Tabs value={chartType} onValueChange={setChartType} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="line" className="h-6 text-xs px-2"><LineChartIcon className="w-3 h-3"/></TabsTrigger>
                      <TabsTrigger value="bar" className="h-6 text-xs px-2"><BarChart3 className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Dialog open={isChartMaximized} onOpenChange={setIsChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="max-w-7xl h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>{chartConfig.title}</DialogTitle></DialogHeader>
                    <div className="flex-1 bg-white rounded-xl p-4">{renderEmissionsChart(dashboardData.monthlyEmissions, chartConfig, chartType)}</div>
                  </DialogContent>
                </Dialog>
             </CardHeader>
             <CardContent className="h-[300px]">
                {renderEmissionsChart(dashboardData.monthlyEmissions, chartConfig, chartType)}
             </CardContent>
          </Card>

          <Card className="glass-effect border-white/20">
             <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                  <CardTitle>Methane Trend</CardTitle>
                  <Tabs value={methaneChartType} onValueChange={setMethaneChartType} className="w-[120px]">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="line" className="h-6 text-xs px-2"><LineChartIcon className="w-3 h-3"/></TabsTrigger>
                      <TabsTrigger value="bar" className="h-6 text-xs px-2"><BarChart3 className="w-3 h-3"/></TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <Dialog open={isMethaneChartMaximized} onOpenChange={setIsMethaneChartMaximized}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                  <DialogContent className="max-w-7xl h-[90vh] flex flex-col glass-effect">
                    <DialogHeader><DialogTitle>Methane Trend</DialogTitle></DialogHeader>
                    <div className="flex-1 bg-white rounded-xl p-4">{renderMethaneChart(dashboardData.monthlyEmissions, chartConfig, methaneChartType)}</div>
                  </DialogContent>
                </Dialog>
             </CardHeader>
             <CardContent className="h-[300px]">
                {renderMethaneChart(dashboardData.monthlyEmissions, chartConfig, methaneChartType)}
             </CardContent>
          </Card>
       </div>

       {/* Row 4: Waterfall & Comparison (Placeholder for AI/ML features mentioned in request, using Component logic for now) */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-2" initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}}>
            <Card className="glass-effect border-white/20">
              <CardHeader className="flex flex-row justify-between">
                <CardTitle>Activity Contribution (Waterfall)</CardTitle>
                 <Dialog open={isWaterfallMaximized} onOpenChange={setIsWaterfallMaximized}>
                    <DialogTrigger asChild><Button variant="ghost" size="sm"><Maximize2 className="h-4 w-4"/></Button></DialogTrigger>
                    <DialogContent className="max-w-6xl h-[80vh] flex flex-col glass-effect"><div className="flex-1 bg-white rounded-xl p-4"><ResponsiveContainer><BarChart data={activityBreakdown}><XAxis dataKey="name"/><YAxis/><Bar dataKey="value"><Cell fill="#ef4444"/><Cell fill="#f59e0b"/><Cell fill="#8b5cf6"/><Cell fill="#3b82f6"/><Cell fill="#10b981"/></Bar></BarChart></ResponsiveContainer></div></DialogContent>
                 </Dialog>
              </CardHeader>
              <CardContent className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={activityBreakdown} barSize={60}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} />
                     <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                     <YAxis stroke="hsl(var(--muted-foreground))" tick={{fontSize: 12}} />
                     <Tooltip 
                        contentStyle={{backgroundColor: 'hsl(var(--popover))', borderRadius: '8px'}}
                        cursor={{fill: 'transparent'}}
                        formatter={(value: any) => [`${value?.toFixed(2)} t`, 'Emission']}
                     />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                       {activityBreakdown.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={entry.fill} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>

          {/* AI Insights Card */}
          <motion.div className="lg:col-span-1" initial={{opacity:0, y:20}} whileInView={{opacity:1, y:0}} viewport={{once:true}} transition={{delay:0.2}}>
             <Card className="glass-effect border-white/20 h-full bg-gradient-to-br from-primary/5 to-secondary/5">
               <CardHeader>
                 <div className="flex items-center gap-2">
                   <Zap className="w-5 h-5 text-yellow-500" />
                   <CardTitle className="text-xl">AI Insights</CardTitle>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Signal:</strong> {highestEmittingMine.name} shows a <span className="text-red-500 font-bold">18% increase</span> in fuel consumption compared to last month.
                   </p>
                 </div>
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Optimization:</strong> Switching extraction method at {mineLeaderboard[1]?.name || 'Site B'} could reduce Scope 1 emissions by <span className="text-green-600 font-bold">12%</span>.
                   </p>
                 </div>
                 <div className="p-4 bg-white/50 backdrop-blur-sm rounded-lg border border-white/20">
                   <p className="text-sm text-foreground">
                     <strong>Forecast:</strong> Methane levels expected to peak in <span className="text-blue-600 font-bold">July</span> based on historical trends.
                   </p>
                 </div>
               </CardContent>
             </Card>
          </motion.div>
       </div>

       {/* Row 5: Regional Emission Heatmap */}
       <div className="grid grid-cols-1">
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>
             <Card className="glass-effect border-white/20">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <MapPin className="w-5 h-5 text-purple-500" />
                   Regional Emission Heatmap
                 </CardTitle>
                 <CardDescription>
                   Mines grouped by state/region — Color intensity: <span className="text-green-500 font-semibold">Green (Low)</span> → <span className="text-yellow-500 font-semibold">Yellow (Medium)</span> → <span className="text-red-500 font-semibold">Red (High)</span>
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 {/* Color legend bar */}
                 <div className="flex items-center gap-3 mb-6">
                   <span className="text-xs text-muted-foreground">Low</span>
                   <div className="flex-1 h-3 rounded-full" style={{
                     background: 'linear-gradient(to right, hsl(120,70%,45%), hsl(60,80%,50%), hsl(30,80%,50%), hsl(0,70%,50%))'
                   }} />
                   <span className="text-xs text-muted-foreground">High</span>
                 </div>

                 {(() => {
                   // Calculate global min/max for consistent color mapping
                   const allEmissions = heatmapData.flatMap((s: any) => s.mines.map((m: any) => m.emissions));
                   const globalMin = Math.min(...allEmissions);
                   const globalMax = Math.max(...allEmissions);
                   const range = globalMax - globalMin || 1;

                   return (
                     <div className="space-y-6">
                       {heatmapData.map((stateData: any, si: number) => {
                         const stateNorm = (stateData.totalEmissions / stateData.mines.length - globalMin) / range;
                         const stateHue = (1 - Math.min(1, stateNorm)) * 120;

                         return (
                           <motion.div
                             key={stateData.state}
                             initial={{ opacity: 0, x: -20 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: si * 0.1 }}
                             className="rounded-xl border border-white/10 overflow-hidden"
                           >
                             {/* State header */}
                             <div
                               className="px-5 py-3 flex items-center justify-between"
                               style={{
                                 background: `linear-gradient(135deg, hsla(${stateHue}, 60%, 50%, 0.15), hsla(${stateHue}, 60%, 50%, 0.05))`
                               }}
                             >
                               <div className="flex items-center gap-2">
                                 <MapPin className="w-4 h-4" style={{ color: `hsl(${stateHue}, 70%, 50%)` }} />
                                 <span className="font-semibold text-sm">{stateData.state}</span>
                                 <span className="text-xs text-muted-foreground ml-2">
                                   ({stateData.mines.length} mine{stateData.mines.length > 1 ? 's' : ''})
                                 </span>
                               </div>
                               <span className="text-sm font-bold" style={{ color: `hsl(${stateHue}, 70%, 50%)` }}>
                                 {(stateData.totalEmissions / 1000).toFixed(1)} tCO₂e
                               </span>
                             </div>

                             {/* Mine tiles within state */}
                             <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                               {stateData.mines.map((mineItem: any, mi: number) => {
                                 const normalized = Math.min(1, (mineItem.emissions - globalMin) / range);
                                 const hue = (1 - normalized) * 120; // 120=green → 0=red
                                 const saturation = 65 + normalized * 15;
                                 const lightness = 45 + (1 - normalized) * 10;
                                 const bgColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                                 const pct = globalMax > 0 ? ((mineItem.emissions / globalMax) * 100).toFixed(0) : '0';

                                 return (
                                   <motion.div
                                     key={mineItem.mine}
                                     initial={{ scale: 0.9, opacity: 0 }}
                                     animate={{ scale: 1, opacity: 1 }}
                                     transition={{ delay: si * 0.1 + mi * 0.05 }}
                                     className="rounded-lg p-3 cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg hover:shadow-black/20 relative overflow-hidden"
                                     style={{ backgroundColor: bgColor }}
                                   >
                                     {/* Intensity bar at bottom */}
                                     <div
                                       className="absolute bottom-0 left-0 h-1 rounded-b-lg transition-all"
                                       style={{
                                         width: `${pct}%`,
                                         backgroundColor: `hsla(${hue}, 100%, 30%, 0.6)`
                                       }}
                                     />
                                     <p className="text-white font-bold text-sm truncate drop-shadow-sm">{mineItem.mine}</p>
                                     <p className="text-white/90 text-xs mt-1 drop-shadow-sm">
                                       {(mineItem.emissions / 1000).toFixed(1)} tCO₂e
                                     </p>
                                     <p className="text-white/70 text-[10px] mt-0.5">
                                       {pct}% of max
                                     </p>
                                   </motion.div>
                                 );
                               })}
                             </div>
                           </motion.div>
                         );
                       })}
                     </div>
                   );
                 })()}
               </CardContent>
             </Card>
          </motion.div>
       </div>
    </div>
  );
};

export default DashboardPage;
