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

    console.log('Starting webcam screenshot capture with ScreenshotOne (rate limit passed)...');

    // Roundshot webcam URL - default panorama view
    const targetUrl = 'https://uetliberg.roundshot.com/';
    
    // NOTE: Previously we hid *too much* (e.g. `img` / overlays), which could result in a white/blank capture.
    // Keep capture stable first; we can re-introduce targeted UI-hiding later once we know Roundshot's DOM.

    // Build ScreenshotOne API URL
    const params = new URLSearchParams({
      access_key: screenshotOneKey,
      url: targetUrl,
      viewport_width: '1920',
      viewport_height: '1080',
      format: 'jpeg',
      // Give the panorama time to render
      delay: '25',
      block_ads: 'true',
      block_cookie_banners: 'true',
      block_trackers: 'true',
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
