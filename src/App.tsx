import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import AnalyzePage from "./pages/AnalyzePage";
import ResultsPage from "./pages/ResultsPage";
import BoardPage from "./pages/BoardPage";
import PrepPage from "./pages/PrepPage";
import SearchPage from "./pages/SearchPage";
import ApplyPage from "./pages/ApplyPage";
import ApplicationsPage from "./pages/ApplicationsPage";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ApplyBriefingPage from "./pages/BriefingPage";
import CVGeneratorPage from "./pages/CVGeneratorPage";
import PricingPage from "./pages/PricingPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <ApplicationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>

                {/* PUBLIC — no auth needed */}
                <Route path="/"         element={<HomePage />} />
                <Route path="/login"    element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/pricing"  element={<PricingPage />} />

                {/* PROTECTED — ProtectedRoute redirects to /login if not authed */}
                <Route path="/analyze"        element={<ProtectedRoute><Layout><AnalyzePage /></Layout></ProtectedRoute>} />
                <Route path="/results"        element={<ProtectedRoute><Layout><ResultsPage /></Layout></ProtectedRoute>} />
                <Route path="/search"         element={<ProtectedRoute><Layout><SearchPage /></Layout></ProtectedRoute>} />
                <Route path="/board"          element={<ProtectedRoute><Layout><BoardPage /></Layout></ProtectedRoute>} />
                <Route path="/applications"   element={<ProtectedRoute><Layout><ApplicationsPage /></Layout></ProtectedRoute>} />
                <Route path="/prep"           element={<ProtectedRoute><Layout><PrepPage /></Layout></ProtectedRoute>} />
                <Route path="/apply"          element={<ProtectedRoute><Layout><ApplyPage /></Layout></ProtectedRoute>} />
                <Route path="/apply-briefing" element={<ProtectedRoute><Layout><ApplyBriefingPage /></Layout></ProtectedRoute>} />
                <Route path="/cv-generator"   element={<ProtectedRoute><Layout><CVGeneratorPage /></Layout></ProtectedRoute>} />
                <Route path="/profile"        element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />

              </Routes>
            </TooltipProvider>
          </ApplicationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
