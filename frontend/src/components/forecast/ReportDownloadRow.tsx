import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Download, FileText, Loader2, CheckCircle2 } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface Props {
  mineId: string;
  mineName: string;
  horizon: number;
}

const ReportDownloadRow = ({ mineId: _mineId, mineName, horizon }: Props) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [progress, setProgress] = useState("");

  const handleDownload = async () => {
    setDownloading(true);
    setProgress("Preparing report...");

    try {
      // Find the main content container
      const container = document.querySelector(".container.mx-auto.max-w-\\[1400px\\]");
      if (!container) {
        throw new Error("Could not find content container");
      }

      // Get all chart-bearing sections (Cards, motion.divs with data)
      const sections = container.querySelectorAll<HTMLElement>(
        ":scope > .glass-effect, :scope > div > .glass-effect, :scope > div"
      );

      const sectionsArr = Array.from(sections).filter(
        (el) => el.offsetHeight > 30 && el.offsetWidth > 100
      );

      if (sectionsArr.length === 0) {
        throw new Error("No sections found to capture");
      }

      // Create an A4 landscape PDF for wider charts
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      // ── Cover page ──
      setProgress("Creating cover page...");
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pageWidth, pageHeight, "F");

      // Purple accent bar at top
      pdf.setFillColor(139, 92, 246);
      pdf.rect(0, 0, pageWidth, 4, "F");

      // Title
      pdf.setTextColor(30, 30, 40);
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      pdf.text("CoalNet Zero", pageWidth / 2, 55, { align: "center" });

      pdf.setFontSize(16);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 120);
      pdf.text("Forecast Intelligence Report", pageWidth / 2, 68, { align: "center" });

      // Divider line
      pdf.setDrawColor(139, 92, 246);
      pdf.setLineWidth(0.5);
      pdf.line(pageWidth / 2 - 40, 78, pageWidth / 2 + 40, 78);

      // Mine info
      pdf.setTextColor(30, 30, 40);
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold");
      pdf.text(mineName, pageWidth / 2, 95, { align: "center" });

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 100, 130);
      pdf.text(`${horizon}-Day ARIMA Forecast`, pageWidth / 2, 108, { align: "center" });
      pdf.text(`Generated: ${new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
      })}`, pageWidth / 2, 118, { align: "center" });

      // Footer on cover
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 120);
      pdf.text(
        "AI-powered emission intelligence • ARIMA time series forecasting",
        pageWidth / 2,
        pageHeight - 15,
        { align: "center" }
      );

      // ── Capture each visible section as a page ──
      const totalSections = sectionsArr.length;

      for (let i = 0; i < totalSections; i++) {
        const section = sectionsArr[i];
        setProgress(`Capturing section ${i + 1} of ${totalSections}...`);

        try {
          const canvas = await html2canvas(section, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
            removeContainer: true,
            windowWidth: 1400,
          });

          const imgData = canvas.toDataURL("image/png");
          const imgAspect = canvas.width / canvas.height;
          let imgWidth = contentWidth;
          let imgHeight = imgWidth / imgAspect;

          // If image is taller than the page, scale down
          if (imgHeight > pageHeight - margin * 2) {
            imgHeight = pageHeight - margin * 2;
            imgWidth = imgHeight * imgAspect;
          }

          pdf.addPage();

          // White background
          pdf.setFillColor(255, 255, 255);
          pdf.rect(0, 0, pageWidth, pageHeight, "F");

          // Centered image
          const xOffset = (pageWidth - imgWidth) / 2;
          const yOffset = (pageHeight - imgHeight) / 2;
          pdf.addImage(imgData, "PNG", xOffset, yOffset, imgWidth, imgHeight);

          // Page footer
          pdf.setFontSize(8);
          pdf.setTextColor(120, 120, 140);
          pdf.text(
            `${mineName} • ${horizon}-Day Forecast • Page ${i + 2}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: "center" }
          );
        } catch (sectionErr) {
          console.warn(`Could not capture section ${i + 1}:`, sectionErr);
        }
      }

      // Save the PDF
      setProgress("Saving PDF...");
      const filename = `CoalNet_Report_${mineName.replace(/\s+/g, "_")}_${horizon}d_${
        new Date().toISOString().slice(0, 10)
      }.pdf`;
      pdf.save(filename);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    } catch (err) {
      console.error("PDF report error:", err);
    } finally {
      setDownloading(false);
      setProgress("");
    }
  };

  const includedSections = [
    "Forecast chart with confidence bands",
    "Forecast data table",
    "Anomaly detection & seasonality analysis",
    "Carbon budget & risk assessment",
    "Model explainability & metrics",
    "Multi-mine forecast comparison",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <Card className="glass-effect border-white/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none rounded-xl" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Forecast Intelligence Report (PDF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Included sections */}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">PDF report includes all visible sections:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {includedSections.map((section) => (
                  <div key={section} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{section}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Download button */}
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleDownload}
                disabled={downloading}
                size="lg"
                className={`px-8 transition-all ${
                  downloaded
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                } text-white shadow-lg`}
              >
                {downloading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {progress || "Generating PDF..."}</>
                ) : downloaded ? (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Downloaded!</>
                ) : (
                  <><Download className="w-4 h-4 mr-2" /> Download PDF Report</>
                )}
              </Button>
              {downloading && (
                <p className="text-xs text-muted-foreground/60">Capturing all charts and sections...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ReportDownloadRow;
