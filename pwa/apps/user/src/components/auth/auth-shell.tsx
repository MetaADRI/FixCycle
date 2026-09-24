'use client';

import type { ReactNode } from 'react';

import { useRuntime } from '@/lib/runtime-context';

export interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps): ReactNode {
  const { runtime } = useRuntime();
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[var(--fc-bg-primary)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_at_top,rgba(var(--fc-bg-secondary-rgb,99,102,241),0.28),transparent_62%)]"
      />
      <div className="relative mx-auto flex w-full max-w-[430px] sm:max-w-[640px] md:max-w-[768px] lg:max-w-[1024px] md:max-w-[640px] lg:max-w-[768px] xl:max-w-[1024px] flex-1 flex-col justify-end px-6 pb-6 pt-12">
        <div className="flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.4rem] bg-white/10 ring-1 ring-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.28)]">
              {runtime.businessLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={runtime.businessLogoUrl}
                  alt={runtime.appName}
                  className="h-16 w-16 rounded-xl object-contain"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/icons/fixcycle-logo.png"
                  alt={runtime.appName}
                  className="h-16 w-16 rounded-xl object-contain"
                />
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">{runtime.appName}</h1>
            <p className="max-w-[16rem] text-sm font-medium leading-relaxed text-[var(--fc-text-secondary)]">
              Get there. Ride with ease.
            </p>
          </div>
        </div>
        <div className="mt-auto w-full rounded-t-[1.75rem] border border-b-0 border-[var(--fc-border)] bg-[var(--fc-surface)] px-4 pb-8 pt-6 shadow-[0_-8px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          {children}
        </div>
      </div>
    </div>
  );
}