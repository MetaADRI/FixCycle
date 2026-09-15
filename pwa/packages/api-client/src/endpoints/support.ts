/**
 * Phase 12 — Customer support conversation.
 * Mirrors: Api\CommonController@Customer_Support
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str0(value: unknown, fb = ''): string { return typeof value === 'string' && value.length > 0 ? value : fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }

export interface SupportThread {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export interface SupportChannel {
  id: string;
  name: string;
  value: string;
  raw: Record<string, unknown>;
}

export async function fetchSupportThreads(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<SupportThread[]> {
  const envelope = await client.post<unknown>('/user/customer_support', {}, { scope: 'user', signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    subject: str0(o['subject']),
    message: str0(o['message']),
    status: str0(o['status']),
    createdAt: str0(o['created_at']),
    raw: o,
  }));
}

export async function sendSupportMessage(
  client: ApiClient,
  params: { subject?: string; message: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/customer_support', {
    subject: params.subject ?? 'Support',
    message: params.message,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Send failed') };
}

export async function fetchSupportChannels(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<SupportChannel[]> {
  const envelope = await client.post<unknown>('/user/customer_support/channels', {}, { scope: 'user', signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    name: str0(o['name']),
    value: str0(o['value'] ?? o['contact']),
    raw: o,
  }));
}