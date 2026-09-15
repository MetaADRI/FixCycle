'use client';

import type { CSSProperties, ReactNode } from 'react';

import type { ServiceCellItem } from '@fixcycle/api-client';
import { Icon, serviceIconFor } from '@fixcycle/ui';

import { t } from '@/lib/i18n';

export interface ServiceGridProps {
  services: ServiceCellItem[];
  columns?: number;
  onSelect: (service: ServiceCellItem) => void;
  locale?: string;
}

export function ServiceGrid({
  services,
  columns = 4,
  onSelect,
  locale = 'en',
}: ServiceGridProps): ReactNode {
  if (services.length === 0) {
    return null;
  }
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {services.map((service) => {
        const comingSoon = service.isComingSoon === true;
        const label = service.name || service.slug || service.title || '';
        return (
          <button
            key={service.id}
            type="button"
            disabled={comingSoon}
            onClick={() => onSelect(service)}
            aria-disabled={comingSoon}
            className={`flex min-h-[44px] flex-col items-center gap-1.5 rounded-[var(--fc-radius-md)] px-1 py-2 text-center transition-opacity active:opacity-80 ${
              comingSoon ? 'cursor-not-allowed opacity-45' : 'bg-[var(--fc-surface-raised)]'
            }`}
          >
            <ServiceTile service={service} comingSoon={comingSoon} />
            <span className="line-clamp-2 text-[11px] leading-tight text-[var(--fc-text-primary)]">{label}</span>
            {comingSoon ? (
              <span className="rounded-full bg-[var(--fc-border)] px-1.5 py-px text-[9px] font-semibold uppercase text-[var(--fc-text-secondary)]">
                {t('home.comingSoon', locale)}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ServiceTile({ service, comingSoon }: { service: ServiceCellItem; comingSoon: boolean }): ReactNode {
  const gradient1 = service.gradient1?.trim();
  const gradient2 = service.gradient2?.trim();
  const hasGradient = (gradient1?.length ?? 0) > 0 || (gradient2?.length ?? 0) > 0;
  const tileStyle: CSSProperties =
    hasGradient && gradient1
      ? { background: `linear-gradient(135deg, ${gradient1}, ${gradient2 ?? gradient1})` }
      : {};
  const serverImage = service.image?.trim();
  const iconName = serviceIconFor(service.slug ?? service.name ?? service.title ?? '');
  return (
    <span
      className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-[var(--fc-bg-secondary)] text-white"
      style={hasGradient ? tileStyle : undefined}
      aria-hidden="true"
    >
      {serverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={serverImage} alt="" className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <Icon name={iconName} size={24} />
      )}
      {comingSoon ? <span className="absolute inset-0 bg-[var(--fc-overlay)]" /> : null}
    </span>
  );
}
