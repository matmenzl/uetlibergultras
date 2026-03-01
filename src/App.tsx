import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { App as CapApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthStravaCallback from "./pages/AuthStravaCallback";
import Segments from "./pages/Segments";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Pass from "./pages/Pass";
import Profile from "./pages/Profile";
import BadgeDemo from "./pages/BadgeDemo";
import PublicProfile from "./pages/PublicProfile";

const queryClient = new QueryClient();

function DeepLinkHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const listener = CapApp.addListener("appUrlOpen", async (event) => {
      const url = new URL(event.url);

      if (url.hostname === "auth-success") {
        const at = decodeURIComponent(url.searchParams.get("at") || "");
        const rt = decodeURIComponent(url.searchParams.get("rt") || "");

        if (at && rt) {
          await Browser.close();
          await supabase.auth.setSession({ access_token: at, refresh_token: rt });
          navigate("/");
        }
      } else if (url.hostname === "auth-error") {
        await Browser.close();
        navigate("/auth");
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <DeepLinkHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/pass" element={<Pass />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/segments" element={<Segments />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/strava-callback" element={<AuthStravaCallback />} />
          <Route path="/badge-demo" element={<BadgeDemo />} />
          <Route path="/runner/:userId" element={<PublicProfile />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
