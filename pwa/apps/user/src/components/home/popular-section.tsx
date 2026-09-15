'use client';

import type { ReactNode } from 'react';

import type { BusinessSegmentItem } from '@fixcycle/api-client';
import { Icon } from '@fixcycle/ui';

import { t } from '@/lib/i18n';

export interface PopularSectionProps {
  title: string;
  items: BusinessSegmentItem[];
  onSelect: (item: BusinessSegmentItem) => void;
  locale?: string;
}

export function PopularSection({ title, items, onSelect, locale = 'en' }: PopularSectionProps): ReactNode {
  if (items.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2">
      <h2 className="px-1 text-sm font-bold text-[var(--fc-text-primary)]">{title}</h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((item) => {
          const open = item.isBusinessSegmentOpen === true;
          const name = item.name || item.title || '';
          const image = item.image?.trim();
          const rating = item.rating?.trim();
          const distance = item.distance?.trim();
          const time = item.time?.trim();
          return (
            <button
              key={item.businessSegmentId || item.id}
              type="button"
              onClick={() => onSelect(item)}
              className="w-36 shrink-0 snap-start overflow-hidden rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface-raised)] text-left active:opacity-90"
            >
              <div className="relative h-24 w-full bg-[var(--fc-border)]">
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={image} alt={name} className="h-full w-full object-cover" loading="lazy" />
                ) : null}
                <span
                  className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 ${
                    item.isFavourite ? 'text-[var(--fc-bg-secondary)]' : 'text-[var(--fc-text-secondary)]'
                  }`}
                  aria-hidden="true"
                >
                  <Icon name="heart" size={15} fill={item.isFavourite ? 'currentColor' : 'none'} />
                </span>
                <span
                  className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    open
                      ? 'bg-[var(--fc-success)]/90 text-white'
                      : 'bg-[var(--fc-text-secondary)]/90 text-white'
                  }`}
                >
                  {open ? t('home.open', locale) : t('home.closed', locale)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 p-2">
                <span className="truncate text-xs font-semibold text-[var(--fc-text-primary)]">{name}</span>
                <span className="flex items-center gap-2 text-[10px] text-[var(--fc-text-secondary)]">
                  {rating ? (
                    <span className="inline-flex items-center gap-0.5 font-semibold text-[var(--fc-warning)]">
                      <Icon name="star" size={11} />
                      {rating}
                    </span>
                  ) : null}
                  {distance ? (
                    <span>
                      {distance}
                      {distance && !/[a-z]/i.test(distance.slice(-1)) ? ` ${t('home.km', locale)}` : ''}
                    </span>
                  ) : null}
                  {time ? <span>{time}</span> : null}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
