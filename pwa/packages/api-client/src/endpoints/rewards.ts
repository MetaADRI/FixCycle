/**
 * Phase 12 — Rewards: reward points, redeem, gift list, history.
 * Mirrors: Api\UserController, Api\RewardGiftController, Api\CommonController
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

export interface RewardSummary {
  rewardPoints: number;
  usableRewardPoints: number;
  currency: string;
  raw: Record<string, unknown>;
}

export interface RewardGift {
  id: string;
  name: string;
  requiredPoints: number;
  available: boolean;
  image?: string;
  raw: Record<string, unknown>;
}

export interface RewardHistoryItem {
  id: string;
  points: number;
  type: string;
  description: string;
  date: string;
  raw: Record<string, unknown>;
}

export async function fetchRewardPoints(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<RewardSummary> {
  const envelope = await client.post<unknown>('/user/reward-points', {}, { scope: 'user', signal });
  const d = dataOf(envelope);
  return {
    rewardPoints: num0(d['reward_points']),
    usableRewardPoints: num0(d['usable_reward_points']),
    currency: str0(d['currency']),
    raw: d,
  };
}

export async function redeemRewardPoints(
  client: ApiClient,
  params: { rewardPoints: number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/redeem-points', {
    reward_points: params.rewardPoints,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Redeem failed') };
}

export async function fetchRewardGiftList(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<RewardGift[]> {
  const envelope = await client.post<unknown>('/user/reward-gift-list', {}, { scope: 'user', signal });
  const d = dataOf(envelope);
  const list = arr(Array.isArray(d['gifts']) ? d['gifts'] : envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    name: str0(o['gift_name'] ?? o['name']),
    requiredPoints: num0(o['required_points'] ?? o['points']),
    available: toBool(o['available'] ?? o['is_available']),
    image: str(o['image']),
    raw: o,
  }));
}

export async function redeemRewardGift(
  client: ApiClient,
  params: { giftId: string | number; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/redeem-reward-gift', {
    gift_id: params.giftId,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Redeem failed') };
}

export async function fetchRewardHistory(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<RewardHistoryItem[]> {
  const envelope = await client.post<unknown>('/user/reward-history', {}, { scope: 'user', signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    points: num0(o['points']),
    type: str0(o['type'] ?? o['point_type']),
    description: str0(o['description'] ?? o['title']),
    date: str0(o['created_at'] ?? o['date']),
    raw: o,
  }));
}

export async function fetchRedeemedGifts(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<RewardHistoryItem[]> {
  const envelope = await client.post<unknown>('/user/redeemed-rewards', {}, { scope: 'user', signal });
  const list = arr(envelope.data);
  return list.map((o) => ({
    id: str0(o['id']),
    points: num0(o['points']),
    type: str0(o['type'] ?? 'gift'),
    description: str0(o['gift_name'] ?? o['name'] ?? o['description']),
    date: str0(o['redeemed_at'] ?? o['created_at']),
    raw: o,
  }));
}