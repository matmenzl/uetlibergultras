import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://uetlibergultras.ch";
const SITEMAP_URL = `${SITE_URL}/sitemap.xml`;
const SITE_IDENTIFIER = encodeURIComponent(`${SITE_URL}/`);
const SITEMAP_IDENTIFIER = encodeURIComponent(SITEMAP_URL);
const GATEWAY = "https://connector-gateway.lovable.dev/google_search_console";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GSC_KEY = Deno.env.get("GOOGLE_SEARCH_CONSOLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LOVABLE_API_KEY) {
    return json({ error: "LOVABLE_API_KEY missing" }, 500);
  }
  if (!GSC_KEY) {
    return json({ error: "GOOGLE_SEARCH_CONSOLE_API_KEY missing" }, 500);
  }

  // Parse body (optional)
  let body: { force?: boolean; trigger?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* no body */
  }
  const force = body.force === true;
  const trigger = body.trigger ?? "manual";

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  try {
    // 1. Fetch live sitemap
    const res = await fetch(SITEMAP_URL, {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) {
      await log(admin, null, "fetch_failed", `HTTP ${res.status}`, trigger);
      return json({ error: `sitemap fetch failed: ${res.status}` }, 502);
    }
    const xml = await res.text();
    const hash = await sha256(xml);

    // 2. Compare against last submitted hash
    const { data: state } = await admin
      .from("sitemap_submission_state")
      .select("last_hash")
      .eq("id", "default")
      .maybeSingle();

    if (!force && state?.last_hash === hash) {
      return json({
        submitted: false,
        reason: "unchanged",
        hash,
        trigger,
      });
    }

    // 3. Submit to Google Search Console
    const gscRes = await fetch(
      `${GATEWAY}/webmasters/v3/sites/${SITE_IDENTIFIER}/sitemaps/${SITEMAP_IDENTIFIER}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GSC_KEY,
        },
      },
    );

    if (!gscRes.ok && gscRes.status !== 204) {
      const errText = await gscRes.text();
      await log(admin, hash, "gsc_failed", `${gscRes.status}: ${errText}`, trigger);
      return json({ error: `GSC submit failed: ${gscRes.status}`, detail: errText }, 502);
    }

    await log(admin, hash, "ok", null, trigger);

    return json({ submitted: true, hash, trigger, force });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await log(admin, null, "error", msg, trigger);
    return json({ error: msg }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function log(
  admin: ReturnType<typeof createClient>,
  hash: string | null,
  status: string,
  error: string | null,
  trigger: string,
) {
  await admin.from("sitemap_submission_state").upsert(
    {
      id: "default",
      last_hash: hash ?? undefined,
      last_submitted_at: new Date().toISOString(),
      last_status: status,
      last_error: error,
      last_trigger: trigger,
    },
    { onConflict: "id" },
  );
}