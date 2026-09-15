import type { ApiClient } from '../client';

// ---------------------------------------------------------------------------
// Navigation drawer
// Source of truth: Api\NavigationDrawerController
//
//  - /get-navigation-drawer        -> { id, name, merchant_id, config, menu_options }
//  - /get-navigation-drawer-config -> { drawer_backgroud, data[], logout_button }
// Both require request_for = USER|DRIVER. They live on the merchant group
// (merchant public/secret key headers authenticate them; no user token).
// ---------------------------------------------------------------------------

export const DRAWER_HEADER = 'DRAWER_HEADER';
export const DRAWER_ITEMS_TILE = 'DRAWER_ITEMS_TILE';

export interface DrawerMenuOptions {
  [slug: string]: string;
}

export interface NavigationDrawer {
  id: string;
  name: string;
  merchantId: string;
  config: unknown;
  menuOptions: DrawerMenuOptions;
}

export interface DrawerHeaderDefinition {
  title?: string;
  secondary_text?: string;
  image?: string;
  background_color?: string;
  text_color?: string;
  secondary_text_color?: string;
}

export interface DrawerItemDefinition {
  uid?: string;
  type?: string;
  icon?: string;
  title?: string;
  text_color?: string;
  icon_color?: string;
  background_color?: string;
  screen_data?: string;
  screen_name?: string;
  subMenu?: unknown;
  toShowSubMenu?: boolean;
  subMenutype?: string;
}

export type DrawerEntry =
  | { drawerName: typeof DRAWER_HEADER; definition: DrawerHeaderDefinition }
  | { drawerName: typeof DRAWER_ITEMS_TILE; definition: DrawerItemDefinition };

export interface NavigationDrawerConfig {
  background: string;
  entries: DrawerEntry[];
  logoutButton: Record<string, unknown> | null;
}

export interface LogoutButtonDefinition {
  background_color?: string;
  text_color?: string;
  text_size?: string;
  logout_icon?: string;
  icon_size?: string;
  icon_color?: string;
  button_text?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pickString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

// ---------------------------------------------------------------------------
// /get-navigation-drawer
// ---------------------------------------------------------------------------

export interface FetchNavigationDrawerParams {
  requestFor?: 'USER' | 'DRIVER';
}

export async function fetchNavigationDrawer(
  client: ApiClient,
  params: FetchNavigationDrawerParams = {},
): Promise<NavigationDrawer> {
  const requestFor = params.requestFor ?? 'USER';
  const envelope = await client.post<Record<string, unknown>>('/get-navigation-drawer', {
    request_for: requestFor,
  });
  const data = envelope.data;
  if (!isRecord(data)) {
    throw new Error('API response for /get-navigation-drawer did not include data');
  }
  const menuOptions: DrawerMenuOptions = {};
  const rawMenu = data['menu_options'];
  if (isRecord(rawMenu)) {
    for (const [key, value] of Object.entries(rawMenu)) {
      if (typeof value === 'string' || typeof value === 'number') {
        menuOptions[key] = String(value);
      }
    }
  }
  return {
    id: pickString(data, 'id'),
    name: pickString(data, 'name'),
    merchantId: String(data['merchant_id'] ?? ''),
    config: data['config'],
    menuOptions,
  };
}

// ---------------------------------------------------------------------------
// /get-navigation-drawer-config
// ---------------------------------------------------------------------------

export async function fetchNavigationDrawerConfig(
  client: ApiClient,
  params: FetchNavigationDrawerParams = {},
): Promise<NavigationDrawerConfig | null> {
  const requestFor = params.requestFor ?? 'USER';
  const envelope = await client.post<Record<string, unknown>>('/get-navigation-drawer-config', {
    request_for: requestFor,
  });
  const data = envelope.data;
  if (!isRecord(data)) {
    return null;
  }
  const entries: DrawerEntry[] = [];
  const rawEntries = data['data'];
  if (Array.isArray(rawEntries)) {
    for (const entry of rawEntries) {
      if (!isRecord(entry)) {
        continue;
      }
      const drawerName = pickString(entry, 'drawer_name') as DrawerEntry['drawerName'];
      const definition = entry['drawer_definition'];
      if (!isRecord(definition)) {
        continue;
      }
      if (drawerName === DRAWER_HEADER) {
        const header = definition as DrawerHeaderDefinition;
        entries.push({ drawerName, definition: header });
      } else {
        const item = definition as DrawerItemDefinition;
        entries.push({ drawerName: DRAWER_ITEMS_TILE, definition: item });
      }
    }
  }
  const logout = data['logout_button'];
  return {
    background: pickString(data, 'drawer_backgroud'),
    entries,
    logoutButton: isRecord(logout) ? (logout as Record<string, unknown>) : null,
  };
}
