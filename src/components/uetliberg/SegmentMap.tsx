import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { SegmentData, decodePolyline, getDifficultyLevel, getDifficultyColor } from '@/lib/mapUtils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface SegmentMapProps {
  segments?: SegmentData[];
  isLoading?: boolean;
  selectedSegmentId?: number | null;
  onSegmentClick?: (segment: SegmentData) => void;
}

export const SegmentMap = ({ segments = [], isLoading, selectedSegmentId, onSegmentClick }: SegmentMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>(() => {
    return localStorage.getItem('mapbox_token') || '';
  });
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(!mapboxToken);

  const handleTokenSubmit = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
      setShowTokenPrompt(false);
    }
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
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
      console.log('Map loaded');
      setMapReady(true);
    });

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken]);

  // Add segments to map
  useEffect(() => {
    if (!map.current || !mapReady || !segments.length) return;

    // Remove existing layers and sources
    if (map.current.getLayer('segments')) {
      map.current.removeLayer('segments');
    }
    if (map.current.getSource('segments')) {
      map.current.removeSource('segments');
    }

    const features = segments.map((segment) => {
      const coordinates = decodePolyline(segment.polyline);
      const difficulty = getDifficultyLevel(segment.avg_grade);
      const color = getDifficultyColor(difficulty);

      return {
        type: 'Feature' as const,
        properties: {
          id: segment.id,
          name: segment.name,
          color,
        },
        geometry: {
          type: 'LineString' as const,
          coordinates,
        },
      };
    });

    map.current.addSource('segments', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features,
      },
    });

    map.current.addLayer({
      id: 'segments',
      type: 'line',
      source: 'segments',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 4,
        'line-opacity': 0.8,
      },
    });

    // Add click handler
    map.current.on('click', 'segments', (e) => {
      if (!e.features || !e.features[0]) return;
      const segmentId = e.features[0].properties?.id;
      const segment = segments.find((s) => s.id === segmentId);
      if (segment && onSegmentClick) {
        onSegmentClick(segment);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'segments', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });

    map.current.on('mouseleave', 'segments', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });
  }, [segments, mapReady, onSegmentClick]);

  // Highlight selected segment
  useEffect(() => {
    if (!map.current || !mapReady || !selectedSegmentId) return;

    const segment = segments.find((s) => s.id === selectedSegmentId);
    if (!segment) return;

    const coordinates = decodePolyline(segment.polyline);
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord as [number, number]);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

    map.current.fitBounds(bounds, { padding: 100, duration: 1000 });
  }, [selectedSegmentId, segments, mapReady]);

  return (
    <div className="relative w-full h-full min-h-[500px]">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {showTokenPrompt && (
        <div className="absolute inset-0 bg-background/95 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Mapbox Token erforderlich</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bitte gib deinen Mapbox Public Access Token ein. Du findest ihn in deinem Mapbox-Dashboard unter{' '}
                <a 
                  href="https://account.mapbox.com/access-tokens/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  account.mapbox.com/access-tokens
                </a>
              </p>
            </div>
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTokenSubmit()}
            />
            <Button onClick={handleTokenSubmit} className="w-full">
              Token speichern
            </Button>
          </Card>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="text-lg">Lade Segmente...</div>
        </div>
      )}
      {!isLoading && segments.length === 0 && !showTokenPrompt && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="text-lg">Keine Segmente gefunden</div>
        </div>
      )}
    </div>
  );
};
