import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { decodePolyline } from '@/lib/mapUtils';

interface Segment {
  segment_id: number;
  name: string;
  distance: number;
  avg_grade: number;
  elevation_high: number | null;
  elevation_low: number | null;
  climb_category: number;
  effort_count: number | null;
  priority: string | null;
  distance_to_center: number | null;
  ends_at_uetliberg: boolean | null;
  polyline?: string | null;
  start_latlng?: number[] | null;
  end_latlng?: number[] | null;
}

interface SegmentsMapProps {
  segments: Segment[];
  mapboxToken: string;
  selectedSegmentId?: number | null;
}

const getPriorityColor = (priority: string | null): string => {
  switch (priority) {
    case 'high':
      return '#2563eb'; // blue - high contrast on outdoor maps
    case 'medium':
      return '#9333ea'; // violet - rarely appears on maps
    case 'low':
      return '#ea580c'; // orange - distinct from red marker
    default:
      return '#6b7280'; // gray
  }
};

const formatDistance = (meters: number): string => {
  return (meters / 1000).toFixed(2) + ' km';
};

export function SegmentsMap({ segments, mapboxToken, selectedSegmentId }: SegmentsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [8.4920, 47.3495], // Uetliberg
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoading(false);
      setMapLoaded(true);

      // Add segments as sources and layers
      segments.forEach((segment) => {
        if (!segment.polyline || !map.current) return;

        try {
          const coordinates = decodePolyline(segment.polyline);
          if (coordinates.length < 2) return;

          const sourceId = `segment-${segment.segment_id}`;
          const layerId = `segment-line-${segment.segment_id}`;
          const color = getPriorityColor(segment.priority);

          map.current.addSource(sourceId, {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {
                id: segment.segment_id,
                name: segment.name,
                distance: segment.distance,
                avg_grade: segment.avg_grade,
                priority: segment.priority,
                ends_at_uetliberg: segment.ends_at_uetliberg,
              },
              geometry: {
                type: 'LineString',
                coordinates,
              },
            },
          });

          const outlineLayerId = `segment-outline-${segment.segment_id}`;

          // White outline layer (behind the colored line)
          map.current.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#ffffff',
              'line-width': 7,
              'line-opacity': 0.9,
            },
          });

          // Colored line layer (on top)
          map.current.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': color,
              'line-width': 4,
              'line-opacity': 1,
            },
          });

          // Hover effect on both layers
          map.current.on('mouseenter', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = 'pointer';
              map.current.setPaintProperty(layerId, 'line-width', 6);
              map.current.setPaintProperty(outlineLayerId, 'line-width', 9);
            }
          });

          map.current.on('mouseleave', layerId, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
              map.current.setPaintProperty(layerId, 'line-width', 4);
              map.current.setPaintProperty(outlineLayerId, 'line-width', 7);
            }
          });

          // Click popup
          map.current.on('click', layerId, (e) => {
            if (!map.current) return;

            // Close existing popup
            if (popupRef.current) {
              popupRef.current.remove();
            }

            const priorityLabel =
              segment.priority === 'high'
                ? 'Hoch'
                : segment.priority === 'medium'
                ? 'Mittel'
                : 'Niedrig';

            const popupContent = `
              <div class="p-2">
                <h3 class="font-semibold text-sm mb-1">${segment.name}</h3>
                <p class="text-xs text-gray-600 mb-1">
                  ${formatDistance(segment.distance)} · ${segment.avg_grade?.toFixed(1) ?? 0}%
                </p>
                <p class="text-xs mb-2">
                  <span class="inline-block px-1.5 py-0.5 rounded text-white text-xs" style="background-color: ${color}">
                    ${priorityLabel}
                  </span>
                  ${segment.ends_at_uetliberg ? '<span class="ml-1 text-gray-500">📍 Uetliberg</span>' : ''}
                </p>
                <a 
                  href="https://www.strava.com/segments/${segment.segment_id}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="text-xs text-orange-600 hover:underline"
                >
                  Auf Strava öffnen →
                </a>
              </div>
            `;

            popupRef.current = new mapboxgl.Popup({
              closeButton: true,
              closeOnClick: true,
              maxWidth: '250px',
            })
              .setLngLat(e.lngLat)
              .setHTML(popupContent)
              .addTo(map.current);
          });
        } catch (error) {
          console.error(`Error adding segment ${segment.segment_id}:`, error);
        }
      });

      // Add Uetliberg marker
      new mapboxgl.Marker({ color: '#ef4444' })
        .setLngLat([8.4920, 47.3495])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(
            '<div class="p-2"><strong>Uetliberg</strong><br/>871 m</div>'
          )
        )
        .addTo(map.current);
    });

    return () => {
      if (popupRef.current) {
        popupRef.current.remove();
      }
      if (map.current) {
        map.current.remove();
      }
    };
  }, [segments, mapboxToken]);

  // Effect to zoom to selected segment
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedSegmentId) return;

    const segment = segments.find(s => s.segment_id === selectedSegmentId);
    if (!segment?.polyline) return;

    try {
      const coordinates = decodePolyline(segment.polyline);
      if (coordinates.length < 2) return;

      // Calculate bounds
      const bounds = coordinates.reduce(
        (acc, coord) => ({
          minLng: Math.min(acc.minLng, coord[0]),
          maxLng: Math.max(acc.maxLng, coord[0]),
          minLat: Math.min(acc.minLat, coord[1]),
          maxLat: Math.max(acc.maxLat, coord[1]),
        }),
        { minLng: Infinity, maxLng: -Infinity, minLat: Infinity, maxLat: -Infinity }
      );

      // Fly to segment
      map.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat],
        ],
        { padding: 100, duration: 1000, maxZoom: 15 }
      );

      // Highlight the segment
      const layerId = `segment-line-${selectedSegmentId}`;
      const outlineLayerId = `segment-outline-${selectedSegmentId}`;
      
      // Reset all segments first
      segments.forEach(s => {
        const lid = `segment-line-${s.segment_id}`;
        const olid = `segment-outline-${s.segment_id}`;
        if (map.current?.getLayer(lid)) {
          map.current.setPaintProperty(lid, 'line-width', 4);
        }
        if (map.current?.getLayer(olid)) {
          map.current.setPaintProperty(olid, 'line-width', 7);
        }
      });

      // Highlight selected
      if (map.current.getLayer(layerId)) {
        map.current.setPaintProperty(layerId, 'line-width', 8);
      }
      if (map.current.getLayer(outlineLayerId)) {
        map.current.setPaintProperty(outlineLayerId, 'line-width', 12);
      }

      // Show popup
      if (popupRef.current) {
        popupRef.current.remove();
      }

      const midIndex = Math.floor(coordinates.length / 2);
      const midPoint = coordinates[midIndex];
      const color = getPriorityColor(segment.priority);
      const priorityLabel =
        segment.priority === 'high'
          ? 'Hoch'
          : segment.priority === 'medium'
          ? 'Mittel'
          : 'Niedrig';

      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">${segment.name}</h3>
          <p class="text-xs text-gray-600 mb-1">
            ${formatDistance(segment.distance)} · ${segment.avg_grade?.toFixed(1) ?? 0}%
          </p>
          <p class="text-xs mb-2">
            <span class="inline-block px-1.5 py-0.5 rounded text-white text-xs" style="background-color: ${color}">
              ${priorityLabel}
            </span>
            ${segment.ends_at_uetliberg ? '<span class="ml-1 text-gray-500">📍 Uetliberg</span>' : ''}
          </p>
          <a 
            href="https://www.strava.com/segments/${segment.segment_id}" 
            target="_blank" 
            rel="noopener noreferrer"
            class="text-xs text-orange-600 hover:underline"
          >
            Auf Strava öffnen →
          </a>
        </div>
      `;

      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '250px',
      })
        .setLngLat([midPoint[0], midPoint[1]])
        .setHTML(popupContent)
        .addTo(map.current);
    } catch (error) {
      console.error('Error zooming to segment:', error);
    }
  }, [selectedSegmentId, mapLoaded, segments]);

  if (!mapboxToken) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Mapbox Token nicht konfiguriert</p>
      </Card>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/50 rounded-lg">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      <div
        ref={mapContainer}
        className="w-full h-[500px] sm:h-[600px] rounded-lg overflow-hidden border"
      />
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded shadow-sm" style={{ backgroundColor: '#2563eb', boxShadow: '0 0 0 1px white' }} />
          <span>Hohe Priorität</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded shadow-sm" style={{ backgroundColor: '#9333ea', boxShadow: '0 0 0 1px white' }} />
          <span>Mittlere Priorität</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 rounded shadow-sm" style={{ backgroundColor: '#ea580c', boxShadow: '0 0 0 1px white' }} />
          <span>Niedrige Priorität</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
          <span>Uetliberg</span>
        </div>
      </div>
    </div>
  );
}
