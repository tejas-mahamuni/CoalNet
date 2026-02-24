import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Maximize2, ChevronDown, ChevronUp, X } from "lucide-react";

interface ChartWrapperProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultCollapsed?: boolean;
}

const ChartWrapper = ({ title, icon, children, defaultCollapsed = false }: ChartWrapperProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [maximized, setMaximized] = useState(false);

  return (
    <>
      {/* Normal (inline) view */}
      <div className="relative">
        {/* Control bar */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-muted-foreground hover:text-white"
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setMaximized(true); setCollapsed(false); }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-muted-foreground hover:text-white"
            title="Maximize"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsed view */}
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-effect rounded-2xl border border-white/20 px-5 py-3 cursor-pointer flex items-center gap-3"
              onClick={() => setCollapsed(false)}
            >
              {icon}
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
              <span className="text-xs text-muted-foreground/50 ml-auto mr-16">Click to expand</span>
            </motion.div>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen overlay */}
      <AnimatePresence>
        {maximized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setMaximized(false)}
            />

            {/* Maximized content */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full h-full max-w-[95vw] max-h-[92vh] overflow-auto rounded-2xl glass-effect border border-white/20 shadow-2xl"
              style={{ background: "hsl(var(--background))" }}
            >
              {/* Fullscreen header bar */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-background/80 backdrop-blur-sm rounded-t-2xl">
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="text-sm font-semibold">{title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMaximized(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-muted-foreground hover:text-white"
                    title="Minimize"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMaximized(false)}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-all text-red-400 hover:text-red-300"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Content area — stretched to fill */}
              <div className="p-6 [&_.h-\[380px\]]:h-[calc(92vh-120px)] [&_.h-\[420px\]]:h-[calc(92vh-120px)] [&_.h-\[350px\]]:h-[calc(92vh-120px)]">
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChartWrapper;
