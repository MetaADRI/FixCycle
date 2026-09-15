/**
 * Phase 12 — Promotions (offer notifications).
 * Mirrors: Api\UserController@PromotionNotification
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }

export interface PromotionItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  expiryDate: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export async function fetchPromotions(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<PromotionItem[]> {
  const envelope = await client.post<unknown>('/user/promotion/notification', {}, { scope: 'user', signal });
  if (envelope.result !== '1') return [];
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    title: str0(o['title']),
    description: str0(o['description']),
    image: str(o['image']),
    expiryDate: str0(o['expiry_date']),
    createdAt: str0(o['created_at']),
    raw: o,
  }));
}