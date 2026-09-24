'use client';

import { useState } from 'react';
import type { ImgHTMLAttributes, ReactNode } from 'react';

export interface FlagImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  countryCode?: string;
  countryName?: string;
  size?: number;
}

function FlagFallback({ countryCode, size, className }: { countryCode: string; size: number; className?: string }): ReactNode {
  return (
    <div
      className={`flex items-center justify-center rounded-sm font-bold text-[var(--fc-text-secondary)] ${className ?? ''}`}
      style={{
        width: size,
        height: Math.round(size * 0.75),
        fontSize: Math.max(8, Math.round(size * 0.32)),
        lineHeight: 1,
        border: '1px solid var(--fc-border)',
        background: 'var(--fc-surface)',
      }}
      aria-hidden="true"
    >
      {countryCode.toUpperCase()}
    </div>
  );
}

export function FlagImage({ countryCode, countryName, size = 24, className, style, ...rest }: FlagImageProps): ReactNode {
  const [loadFailed, setLoadFailed] = useState(false);

  if (!countryCode) {
    return <FlagFallback countryCode="?" size={size} className={className} />;
  }

  if (loadFailed) {
    return <FlagFallback countryCode={countryCode} size={size} className={className} />;
  }

  return (
    <img
      src={`${runtime.businessLogoUrl ? `/flags/${countryCode.toLowerCase()}.svg` : `https://flagcdn.com/${countryCode.toLowerCase()}.svg`}`}
      alt={countryName ? `${countryName} flag` : countryCode}
      width={size}
      height={Math.round(size * 0.75)}
      loading="lazy"
      onError={() => setLoadFailed(true)}
      className={className}
      style={{ borderRadius: 2, objectFit: 'cover', ...style }}
      {...rest}
    />
  );
}