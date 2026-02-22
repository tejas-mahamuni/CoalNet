import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Activity,
  Target,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  Filter,
  Loader2,
  Database,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mines, setMines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMine, setSelectedMine] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('monthly');
  const [migrating, setMigrating] = useState(false);
  const [isChartMaximized, setIsChartMaximized] = useState(false);
  const [isMethaneChartMaximized, setIsMethaneChartMaximized] = useState(false);
  const [isPieChartMaximized, setIsPieChartMaximized] = useState(false);

  // Color palette for pie chart
  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  // Fetch mines
  useEffect(() => {
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
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Show refreshing indicator if data already exists (filter change)
      if (dashboardData) {
        setRefreshing(true);
      } else {
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
        setRefreshing(false);
      }
    };

    fetchDashboardData();
  }, [selectedMine, selectedPeriod]);

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

  const handleMigration = async () => {
    setMigrating(true);
    try {
      await api.runMigration();
      // Refresh dashboard data after migration
      const filters: any = {};
      if (selectedMine !== 'all') {
        filters.mineName = selectedMine;
      }
      if (selectedPeriod !== 'all') {
        filters.period = selectedPeriod;
      }
      const data = await api.getDashboard(filters);
      setDashboardData(data);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setMigrating(false);
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="glass-effect p-8 rounded-2xl border border-white/20 animate-fade-in">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-center text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <Alert variant="destructive" className="glass-effect max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load dashboard data. Please check your backend connection.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'draft':
        return <Calendar className="w-4 h-4 text-gray-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Activity className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4 pb-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Filters */}
        <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
                <p className="text-muted-foreground">Overview of carbon emissions and sustainability metrics</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Select value={selectedMine} onValueChange={setSelectedMine}>
                <SelectTrigger className="glass-effect border-white/20 w-full md:w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Mines" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Mines</SelectItem>
                  {mines.length > 0 ? mines.map((mine) => (
                    <SelectItem key={mine._id || mine.name} value={mine.name}>
                      {mine.name}
                    </SelectItem>
                  )) : (
                    <SelectItem value="no-mines" disabled>No mines available</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="glass-effect border-white/20 w-full md:w-[180px]">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Loading overlay for filter changes */}
        {refreshing && (
          <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="glass-effect p-6 rounded-2xl border border-white/20">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-center text-muted-foreground">Updating data...</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-6">
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Mines</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.totalMines}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">
                  {dashboardData.overview.activeMines} active
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Emissions</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {(dashboardData.overview.totalEmissions || 0).toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">tonnes CO₂e</span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Target Reduction</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.targetReduction}%</p>
                </div>
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-primary font-medium">
                  {dashboardData.overview.currentReduction}% achieved
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/20 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Mines</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{dashboardData.overview.activeMines}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">
                  {dashboardData.overview.totalMines} total mines
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emissions Trend */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{chartConfig.title}</CardTitle>
              <Dialog open={isChartMaximized} onOpenChange={setIsChartMaximized}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-[90vh] glass-effect bg-white/30 border-white/20 backdrop-blur-xl">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-semibold text-white">{chartConfig.title}</DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsChartMaximized(false)}
                      className="h-8 w-8 p-0"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </DialogHeader>
                  <div className="flex-1 h-full p-4">
                    <div className="bg-white rounded-xl p-4 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.monthlyEmissions}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey={chartConfig.dataKey}
                      stroke="hsl(var(--muted-foreground))"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any, name: string) => [`${value} tonnes CO₂e`, name]}
                          />
                          <Line
                            type="monotone"
                            dataKey="emissions"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            name="Actual"
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="target"
                            stroke="hsl(var(--primary-glow))"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Target"
                            dot={{ fill: 'hsl(var(--primary-glow))', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.monthlyEmissions}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey={chartConfig.dataKey}
                            stroke="hsl(var(--muted-foreground))"
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: any, name: string) => [`${value} tonnes CO₂e`, name]}
                    />
                    <Line
                      type="monotone"
                      dataKey="emissions"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      name="Actual"
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="hsl(var(--primary-glow))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Target"
                      dot={{ fill: 'hsl(var(--primary-glow))', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Scope Breakdown */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">Emissions by Scope</CardTitle>
              <Dialog open={isPieChartMaximized} onOpenChange={setIsPieChartMaximized}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-[90vh] glass-effect bg-white/30 border-white/20 backdrop-blur-xl">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-semibold text-white">Emissions by Scope</DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsPieChartMaximized(false)}
                      className="h-8 w-8 p-0"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </DialogHeader>
                  <div className="flex-1 h-full p-4">
                    <div className="bg-white rounded-xl p-4 h-full">
                      {dashboardData.scopeBreakdown && dashboardData.scopeBreakdown.length > 0 &&
                       dashboardData.scopeBreakdown.some((entry: any) => entry.value > 0) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardData.scopeBreakdown.filter((entry: any) => entry.value > 0)}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={150}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {dashboardData.scopeBreakdown
                                .filter((entry: any) => entry.value > 0)
                                .map((entry: any, index: number) => (
                                  <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                              formatter={(value: any) => [`${value} tonnes CO₂e`, 'Emissions']}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground">
                          <p>No emission data available for selected filters</p>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {dashboardData.scopeBreakdown && dashboardData.scopeBreakdown.length > 0 &&
                 dashboardData.scopeBreakdown.some((entry: any) => entry.value > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData.scopeBreakdown.filter((entry: any) => entry.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {dashboardData.scopeBreakdown
                          .filter((entry: any) => entry.value > 0)
                          .map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || pieColors[index % pieColors.length]} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: any) => [`${value} tonnes CO₂e`, 'Emissions']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>No emission data available for selected filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Methane Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Methane Emissions Trend */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold">{chartConfig.title.replace('Emissions', 'Methane Emissions')}</CardTitle>
              <Dialog open={isMethaneChartMaximized} onOpenChange={setIsMethaneChartMaximized}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl w-full h-[90vh] glass-effect bg-white/30 border-white/20 backdrop-blur-xl">
                  <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-semibold text-white">{chartConfig.title.replace('Emissions', 'Methane Emissions')}</DialogTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMethaneChartMaximized(false)}
                      className="h-8 w-8 p-0"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </DialogHeader>
                  <div className="flex-1 h-full p-4">
                    <div className="bg-white rounded-xl p-4 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.monthlyEmissions.filter(item => {
                          const month = parseInt(item.period.split('-')[1]);
                          return month >= 5 && month <= 11;
                        })}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey={chartConfig.dataKey}
                            stroke="hsl(var(--muted-foreground))"
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any, name: string) => [`${value} tonnes CO₂e`, name]}
                          />
                          <Line
                            type="monotone"
                            dataKey="methane_co2e"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Methane"
                            dot={{ fill: '#10b981', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={dashboardData.monthlyEmissions.filter(item => {
                          const month = parseInt(item.period.split('-')[1]);
                          return month >= 5 && month <= 11;
                        })}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey={chartConfig.dataKey}
                            stroke="hsl(var(--muted-foreground))"
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis stroke="hsl(var(--muted-foreground))" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            formatter={(value: any, name: string) => [`${value} tonnes CO₂e`, name]}
                          />
                          <Line
                            type="monotone"
                            dataKey="methane_co2e"
                            stroke="#10b981"
                            strokeWidth={3}
                            name="Methane"
                            dot={{ fill: '#10b981', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Methane Statistics */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Methane Emissions Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {dashboardData.monthlyEmissions && dashboardData.monthlyEmissions.length > 0 ? (
                  <>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600">
                        {(() => {
                          const totalMethane = dashboardData.monthlyEmissions.reduce((sum: number, item: any) => sum + (item.methane_co2e || 0), 0);
                          const totalEmissions = dashboardData.monthlyEmissions.reduce((sum: number, item: any) => sum + (item.emissions || 0), 0);
                          const percentage = totalEmissions > 0 ? ((totalMethane / totalEmissions) * 100).toFixed(1) : '0.0';
                          return `${percentage}%`;
                        })()}
                      </p>
                      <p className="text-sm text-muted-foreground">of total emissions</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <p className="text-xl font-semibold text-emerald-600">
                          {(() => {
                            const totalMethane = dashboardData.monthlyEmissions.reduce((sum: number, item: any) => sum + (item.methane_co2e || 0), 0);
                            return totalMethane.toLocaleString();
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Methane (tonnes CO₂e)</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-semibold text-emerald-600">
                          {(() => {
                            const values = dashboardData.monthlyEmissions.map((item: any) => item.methane_co2e || 0).filter((v: number) => v > 0);
                            const avg = values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0;
                            return avg.toFixed(1);
                          })()}
                        </p>
                        <p className="text-xs text-muted-foreground">Average (tonnes CO₂e)</p>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Peak Month:</span>
                        <span className="font-medium text-emerald-600">
                          {(() => {
                            const maxItem = dashboardData.monthlyEmissions.reduce((max: any, item: any) =>
                              (item.methane_co2e || 0) > (max.methane_co2e || 0) ? item : max
                            );
                            return maxItem ? `${maxItem[chartConfig.dataKey]} (${(maxItem.methane_co2e || 0).toFixed(1)}t)` : 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>No methane emission data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.recentActivities.map((activity: any) => (
                  <div key={activity.id} className="glass-effect p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(activity.status)}
                        <div>
                          <p className="font-medium text-foreground">{activity.type}</p>
                          <p className="text-sm text-muted-foreground">{activity.mine}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{activity.date}</p>
                        <p className="text-xs text-muted-foreground capitalize">{activity.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                  to="/input"
                  className="text-primary hover:text-primary/80 text-sm font-medium flex items-center gap-1"
                >
                  View all activities <TrendingUp className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Alerts & Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.alerts.map((alert: any) => (
                  <div key={alert.id} className="glass-effect p-3 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-effect border-white/20 animate-fade-in">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 pt-6">
                <Link to="/input">
                  <Button variant="default" className="w-full">
                    Add New Activity
                  </Button>
                </Link>
                <Link to="/upload">
                  <Button variant="secondary" className="w-full">
                    Upload CSV Data
                  </Button>
                </Link>
                <Link to="/visualization">
                  <Button variant="secondary" className="w-full">
                    View Analytics
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleMigration}
                  disabled={migrating}
                >
                  {migrating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Running Migration...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Run Migration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
