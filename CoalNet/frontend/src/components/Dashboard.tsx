import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, PieChart, TrendingUp } from "lucide-react";
import dashboardPreview from "@/assets/dashboard-preview.jpg";

const Dashboard = () => {
  return (
    <section className="py-24 px-4 relative overflow-hidden bg-muted/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
          {/* Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 glass-effect px-4 py-2 rounded-full">
              <BarChart3 className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Interactive Dashboards</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold">
              Visualize Your
              <span className="text-gradient"> Carbon Footprint</span>
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Transform complex emission data into actionable insights with our intuitive dashboards. Track trends, compare periods, and make data-driven decisions to achieve your sustainability goals.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center smooth-transition group-hover:scale-110 group-hover:bg-primary/20">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Category Breakdown</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize emissions by fuel, electricity, methane, and transport
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center smooth-transition group-hover:scale-110 group-hover:bg-secondary/20">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Trend Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Identify patterns and forecast future emission trajectories
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center smooth-transition group-hover:scale-110 group-hover:bg-accent/20">
                  <BarChart3 className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Comparative Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Compare performance across time periods and mining sites
                  </p>
                </div>
              </div>
            </div>

            <Button variant="hero" size="lg" className="group">
              Explore Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Dashboard Preview */}
          <div className="relative animate-slide-in-right">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/50 glass-effect">
              <img
                src={dashboardPreview}
                alt="CoalNet Zero Dashboard Interface"
                className="w-full h-auto"
              />
              {/* Overlay Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-secondary/20 pointer-events-none" />
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -top-6 -right-6 glass-effect p-4 rounded-xl shadow-lg animate-float">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
                <span className="text-sm font-medium">Live Tracking</span>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 glass-effect p-4 rounded-xl shadow-lg animate-float" style={{ animationDelay: "1s" }}>
              <div className="text-2xl font-bold text-gradient">-32%</div>
              <div className="text-sm text-muted-foreground">vs last month</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
