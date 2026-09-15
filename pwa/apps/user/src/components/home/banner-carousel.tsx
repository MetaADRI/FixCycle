'use client';

import type { ReactNode } from 'react';

import type { BannerCellItem } from '@fixcycle/api-client';

import { HomeBannerIllustration } from './illustrations';

export interface BannerCarouselProps {
  banners: BannerCellItem[];
  onSelect: (banner: BannerCellItem) => void;
}

export function BannerCarousel({ banners, onSelect }: BannerCarouselProps): ReactNode {
  if (banners.length === 0) {
    return null;
  }
  return (
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {banners.map((banner) => {
        const image = banner.image?.trim();
        const label = banner.name || banner.title || '';
        const width = banner.imageWidth || 6;
        const height = banner.imageHeight || 3;
        const aspect = `${width} / ${height}`;
        return (
          <button
            key={banner.id}
            type="button"
            onClick={() => onSelect(banner)}
            className="relative w-[78%] shrink-0 snap-start overflow-hidden rounded-[var(--fc-radius-lg)] bg-[var(--fc-surface-raised)] active:opacity-90"
            style={{ aspectRatio: aspect }}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={label}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <HomeBannerIllustration className="h-full w-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
