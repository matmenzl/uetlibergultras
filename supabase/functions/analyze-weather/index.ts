const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Uetliberg coordinates
const UETLIBERG_LAT = 47.3494;
const UETLIBERG_LON = 8.4917;

// Map WMO weather codes to emojis
function getWeatherEmoji(weatherCode: number, isDay: boolean): string {
  // WMO Weather interpretation codes
  // https://open-meteo.com/en/docs
  const weatherMap: Record<number, { day: string; night: string }> = {
    0: { day: '☀️', night: '🌙' }, // Clear sky
    1: { day: '🌤️', night: '🌙' }, // Mainly clear
    2: { day: '⛅', night: '☁️' }, // Partly cloudy
    3: { day: '☁️', night: '☁️' }, // Overcast
    45: { day: '🌫️', night: '🌫️' }, // Fog
    48: { day: '🌫️', night: '🌫️' }, // Depositing rime fog
    51: { day: '🌧️', night: '🌧️' }, // Light drizzle
    53: { day: '🌧️', night: '🌧️' }, // Moderate drizzle
    55: { day: '🌧️', night: '🌧️' }, // Dense drizzle
    56: { day: '🌧️', night: '🌧️' }, // Light freezing drizzle
    57: { day: '🌧️', night: '🌧️' }, // Dense freezing drizzle
    61: { day: '🌦️', night: '🌧️' }, // Slight rain
    63: { day: '🌧️', night: '🌧️' }, // Moderate rain
    65: { day: '🌧️', night: '🌧️' }, // Heavy rain
    66: { day: '🌧️', night: '🌧️' }, // Light freezing rain
    67: { day: '🌧️', night: '🌧️' }, // Heavy freezing rain
    71: { day: '🌨️', night: '🌨️' }, // Slight snow
    73: { day: '🌨️', night: '🌨️' }, // Moderate snow
    75: { day: '🌨️', night: '🌨️' }, // Heavy snow
    77: { day: '🌨️', night: '🌨️' }, // Snow grains
    80: { day: '🌦️', night: '🌧️' }, // Slight rain showers
    81: { day: '🌧️', night: '🌧️' }, // Moderate rain showers
    82: { day: '🌧️', night: '🌧️' }, // Violent rain showers
    85: { day: '🌨️', night: '🌨️' }, // Slight snow showers
    86: { day: '🌨️', night: '🌨️' }, // Heavy snow showers
    95: { day: '⛈️', night: '⛈️' }, // Thunderstorm
    96: { day: '⛈️', night: '⛈️' }, // Thunderstorm with slight hail
    99: { day: '⛈️', night: '⛈️' }, // Thunderstorm with heavy hail
  };

  const weather = weatherMap[weatherCode] || { day: '🌤️', night: '🌙' };
  return isDay ? weather.day : weather.night;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Fetch weather data from Open-Meteo API (free, no API key needed)
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${UETLIBERG_LAT}&longitude=${UETLIBERG_LON}&current=temperature_2m,weather_code,is_day&timezone=Europe/Zurich`;
    
    console.log('Fetching weather from Open-Meteo:', apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API failed: ${response.status}`);
    }

    const data = await response.json();
    
    const temperature = Math.round(data.current.temperature_2m);
    const weatherCode = data.current.weather_code;
    const isDay = data.current.is_day === 1;
    
    const weatherEmoji = getWeatherEmoji(weatherCode, isDay);

    console.log('Weather result:', { temperature, weatherCode, isDay, weatherEmoji });

    return new Response(
      JSON.stringify({
        success: true,
        weather: weatherEmoji,
        temperature: temperature,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching weather:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        weather: '🌤️',
        temperature: null,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
});
