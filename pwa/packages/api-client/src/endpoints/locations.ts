import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Country areas for the manual location picker
// Source of truth: Api\HomeController@Areas /user/areas
// Returns a list of CountryArea records with id, country_id and AreaName.
// ---------------------------------------------------------------------------

export interface AreaOption {
  id: string;
  countryId?: string;
  name: string;
  raw: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

export function parseAreas(payload: unknown): AreaOption[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const areas: AreaOption[] = [];
  for (const entry of payload) {
    if (!isRecord(entry)) {
      continue;
    }
    const id =
      pickString(entry, 'id') ||
      (typeof entry['id'] === 'number' ? String(entry['id']) : '');
    if (!id) {
      continue;
    }
    const name =
      pickString(entry, 'AreaName') ||
      pickString(entry, 'name') ||
      pickString(entry, 'country_area_name');
    if (!name) {
      continue;
    }
    areas.push({
      id,
      countryId: pickString(entry, 'country_id'),
      name,
      raw: entry,
    });
  }
  return areas;
}

export async function fetchAreas(client: ApiClient, signal?: AbortSignal): Promise<AreaOption[]> {
  const envelope = await client.post<unknown>('/user/areas', {}, { scope: 'user', signal });
  return parseAreas(envelope.data);
}
