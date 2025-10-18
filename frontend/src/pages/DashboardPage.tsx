const DashboardPage = () => {
  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="container mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gradient">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in">
            <h3 className="text-xl font-semibold mb-2">Total Emissions</h3>
            <p className="text-3xl font-bold text-primary">1,234 tCO₂e</p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-xl font-semibold mb-2">Active Mines</h3>
            <p className="text-3xl font-bold text-primary">42</p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-white/20 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-xl font-semibold mb-2">Reduction Target</h3>
            <p className="text-3xl font-bold text-primary">-15%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
