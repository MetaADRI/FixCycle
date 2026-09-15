'use client';

import type { ReactNode } from 'react';

import type {
  AddMoneyItem,
  BannerCellItem,
  BusinessSegmentItem,
  MainScreenCell,
  MainScreenCellItem,
  ServiceCellItem,
} from '@fixcycle/api-client';
import { Icon, serviceIconFor } from '@fixcycle/ui';

import { t } from '@/lib/i18n';

import { AddMoney } from './add-money';
import { BannerCarousel } from './banner-carousel';
import { PopularSection } from './popular-section';
import { ServiceGrid } from './service-grid';

export interface HolderRendererContext {
  locale: string;
  currency: string;
  walletBalance?: string;
  onBanner: (banner: BannerCellItem) => void;
  onService: (service: ServiceCellItem) => void;
  onBusiness: (item: BusinessSegmentItem) => void;
  onAddMoney: () => void;
  onGeneric: (cell: MainScreenCell, item: MainScreenCellItem | undefined) => void;
}

const POPULAR_TITLES = new Set([
  'POPULAR_RESTAURANT',
  'POPULAR_STORE',
  'POPULAR_PHARMACY',
  'POPULAR_LAUNDRY',
]);

const SERVICE_TITLES = new Set([
  'RECENTS',
  'ALL SERVICES',
  'ALL SERVICES V2',
  'ALL SERVICES WITH TAXI CATAGORIES',
  'HORIZONTAL_ALL_SERVICES',
  'ZAAOU_ALL_SERVICES',
]);

export function HolderRenderer({
  cell,
  ctx,
}: {
  cell: MainScreenCell;
  ctx: HolderRendererContext;
}): ReactNode {
  const titleKey = (cell.title ?? '').toUpperCase().trim();

  // Banner holders
  if (titleKey === 'BANNERS' || titleKey === 'BOTTOM_BANNERS') {
    const banners = cell.contents as BannerCellItem[];
    return <BannerCell banners={banners} ctx={ctx} />;
  }

  // Recommended service holder
  if (titleKey === 'RECOMMENDED_SERVICE') {
    const services = cell.contents as ServiceCellItem[];
    return <RecommendedCell services={services} ctx={ctx} />;
  }

  // Popular business segment holders
  if (POPULAR_TITLES.has(titleKey)) {
    const items = cell.contents as BusinessSegmentItem[];
    if (items.length === 0) {
      return null;
    }
    return (
      <PopularSection
        title={cell.titleText || popularTitle(titleKey, ctx)}
        items={items}
        onSelect={ctx.onBusiness}
        locale={ctx.locale}
      />
    );
  }
  // Service grid holders
  if (SERVICE_TITLES.has(titleKey)) {
    const services = cell.contents as ServiceCellItem[];
    if (services.length === 0) {
      return null;
    }
    return (
      <ServiceCell
        title={cell.titleText}
        services={services}
        columns={4}
        onSelect={ctx.onService}
        locale={ctx.locale}
      />
    );
  }

  // Add-money holder
  if (titleKey === 'ADDMONEY') {
    const addMoney = cell.contents[0] as AddMoneyItem | undefined;
    if (!addMoney) {
      return null;
    }
    return (
      <AddMoney
        item={addMoney}
        fallbackBalance={ctx.walletBalance}
        currency={ctx.currency}
        onAddMoney={ctx.onAddMoney}
      />
    );
  }

  // Unknown / dynamic holders: render as a generic card row — never crash.
  return <GenericCell cell={cell} ctx={ctx} />;
}

function BannerCell({
  banners,
  ctx,
}: {
  banners: BannerCellItem[];
  ctx: HolderRendererContext;
}): ReactNode {
  return <BannerCarousel banners={banners} onSelect={ctx.onBanner} />;
}

function RecommendedCell({
  services,
  ctx,
}: {
  services: ServiceCellItem[];
  ctx: HolderRendererContext;
}): ReactNode {
  if (services.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-2">
      <ServiceCell
        title={ctx.locale ? t('home.recommended', ctx.locale) : 'Recommended'}
        services={services}
        columns={4}
        onSelect={ctx.onService}
        locale={ctx.locale}
      />
    </section>
  );
}

function ServiceCell({
  title,
  services,
  columns,
  onSelect,
  locale,
}: {
  title?: string;
  services: ServiceCellItem[];
  columns: number;
  onSelect: (service: ServiceCellItem) => void;
  locale: string;
}): ReactNode {
  return (
    <div className="flex flex-col gap-2 px-1">
      {title ? (
        <span className="text-sm font-bold text-[var(--fc-text-primary)]">{title}</span>
      ) : null}
      <ServiceGrid services={services} columns={columns} onSelect={onSelect} locale={locale} />
    </div>
  );
}

function popularTitle(titleKey: string, ctx: HolderRendererContext): string {
  switch (titleKey) {
    case 'POPULAR_RESTAURANT':
      return t('home.popularRestaurants', ctx.locale);
    case 'POPULAR_STORE':
      return t('home.popularStores', ctx.locale);
    case 'POPULAR_PHARMACY':
      return t('home.popularPharmacies', ctx.locale);
    case 'POPULAR_LAUNDRY':
      return t('home.popularLaundries', ctx.locale);
    default:
      return titleKey;
  }
}

function GenericCell({ cell, ctx }: { cell: MainScreenCell; ctx: HolderRendererContext }): ReactNode {
  const heading = cell.titleText || cell.title || t('home.services', ctx.locale);
  const items = cell.contents.length > 0 ? cell.contents : [undefined];
  return (
    <section className="flex flex-col gap-2">
      {cell.titleText ? (
        <span className="px-1 text-sm font-bold text-[var(--fc-text-primary)]">{cell.titleText}</span>
      ) : null}
      <div className="flex flex-col overflow-hidden rounded-[var(--fc-radius-lg)] border border-[var(--fc-border)] bg-[var(--fc-surface)]">
        {items.map((item, index) => (
          <button
            key={`${cell.title}-${index}`}
            type="button"
            onClick={() => ctx.onGeneric(cell, item)}
            className="flex min-h-[52px] w-full items-center gap-3 border-b border-[var(--fc-border)] px-4 py-3 text-left last:border-b-0 active:bg-[var(--fc-surface-raised)]"
          >
            {item ? (
              <GenericGlyph item={item} />
            ) : (
              <Icon name="grid" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />
            )}
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--fc-text-primary)]">
              {item?.name || item?.title || heading}
            </span>
            <Icon name="chevron-right" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />
          </button>
        ))}
      </div>
    </section>
  );
}

function GenericGlyph({ item }: { item: MainScreenCellItem }): ReactNode {
  const name = item.name || item.slug || item.title;
  if (!name) {
    return <Icon name="grid" size={18} className="shrink-0 text-[var(--fc-text-secondary)]" />;
  }
  return <Icon name={serviceIconFor(name)} size={18} className="shrink-0 text-[var(--fc-bg-secondary)]" />;
}
