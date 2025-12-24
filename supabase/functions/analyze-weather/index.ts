import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Get the webcam screenshot URL
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: urlData } = supabase.storage
      .from('webcam-screenshots')
      .getPublicUrl('latest.jpg');

    const imageUrl = urlData.publicUrl + '?t=' + Date.now(); // Cache bust

    console.log('Analyzing weather from webcam image:', imageUrl);

    // Call Lovable AI to analyze the weather
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Du bist ein Wetter-Analyst. Analysiere das Webcam-Bild vom Uetliberg (Zürich, Schweiz) und bestimme das aktuelle Wetter.
            
Antworte NUR mit einem einzelnen Emoji das das Wetter am besten beschreibt:
- ☀️ für sonnig/klar
- 🌤️ für teilweise bewölkt
- ⛅ für bewölkt mit Sonne
- ☁️ für bewölkt
- 🌧️ für Regen
- 🌦️ für Regenschauer
- ⛈️ für Gewitter
- 🌨️ für Schnee
- 🌫️ für Nebel/diesig
- 🌪️ für stürmisch

Falls das Bild zu dunkel ist (Nacht), benutze:
- 🌙 für klare Nacht
- ☁️ für bewölkte Nacht

Antworte NUR mit dem Emoji, ohne weitere Erklärung.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              },
              {
                type: 'text',
                text: 'Was ist das aktuelle Wetter auf diesem Webcam-Bild?'
              }
            ]
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI API failed: ${response.status}`);
    }

    const data = await response.json();
    const weatherEmoji = data.choices?.[0]?.message?.content?.trim() || '🌤️';

    console.log('Weather analysis result:', weatherEmoji);

    return new Response(
      JSON.stringify({
        success: true,
        weather: weatherEmoji,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error analyzing weather:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        weather: '🌤️', // Fallback emoji
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with fallback so UI doesn't break
      }
    );
  }
});
