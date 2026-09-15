/**
 * Phase 12 — Price card (service/vehicle price breakdown by area + segment).
 * Mirrors: Api\CommonController@Pricecard
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }

export interface PriceCardValue {
  parameterPrice: string;
  pricingParameter: string;
  description: string;
  raw: Record<string, unknown>;
}

export interface PriceCardVehicle {
  vehicleTypeName: string;
  vehicleTypeDescription: string;
  vehicleTypeImage?: string;
  priceCardValues: PriceCardValue[];
  raw: Record<string, unknown>;
}

export interface PriceCardService {
  serviceName: string;
  vehicleTypes: PriceCardVehicle[];
  raw: Record<string, unknown>;
}

export async function fetchPriceCard(
  client: ApiClient,
  params: { area: string | number; segmentId: string | number; signal?: AbortSignal },
): Promise<PriceCardService[]> {
  const envelope = await client.post<unknown>('/user/pricecard', {
    area: params.area,
    segment_id: params.segmentId,
  }, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') return [];
  const list = arr(envelope.data);
  return list.map((o) => ({
    serviceName: str0(o['serviceName']),
    vehicleTypes: arr(o['vehicle_type']).map((v) => ({
      vehicleTypeName: str0(v['vehicleTypeName']),
      vehicleTypeDescription: str0(v['vehicleTypeDescription']),
      vehicleTypeImage: str(v['vehicleTypeImage']),
      priceCardValues: arr(v['price_card_values']).map((p) => ({
        parameterPrice: str0(p['parameter_price']),
        pricingParameter: str0(p['pricing_parameter']),
        description: str0(p['description']),
        raw: p,
      })),
      raw: v,
    })),
    raw: o,
  }));
}