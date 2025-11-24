import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Buy from "./pages/Buy";
import NotFound from "./pages/NotFound";
import FirstBuyers from "./pages/FirstBuyers";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFirstBuyers from "./pages/AdminFirstBuyers";
import { AuthProvider } from "@/context/AuthContext";
import { PixelMetadataProvider } from "@/context/PixelMetadataContext";
import { ReservationsProvider } from "@/context/ReservationsContext";
import { FirstBuyersProvider } from "@/context/FirstBuyersContext";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ReservationsProvider>
        <PixelMetadataProvider>
          <FirstBuyersProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/buy" element={<Buy />} />
                  <Route path="/first-buyers" element={<FirstBuyers />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAuth>
                        <AdminDashboard />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/admin/first-buyers"
                    element={
                      <RequireAuth>
                        <AdminFirstBuyers />
                      </RequireAuth>
                    }
                  />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </FirstBuyersProvider>
        </PixelMetadataProvider>
      </ReservationsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
