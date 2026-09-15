'use client';

import type { ReactNode } from 'react';

import { Skeleton } from '@fixcycle/ui';

export function HomeSkeleton(): ReactNode {
  return (
    <div className="animate-pulse flex flex-col gap-5 px-4 pb-6 pt-4" aria-hidden="true">
      <ServiceGridSkeleton />
      <BannerSkeleton />
      <PopularSkeleton />
    </div>
  );
}

export function ServiceGridSkeleton(): ReactNode {
  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton(): ReactNode {
  return (
    <div className="flex gap-3 overflow-hidden">
      <Skeleton className="h-28 w-[78%] shrink-0 rounded-[var(--fc-radius-lg)]" />
      <Skeleton className="h-28 w-[78%] shrink-0 rounded-[var(--fc-radius-lg)]" />
    </div>
  );
}

export function PopularSkeleton(): ReactNode {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-32 rounded" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="w-36 shrink-0">
            <Skeleton className="h-24 rounded-[var(--fc-radius-lg)]" />
            <Skeleton className="mt-2 h-3 w-20 rounded" />
            <Skeleton className="mt-1 h-3 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
