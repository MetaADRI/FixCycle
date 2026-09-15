/**
 * Phase 12 — Family / child members.
 * Mirrors: Api\UserController (AddFamilyMember / DeleteFamilyMember / ListFamilyMember)
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

export interface FamilyMember {
  id: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  raw: Record<string, unknown>;
}

function parseMember(o: Record<string, unknown>): FamilyMember {
  return {
    id: str0(o['id']),
    name: str0(o['name'] ?? o['UserName']),
    phone: str0(o['phone'] ?? o['UserPhone']),
    email: str0(o['email']),
    relationship: str0(o['relation'] ?? o['relationship']),
    raw: o,
  };
}

export async function fetchFamilyMembers(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<FamilyMember[]> {
  const envelope = await client.post<unknown>('/user/ListFamilyMember', {}, { scope: 'user', signal });
  const d = dataOf(envelope);
  const list = arr(Array.isArray(d['members']) ? d['members'] : envelope.data);
  return list.map(parseMember);
}

export async function addFamilyMember(
  client: ApiClient,
  params: {
    name: string;
    phone: string;
    email?: string;
    relationship?: string;
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; message: string; member?: FamilyMember }> {
  const body: Record<string, unknown> = {
    name: params.name,
    phone: params.phone,
  };
  if (params.email) body['email'] = params.email;
  if (params.relationship) body['relation'] = params.relationship;
  const envelope = await client.post<unknown>('/user/AddFamilyMember', body, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') {
    return { success: false, message: str0(envelope.message, 'Failed to add member') };
  }
  return {
    success: true,
    message: str0(envelope.message, 'Member added'),
    member: parseMember({ id: str0(dataOf(envelope)['id']), name: params.name, phone: params.phone, email: params.email ?? '', relation: params.relationship ?? '' }),
  };
}

export async function deleteFamilyMember(
  client: ApiClient,
  params: { memberId: string | number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/DeleteFamilyMember', {
    id: params.memberId,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Delete failed') };
}