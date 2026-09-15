/**
 * Phase 12 — Favourite drivers, locations.
 * Mirrors: Api\UserController, Api\CommonController
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function num0(value: unknown, fb = 0): number {
  return typeof value === 'number' ? value : typeof value === 'string' && value.length > 0 ? Number(value) ?? fb : fb;
}
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return typeof envelope.data === 'object' && envelope.data !== null ? (envelope.data as Record<string, unknown>) : {}; }

export interface FavouriteDriver {
  driverId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  rating?: string;
  profileImage?: string;
  raw: Record<string, unknown>;
}

export interface FavouriteLocation {
  id: string;
  locationName: string;
  address: string;
  latitude: number;
  longitude: number;
  raw: Record<string, unknown>;
}

export async function fetchFavouriteDrivers(
  client: ApiClient,
  params: { segmentId: string | number; signal?: AbortSignal },
): Promise<FavouriteDriver[]> {
  const envelope = await client.post<unknown>('/user/get-favourite-driver', {
    segment_id: params.segmentId,
  }, { scope: 'user', signal: params.signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    driverId: str0(o['driver_id']),
    firstName: str0(o['first_name']),
    lastName: str0(o['last_name']),
    phoneNumber: str0(o['phone_number']),
    rating: str(o['rating']),
    profileImage: str(o['profile_image']),
    raw: o,
  }));
}

export async function toggleFavouriteDriver(
  client: ApiClient,
  params: { driverId: number; segmentId: number; action: 1 | 2; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/favourite-driver', {
    driver_id: params.driverId,
    segment_id: params.segmentId,
    action: params.action,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Update failed') };
}

export async function fetchFavouriteLocations(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<FavouriteLocation[]> {
  const envelope = await client.post<unknown>('/user/get-favourite-location', {}, { scope: 'user', signal });
  const d = dataOf(envelope);
  const list = arr(Array.isArray(d['locations']) ? d['locations'] : envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    locationName: str0(o['location_name'] ?? o['name']),
    address: str0(o['address']),
    latitude: num0(o['latitude']),
    longitude: num0(o['longitude']),
    raw: o,
  }));
}

export async function addFavouriteLocation(
  client: ApiClient,
  params: {
    locationName?: string;
    address?: string;
    latitude: number | string;
    longitude: number | string;
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/add-favourite-location', {
    location_name: params.locationName ?? '',
    address: params.address ?? '',
    latitude: params.latitude,
    longitude: params.longitude,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Save failed') };
}

export async function deleteFavouriteLocation(
  client: ApiClient,
  params: { locationId: string | number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/delete-favourite-location', {
    favourite_location_id: params.locationId,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Delete failed') };
}