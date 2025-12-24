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

    console.log('Starting webcam screenshot capture (SE direction, cropped)...');

    // Roundshot webcam URL - SE direction (Southeast view)
    const targetUrl = 'https://uetliberg.roundshot.com/#/se';
    
    // Call Screenshot API with delay for page load
    // Using css_clip to crop UI overlays heavily: top=300px, right=300px, bottom=350px, left=300px
    // Format: css_clip=top,right,bottom,left
    const screenshotUrl = `https://shot.screenshotapi.net/screenshot?token=${screenshotApiKey}&url=${encodeURIComponent(targetUrl)}&delay=12000&output=image&file_type=jpeg&width=1920&height=1080&full_page=false&fresh=true&css_clip=300,300,350,300`;

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
