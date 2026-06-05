import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { XMLParser } from 'npm:fast-xml-parser@4.3.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Matching tolerances (meters)
const START_END_TOLERANCE_M = 30;
const AVG_DEVIATION_TOLERANCE_M = 35;
const CUTOFF_DATE = new Date('2026-01-01T00:00:00Z');
const UETLIBERG_LAT = 47.3494;
const UETLIBERG_LON = 8.4916;

type Pt = { lat: number; lon: number; t: number };

// ---------- Geo helpers ----------
function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Decode Strava/Google encoded polyline
function decodePolyline(str: string): Array<{ lat: number; lon: number }> {
  const coords: Array<{ lat: number; lon: number }> = [];
  let index = 0, lat = 0, lng = 0;
  while (index < str.length) {
    let b: number, shift = 0, result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do {
      b = str.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ lat: lat / 1e5, lon: lng / 1e5 });
  }
  return coords;
}

// Find index of first trackpoint within tolerance of target, starting from `fromIdx`
function findNearestIndex(track: Pt[], target: { lat: number; lon: number }, fromIdx: number, tol: number): number {
  let best = -1;
  let bestDist = tol;
  for (let i = fromIdx; i < track.length; i++) {
    const d = haversine(track[i], target);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

// Average min-distance from each track point to closest segment polyline point
function avgDeviation(track: Pt[], poly: Array<{ lat: number; lon: number }>): number {
  if (track.length === 0 || poly.length === 0) return Infinity;
  let sum = 0;
  for (const tp of track) {
    let min = Infinity;
    for (const pp of poly) {
      const d = haversine(tp, pp);
      if (d < min) min = d;
    }
    sum += min;
  }
  return sum / track.length;
}

// ---------- Parsers ----------
function parseGPX(xml: string): { points: Pt[]; name: string | null } {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const gpx = doc.gpx;
  if (!gpx) throw new Error('Invalid GPX: missing <gpx>');
  const trk = Array.isArray(gpx.trk) ? gpx.trk[0] : gpx.trk;
  if (!trk) throw new Error('GPX has no <trk>');
  const name = trk.name ?? null;
  const segs = Array.isArray(trk.trkseg) ? trk.trkseg : [trk.trkseg];
  const points: Pt[] = [];
  for (const seg of segs) {
    if (!seg) continue;
    const pts = Array.isArray(seg.trkpt) ? seg.trkpt : seg.trkpt ? [seg.trkpt] : [];
    for (const p of pts) {
      const lat = parseFloat(p['@_lat']);
      const lon = parseFloat(p['@_lon']);
      const time = p.time;
      if (!isFinite(lat) || !isFinite(lon) || !time) continue;
      points.push({ lat, lon, t: new Date(time).getTime() });
    }
  }
  return { points, name };
}

function parseTCX(xml: string): { points: Pt[]; name: string | null } {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const doc = parser.parse(xml);
  const tcd = doc.TrainingCenterDatabase;
  if (!tcd) throw new Error('Invalid TCX');
  const acts = tcd.Activities?.Activity;
  const activity = Array.isArray(acts) ? acts[0] : acts;
  if (!activity) throw new Error('TCX has no Activity');
  const laps = Array.isArray(activity.Lap) ? activity.Lap : [activity.Lap];
  const points: Pt[] = [];
  for (const lap of laps) {
    if (!lap) continue;
    const track = lap.Track;
    if (!track) continue;
    const tps = Array.isArray(track.Trackpoint) ? track.Trackpoint : [track.Trackpoint];
    for (const tp of tps) {
      if (!tp?.Position) continue;
      const lat = parseFloat(tp.Position.LatitudeDegrees);
      const lon = parseFloat(tp.Position.LongitudeDegrees);
      const time = tp.Time;
      if (!isFinite(lat) || !isFinite(lon) || !time) continue;
      points.push({ lat, lon, t: new Date(time).getTime() });
    }
  }
  return { points, name: activity.Notes ?? null };
}

// ---------- Synthetic activity_id (negative bigint) ----------
async function syntheticActivityId(userId: string, startedAtMs: number): Promise<number> {
  const data = new TextEncoder().encode(`${userId}:${startedAtMs}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  // Take 6 bytes => 48-bit, fits safely in JS number; negate to avoid Strava-id collisions
  let n = 0;
  for (let i = 0; i < 6; i++) n = n * 256 + bytes[i];
  return -n;
}

// Weather fetch (best-effort)
async function fetchWeatherAt(timestampMs: number): Promise<{ weather_code: number | null; temperature: number | null }> {
  try {
    const date = new Date(timestampMs).toISOString().slice(0, 10);
    const hourIso = new Date(timestampMs).toISOString().slice(0, 13) + ':00';
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${UETLIBERG_LAT}&longitude=${UETLIBERG_LON}&start_date=${date}&end_date=${date}&hourly=temperature_2m,weather_code`;
    const res = await fetch(url);
    if (!res.ok) return { weather_code: null, temperature: null };
    const data = await res.json();
    const times: string[] = data?.hourly?.time ?? [];
    const idx = times.findIndex((t) => t === hourIso);
    if (idx === -1) return { weather_code: null, temperature: null };
    return {
      weather_code: data.hourly.weather_code?.[idx] ?? null,
      temperature: data.hourly.temperature_2m?.[idx] ?? null,
    };
  } catch {
    return { weather_code: null, temperature: null };
  }
}

// ---------- Main handler ----------
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Auth: validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    // Parse multipart
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (file.size > 10 * 1024 * 1024) {
      return new Response(JSON.stringify({ error: 'File too large (max 10 MB)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const filename = file.name;
    const lower = filename.toLowerCase();
    let format: 'gpx' | 'tcx';
    if (lower.endsWith('.gpx')) format = 'gpx';
    else if (lower.endsWith('.tcx')) format = 'tcx';
    else {
      return new Response(JSON.stringify({ error: 'Only .gpx and .tcx supported in this version' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert pending upload row
    const { data: uploadRow, error: uploadErr } = await admin
      .from('manual_run_uploads')
      .insert({ user_id: userId, filename, format, status: 'pending' })
      .select('id')
      .single();
    if (uploadErr || !uploadRow) throw new Error(`Failed to create upload row: ${uploadErr?.message}`);
    const uploadId = uploadRow.id;

    const finishWithError = async (msg: string, code = 400) => {
      await admin.from('manual_run_uploads').update({ status: 'failed', error: msg }).eq('id', uploadId);
      return new Response(JSON.stringify({ error: msg, upload_id: uploadId }), {
        status: code, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    // Parse file
    const text = await file.text();
    let parsed: { points: Pt[]; name: string | null };
    try {
      parsed = format === 'gpx' ? parseGPX(text) : parseTCX(text);
    } catch (e) {
      return await finishWithError(`Datei konnte nicht gelesen werden: ${(e as Error).message}`);
    }
    const track = parsed.points;
    if (track.length < 5) return await finishWithError('Zu wenige Trackpunkte in der Datei.');

    const startedAt = new Date(track[0].t);
    const endedAt = new Date(track[track.length - 1].t);
    const elapsedS = Math.max(0, Math.round((endedAt.getTime() - startedAt.getTime()) / 1000));

    // Compute total distance
    let totalDist = 0;
    for (let i = 1; i < track.length; i++) totalDist += haversine(track[i - 1], track[i]);

    // Cutoff
    if (startedAt < CUTOFF_DATE) {
      await admin.from('manual_run_uploads').update({
        status: 'processed',
        started_at: startedAt.toISOString(),
        distance_m: totalDist,
        elapsed_s: elapsedS,
        trackpoint_count: track.length,
        error: 'Run liegt vor dem Gamification-Start (1.1.2026).',
      }).eq('id', uploadId);
      return new Response(JSON.stringify({
        upload_id: uploadId, segments_matched: 0, check_ins_created: 0,
        message: 'Dieser Run liegt vor dem 1.1.2026 und zählt nicht.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
    }

    // Load segments
    const { data: segments, error: segErr } = await admin
      .from('uetliberg_segments')
      .select('segment_id, name, polyline, start_latlng, end_latlng');
    if (segErr || !segments) return await finishWithError(`Konnte Segmente nicht laden: ${segErr?.message}`, 500);

    // Match each segment
    type Match = { segment_id: number; name: string; startIdx: number; endIdx: number; elapsed: number; distance: number };
    const matches: Match[] = [];

    for (const seg of segments) {
      const poly = decodePolyline(seg.polyline);
      if (poly.length < 2) continue;
      const segStart = poly[0];
      const segEnd = poly[poly.length - 1];

      const sIdx = findNearestIndex(track, segStart, 0, START_END_TOLERANCE_M);
      if (sIdx === -1) continue;
      const eIdx = findNearestIndex(track, segEnd, sIdx + 1, START_END_TOLERANCE_M);
      if (eIdx === -1) continue;

      const slice = track.slice(sIdx, eIdx + 1);
      const dev = avgDeviation(slice, poly);
      if (dev > AVG_DEVIATION_TOLERANCE_M) continue;

      let segDist = 0;
      for (let i = 1; i < slice.length; i++) segDist += haversine(slice[i - 1], slice[i]);
      const elapsed = Math.max(0, Math.round((slice[slice.length - 1].t - slice[0].t) / 1000));

      matches.push({
        segment_id: seg.segment_id,
        name: seg.name,
        startIdx: sIdx,
        endIdx: eIdx,
        elapsed,
        distance: segDist,
      });
    }

    // Synthetic activity_id (shared across segments of this run)
    const activityId = await syntheticActivityId(userId, startedAt.getTime());
    const weather = await fetchWeatherAt(startedAt.getTime());

    let createdCount = 0;
    for (const m of matches) {
      const { error: ciErr } = await admin
        .from('check_ins')
        .upsert({
          user_id: userId,
          segment_id: m.segment_id,
          activity_id: activityId,
          activity_name: parsed.name ?? filename,
          elapsed_time: m.elapsed,
          distance: m.distance,
          checked_in_at: startedAt.toISOString(),
          activity_distance: totalDist,
          activity_elapsed_time: elapsedS,
          weather_code: weather.weather_code,
          temperature: weather.temperature,
          source: 'manual_upload',
          upload_id: uploadId,
          is_manual: false,
        }, { onConflict: 'user_id,segment_id,activity_id' });
      if (!ciErr) createdCount++;
      else console.error('Check-in error:', ciErr);
    }

    await admin.from('manual_run_uploads').update({
      status: 'processed',
      started_at: startedAt.toISOString(),
      distance_m: totalDist,
      elapsed_s: elapsedS,
      trackpoint_count: track.length,
      segments_matched: matches.length,
      check_ins_created: createdCount,
    }).eq('id', uploadId);

    // Trigger achievement check
    if (createdCount > 0) {
      try {
        await admin.functions.invoke('check-achievements', { body: { user_id: userId } });
      } catch (e) {
        console.error('Failed to invoke check-achievements:', e);
      }
    }

    return new Response(JSON.stringify({
      upload_id: uploadId,
      started_at: startedAt.toISOString(),
      distance_m: Math.round(totalDist),
      elapsed_s: elapsedS,
      trackpoint_count: track.length,
      segments_matched: matches.length,
      check_ins_created: createdCount,
      matches: matches.map((m) => ({
        segment_id: m.segment_id,
        name: m.name,
        elapsed_time: m.elapsed,
        distance: Math.round(m.distance),
      })),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (e) {
    console.error('upload-run error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});