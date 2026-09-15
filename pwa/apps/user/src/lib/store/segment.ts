import type { StoreSlug } from '@fixcycle/api-client';

// Map home service segment_id -> store slug for the store ordering engine.
const SEGMENT_SLUG: Record<string, StoreSlug> = {
  '3': 'grocery',
  '4': 'pharmacy',
  '5': 'store',
};

export function segmentSlug(segmentId: string | number | undefined, fallback: StoreSlug = 'grocery'): StoreSlug {
  if (segmentId === undefined || segmentId === null || segmentId === '') return fallback;
  const s = String(segmentId);
  return SEGMENT_SLUG[s] ?? fallback;
}

export function segmentTitleSlug(slug: StoreSlug): StoreSlug {
  return slug;
}
