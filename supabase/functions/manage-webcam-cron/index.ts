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
    const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;
    
    // Verify user using their token
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using service role
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action } = await req.json();

    // Use postgres module for direct DB access to cron schema
    const { Pool } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const pool = new Pool(dbUrl, 1, true);
    const connection = await pool.connect();

    try {
      if (action === "status") {
        // Check current cron job status
        const result = await connection.queryObject`
          SELECT jobid, schedule, active, jobname, command 
          FROM cron.job 
          WHERE command ILIKE '%capture-webcam%'
        `;
        
        const jobs = result.rows;
        const isActive = jobs.length > 0 && jobs.some((j: any) => j.active);
        
        return new Response(
          JSON.stringify({ 
            status: isActive ? "active" : "inactive",
            jobs: jobs
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "enable") {
        // First check if job already exists
        const existing = await connection.queryObject`
          SELECT jobid FROM cron.job WHERE command ILIKE '%capture-webcam%'
        `;
        
        if (existing.rows.length > 0) {
          // Job exists - just make sure it's active (re-schedule it)
          await connection.queryObject`SELECT cron.unschedule(${(existing.rows[0] as any).jobid})`;
        }
        
        // Schedule the cron job - every 30 minutes during daytime (6:00-20:00)
        const scheduleQuery = `
          SELECT cron.schedule(
            'webcam-screenshot-job',
            '*/30 6-20 * * *',
            $$
            SELECT net.http_post(
              url:='${supabaseUrl}/functions/v1/capture-webcam',
              headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${supabaseAnonKey}"}'::jsonb,
              body:='{}'::jsonb
            ) as request_id;
            $$
          );
        `;
        
        await connection.queryObject(scheduleQuery);

        return new Response(
          JSON.stringify({ success: true, message: "Webcam-Cron aktiviert (alle 30 Min, 6:00-20:00 Uhr)" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (action === "disable") {
        // Find and unschedule the cron job
        const existing = await connection.queryObject`
          SELECT jobid FROM cron.job WHERE command ILIKE '%capture-webcam%'
        `;
        
        if (existing.rows.length > 0) {
          for (const row of existing.rows) {
            await connection.queryObject`SELECT cron.unschedule(${(row as any).jobid})`;
          }
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
    } finally {
      connection.release();
    }

  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
