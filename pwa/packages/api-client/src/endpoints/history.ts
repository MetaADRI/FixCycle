/**
 * Phase 12 — Booking history, detail, active bookings.
 * Mirrors: Api\BookingHistoryController
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && value.length > 0 ? Number(value) : undefined;
}
function num0(value: unknown, fb = 0): number { return num(value) ?? fb; }
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }
function obj(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }
function toBool(value: unknown): boolean { return value === true || value === 1 || value === '1'; }
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export interface HistoryBooking {
  id: string;
  bookingId: string;
  segmentName: string;
  serviceType: string;
  pickupAddress: string;
  dropAddress: string;
  bookingDate: string;
  bookingStatus: number;
  bookingStatusLabel: string;
  amount: string;
  currency: string;
  driverName: string;
  driverImage?: string;
  vehicleType: string;
  vehicleNumber: string;
  vehicleColor: string;
  rating?: number;
  raw: Record<string, unknown>;
}

export interface HistoryDetail {
  booking: HistoryBooking;
  sos: { id: string; number: string; name: string }[];
  raw: Record<string, unknown>;
}

export interface HistoryPageResult {
  bookings: HistoryBooking[];
  nextPageUrl: string;
  totalPages: number;
  currentPage: number;
}

function parseBooking(o: Record<string, unknown>): HistoryBooking {
  return {
    id: str0(o['id']),
    bookingId: str0(o['id']),
    segmentName: str0(o['segment_name']),
    serviceType: str0(o['service_type'] ?? (isRecord(o['ServiceType']) ? o['ServiceType']['vehicleTypeName'] : '')),
    pickupAddress: str0(o['pickup_address'] ?? o['pickup_location']),
    dropAddress: str0(o['drop_address'] ?? o['drop_location']),
    bookingDate: str0(o['booking_date'] ?? o['created_at']),
    bookingStatus: num0(o['booking_status']),
    bookingStatusLabel: str0(o['booking_status_label']),
    amount: str0(o['total_amount'] ?? o['amount']),
    currency: str0(o['currency']),
    driverName: str0(o['driver_name'] ?? ''),
    driverImage: str(o['driver_image']),
    vehicleType: str0(o['vehicle_type_name'] ?? ''),
    vehicleNumber: str0(o['vehicle_number']),
    vehicleColor: str0(o['vehicle_color']),
    rating: num(o['rating']),
    raw: o,
  };
}

export async function fetchBookingHistory(
  client: ApiClient,
  params: { segmentId: string | number; requestType: string; page?: number; signal?: AbortSignal },
): Promise<HistoryPageResult> {
  const envelope = await client.post<unknown>('/user/booking/history', {
    segment_id: params.segmentId,
    request_type: params.requestType,
    page: params.page ?? 1,
  }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') {
    return { bookings: [], nextPageUrl: '', totalPages: 0, currentPage: 1 };
  }
  const d = dataOf(envelope);
  const list = arr(d['data']);
  return {
    bookings: list.map(parseBooking),
    nextPageUrl: str0((envelope as unknown as Record<string, unknown>)['next_page_url'] as string),
    totalPages: num0((envelope as unknown as Record<string, unknown>)['total_pages']),
    currentPage: num0((envelope as unknown as Record<string, unknown>)['current_page']),
  };
}

export async function fetchBookingDetail(
  client: ApiClient,
  params: { bookingId: string | number; signal?: AbortSignal },
): Promise<HistoryDetail | null> {
  const envelope = await client.post<unknown>('/user/booking/history/detail', {
    booking_id: params.bookingId,
  }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') return null;
  const d = dataOf(envelope);
  const b = obj(d['booking'] ?? d);
  return {
    booking: parseBooking(b),
    sos: arr(b['sos']).map((s) => ({
      id: str0(s['id']),
      number: str0(s['number']),
      name: str0(s['name']),
    })),
    raw: d,
  };
}

export async function fetchActiveBookings(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<HistoryBooking[]> {
  const envelope = await client.post<unknown>('/user/booking/active', {}, { scope: 'user', signal: params?.signal });
  if (envelope.result !== '1') return [];
  const d = dataOf(envelope);
  const list = arr(d['data']);
  return list.map(parseBooking);
}
