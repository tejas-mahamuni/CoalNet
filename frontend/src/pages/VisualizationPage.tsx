const VisualizationPage = () => {
  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Emission Visualization</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in h-96 flex items-center justify-center">
            <p className="text-muted-foreground">Monthly Emissions Chart</p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in h-96 flex items-center justify-center" style={{ animationDelay: "0.1s" }}>
            <p className="text-muted-foreground">Category Distribution</p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in h-96 flex items-center justify-center" style={{ animationDelay: "0.2s" }}>
            <p className="text-muted-foreground">Trend Forecast</p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in h-96 flex items-center justify-center" style={{ animationDelay: "0.3s" }}>
            <p className="text-muted-foreground">Comparative Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;
