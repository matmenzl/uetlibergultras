import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import polyline from '@mapbox/polyline';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Segment {
  segment_id: number;
  segment_name: string;
  distance: number;
  start_date: string;
}

interface SegmentWithPolyline {
  id: number;
  name: string;
  polyline: string;
  distance: number;
  average_grade: number;
}

interface ActivityMapProps {
  segments: Segment[];
}

export const ActivityMap = ({ segments }: ActivityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [segmentPolylines, setSegmentPolylines] = useState<SegmentWithPolyline[]>([]);

  // Fetch segment polylines from Strava
  useEffect(() => {
    const fetchSegmentPolylines = async () => {
      if (!segments.length) return;

      try {
        const segmentIds = segments.map(s => s.segment_id);
        
        const { data, error } = await supabase.functions.invoke('strava-activity-segments', {
          body: { segmentIds },
        });

        if (error) {
          console.error('Error fetching segment polylines:', error);
          return;
        }

        if (data?.segments) {
          setSegmentPolylines(data.segments);
        }
      } catch (error) {
        console.error('Error fetching segment polylines:', error);
      }
    };

    fetchSegmentPolylines();
  }, [segments]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [8.491, 47.349], // Uetliberg center
      zoom: 13,
      pitch: 45,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add segment polylines to map
  useEffect(() => {
    if (!map.current || !mapReady || !segmentPolylines.length) return;

    // Remove existing layers and sources
    if (map.current.getLayer('segments-route')) {
      map.current.removeLayer('segments-route');
    }
    if (map.current.getSource('segments-route')) {
      map.current.removeSource('segments-route');
    }

    // Create features from polylines
    const features = segmentPolylines
      .filter(segment => segment.polyline)
      .map((segment, index) => {
        const coordinates = polyline.decode(segment.polyline).map(([lat, lng]) => [lng, lat]);
        
        // Color based on gradient
        let color = '#22c55e'; // green for easy
        const grade = Math.abs(segment.average_grade);
        if (grade >= 6) color = '#ef4444'; // red for hard
        else if (grade >= 3) color = '#f59e0b'; // orange for medium

        return {
          type: 'Feature' as const,
          properties: {
            id: segment.id,
            name: segment.name,
            color,
            index: index + 1,
          },
          geometry: {
            type: 'LineString' as const,
            coordinates,
          },
        };
      });

    // Add source and layer
    map.current.addSource('segments-route', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.current.addLayer({
      id: 'segments-route',
      type: 'line',
      source: 'segments-route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 5,
        'line-opacity': 0.8,
      },
    });

    // Add markers at segment starts
    features.forEach((feature) => {
      const coordinates = feature.geometry.coordinates[0];
      const el = document.createElement('div');
      el.className = 'segment-marker';
      el.style.backgroundColor = feature.properties.color;
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '12px';
      el.style.fontWeight = 'bold';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.textContent = feature.properties.index.toString();

      new mapboxgl.Marker(el)
        .setLngLat(coordinates as [number, number])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>#${feature.properties.index}: ${feature.properties.name}</strong>
            </div>`
          )
        )
        .addTo(map.current!);
    });

    // Fit map to show all segments
    if (features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      features.forEach(feature => {
        feature.geometry.coordinates.forEach(coord => {
          bounds.extend(coord as [number, number]);
        });
      });
      map.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    }
  }, [segmentPolylines, mapReady]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {(!mapReady || (segments.length > 0 && segmentPolylines.length === 0)) && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">
            {!mapReady ? 'Lade Karte...' : 'Lade Routen...'}
          </div>
        </div>
      )}
    </div>
  );
};
