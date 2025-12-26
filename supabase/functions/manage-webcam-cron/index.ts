import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Verify user using their token
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    });
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = await req.json();
    console.log("Action requested:", action, "by user:", user.id);

    if (action === "status") {
      // Use the database function to get cron status
      const { data, error } = await supabase.rpc("webcam_cron_status");
      
      if (error) {
        console.error("Error getting cron status:", error);
        throw error;
      }
      
      const isActive = data && data.length > 0 && data.some((j: { active: boolean }) => j.active);
      
      return new Response(
        JSON.stringify({ 
          status: isActive ? "active" : "inactive",
          jobs: data || []
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enable") {
      // Use the database function to enable cron
      const { error } = await supabase.rpc("webcam_cron_set_enabled", { _enabled: true });
      
      if (error) {
        console.error("Error enabling cron:", error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: "Webcam-Cron aktiviert (alle 30 Min, 6:00-20:00 Uhr)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      // Use the database function to disable cron
      const { error } = await supabase.rpc("webcam_cron_set_enabled", { _enabled: false });
      
      if (error) {
        console.error("Error disabling cron:", error);
        throw error;
      }

      return new Response(
        JSON.stringify({ success: true, message: "Webcam-Cron deaktiviert" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use 'status', 'enable', or 'disable'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
