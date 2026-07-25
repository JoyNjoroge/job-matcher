import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { lazy, Suspense } from "react";
import { ApplicationProvider } from "./contexts/ApplicationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
const HomePage = lazy(() => import("./pages/HomePage"));
const AnalyzePage = lazy(() => import("./pages/AnalyzePage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const BoardPage = lazy(() => import("./pages/BoardPage"));
const PrepPage = lazy(() => import("./pages/PrepPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ApplyPage = lazy(() => import("./pages/ApplyPage"));
const ApplicationsPage = lazy(() => import("./pages/ApplicationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const ApplyBriefingPage = lazy(() => import("./pages/BriefingPage"));
const CVGeneratorPage = lazy(() => import("./pages/CVGeneratorPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BillingCallbackPage = lazy(() => import("./pages/BillingCallbackPage"));

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
              <Suspense fallback={
                <div className="min-h-screen grid place-items-center bg-[var(--bg)] text-sm text-muted-foreground">
                  Loading…
                </div>
              }>
              <Routes>

                {/* PUBLIC — no auth needed */}
                <Route path="/"         element={<HomePage />} />
                <Route path="/login"    element={<AuthPage mode="login" />} />
                <Route path="/register" element={<AuthPage mode="register" />} />
                <Route path="/pricing"       element={<PricingPage />} />
                <Route path="/billing/callback" element={<ProtectedRoute><BillingCallbackPage /></ProtectedRoute>} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

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
              </Suspense>
            </TooltipProvider>
          </ApplicationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
