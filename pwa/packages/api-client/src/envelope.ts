import { z } from 'zod';

export const ENVELOPE_RESULT = {
  SUCCESS: '1',
  FAILURE: '0',
  PENDING: '2',
} as const;

export type EnvelopeResultValue = (typeof ENVELOPE_RESULT)[keyof typeof ENVELOPE_RESULT];

export interface ApiEnvelope<T = unknown> {
  version?: string;
  result: string;
  message?: string;
  data?: T;
  time?: number;
}

export interface ApiEnvelopeSchema {
  version?: string;
  result: string;
  message?: string;
  data: unknown;
  time?: number;
}

const envelopeFields = z.object({
  version: z.string().optional(),
  result: z.coerce.string(),
  message: z.string().optional(),
  data: z.unknown().optional(),
  time: z.number().optional(),
});

export function isApiEnvelope(value: unknown): value is ApiEnvelopeSchema {
  return envelopeFields.safeParse(value).success;
}

export function parseEnvelope(value: unknown): ApiEnvelope<unknown> {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError('API response is not an object');
  }
  const parsed = envelopeFields.safeParse(value);
  if (!parsed.success) {
    throw new TypeError(`API response does not match the Fixcycle envelope: ${parsed.error.message}`);
  }
  return {
    version: parsed.data.version,
    result: parsed.data.result,
    message: parsed.data.message,
    data: parsed.data.data,
    time: parsed.data.time,
  };
}

export function isSuccessResult(value: string): value is '1' {
  return value === ENVELOPE_RESULT.SUCCESS;
}

export function isPendingResult(value: string): value is '2' {
  return value === ENVELOPE_RESULT.PENDING;
}