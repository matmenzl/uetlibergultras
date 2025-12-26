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

    // CSS to hide ALL UI overlays on the Roundshot page - using exact selectors from their Angular app
    const customCSS = `
      /* Top compass */
      app-compass-top, .compass-container, .compass-row, .compass-label, .compass-indicator {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Main menu / sidebar on the right */
      app-main-menu-container, .main-menu-container, .main-menu, .main-menu-item, 
      .main-menu-button, .menu-placeholder, .menu-scrollable {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Weather button */
      app-weather-menu-button, .weather-button, .weather-content {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Sponsor logos / branding (Uto Kulm, Bergstube) */
      app-sponsors-container, .sponsors-container, .sponsor, .sponsor-logo,
      app-branding, .branding-container, .branding-logo {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Timeline / time scrubber at the bottom */
      app-scrubber, app-timeline, .scrubber, .timeline, .time-slider,
      app-scrubber-container, .scrubber-container {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Zoom controls */
      app-zoom-control, .zoom-control, .zoom-container {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Hotspots (pins on the image) */
      app-hotspots-container, app-hotspot, .hotspot, .hotspot-icon, .hotspot-title {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Roundshot logo */
      app-roundshot-logo, .roundshot-logo, [class*="roundshot"] {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Tab links (Wetter, Hotel, Bergstube) */
      app-tab-links, .tab-links, .tab-link {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Any remaining Angular Material buttons */
      button, .mat-button, .mat-icon-button, a.mat-button {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
      }
      
      /* Any absolute positioned overlays */
      [style*="position: absolute"]:not(app-canvas):not(canvas),
      [style*="position:absolute"]:not(app-canvas):not(canvas) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
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

    // Exact Angular component selectors from Roundshot page
    const hideSelectors = [
      // Top compass
      'app-compass-top', '.compass-container',
      // Right sidebar menu
      'app-main-menu-container', '.main-menu-container', '.main-menu',
      // Weather
      'app-weather-menu-button', '.weather-button',
      // Sponsor logos
      'app-sponsors-container', '.sponsor',
      // Bottom timeline/scrubber
      'app-scrubber', 'app-timeline', '.scrubber', '.timeline',
      // Zoom controls
      'app-zoom-control', '.zoom-control',
      // Hotspots
      'app-hotspots-container', 'app-hotspot', '.hotspot',
      // Roundshot logo
      'app-roundshot-logo', '.roundshot-logo',
      // Tab links at bottom
      'app-tab-links', '.tab-links',
      // General buttons
      'button', '.mat-button',
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
