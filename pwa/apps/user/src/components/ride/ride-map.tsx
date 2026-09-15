'use client';

import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface RideMapMarker {
  id: string;
  kind: 'pickup' | 'drop' | 'stop' | 'driver';
  lat: number;
  lng: number;
  label?: string;
}

export interface RideMapProps {
  center: MapCoordinate;
  zoom?: number;
  markers?: RideMapMarker[];
  polyline?: MapCoordinate[];
  className?: string;
  interactive?: boolean;
  onMapClick?: (coord: MapCoordinate) => void;
  onCenterChange?: (coord: MapCoordinate) => void;
}

const iconColors: Record<RideMapMarker['kind'], string> = {
  pickup: '#16a34a',
  drop: '#dc2626',
  stop: '#f59e0b',
  driver: '#2563eb',
};

export function RideMap({
  center,
  zoom = 15,
  markers = [],
  polyline = [],
  className = '',
  interactive = true,
  onMapClick,
  onCenterChange,
}: RideMapProps): React.ReactNode {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const clickRef = useRef(onMapClick);
  const centerChangeRef = useRef(onCenterChange);
  const markersRef = useRef<RideMapMarker[]>(markers);
  const polylineRef = useRef<MapCoordinate[]>(polyline);
  const centerRef = useRef<MapCoordinate>(center);

  clickRef.current = onMapClick;
  centerChangeRef.current = onCenterChange;
  markersRef.current = markers;
  polylineRef.current = polyline;
  centerRef.current = center;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let map: { remove: () => void } | null = null;

    void (async () => {
      const L = await import('leaflet');
      const mapRef = L.map(container, {
        center: [centerRef.current.lat, centerRef.current.lng],
        zoom,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
        attributionControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapRef);

      if (clickRef.current && interactive) {
        mapRef.on('click', (ev: { latlng: { lat: number; lng: number } }) => {
          clickRef.current?.({ lat: ev.latlng.lat, lng: ev.latlng.lng });
        });
      }

      if (centerChangeRef.current) {
        let movePending = false;
        const emit = (): void => {
          const c = mapRef.getCenter();
          centerChangeRef.current?.({ lat: c.lat, lng: c.lng });
        };
        mapRef.on('moveend', () => {
          if (!movePending) {
            movePending = true;
            window.setTimeout(() => {
              movePending = false;
            }, 0);
          }
          emit();
        });
        mapRef.on('zoomend', emit);
      }

      // Layer group for markers + polyline so we can update them cheaply.
      const overlay = L.layerGroup().addTo(mapRef);

      const markerIcons = (kind: RideMapMarker['kind']): unknown => {
        const color = iconColors[kind];
        const html = `<svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Z"/><circle cx="12" cy="9" r="2.6" fill="#fff"/></svg>`;
        return L.divIcon({ html, className: '', iconSize: [28, 28], iconAnchor: [14, 27] });
      };

      const applyOverlay = (): void => {
        overlay.clearLayers();

        for (const m of markersRef.current) {
          L.marker([m.lat, m.lng], { icon: markerIcons(m.kind) as L.DivIcon })
            .addTo(overlay)
            .bindTooltip(m.label ?? '', { direction: 'top', opacity: 0.85 });
        }

        if (polylineRef.current.length > 1) {
          const ll = polylineRef.current.map((p) => [p.lat, p.lng] as [number, number]);
          L.polyline(ll, {
            color: '#2563eb',
            weight: 4,
            opacity: 0.8,
            lineJoin: 'round',
          }).addTo(overlay);
        }
      };

      applyOverlay();

      map = mapRef as unknown as { remove: () => void };

      return () => {
        disposed = true;
        if (map) map.remove();
      };
    })();

    return () => {
      disposed = true;
      if (map) map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, interactive]);

  return <div ref={containerRef} className={`h-full w-full ${className}`} aria-label="Map" />;
}

export function encodePolyline(points: MapCoordinate[]): string {
  let result = '';
  let prevLat = 0;
  let prevLng = 0;
  const scale = 1e5;
  for (const p of points) {
    const lat = Math.round(p.lat * scale);
    const lng = Math.round(p.lng * scale);
    result += encodeSigned(lat - prevLat);
    result += encodeSigned(lng - prevLng);
    prevLat = lat;
    prevLng = lng;
  }
  return result;
}

function encodeSigned(value: number): string {
  let v = value < 0 ? ~(value << 1) : value << 1;
  let out = '';
  while (v >= 0x20) {
    out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
    v >>= 5;
  }
  out += String.fromCharCode(v + 63);
  return out;
}

export function decodePolyline(encoded: string): MapCoordinate[] {
  const points: MapCoordinate[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;
  const scale = 1e5;
  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;
    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;
    points.push({ lat: lat / scale, lng: lng / scale });
  }
  return points;
}
