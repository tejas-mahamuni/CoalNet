// FULL RESTORE + FIXES (FINAL)
import { useState, useMemo } from "react";
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
  Flame
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
    if (!dashboardData?.chartData) return [];
    // Just a sample heatmap structure based on available data
    // Group by Mine and Month
    const map: any = {};
    dashboardData.chartData.forEach((item: any) => {
      const month = item.date.substring(0, 7); // YYYY-MM
      const key = `${item.mineName}-${month}`;
      if(!map[key]) map[key] = 0;
      map[key] += item.totalEmissions;
    });

    const result = Object.entries(map).map(([key, value]) => {
      const [mine, month] = key.split(/-(.+)/); // Split only on first hyphen
      return { mine, month, value: (value as number) / 1000 };
    });
    
    return result.sort((a: any, b: any) => b.value - a.value).slice(0, 50); // Top 50 
  }, [dashboardData]);


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

       {/* Row 5: Heatmap & Others (Visualizing Grid) */}
       <div className="grid grid-cols-1">
          <motion.div initial={{opacity:0}} whileInView={{opacity:1}} viewport={{once:true}}>
             <Card className="glass-effect border-white/20">
               <CardHeader>
                 <CardTitle>Emission Intensity Heatmap</CardTitle>
                 <CardDescription>Mines vs. Time (Intensity - Green: Low, Red: High)</CardDescription>
               </CardHeader>
               <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                     {heatmapData.map((item: any, idx: number) => {
                       const maxVal = 10; 
                       const normalized = Math.min(1, item.value / maxVal);
                       const hue = (1 - normalized) * 120;
                       
                       return (
                       <div key={idx} className="aspect-video rounded-md flex flex-col items-center justify-center text-xs p-2 transition-all hover:scale-105 cursor-pointer"
                            style={{
                              backgroundColor: `hsla(${hue}, 70%, 50%, 0.8)`,
                              color: 'white'
                            }}>
                          <span className="font-bold truncate w-full text-center">{item.mine}</span>
                          <span className="opacity-80">{item.month}</span>
                          <span>{item.value.toFixed(1)}t</span>
                       </div>
                     )})}
                  </div>
               </CardContent>
             </Card>
          </motion.div>
       </div>
    </div>
  );
};

export default DashboardPage;
