
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
import { Loader2 } from "lucide-react";

const InputPage = () => {
  const { toast } = useToast();
  const [mines, setMines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    mineId: "",
    date: new Date().toISOString().split("T")[0], // Default to today
    fuel_used: "",
    electricity_used: "",
    explosives_used: "",
    transport_fuel_used: "",
  });

  useEffect(() => {
    const fetchMines = async () => {
      try {
        const data = await api.getMines();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, mineId: value }));
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

      await api.addEmission(submissionData);

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
    } catch (error) {
      console.error("Error submitting emission data:", error);
      toast({
        title: "Submission Error",
        description:
          error.response?.data?.error || "There was an error submitting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-gradient">
          Input Daily Emission Data
        </h1>
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
      </div>
    </div>
  );
};

export default InputPage;
