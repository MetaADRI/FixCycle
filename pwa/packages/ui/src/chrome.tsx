import type { CSSProperties, ReactNode } from 'react';

import type { IconName } from './icons';
import { Icon } from './icons';

export interface AppShellProps {
  children?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  className?: string;
  padded?: boolean;
}

export function AppShell({ children, header, footer, className = '', padded = true }: AppShellProps): ReactNode {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-[var(--fc-surface)]"
      style={{ boxShadow: 'var(--fc-shadow)' } as CSSProperties}
    >
      {header ? <header className="sticky top-0 z-20">{header}</header> : null}
      <main className={`flex-1 ${padded ? 'px-4 pb-6 pt-4' : ''} ${className}`}>{children}</main>
      {footer ? <footer>{footer}</footer> : null}
    </div>
  );
}

export interface TopHeaderProps {
  title: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function TopHeader({ title, leading, trailing }: TopHeaderProps): ReactNode {
  return (
    <div className="flex h-14 items-center gap-2 border-b border-[var(--fc-border)] bg-[var(--fc-surface)] px-2">
      <div className="flex w-12 items-center justify-start">{leading}</div>
      <h1 className="flex-1 truncate text-center text-base font-bold text-[var(--fc-text-primary)]">{title}</h1>
      <div className="flex w-12 items-center justify-end">{trailing}</div>
    </div>
  );
}

export const SAFE_AREA_PADDING: CSSProperties = {
  paddingBottom: 'env(safe-area-inset-bottom)',
  paddingLeft: 'env(safe-area-inset-left)',
  paddingRight: 'env(safe-area-inset-right)',
  paddingTop: 'env(safe-area-inset-top)',
};

export interface TabBarItem {
  key: string;
  label: string;
  icon: IconName;
  href: string;
  active?: boolean;
}

export interface TabBarProps {
  items: TabBarItem[];
}

export function TabBar({ items }: TabBarProps): ReactNode {
  return (
    <nav
      className="border-t border-[var(--fc-border)] bg-[var(--fc-surface)]"
      style={SAFE_AREA_PADDING as CSSProperties}
      aria-label="Primary navigation"
    >
      <div className="mx-auto flex h-16 max-w-[430px] items-stretch justify-around">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            aria-current={item.active ? 'page' : undefined}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:opacity-70 ${
              item.active ? 'text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-secondary)]'
            }`}
          >
            <span className="flex h-6 w-6 items-center justify-center">
              <Icon name={item.icon} size={20} />
            </span>
            <span className="truncate">{item.label}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}