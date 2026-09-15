import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Place search for the location picker
// Source of truth: Api\CommonController@searchPlaces (/user-free? no — user/search/places)
//
// POST /api/v1/user/search/places { keyword, language, location, for: USER }
// returns [{ keyword, google_response: Place[] }] where each Place is a
// Google Places autocomplete result.
// ---------------------------------------------------------------------------

export interface PlaceOption {
  /** Google place_id when available */
  id?: string;
  mainText?: string;
  secondaryText?: string;
  description?: string;
  placeId?: string;
  latitude?: string | number;
  longitude?: string | number;
  raw: Record<string, unknown>;
}

export interface PlaceSearchResult {
  keyword: string;
  places: PlaceOption[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function pickNumber(value: unknown): string | number | undefined {
  if (typeof value === 'number' || typeof value === 'string') {
    return value;
  }
  return undefined;
}

function parsePlace(value: unknown): PlaceOption | undefined {
  if (!isRecord(value)) {
    return undefined;
  }
  // Google autocomplete fields are nested under an inner structure.
  const structured = value['structured_formatting'];
  const geometry = value['geometry'];
  const location = geometry && isRecord(geometry) ? geometry['location'] : undefined;
  return {
    id: pickString(value, 'place_id') || pickString(value, 'id'),
    mainText:
      (structured && isRecord(structured) ? pickString(structured, 'main_text') : '') ||
      pickString(value, 'description') ||
      pickString(value, 'name'),
    secondaryText: structured && isRecord(structured) ? pickString(structured, 'secondary_text') : '',
    description: pickString(value, 'description') || pickString(value, 'name'),
    placeId: pickString(value, 'place_id'),
    latitude: location && isRecord(location) ? pickNumber(location['lat']) : undefined,
    longitude: location && isRecord(location) ? pickNumber(location['lng']) : undefined,
    raw: value,
  };
}

export function parsePlaceSearch(payload: unknown): PlaceSearchResult[] {
  const results: PlaceSearchResult[] = [];
  if (!Array.isArray(payload)) {
    return results;
  }
  for (const entry of payload) {
    if (!isRecord(entry)) {
      continue;
    }
    const keyword = pickString(entry, 'keyword');
    const googleResponse = entry['google_response'];
    const places: PlaceOption[] = [];
    if (Array.isArray(googleResponse)) {
      for (const item of googleResponse) {
        const parsed = parsePlace(item);
        if (parsed) {
          places.push(parsed);
        }
      }
    }
    if (places.length > 0) {
      results.push({ keyword, places });
    }
  }
  return results;
}

export interface SearchPlacesParams {
  keyword: string;
  location: string;
  language?: string;
}

export async function searchPlaces(
  client: ApiClient,
  params: SearchPlacesParams,
  signal?: AbortSignal,
): Promise<PlaceSearchResult[]> {
  const envelope = await client.post<unknown>(
    '/user/search/places',
    {
      keyword: params.keyword,
      language: params.language ?? client.locale,
      location: params.location,
      for: 'USER',
    },
    { scope: 'user', signal },
  );
  return parsePlaceSearch(envelope.data);
}
