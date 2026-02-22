import { Activity, BarChart3, Brain, FileDown, Leaf, TrendingUp, Wind, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Activity,
    title: "Real-time Emission Tracking",
    description: "Monitor CO₂, CH₄, fuel, and electricity emissions across all mining operations with live updates",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: BarChart3,
    title: "Activity-Wise Analytics",
    description: "Track emissions by category with daily, weekly, and monthly breakdowns for complete transparency",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Brain,
    title: "AI-Powered Forecasting",
    description: "Predict future emission trends using advanced ML models to identify potential surges early",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: TrendingUp,
    title: "Interactive Dashboards",
    description: "Visualize data with beautiful charts, graphs, and insights for data-driven decisions",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: FileDown,
    title: "Exportable Reports",
    description: "Generate PDF and CSV reports for compliance, auditing, and regulatory submissions",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  },
  {
    icon: Wind,
    title: "AQI Integration",
    description: "Real-time Air Quality Index data for mining zones and nearby cities using live APIs",
    color: "text-accent",
    bgColor: "bg-accent/10"
  },
  {
    icon: Leaf,
    title: "Reduction Pathways",
    description: "Get AI-recommended strategies for emission reduction including EV adoption and renewable energy",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: Zap,
    title: "Dataset Upload",
    description: "Upload custom activity datasets (CSV) to visualize your own emission trends dynamically",
    color: "text-secondary",
    bgColor: "bg-secondary/10"
  }
];

const Features = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px]" />

      <div className="container mx-auto relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Comprehensive Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="text-gradient"> Achieve Net Zero</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A complete suite of tools to track, analyze, and reduce carbon emissions across your mining operations
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group border-border/50 smooth-transition hover:scale-105 hover:shadow-xl hover:border-primary/50 animate-fade-in-up bg-card/50 backdrop-blur-sm"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className={`w-12 h-12 rounded-xl ${feature.bgColor} flex items-center justify-center smooth-transition group-hover:scale-110 glow-effect`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
