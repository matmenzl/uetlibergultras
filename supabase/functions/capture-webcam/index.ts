import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 15 minutes between screenshots
const RATE_LIMIT_MINUTES = 15;

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const screenshotOneKey = Deno.env.get('SCREENSHOTONE_ACCESS_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase client early for rate limit check
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // RATE LIMIT TEMPORARILY DISABLED FOR DEBUGGING
    console.log('Rate limit check SKIPPED (debugging mode)');

    if (!screenshotOneKey) {
      throw new Error('SCREENSHOTONE_ACCESS_KEY not configured');
    }

    console.log('Starting webcam screenshot capture with ScreenshotOne (DEBUG MODE)...');

    // Roundshot webcam URL
    const targetUrl = 'https://uetliberg.roundshot.com/';

    // AGGRESSIVE CSS: Hide EVERYTHING except the canvas element
    const customCSS = `
      /* Hide all direct children of app-root except app-canvas */
      app-root > *:not(app-canvas) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Hide everything inside app-canvas except the actual canvas element */
      app-canvas > *:not(canvas) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Make sure canvas fills the viewport */
      app-canvas, canvas {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
      
      /* Hide any elements with Angular content attributes that are overlays */
      app-compass-top,
      app-main-menu-container,
      app-weather-menu-button,
      app-sponsors-container,
      app-scrubber,
      app-scrubber-container,
      app-timeline,
      app-zoom-control,
      app-hotspots-container,
      app-hotspot,
      app-roundshot-logo,
      app-tab-links,
      app-entry-loader,
      [class*="compass"],
      [class*="menu"],
      [class*="weather"],
      [class*="sponsor"],
      [class*="scrubber"],
      [class*="timeline"],
      [class*="zoom"],
      [class*="hotspot"],
      [class*="roundshot"],
      [class*="branding"],
      [class*="tab-link"],
      a[href],
      button,
      img:not(canvas) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        pointer-events: none !important;
      }
    `;

    // Params with custom CSS to hide UI elements
    const params = new URLSearchParams({
      access_key: screenshotOneKey,
      url: targetUrl,
      viewport_width: '1920',
      viewport_height: '1080',
      format: 'jpeg',
      delay: '10',
      cache: 'false',
      styles: customCSS,
    });

    // Comprehensive list of Angular component selectors to hide
    const hideSelectors = [
      'app-compass-top',
      'app-main-menu-container',
      'app-weather-menu-button', 
      'app-sponsors-container',
      'app-scrubber',
      'app-scrubber-container',
      'app-timeline',
      'app-zoom-control',
      'app-hotspots-container',
      'app-hotspot',
      'app-roundshot-logo',
      'app-tab-links',
      'app-entry-loader',
      'button',
      'a',
      'img',
    ];

    // Add each selector
    hideSelectors.forEach(selector => {
      params.append('hide_selectors[]', selector);
    });
    
    const screenshotUrl = `https://api.screenshotone.com/take?${params.toString()}`;

    console.log('Fetching screenshot from ScreenshotOne API...');
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
