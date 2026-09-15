/**
 * Phase 12 — SOS contacts CRUD and request.
 * Mirrors: Api\SosController, Api\CommonController
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
function obj(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }

export interface SosContact {
  id: string;
  number: string;
  name: string;
  raw: Record<string, unknown>;
}

export async function fetchSosContacts(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<SosContact[]> {
  const envelope = await client.post<unknown>('/user/sos', {}, { scope: 'user', signal: params?.signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    number: str0(o['number']),
    name: str0(o['name']),
    raw: o,
  }));
}

export async function createSosContact(
  client: ApiClient,
  params: { number: string; name: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string; contact?: SosContact }> {
  const envelope = await client.post<unknown>('/user/sos/create', {
    number: params.number,
    name: params.name,
  }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') {
    return { success: false, message: str0(envelope.message, 'Failed to add contact') };
  }
  const d = obj(envelope.data);
  return {
    success: true,
    message: str0(envelope.message, 'Contact added'),
    contact: { id: str0(d['id']), number: str0(d['number']), name: str0(d['name']), raw: d },
  };
}

export async function deleteSosContact(
  client: ApiClient,
  params: { contactId: string | number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/sos/distory', {
    id: params.contactId,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Failed to delete contact') };
}

export async function sendSosRequest(
  client: ApiClient,
  params: {
    bookingId: string | number;
    for?: string;
    latitude: number | string;
    longitude: number | string;
    application?: string;
    action?: string;
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/sos-request', {
    booking_id: params.bookingId,
    for: params.for ?? 'USER',
    latitude: params.latitude,
    longitude: params.longitude,
    application: params.application ?? 'web',
    action: params.action ?? 'CREATED',
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'SOS request failed') };
}
