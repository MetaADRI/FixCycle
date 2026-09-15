/**
 * Phase 12 — Referral.
 * Mirrors: Api\UserController@Referral → ReferralController@getReferralDetailsForApp
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function obj(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }

export interface ReferralInfo {
  referImage: string;
  referHeading: string;
  referExplanation: string;
  startDate: string;
  endDate: string;
  referCode: string;
  referStatus: string;
  referOffer: string;
  sharingText: string;
  raw: Record<string, unknown>;
}

export async function fetchReferral(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<ReferralInfo> {
  const envelope = await client.post<unknown>('/user/refer', {}, { scope: 'user', signal: params?.signal });
  const d = dataOf(envelope);
  return {
    referImage: str0(d['refer_image']),
    referHeading: str0(d['refer_heading'], 'Refer & Earn'),
    referExplanation: str0(d['refer_explanation']),
    startDate: str0(d['start_date']),
    endDate: str0(d['end_date']),
    referCode: str0(d['refer_code']),
    referStatus: str0(d['refer_status']),
    referOffer: str0(d['refer_offer']),
    sharingText: str0(d['sharing_text']),
    raw: d,
  };
}