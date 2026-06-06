import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { track, identifyUser, resetUser } from "@/lib/posthog";

/**
 * Sends $pageview on every route change and keeps the PostHog identity
 * in sync with the Supabase auth session.
 */
export function usePostHogTracking() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  // Pageviews
  useEffect(() => {
    const path = location.pathname + location.search;
    if (lastPath.current === path) return;
    lastPath.current = path;
    track("$pageview", {
      path: location.pathname,
      search: location.search || undefined,
    });
  }, [location]);

  // Identify / reset based on auth state
  useEffect(() => {
    const identifyFromSession = async (userId: string) => {
      const { data } = await supabase
        .from("profiles")
        .select("strava_id, is_founding_member, user_number")
        .eq("id", userId)
        .maybeSingle();
      identifyUser(userId, {
        strava_user: data?.strava_id !== null && data?.strava_id !== undefined,
        founding_member: data?.is_founding_member ?? false,
        user_number: data?.user_number ?? undefined,
      });
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) identifyFromSession(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_OUT") {
          resetUser();
        } else if (session?.user) {
          identifyFromSession(session.user.id);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}