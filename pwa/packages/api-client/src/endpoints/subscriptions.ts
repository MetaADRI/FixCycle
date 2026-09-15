/**
 * Phase 12 — Subscriptions: package list, activate, history, active.
 * Mirrors: Api\SubscriptionPackageController
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

export interface SubscriptionPackage {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  durationLabel: string;
  features: string[];
  active: boolean;
  paymentMethods: { id: number; name: string; raw: Record<string, unknown> }[];
  raw: Record<string, unknown>;
}

function parsePackage(o: Record<string, unknown>): SubscriptionPackage {
  return {
    id: str0(o['id']),
    title: str0(o['title'] ?? o['package_name']),
    description: str0(o['description']),
    price: str0(o['price'] ?? o['amount']),
    currency: str0(o['currency']),
    durationLabel: str0(o['duration_label'] ?? o['valid_for']),
    features: Array.isArray(o['features']) ? (o['features'] as string[]) : [],
    active: toBool(o['is_active'] ?? o['active']),
    paymentMethods: arr(o['payment_methods']).map((p) => ({
      id: num0(p['id']),
      name: str0(p['name']),
      raw: p,
    })),
    raw: o,
  };
}

export async function fetchSubscriptionPackages(
  client: ApiClient,
  params?: { segmentId?: string | number; vehicleTypeId?: string | number; signal?: AbortSignal },
): Promise<SubscriptionPackage[]> {
  const body: Record<string, unknown> = {};
  if (params?.segmentId) body['segment_id'] = params.segmentId;
  if (params?.vehicleTypeId) body['vehicle_type_id'] = params.vehicleTypeId;
  const envelope = await client.post<unknown>('/user/get-subscriptions-list', body, { scope: 'user', signal: params?.signal });
  const list = arr(envelope.data);
  return list.map(parsePackage);
}

export async function fetchSubscriptionHistory(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<SubscriptionPackage[]> {
  const envelope = await client.post<unknown>('/user/get-subscriptions-history', {}, { scope: 'user', signal: params?.signal });
  const list = arr(envelope.data);
  return list.map(parsePackage);
}

export async function fetchActiveSubscription(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<SubscriptionPackage | null> {
  const envelope = await client.post<unknown>('/user/get-active-subscription', {}, { scope: 'user', signal: params?.signal });
  if (envelope.result !== '1') return null;
  const d = dataOf(envelope);
  return parsePackage(d['package'] as Record<string, unknown> ?? d);
}

export async function activateSubscription(
  client: ApiClient,
  params: { packageId: string | number; paymentMethodId?: string | number; paymentStatus?: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = { subscription_package_id: params.packageId };
  if (params.paymentMethodId) body['payment_method_id'] = params.paymentMethodId;
  if (params.paymentStatus) body['payment_status'] = params.paymentStatus;
  const envelope = await client.post<unknown>('/user/activate-subscription-package', body, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Activation failed') };
}