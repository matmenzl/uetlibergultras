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

    // Check when the last screenshot was taken
    const { data: files, error: listError } = await supabase.storage
      .from('webcam-screenshots')
      .list('', { search: 'latest.jpg' });

    if (!listError && files && files.length > 0) {
      const latestFile = files.find(f => f.name === 'latest.jpg');
      if (latestFile) {
        const lastUpdated = new Date(latestFile.updated_at);
        const now = new Date();
        const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
        
        if (diffMinutes < RATE_LIMIT_MINUTES) {
          const remainingMinutes = Math.ceil(RATE_LIMIT_MINUTES - diffMinutes);
          console.log(`Rate limit: Last screenshot was ${diffMinutes.toFixed(1)} minutes ago. Need to wait ${remainingMinutes} more minutes.`);
          
          return new Response(
            JSON.stringify({
              success: false,
              rateLimited: true,
              message: `Bitte warte noch ${remainingMinutes} Minute${remainingMinutes > 1 ? 'n' : ''} bis zum nächsten Screenshot.`,
              lastUpdated: lastUpdated.toISOString(),
              nextAllowedAt: new Date(lastUpdated.getTime() + RATE_LIMIT_MINUTES * 60 * 1000).toISOString(),
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 429,
            }
          );
        }
      }
    }

    if (!screenshotOneKey) {
      throw new Error('SCREENSHOTONE_ACCESS_KEY not configured');
    }

    console.log('Starting webcam screenshot capture with ScreenshotOne (rate limit passed)...');

    // Roundshot webcam URL - default panorama view
    const targetUrl = 'https://uetliberg.roundshot.com/';
    
    // CSS selectors to hide UI elements (ScreenshotOne uses hide_selectors parameter)
    const hideSelectors = 'button,nav,header,footer,aside,[class*="logo"],[class*="control"],[class*="zoom"],[class*="nav"],[class*="menu"],svg,a[href],[class*="toolbar"],[class*="overlay"],[class*="ui-"],[class*="icon"],[class*="widget"],[class*="panel"],[class*="sidebar"],[class*="compass"],[class*="timeline"],[class*="share"],[class*="fullscreen"],[class*="info"],[class*="help"],[class*="settings"]';
    
    // Build ScreenshotOne API URL
    const params = new URLSearchParams({
      access_key: screenshotOneKey,
      url: targetUrl,
      viewport_width: '1920',
      viewport_height: '1080',
      format: 'jpeg',
      delay: '15', // ScreenshotOne uses seconds, not milliseconds
      block_ads: 'true',
      block_cookie_banners: 'true',
      hide_selectors: hideSelectors,
      full_page: 'false',
      cache: 'false',
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
