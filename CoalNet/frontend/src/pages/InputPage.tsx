import { useState, useEffect } from "react";
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
import { Loader2, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const InputPage = () => {
  const { toast } = useToast();
  const [mines, setMines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mineEmissions, setMineEmissions] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    mineId: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    fuel_used: "",
    electricity_used: "",
    explosives_used: "",
    transport_fuel_used: "",
  });

  // Color palette for pie chart
  const pieColors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

  useEffect(() => {
    const fetchMines = async () => {
      try {
        const data = await api.getMines();
        if (!Array.isArray(data)) {
          console.error("API returned non-array data for mines:", data);
          return;
        }
        setMines(data);
      } catch (error) {
        console.error("Error fetching mines:", error);
        toast({
          title: "Error",
          description: "Could not fetch mines. Please try again later.",
          variant: "destructive",
        });
      }
    };
    fetchMines();
  }, [toast]);

  // Fetch mine emissions when mine is selected
  useEffect(() => {
    const fetchMineEmissions = async () => {
      if (!formData.mineId) {
        setMineEmissions([]);
        return;
      }

      try {
        const data = await api.getMineEmissions(formData.mineId);
        setMineEmissions(data);
      } catch (error) {
        console.error("Error fetching mine emissions:", error);
        setMineEmissions([]);
      }
    };

    fetchMineEmissions();
  }, [formData.mineId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mineId: value }));
    setSubmissionResult(null); // Clear previous submission result
  };

  const handleExport = async () => {
    if (!formData.mineId) {
      toast({
        title: "Error",
        description: "Please select a mine first.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const blob = await api.exportMineEmissions(formData.mineId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${mines.find(m => m._id === formData.mineId)?.name || 'mine'}_emissions.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success!",
        description: "CSV export completed successfully.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export Error",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const {
      mineId,
      date,
      fuel_used,
      electricity_used,
      explosives_used,
      transport_fuel_used,
    } = formData;

    if (!mineId || !date) {
      toast({
        title: "Validation Error",
        description: "Please select a mine and a date.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const submissionData = {
        mineId,
        date,
        fuel_used: parseFloat(fuel_used),
        electricity_used: parseFloat(electricity_used),
        explosives_used: parseFloat(explosives_used),
        transport_fuel_used: parseFloat(transport_fuel_used),
      };

      const result = await api.addEmission(submissionData);

      // Calculate emission statistics for display


      const totalEmissions = result.total_carbon_emission;
      const methaneEmissions = result.methane_emissions_co2e;

      setSubmissionResult({
        totalEmissions,
        methaneEmissions,
        scopeBreakdown: [
          { name: 'Scope 1', value: result.scope1, color: pieColors[0] },
          { name: 'Scope 2', value: result.scope2, color: pieColors[1] },
          { name: 'Scope 3', value: result.scope3, color: pieColors[2] },
          { name: 'Methane', value: methaneEmissions, color: pieColors[3] },
        ]
      });

      toast({
        title: "Success!",
        description: "Emission data has been submitted successfully.",
      });

      // Reset form
      setFormData((prev) => ({
        ...prev,
        fuel_used: "",
        electricity_used: "",
        explosives_used: "",
        transport_fuel_used: "",
      }));

      // Refresh mine emissions data
      const updatedData = await api.getMineEmissions(mineId);
      setMineEmissions(updatedData);

    } catch (error) {
      console.error("Error submitting emission data:", error);
      const errorMessage = (error as any).response?.data?.error || "There was an error submitting your data. Please try again.";
      toast({
        title: "Submission Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-gradient">
          Input Daily Emission Data
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="glass-effect p-8 rounded-2xl border border-white/20 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mineId">Mine</Label>
                  <Select
                    value={formData.mineId}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger id="mineId">
                      <SelectValue placeholder="Select a mine" />
                    </SelectTrigger>
                    <SelectContent>
                      {mines.length > 0 ? (
                        mines.map((mine) => (
                          <SelectItem key={mine._id} value={mine._id}>
                            {mine.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="loading" disabled>
                          Loading mines...
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fuel_used">Fuel Used (liters)</Label>
                  <Input
                    id="fuel_used"
                    type="number"
                    placeholder="e.g., 1000"
                    value={formData.fuel_used}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="electricity_used">Electricity Used (kWh)</Label>
                  <Input
                    id="electricity_used"
                    type="number"
                    placeholder="e.g., 5000"
                    value={formData.electricity_used}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="explosives_used">Explosives Used (kg)</Label>
                  <Input
                    id="explosives_used"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.explosives_used}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport_fuel_used">Transport Fuel (liters)</Label>
                  <Input
                    id="transport_fuel_used"
                    type="number"
                    placeholder="e.g., 300"
                    value={formData.transport_fuel_used}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  "Submit Emission Data"
                )}
              </Button>
            </form>
          </div>

          {/* Results Section */}
          {submissionResult && (
            <div className="space-y-6">
              <Card className="glass-effect border-white/20">
                <CardHeader>
                  <CardTitle className="text-xl">Emission Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {(submissionResult.totalEmissions / 1000).toFixed(2)} t
                      </p>
                      <p className="text-sm text-muted-foreground">Total CO₂e</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">
                        {(submissionResult.methaneEmissions / 1000).toFixed(2)} t
                      </p>
                      <p className="text-sm text-muted-foreground">Methane CO₂e</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={submissionResult.scopeBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {submissionResult.scopeBreakdown.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => [`${(value / 1000).toFixed(2)} t CO₂e`, '']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Mine Data Section */}
        {formData.mineId && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                {mines.find(m => m._id === formData.mineId)?.name} - Emission History
              </h2>
              <Button
                onClick={handleExport}
                variant="outline"
                disabled={isExporting}
              >
                {isExporting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exporting...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Export CSV</>
                )}
              </Button>
            </div>

            <Card className="glass-effect border-white/20">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Fuel (L)</TableHead>
                      <TableHead>Electricity (kWh)</TableHead>
                      <TableHead>Explosives (kg)</TableHead>
                      <TableHead>Methane (kg CH4)</TableHead>
                      <TableHead>Transport (L)</TableHead>
                      <TableHead>Total CO₂e (kg)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mineEmissions.length > 0 ? (
                      mineEmissions.slice(0, 10).map((emission) => (
                        <TableRow key={emission._id}>
                          <TableCell>{new Date(emission.date).toLocaleDateString()}</TableCell>
                          <TableCell>{emission.fuel_used}</TableCell>
                          <TableCell>{emission.electricity_used}</TableCell>
                          <TableCell>{emission.explosives_used}</TableCell>
                          <TableCell>{emission.methane_emissions_ch4?.toFixed(2) || '0.00'}</TableCell>
                          <TableCell>{emission.transport_fuel_used}</TableCell>
                          <TableCell>{emission.total_carbon_emission?.toFixed(2) || '0.00'}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No emission data found for this mine.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default InputPage;
