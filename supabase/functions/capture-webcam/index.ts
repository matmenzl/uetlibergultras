import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const screenshotApiKey = Deno.env.get('SCREENSHOT_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!screenshotApiKey) {
      throw new Error('SCREENSHOT_API_KEY not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    console.log('Starting webcam screenshot capture...');

    // Roundshot webcam URL - no direction specified (default view)
    const targetUrl = 'https://uetliberg.roundshot.com/';
    
    // Using CSS injection to hide UI overlays
    const hideUiCss = encodeURIComponent(`
      /* Generic app chrome */
      header, footer,
      .header, .footer, .controls, .navigation, .menu, .logo, .brand,
      [class*="header"], [class*="footer"], [class*="control"], [class*="nav"],
      [class*="menu"], [class*="logo"], [class*="brand"], [class*="toolbar"],
      [class*="overlay"], [class*="ui"],

      /* Pannellum UI (common for 360 viewers) */
      .pnlm-controls-container, .pnlm-control, .pnlm-compass, .pnlm-hot-spot,
      .pnlm-load-box, .pnlm-about-msg, .pnlm-ui, .pnlm-button,

      /* Roundshot-ish prefixes (best-effort) */
      .rs-ui, .rs-control, .rs-header, .rs-footer, .rs-logo, .rs-menu,
      .rs-timeline, .rs-compass, .rs-fullscreen, .rs-share, .rs-info,

      /* Specifically: anything clickable in the top-right corner */
      button[style*="top"],
      button[style*="right"],
      a[style*="top"],
      a[style*="right"],
      [style*="position: fixed"][style*="top"][style*="right"],
      [style*="position: absolute"][style*="top"][style*="right"]
      {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
    `);
    
    // Call Screenshot API with delay for page load and CSS to hide UI elements
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=${screenshotApiKey}&url=${encodeURIComponent(targetUrl)}&delay=15000&output=image&file_type=jpeg&width=1920&height=1080&full_page=false&fresh=true&css=${hideUiCss}`;

    console.log('Fetching screenshot from API...');
    const screenshotResponse = await fetch(screenshotUrl);

    if (!screenshotResponse.ok) {
      const errorText = await screenshotResponse.text();
      console.error('Screenshot API error:', errorText);
      throw new Error(`Screenshot API failed: ${screenshotResponse.status} - ${errorText}`);
    }

    const imageBlob = await screenshotResponse.blob();
    console.log(`Screenshot received: ${imageBlob.size} bytes`);

    if (imageBlob.size < 1000) {
      throw new Error('Screenshot too small, likely failed to capture');
    }

    // Convert blob to ArrayBuffer for upload
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Upload to storage bucket (upsert = replace existing)
    const fileName = 'latest.jpg';
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('webcam-screenshots')
      .upload(fileName, uint8Array, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload screenshot: ${uploadError.message}`);
    }

    console.log('Screenshot uploaded successfully:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('webcam-screenshots')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webcam screenshot captured and stored',
        url: publicUrl,
        size: imageBlob.size,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error capturing webcam screenshot:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
