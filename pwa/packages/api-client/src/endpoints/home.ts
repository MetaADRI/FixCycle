import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

// ---------------------------------------------------------------------------
// Main screen home: POST /api/v1/user/main-screen
// Source of truth: Api\MainScreenController@mainScreenSegments
//
// The response is an ordered array of "cells". Each cell has a cell_title (the
// holder type), cell_title_text (localized heading) and cell_contents (per-type
// items). Unknown cell_titles must still render as a generic card row — the
// client treats them as opaque data.
// ---------------------------------------------------------------------------

export interface MainScreenCellItem {
  id: string;
  title?: string;
  name?: string;
  image?: string;
  segmentId?: string;
  segmentGroupId?: string;
  segmentSubGroup?: string;
  isComingSoon?: boolean;
  slug?: string;
  raw: Record<string, unknown>;
}

export interface ServiceCellItem extends MainScreenCellItem {
  priceCardOwner?: string;
  multiStore?: boolean;
  isComingSoon: boolean;
  dynamicUrl?: string;
  gradient1?: string;
  gradient2?: string;
  homeScreenImage?: string;
}

export interface BannerCellItem extends MainScreenCellItem {
  action?: string;
  imageWidth?: number;
  imageHeight?: number;
  redirectUrl?: string;
  businessSegmentId?: string;
  isBusinessSegmentOpen?: boolean;
  isAdminBusinessSegmentOpen?: boolean;
  adminStoreTextFromAdmin?: string;
}

export interface BusinessSegmentItem extends MainScreenCellItem {
  businessSegmentId: string;
  title: string;
  time?: string;
  distance?: string;
  rating?: string;
  isBusinessSegmentOpen?: boolean;
  isAdminBusinessSegmentOpen?: boolean;
  adminStoreTextFromAdmin?: string;
  isFavourite?: boolean;
  backgroundGradient?: string;
}

export interface RecommendedServiceItem extends MainScreenCellItem {
  serviceName?: string;
  description?: string;
  isComingSoon: boolean;
  dynamicUrl?: string;
}

export interface AddMoneyItem extends MainScreenCellItem {
  btnText?: string;
  btnColor?: string;
}

export interface MainScreenCell {
  title: string;
  titleText: string;
  icon?: string;
  cellName?: string;
  backgroundGradient?: string;
  contents: MainScreenCellItem[];
  raw: Record<string, unknown>;
}

export interface MainScreenResult {
  cells: MainScreenCell[];
  raw: unknown;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

function pickString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function pickNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function pickBoolean(value: unknown): boolean | undefined {
  return value === true || value === 1 || value === '1';
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseCell(rawCell: Record<string, unknown>): MainScreenCell {
  const contents: MainScreenCellItem[] = [];
  const rawContents = rawCell['cell_contents'];
  if (Array.isArray(rawContents)) {
    for (const entry of rawContents) {
      const parsed = parseItem(entry, rawCell['cell_title']);
      if (parsed) {
        contents.push(parsed);
      }
    }
  }
  return {
    title: pickString(rawCell['cell_title']) ?? '',
    titleText: pickString(rawCell['cell_title_text']) ?? '',
    icon: pickString(rawCell['cell_icon']),
    cellName: pickString(rawCell['cell_name']),
    backgroundGradient: pickString(rawCell['background_color']),
    contents,
    raw: rawCell,
  };
}

function parseItem(entry: unknown, cellTitle: unknown): MainScreenCellItem | undefined {
  if (typeof entry !== 'object' || entry === null) {
    return undefined;
  }
  const record = entry as Record<string, unknown>;
  const base: MainScreenCellItem = {
    id: pickString(record['id']) ?? '',
    title: pickString(record['title']),
    name: pickString(record['name']),
    image: pickString(record['image']),
    segmentId: pickString(record['segment_id']),
    segmentGroupId: pickString(record['segment_group_id']),
    segmentSubGroup: pickString(record['segment_sub_group']),
    isComingSoon: pickBoolean(record['is_coming_soon']),
    slug: pickString(record['slug']),
    raw: record,
  };

  const titleKey = String(cellTitle ?? '').toUpperCase();

  if (titleKey === 'POPULAR_RESTAURANT' || titleKey === 'POPULAR_STORE' ||
      titleKey === 'POPULAR_PHARMACY' || titleKey === 'POPULAR_LAUNDRY') {
    return {
      ...base,
      title: pickString(record['title']),
      businessSegmentId: pickString(record['business_segment_id']) ?? '',
      time: pickString(record['time']),
      distance: pickString(record['distance']),
      rating: pickString(record['rating']),
      isBusinessSegmentOpen: pickBoolean(record['is_business_segment_open']),
      isAdminBusinessSegmentOpen: pickBoolean(record['is_admin_business_segment_open']),
      adminStoreTextFromAdmin: pickString(record['admin_store_text_from_admin']),
      isFavourite: pickBoolean(record['is_favourite']),
      backgroundGradient: pickString(record['background_color']),
      raw: record,
    } as unknown as MainScreenCellItem;
  }

  if (titleKey === 'BANNERS' || titleKey === 'BOTTOM_BANNERS') {
    return {
      ...base,
      action: pickString(record['action']),
      imageWidth: pickNumber(record['image_width']),
      imageHeight: pickNumber(record['image_height']),
      redirectUrl: pickString(record['redirect_url']),
      businessSegmentId: pickString(record['business_segment_id']),
      isBusinessSegmentOpen: pickBoolean(record['is_business_segment_open']),
      isAdminBusinessSegmentOpen: pickBoolean(record['is_admin_business_segment_open']),
      adminStoreTextFromAdmin: pickString(record['admin_store_text_from_admin']),
      raw: record,
    } as unknown as MainScreenCellItem;
  }

  if (titleKey === 'RECOMMENDED_SERVICE') {
    return {
      ...base,
      serviceName: pickString(record['service_name']),
      description: pickString(record['description']),
      isComingSoon: pickBoolean(record['is_coming_soon']) ?? false,
      dynamicUrl: pickString(record['dynamic_url']),
      raw: record,
    } as unknown as MainScreenCellItem;
  }

  if (titleKey === 'ADDMONEY') {
    return {
      ...base,
      btnText: pickString(record['btntext']),
      btnColor: pickString(record['btncolor']),
      raw: record,
    } as unknown as MainScreenCellItem;
  }

  // Service cells (ALL SERVICES, RECENTS, HORIZONTAL_ALL_SERVICES, etc.)
  return {
    ...base,
    priceCardOwner: pickString(record['price_card_owner']),
    multiStore: pickBoolean(record['multi_store']),
    isComingSoon: pickBoolean(record['is_coming_soon']) ?? false,
    dynamicUrl: pickString(record['dynamic_url']),
    gradient1: pickString(record['segment_background_gradient_1']),
    gradient2: pickString(record['segment_background_gradient_2']),
    homeScreenImage: pickString(record['segment_home_screen_image']),
    raw: record,
  } as unknown as MainScreenCellItem;
}

/** Parse the raw main-screen payload (an array of cells) into view models. */
export function parseMainScreen(payload: unknown): MainScreenResult {
  const cells: MainScreenCell[] = [];
  if (Array.isArray(payload)) {
    for (const entry of payload) {
      if (typeof entry === 'object' && entry !== null) {
        cells.push(parseCell(entry as Record<string, unknown>));
      }
    }
  }
  return { cells, raw: payload };
}

// ---------------------------------------------------------------------------
// Fetch main screen
// ---------------------------------------------------------------------------

export interface FetchMainScreenParams {
  latitude: string | number;
  longitude: string | number;
  area?: string | number;
  signal?: AbortSignal;
}

export async function fetchMainScreen(
  client: ApiClient,
  params: FetchMainScreenParams,
): Promise<MainScreenResult> {
  const body: Record<string, unknown> = {
    latitude: params.latitude,
    longitude: params.longitude,
  };
  if (params.area !== undefined) {
    body['area'] = params.area;
  }
  const envelope = await client.post<unknown>('/user/main-screen', body, {
    scope: 'user',
    signal: params.signal,
  });
  return parseMainScreen(envelope.data);
}

/** Verify the schema helper is referenced so the module stays self-contained. */
export function isHomeEnv(envelope: ApiEnvelope<unknown>): boolean {
  return envelope.result === '1';
}
