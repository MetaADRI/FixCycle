'use client';

import type { CSSProperties, ReactNode } from 'react';

import type { DrawerEntry, DrawerItemDefinition, LogoutButtonDefinition, NavigationDrawerConfig } from '@fixcycle/api-client';
import { Icon, serviceIconFor } from '@fixcycle/ui';
import type { IconName } from '@fixcycle/ui';

import { t } from '@/lib/i18n';

export interface DrawerProps {
  open: boolean;
  config: NavigationDrawerConfig | null;
  userName: string;
  userInitials: string;
  onNavigate: (screenName: string) => void;
  onLogout: () => void;
  onClose: () => void;
  locale?: string;
}

function drawerTitle(entry: DrawerEntry): string {
  if (entry.drawerName !== 'DRAWER_ITEMS_TILE') {
    return '';
  }
  const def = entry.definition as DrawerItemDefinition;
  return def.title?.trim() ?? '';
}

function drawerIcon(entry: DrawerEntry): string {
  if (entry.drawerName !== 'DRAWER_ITEMS_TILE') {
    return '';
  }
  const def = entry.definition as DrawerItemDefinition;
  return def.icon?.trim() ?? '';
}

function screenName(entry: DrawerEntry): string {
  if (entry.drawerName !== 'DRAWER_ITEMS_TILE') {
    return '';
  }
  const def = entry.definition as DrawerItemDefinition;
  return def.screen_name?.trim() ?? def.screen_data?.trim() ?? '';
}

export function Drawer({
  open,
  config,
  userName,
  userInitials,
  onNavigate,
  onLogout,
  onClose,
  locale = 'en',
}: DrawerProps): ReactNode {
  if (!open) {
    return null;
  }

  const background = config?.background?.trim() || '';
  const headerEntry = config?.entries.find((entry) => entry.drawerName === 'DRAWER_HEADER');
  const headerDef = headerEntry && headerEntry.drawerName === 'DRAWER_HEADER' ? headerEntry.definition : undefined;
  const headerImage = headerDef?.image;
  const textColor = headerDef?.text_color || '';
  const secondaryColor = headerDef?.secondary_text_color || '';

  const items = (config?.entries ?? []).filter((entry) => entry.drawerName === 'DRAWER_ITEMS_TILE');
  const navItems = items.filter((entry) => screenName(entry).length > 0);
  const noRouteItems = items.filter((entry) => screenName(entry).length === 0);

  const logout: LogoutButtonDefinition | null =
    config?.logoutButton != null ? (config.logoutButton as LogoutButtonDefinition) : null;
  const logoutColor = logout?.background_color || '';

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button type="button" aria-label={t('drawer.close', locale)} className="absolute inset-0 bg-[var(--fc-overlay)]" onClick={onClose} />
      <aside
        className="absolute left-0 top-0 flex h-full w-[82%] max-w-[360px] flex-col shadow-2xl"
        style={background ? ({ backgroundColor: background } as CSSProperties) : undefined}
      >
        {/* Header */}
        <div
          className="flex flex-col gap-2 px-4 pb-4 pt-6"
          style={{
            backgroundColor: headerDef?.background_color || 'var(--fc-bg-secondary)',
            color: textColor || '#ffffff',
          }}
        >
          {headerImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={headerImage} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-base font-bold" style={{ color: textColor || 'var(--fc-bg-secondary)' }}>
              {userInitials || '·'}
            </span>
          )}
          <div className="flex items-center gap-1.5" style={{ color: secondaryColor || 'inherit', opacity: 0.85 }}>
            <Icon name="user" size={15} />
            <span className="truncate text-sm font-semibold" style={{ color: textColor || '#ffffff' }}>
              {userName || t('home.guest', locale)}
            </span>
          </div>
        </div>

        {/* Items */}
        <nav className="flex-1 overflow-y-auto py-2">
          {navItems.map((entry, index) => {
            const title = drawerTitle(entry);
            const icon = drawerIcon(entry) || 'chevron-right';
            const name = screenName(entry);
            return (
              <button
                key={`${name}-${index}`}
                type="button"
                onClick={() => onNavigate(name)}
                className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--fc-overlay)]"
              >
                <ItemGlyph icon={icon} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--fc-text-primary)]">{title}</span>
                <Icon name="chevron-right" size={18} className="text-[var(--fc-text-secondary)]" />
              </button>
            );
          })}
          {noRouteItems.map((entry, index) => {
            const title = drawerTitle(entry);
            if (!title) {
              return null;
            }
            return (
              <div key={`title-${index}`} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-[var(--fc-text-secondary)]">
                {title}
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-[var(--fc-border)] p-3">
          <button
            type="button"
            onClick={onLogout}
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[var(--fc-radius-md)] text-sm font-bold text-white active:opacity-90"
            style={logoutColor ? { backgroundColor: logoutColor } : { backgroundColor: 'var(--fc-bg-secondary)' }}
          >
            <Icon name="logout" size={18} />
            <span>{t('home.logout', locale)}</span>
          </button>
        </div>
      </aside>
    </div>
  );
}

function ItemGlyph({ icon }: { icon: string }): ReactNode {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--fc-bg-secondary)] text-white">
      <Icon name={mapIconName(icon)} size={18} />
    </span>
  );
}

function mapIconName(icon: string): IconName {
  const normalized = icon.toLowerCase();
  if (normalized.includes('wallet')) return 'wallet';
  if (normalized.includes('setting')) return 'settings';
  if (normalized.includes('histor') || normalized.includes('activit') || normalized.includes('book')) return 'history';
  if (normalized.includes('card')) return 'card';
  if (normalized.includes('chat')) return 'chat';
  if (normalized.includes('sos') || normalized.includes('emergency')) return 'sos';
  if (normalized.includes('support') || normalized.includes('help')) return 'support';
  if (normalized.includes('languag')) return 'language';
  if (normalized.includes('profile') || normalized.includes('account') || normalized.includes('user')) return 'user';
  if (normalized.includes('logout') || normalized.includes('sign out')) return 'logout';
  if (normalized.includes('promo') || normalized.includes('offer') || normalized.includes('refer')) return 'promo';
  if (normalized.includes('reward') || normalized.includes('gift') || normalized.includes('star')) return 'star';
  if (normalized.includes('subscribe') || normalized.includes('plan')) return 'card';
  if (normalized.includes('family')) return 'user';
  if (normalized.includes('price') || normalized.includes('pricecard')) return 'document';
  if (normalized.includes('favourite') || normalized.includes('favorite')) return 'star';
  if (normalized.includes('notif')) return 'bell';
  if (normalized.includes('info') || normalized.includes('about')) return 'info';
  return serviceIconFor(normalized);
}
