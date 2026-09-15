'use client';

import type { LatLng } from '@/lib/polyline';
import { projectPolyline } from '@/lib/polyline';

interface DriverMapProps {
  /** Encoded polyline string from direction-data (raw overview_polyline.points) */
  encodedPolyline?: string;
  driverLocation?: LatLng | null;
  pickupLocation?: LatLng;
  dropLocation?: LatLng;
  height?: number;
}

function toPoints(encoded: string): LatLng[] {
  const decoded: LatLng[] = [];
  if (!encoded) {
    return decoded;
  }
  const OFFSET = 63;
  const CHUNK = 0x1f;
  let i = 0;
  let lat = 0;
  let lng = 0;
  while (i < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;
    do {
      byte = encoded.charCodeAt(i++) - OFFSET;
      result |= (byte & CHUNK) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += ((result & 1) === 1 ? ~(result >> 1) : result >> 1);
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(i++) - OFFSET;
      result |= (byte & CHUNK) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += ((result & 1) === 1 ? ~(result >> 1) : result >> 1);
    decoded.push({ lat: lat * 1e-5, lng: lng * 1e-5 });
  }
  return decoded;
}

function pin(cx: number, cy: number, fill: string, label: string): React.ReactNode {
  return (
    <g key={`${label}-${cx}-${cy}`}>
      <circle cx={cx} cy={cy} r={36} fill={fill} opacity={0.18} />
      <circle cx={cx} cy={cy} r={20} fill={fill} />
      <text x={cx} y={cy + 5} textAnchor="middle" fontSize={18} fontWeight="bold" fill="white">
        {label}
      </text>
    </g>
  );
}

export function DriverMap({
  encodedPolyline,
  driverLocation,
  pickupLocation,
  dropLocation,
  height = 260,
}: DriverMapProps): React.ReactNode {
  const allPoints: LatLng[] = [
    ...(driverLocation ? [driverLocation] : []),
    ...(pickupLocation ? [pickupLocation] : []),
    ...(dropLocation ? [dropLocation] : []),
    ...toPoints(encodedPolyline ?? ''),
  ];
  const projected = projectPolyline(allPoints, 1000, 100);

  const routePoints = toPoints(encodedPolyline ?? '');
  const routeProjected = projectPolyline(routePoints, 1000, 100);
  const routePath = routeProjected
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // Map each known point type back to its projected position
  let driverProj: { x: number; y: number } | undefined;
  let pickupProj: { x: number; y: number } | undefined;
  let dropProj: { x: number; y: number } | undefined;
  if (driverLocation && projected.length > 0) {
    driverProj = projected[0];
  }
  if (pickupLocation && projected.length > (driverLocation ? 1 : 0)) {
    pickupProj = projected[driverLocation ? 1 : 0];
  }
  if (dropLocation && projected.length > (driverLocation ? 1 : 0) + (pickupLocation ? 1 : 0)) {
    dropProj = projected[(driverLocation ? 1 : 0) + (pickupLocation ? 1 : 0)];
  }

  return (
    <svg
      viewBox="0 0 1000 1000"
      className="w-full rounded-2xl bg-[var(--fc-surface-raised)]"
      style={{ height, border: '1px solid var(--fc-border)' }}
      aria-label="Trip map"
    >
      {/* Grid */}
      {Array.from({ length: 11 }).map((_, i) => (
        <g key={`grid-${i}`}>
          <line x1={i * 100} y1={0} x2={i * 100} y2={1000} stroke="var(--fc-border)" strokeWidth={0.8} opacity={0.4} />
          <line x1={0} y1={i * 100} x2={1000} y2={i * 100} stroke="var(--fc-border)" strokeWidth={0.8} opacity={0.4} />
        </g>
      ))}
      {/* Route polyline */}
      {routePath ? (
        <path d={routePath} fill="none" stroke="var(--fc-bg-secondary)" strokeWidth={8} strokeLinecap="round" opacity={0.85} />
      ) : null}
      {/* Markers */}
      {driverProj ? pin(driverProj.x, driverProj.y, '#22c55e', 'D') : null}
      {pickupProj ? pin(pickupProj.x, pickupProj.y, '#287e0a', 'P') : null}
      {dropProj ? pin(dropProj.x, dropProj.y, '#ef4444', 'X') : null}
      {projected.length === 0 ? (
        <text x={500} y={500} textAnchor="middle" fontSize={28} fill="var(--fc-text-secondary)" opacity={0.5}>
          Map preview
        </text>
      ) : null}
    </svg>
  );
}