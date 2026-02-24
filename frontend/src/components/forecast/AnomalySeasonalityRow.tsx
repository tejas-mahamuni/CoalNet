import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { AlertTriangle, Sun } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

interface AnomalyData {
  date: string;
  value: number;
  expected: number;
  deviation: number;
  severity: "high" | "medium";
}

interface SeasonalityData {
  weekday_data: { day: string; avg_emission: number }[];
  insight: string;
  has_pattern: boolean;
}

interface Props {
  anomalies: AnomalyData[];
  seasonality: SeasonalityData;
}

const AnomalySeasonalityRow = ({ anomalies, seasonality }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Anomaly Panel */}
      <Card className="glass-effect border-white/20 hover:border-red-500/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          {anomalies.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No anomalies detected in recent data.</p>
              <p className="text-xs mt-1">Emissions are within expected ranges.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {anomalies.map((anomaly, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    anomaly.severity === "high"
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-amber-500/30 bg-amber-500/5"
                  }`}
                >
                  {/* Pulsing dot */}
                  <div className="relative">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        anomaly.severity === "high" ? "bg-red-500" : "bg-amber-500"
                      }`}
                    />
                    <div
                      className={`absolute inset-0 w-3 h-3 rounded-full animate-ping ${
                        anomaly.severity === "high" ? "bg-red-500" : "bg-amber-500"
                      } opacity-40`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {new Date(anomaly.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {anomaly.deviation > 0 ? "+" : ""}
                      {anomaly.deviation.toLocaleString()} kg CO₂e vs expected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {anomaly.value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      exp: {anomaly.expected.toLocaleString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seasonality Panel */}
      <Card className="glass-effect border-white/20 hover:border-blue-500/30 transition-colors">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-blue-500" />
            </div>
            Seasonal Patterns
          </CardTitle>
        </CardHeader>
        <CardContent>
          {seasonality.weekday_data.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seasonality.weekday_data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v: string) => v.slice(0, 3)}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "10px",
                      }}
                      formatter={((value: number) => [`${value.toLocaleString()} kg CO₂e`, "Avg Emission"]) as any}
                    />
                    <Bar
                      dataKey="avg_emission"
                      fill="hsl(200, 95%, 48%)"
                      radius={[6, 6, 0, 0]}
                      name="avg_emission"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Textual Insight */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className={`mt-4 p-3 rounded-xl text-sm ${
                  seasonality.has_pattern
                    ? "bg-blue-500/10 border border-blue-500/20 text-blue-400"
                    : "bg-muted/30 border border-white/10 text-muted-foreground"
                }`}
              >
                <p className="font-medium">{seasonality.insight}</p>
              </motion.div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sun className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>Seasonality analysis unavailable.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AnomalySeasonalityRow;
