import { Button } from "@/components/ui/button";
import { Upload as UploadIcon } from "lucide-react";

const UploadPage = () => {
  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto max-w-2xl">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Upload Dataset</h1>
        <div className="glass-effect p-8 rounded-2xl border border-white/20 animate-fade-in">
          <div className="border-2 border-dashed border-primary/30 rounded-xl p-12 text-center hover:border-primary/60 transition-colors cursor-pointer">
            <UploadIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold mb-2">Drop your CSV file here</h3>
            <p className="text-muted-foreground mb-4">or click to browse</p>
            <Button variant="glass" size="lg">
              Select File
            </Button>
          </div>
          <div className="mt-6 text-sm text-muted-foreground">
            <p>Supported format: CSV</p>
            <p>Required columns: Date, Fuel, Electricity, Methane, Transport</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
