import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { OrganizationSchema, WebsiteSchema } from "@/components/SEO";
import Index from "./pages/Index";
import Buy from "./pages/Buy";
import Story from "./pages/Story";
import FirstBuyers from "./pages/FirstBuyers";
import Auction from "./pages/Auction";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFirstBuyers from "./pages/AdminFirstBuyers";
import AdminInvoices from "./pages/AdminInvoices";
import AdminPress from "./pages/AdminPress";
import AdminContact from "./pages/AdminContact";
import Press from "./pages/Press";
import Contact from "./pages/Contact";
import { AuthProvider } from "@/context/AuthContext";
import { PixelMetadataProvider } from "@/context/PixelMetadataContext";
import { ReservationsProvider } from "@/context/ReservationsContext";
import { FirstBuyersProvider } from "@/context/FirstBuyersContext";
import { InvoiceSettingsProvider } from "@/context/InvoiceSettingsContext";
import { PressProvider } from "@/context/PressContext";
import { ContactSettingsProvider } from "@/context/ContactSettingsContext";
import RequireAuth from "@/components/RequireAuth";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <OrganizationSchema />
      <WebsiteSchema />
      <AuthProvider>
      <ReservationsProvider>
        <PixelMetadataProvider>
          <InvoiceSettingsProvider>
            <FirstBuyersProvider>
              <PressProvider>
                <ContactSettingsProvider>
                  <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/buy" element={<Buy />} />
                    <Route path="/story" element={<Story />} />
                    <Route path="/first-buyers" element={<FirstBuyers />} />
                    <Route path="/auction" element={<Auction />} />
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
                    <Route
                      path="/admin/invoices"
                      element={
                        <RequireAuth>
                          <AdminInvoices />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin/press"
                      element={
                        <RequireAuth>
                          <AdminPress />
                        </RequireAuth>
                      }
                    />
                    <Route
                      path="/admin/contact"
                      element={
                        <RequireAuth>
                          <AdminContact />
                        </RequireAuth>
                      }
                    />
                    <Route path="/press" element={<Press />} />
                    <Route path="/contact" element={<Contact />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                  </TooltipProvider>
                </ContactSettingsProvider>
              </PressProvider>
            </FirstBuyersProvider>
          </InvoiceSettingsProvider>
        </PixelMetadataProvider>
      </ReservationsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
