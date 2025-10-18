import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const InputPage = () => {
  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Input Activity Data</h1>
        <div className="glass-effect p-8 rounded-2xl border border-white/20 animate-fade-in">
          <form className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fuel">Fuel Consumption (Liters)</Label>
              <Input id="fuel" type="number" placeholder="Enter fuel consumption" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="electricity">Electricity Usage (kWh)</Label>
              <Input id="electricity" type="number" placeholder="Enter electricity usage" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="methane">Methane Emission (m³)</Label>
              <Input id="methane" type="number" placeholder="Enter methane emission" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="transport">Transport Distance (km)</Label>
              <Input id="transport" type="number" placeholder="Enter transport distance" />
            </div>
            <Button className="w-full" size="lg">
              Calculate Emissions
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputPage;
