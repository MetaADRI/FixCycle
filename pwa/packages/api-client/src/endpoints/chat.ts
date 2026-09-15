/**
 * Phase 12 — Chat with support.
 * Mirrors: Api\ChatController
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }
function obj(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }

export interface ChatMessage {
  id: string;
  senderType: 'USER' | 'ADMIN' | 'DRIVER' | 'STORE';
  message: string;
  senderName: string;
  createdAt: string;
  raw: Record<string, unknown>;
}

export async function fetchChatHistory(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<ChatMessage[]> {
  const envelope = await client.post<unknown>('/user/chat', {}, { scope: 'user', signal: params?.signal });
  const d = dataOf(envelope);
  const list = arr(Array.isArray(d['messages']) ? d['messages'] : envelope.data);
  return list.map((m) => ({
    id: str0(m['id']),
    senderType: (str0(m['sender_type']) as ChatMessage['senderType']) || 'USER',
    message: str0(m['message'] ?? m['text']),
    senderName: str0(m['sender_name']),
    createdAt: str0(m['created_at']),
    raw: m,
  }));
}

export async function sendChatMessage(
  client: ApiClient,
  params: { message: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string; sentMessage?: ChatMessage }> {
  const envelope = await client.post<unknown>('/user/chat/send_message', {
    message: params.message,
  }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') {
    return { success: false, message: str0(envelope.message, 'Send failed') };
  }
  const d = dataOf(envelope);
  return {
    success: true,
    message: str0(envelope.message, 'Sent'),
    sentMessage: {
      id: str0(d['id']),
      senderType: 'USER',
      message: params.message,
      senderName: 'You',
      createdAt: '',
      raw: d,
    },
  };
}