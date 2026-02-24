import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";

const LiveTicker = () => {
  const [tickerData, setTickerData] = useState<any[]>([]);

  useEffect(() => {
    api.getHomeStats()
      .then((data) => {
        if (data?.tickerData?.length) setTickerData(data.tickerData);
      })
      .catch(console.error);
  }, []);

  if (!tickerData.length) return null;

  // Double the data for seamless infinite scroll
  const items = [...tickerData, ...tickerData];

  return (
    <section className="py-4 relative overflow-hidden border-y border-white/10 bg-gradient-to-r from-purple-500/5 via-transparent to-emerald-500/5">
      <div className="flex items-center">
        {/* Live indicator */}
        <div className="flex-shrink-0 px-6 flex items-center gap-2 border-r border-white/10">
          <div className="relative">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider whitespace-nowrap">Live Data</span>
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-8 whitespace-nowrap"
          >
            {items.map((item, i) => {
              const emissionTonnes = (item.emission / 1000).toFixed(1);
              const isHigh = item.emission > 5000;
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-1.5 rounded-full glass-effect border border-white/5">
                  <Activity className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.mine}</span>
                  <span className="text-xs text-muted-foreground">({item.state})</span>
                  <span className={`text-sm font-bold ${isHigh ? 'text-red-400' : 'text-emerald-400'}`}>
                    {emissionTonnes} tCO₂e
                  </span>
                  {isHigh ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LiveTicker;
