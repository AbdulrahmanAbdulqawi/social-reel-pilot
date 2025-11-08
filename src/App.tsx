import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { RTLWrapper } from "@/components/RTLWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Subscription from "./pages/Subscription";
import Contact from "./pages/Contact";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Onboarding from "./pages/Onboarding";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/admin" element={<Admin />} />
            
            {/* Protected routes with sidebar */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <RTLWrapper>
                      <AppSidebar />
                      <main className="flex-1 overflow-auto">
                        <ErrorBoundary>
                          <Routes>
                            <Route path="/onboarding" element={<Onboarding />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/upload" element={<Upload />} />
                            <Route path="/analytics" element={<Analytics />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/subscription" element={<Subscription />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </ErrorBoundary>
                      </main>
                    </RTLWrapper>
                  </SidebarProvider>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
