/**
 * Phase 12 — Saved cards (display only; real payment in Phase 16/LencoPay).
 * Mirrors: Api\CardController@Cards / @DeleteCard
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
function toBool(value: unknown): boolean { return value === true || value === 1 || value === '1'; }

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: string;
  expYear: string;
  maskedNumber: string;
  isDefault: boolean;
  raw: Record<string, unknown>;
}

export async function fetchSavedCards(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<SavedCard[]> {
  const envelope = await client.post<unknown>('/user/cards', {}, { scope: 'user', signal });
  const d = typeof envelope.data === 'object' && envelope.data !== null ? (envelope.data as Record<string, unknown>) : {};
  const list = arr(Array.isArray(d['cards']) ? d['cards'] : envelope.data);
  return list.map((o) => ({
    id: str0(o['card_id'] ?? o['id'] ?? o['card_token']),
    brand: str0(o['brand'] ?? o['card_type']),
    last4: str0(o['last4'] ?? o['last_four']),
    expMonth: str0(o['exp_month'] ?? o['expiry_month']),
    expYear: str0(o['exp_year'] ?? o['expiry_year']),
    maskedNumber: str0(o['card_number'] ?? o['masked_number']),
    isDefault: toBool(o['is_default'] ?? o['default_card']),
    raw: o,
  }));
}

export async function deleteSavedCard(
  client: ApiClient,
  params: { cardId: string | number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/card/delete', {
    card_id: params.cardId,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Delete failed') };
}