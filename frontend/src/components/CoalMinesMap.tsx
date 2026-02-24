import { motion } from "framer-motion";
import { MapPin, Info } from "lucide-react";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const coalMines = [
  { id: 1, name: "Jharia, Dhanbad", state: "Jharkhand", x: 67.5, y: 48.2, status: "warning" },
  { id: 2, name: "Bokaro", state: "Jharkhand", x: 66.8, y: 47.5, status: "warning" },
  { id: 3, name: "Raniganj Coalfield", state: "West Bengal", x: 73.2, y: 46.8, status: "warning" },
  { id: 4, name: "Talcher", state: "Odisha", x: 66.4, y: 58.2, status: "warning" },
  { id: 5, name: "Singrauli", state: "Madhya Pradesh", x: 61.2, y: 49.5, status: "warning" },
  { id: 6, name: "Jayanti", state: "Jharkhand", x: 68.4, y: 46.2, status: "critical" },
  { id: 7, name: "Godda", state: "Jharkhand", x: 69.2, y: 45.8, status: "critical" },
  { id: 8, name: "Giridih (Karbhari)", state: "Jharkhand", x: 67.8, y: 46.5, status: "critical" },
  { id: 9, name: "Ramgarh", state: "Jharkhand", x: 66.2, y: 48.8, status: "critical" },
  { id: 10, name: "Karanpura", state: "Jharkhand", x: 65.5, y: 47.2, status: "critical" },
  { id: 11, name: "Daltonganj", state: "Jharkhand", x: 64.2, y: 46.8, status: "critical" },
  { id: 12, name: "Dalingkot (Darjeeling)", state: "West Bengal", x: 75.8, y: 41.2, status: "critical" },
  { id: 13, name: "Birbhum", state: "West Bengal", x: 74.5, y: 46.2, status: "critical" },
  { id: 14, name: "Chinakuri", state: "West Bengal", x: 72.8, y: 48.5, status: "critical" },
  { id: 15, name: "Korba", state: "Chhattisgarh", x: 63.8, y: 52.4, status: "critical" },
  { id: 16, name: "Bishrampur", state: "Chhattisgarh", x: 62.5, y: 51.2, status: "good" },
  { id: 17, name: "Sonhat", state: "Chhattisgarh", x: 61.8, y: 50.5, status: "good" },
  { id: 18, name: "Jhilmil", state: "Chhattisgarh", x: 60.5, y: 53.2, status: "good" },
  { id: 19, name: "Hasdo-Arand", state: "Chhattisgarh", x: 62.2, y: 54.8, status: "good" },
  { id: 20, name: "Jharsuguda", state: "Odisha", x: 64.8, y: 56.2, status: "warning" },
  { id: 21, name: "Himgiri", state: "Odisha", x: 63.5, y: 57.8, status: "warning" },
  { id: 22, name: "Rampur", state: "Odisha", x: 65.2, y: 59.5, status: "warning" },
  { id: 23, name: "Singareni", state: "Telangana", x: 58.5, y: 69.2, status: "warning" },
  { id: 24, name: "Kothagudem", state: "Telangana", x: 59.8, y: 71.5, status: "warning" },
  { id: 25, name: "Kantapalli", state: "Andhra Pradesh", x: 61.4, y: 75.8, status: "warning" },
  { id: 26, name: "Neyveli", state: "Tamil Nadu", x: 56.5, y: 89.2, status: "warning" },
  { id: 27, name: "Kamptee (Nagpur)", state: "Maharashtra", x: 54.8, y: 62.5, status: "warning" },
  { id: 28, name: "Wun field", state: "Maharashtra", x: 53.5, y: 64.2, status: "warning" },
  { id: 29, name: "Wardha", state: "Maharashtra", x: 52.2, y: 65.8, status: "warning" },
  { id: 30, name: "Ghughus", state: "Maharashtra", x: 51.5, y: 67.4, status: "critical" },
  { id: 31, name: "Warora", state: "Maharashtra", x: 50.8, y: 68.2, status: "good" },
  { id: 32, name: "Ledo", state: "Assam", x: 87.5, y: 35.8, status: "good" },
  { id: 33, name: "Makum", state: "Assam", x: 88.2, y: 36.4, status: "good" },
  { id: 34, name: "Najira", state: "Assam", x: 86.8, y: 37.2, status: "good" },
  { id: 35, name: "Janji", state: "Assam", x: 85.5, y: 38.8, status: "good" },
  { id: 36, name: "Jaipur", state: "Assam", x: 84.4, y: 40.5, status: "good" },
  { id: 37, name: "Darrangiri (Garo hills)", state: "Meghalaya", x: 78.4, y: 42.5, status: "good" },
  { id: 38, name: "Cherrapunji", state: "Meghalaya", x: 79.2, y: 43.8, status: "good" },
  { id: 39, name: "Liotryngew", state: "Meghalaya", x: 80.5, y: 44.2, status: "good" },
  { id: 40, name: "Maolong", state: "Meghalaya", x: 81.2, y: 45.4, status: "good" },
  { id: 41, name: "Langrin coalfields", state: "Meghalaya", x: 77.8, y: 46.5, status: "good" },
  { id: 42, name: "Sohagpur", state: "Madhya Pradesh", x: 60.5, y: 52.2, status: "good" },
  { id: 43, name: "Johila", state: "Madhya Pradesh", x: 59.2, y: 53.8, status: "good" },
  { id: 44, name: "Umaria", state: "Madhya Pradesh", x: 58.8, y: 54.5, status: "good" },
  { id: 45, name: "Satpura coalfield", state: "Madhya Pradesh", x: 56.5, y: 55.4, status: "warning" },
];

const CoalMinesMap = () => {
  const [hoveredMine, setHoveredMine] = useState<any>(null);

  return (
    <section className="py-24 px-4 bg-muted/10 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full border border-white/10 text-primary">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">National Footprint</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Monitoring <span className="text-gradient">Every Corner</span> of Indian Mining
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              From the dense coalfields of Jharkhand to the remote hills of Meghalaya, CoalNet Zero provides 24/7 visibility into emissions across all {coalMines.length} major mining hubs in India.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="glass-effect p-4 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-primary mb-1">12+</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">States Covered</div>
              </div>
              <div className="glass-effect p-4 rounded-2xl border border-white/10">
                <div className="text-3xl font-bold text-secondary mb-1">{coalMines.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Mining Blocks</div>
              </div>
            </div>

            {/* Mine Info Card (Dynamic) */}
            <div className="relative pt-6 h-32">
              {hoveredMine ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={hoveredMine.id}
                  className="glass-effect p-5 rounded-2xl border border-primary/20 bg-primary/5 shadow-xl"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{hoveredMine.name}</h3>
                      <p className="text-sm text-muted-foreground">{hoveredMine.state}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      hoveredMine.status === "critical" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                      hoveredMine.status === "warning" ? "bg-orange-400/20 text-orange-400 border border-orange-400/30" :
                      "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                      {hoveredMine.status}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="glass-effect p-5 rounded-2xl border border-white/5 bg-white/5 flex items-center gap-3 text-muted-foreground">
                  <Info className="w-5 h-5" />
                  <p className="text-sm italic">Hover over the dots on the map to see specific site data</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Map Container */}
          <div className="relative aspect-[4/5] md:aspect-square flex items-center justify-center scale-110">
            {/* Pulsing Base Map Glow */}
            <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] animate-pulse" />

            <TooltipProvider>
              <div className="relative w-full max-w-md">
                {/* Simplified SVG Map of India (Outline) */}
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full drop-shadow-2xl opacity-40 fill-none stroke-primary/40 stroke-[0.8]"
                >
                   {/* Simplified outline of India */}
                   <path d="M45,10 L50,8 L55,10 L60,15 L62,20 L65,25 L75,30 L85,35 L90,45 L85,55 L75,65 L65,75 L60,85 L50,95 L40,85 L35,75 L25,65 L15,55 L10,45 L15,35 L25,30 L35,25 L38,20 L40,15 Z" />
                </svg>

                {/* Pulsing dots for each mine */}
                {coalMines.map((mine) => (
                  <Tooltip key={mine.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                        style={{ left: `${mine.x}%`, top: `${mine.y}%` }}
                        onMouseEnter={() => setHoveredMine(mine)}
                        onMouseLeave={() => setHoveredMine(null)}
                        whileHover={{ scale: 1.5 }}
                      >
                        {/* Static central dot */}
                        <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-0.5 ${
                          mine.status === "critical" ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" :
                          mine.status === "warning" ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]" :
                          "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                        }`} />
                        {/* Pulsing ring */}
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                          mine.status === "critical" ? "bg-red-500" :
                          mine.status === "warning" ? "bg-orange-500" :
                          "bg-emerald-500"
                        }`} />
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent className="glass-effect border-white/20">
                      <p className="font-bold text-xs">{mine.name}</p>
                      <p className="text-[10px] opacity-70">{mine.state}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>

            {/* Floating Labels */}
            <div className="absolute top-10 right-0 glass-effect p-2 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-widest text-emerald-400">
               Live Network
            </div>
            <div className="absolute bottom-10 left-0 glass-effect p-2 rounded-lg text-[10px] font-bold border border-white/10 uppercase tracking-widest text-primary">
               99.9% Uptime
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoalMinesMap;
