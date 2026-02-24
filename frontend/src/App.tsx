import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthForm from "@/components/AuthForm";
import Index from "@/pages/Index";
import DemoPage from "@/pages/DemoPage";
import DashboardPage from "@/pages/DashboardPage";
import InputPage from "@/pages/InputPage";
import PathwaysPage from "@/pages/PathwaysPage";
import VisualizationPage from "@/pages/VisualizationPage";
import UserPage from "@/pages/UserPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthForm />} />
            <Route path="/demo" element={<DemoPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/input"
              element={
                <ProtectedRoute>
                  <InputPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pathways"
              element={
                <ProtectedRoute>
                  <PathwaysPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/visualization"
              element={
                <ProtectedRoute>
                  <VisualizationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user"
              element={
                <ProtectedRoute>
                  <UserPage />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;