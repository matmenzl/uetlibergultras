import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

interface Segment {
  segment_id: number;
  segment_name: string;
  distance: number;
  start_date: string;
}

interface ActivityMapProps {
  segments: Segment[];
}

export const ActivityMap = ({ segments }: ActivityMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);

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

  // Add segment markers to map
  useEffect(() => {
    if (!map.current || !mapReady || !segments.length) return;

    // For now, just add markers at Uetliberg center for each segment
    // In the future, you can fetch actual segment polylines from Strava API
    segments.forEach((segment, index) => {
      // Create a simple marker for each segment
      const el = document.createElement('div');
      el.className = 'segment-marker';
      el.style.backgroundColor = '#fc4c02';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontSize = '10px';
      el.style.fontWeight = 'bold';
      el.textContent = (index + 1).toString();

      // For demo purposes, place markers in a circle around Uetliberg
      const angle = (index / segments.length) * Math.PI * 2;
      const radius = 0.01; // ~1km radius
      const lng = 8.491 + Math.cos(angle) * radius;
      const lat = 47.349 + Math.sin(angle) * radius;

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            `<div style="padding: 8px;">
              <strong>${segment.segment_name}</strong><br/>
              <span style="color: #666;">${(segment.distance / 1000).toFixed(2)} km</span>
            </div>`
          )
        )
        .addTo(map.current!);
    });
  }, [segments, mapReady]);

  return (
    <div className="relative w-full h-[500px] rounded-lg overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      {!mapReady && (
        <div className="absolute inset-0 bg-muted/50 flex items-center justify-center">
          <div className="text-lg text-muted-foreground">Lade Karte...</div>
        </div>
      )}
    </div>
  );
};
