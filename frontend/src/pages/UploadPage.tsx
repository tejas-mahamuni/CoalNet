import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

const UploadPage = () => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMine, setSelectedMine] = useState<string>("");
  const [mines, setMines] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch mines on component mount
  useState(() => {
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
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
        toast({
          title: "Invalid file type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedMine) {
      toast({
        title: "Missing information",
        description: "Please select both a file and a mine.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await api.uploadCSV(selectedFile, selectedMine);
      setUploadResult(result);
      toast({
        title: "Upload successful",
        description: `Successfully uploaded ${result.recordsProcessed} records.`,
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.error || "An error occurred during upload.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setSelectedMine("");
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Upload Dataset</h1>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
            {/* Upload Section */}
            <Card className="glass-effect border-white/20 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-xl">File Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mine Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Mine</label>
                  <Select value={selectedMine} onValueChange={setSelectedMine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a mine..." />
                    </SelectTrigger>
                    <SelectContent>
                      {mines.map((mine) => (
                        <SelectItem key={mine._id} value={mine._id}>
                          {mine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* File Upload Area */}
                <div
                  className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center hover:border-primary/60 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <UploadIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
                  <h3 className="text-xl font-semibold mb-2">
                    {selectedFile ? selectedFile.name : "Drop your CSV file here"}
                  </h3>
                  <p className="text-muted-foreground mb-4">or click to browse</p>
                  <Button variant="glass" size="lg" disabled={!selectedMine}>
                    Select File
                  </Button>
                </div>

                {/* File Info */}
                {selectedFile && (
                  <div className="flex items-center space-x-3 p-3 bg-primary/10 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex space-x-3">
                  <Button
                    onClick={handleUpload}
                    disabled={!selectedFile || !selectedMine || isUploading}
                    className="flex-1"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="w-4 h-4 mr-2" />
                        Upload CSV
                      </>
                    )}
                  </Button>
                  {(selectedFile || selectedMine) && (
                    <Button variant="outline" onClick={clearSelection}>
                      Clear
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {uploadResult && (
              <Card className="glass-effect border-white/20 animate-fade-in mt-6" style={{ animationDelay: "0.1s" }}>
                <CardHeader>
                  <CardTitle className="text-xl">Upload Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Upload successful!</strong>
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-primary/10 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {uploadResult.recordsProcessed}
                        </div>
                        <div className="text-sm text-muted-foreground">Records Processed</div>
                      </div>
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <div className="text-2xl font-bold text-green-500">
                          {uploadResult.totalEmissions?.toFixed(1)} kg
                        </div>
                        <div className="text-sm text-muted-foreground">Total CO₂e</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium">Statistics:</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Fuel Used: {uploadResult.totalFuel?.toFixed(1)} L</div>
                        <div>Electricity: {uploadResult.totalElectricity?.toFixed(1)} kWh</div>
                        <div>Explosives: {uploadResult.totalExplosives?.toFixed(1)} kg</div>
                        <div>Transport: {uploadResult.totalTransport?.toFixed(1)} L</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* CSV Format Requirements */}
        <Card className="mt-6 glass-effect border-white/20">
          <CardHeader>
            <CardTitle className="text-lg">CSV Format Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>Required columns:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><code>Date</code> (YYYY-MM-DD format)</li>
                <li><code>Fuel Used (L)</code> - Fuel consumption in liters</li>
                <li><code>Electricity Used (kWh)</code> - Electricity consumption</li>
                <li><code>Explosives Used (kg)</code> - Explosives used in kg</li>
                <li><code>Transport Fuel Used (L)</code> - Transport fuel in liters</li>
              </ul>
              <p className="mt-4"><strong>Note:</strong> The CSV should match the format exported from the input page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UploadPage;
