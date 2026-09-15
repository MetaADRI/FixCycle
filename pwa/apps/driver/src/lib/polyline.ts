export interface LatLng {
  lat: number;
  lng: number;
}

const OFFSET = 63;
const SHIFT = 5;
const CHUNK = 0x1f;

// Decodes a Google encoded polyline string into lat/lng pairs.
export function decodePolyline(encoded: string): LatLng[] {
  if (!encoded || encoded.length === 0) {
    return [];
  }
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;
  while (index < encoded.length) {
    const latBits = decodeChunk(encoded, index);
    index = latBits.index;
    lat += latBits.value;
    const lngBits = decodeChunk(encoded, index);
    index = lngBits.index;
    lng += lngBits.value;
    points.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return points;
}

function decodeChunk(encoded: string, index: number): { value: number; index: number } {
  let result = 0;
  let shift = 0;
  let byte = 0;
  do {
    byte = encoded.charCodeAt(index++) - OFFSET;
    result |= (byte & CHUNK) << shift;
    shift += SHIFT;
  } while (byte >= 0x20);
  const inverted = (result & 1) === 1;
  const value = inverted ? ~(result >> 1) : result >> 1;
  return { value, index };
}

export function haversineMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Projects decoded points onto a viewBox grid (0..1000) with uniform padding
// so an SVG map can draw them without a geo library.
export function projectPolyline(points: LatLng[], box = 1000, padding = 80): { x: number; y: number }[] {
  if (points.length === 0) {
    return [];
  }
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLng = Math.max(maxLng - minLng, 1e-6);
  const usable = box - padding * 2;
  return points.map((p) => ({
    x: padding + ((p.lng - minLng) / spanLng) * usable,
    y: padding + (1 - (p.lat - minLat) / spanLat) * usable,
  }));
}

export function svgPath(points: LatLng[], box = 1000): string {
  const projected = projectPolyline(points, box);
  if (projected.length === 0) {
    return '';
  }
  return projected
    .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');
}