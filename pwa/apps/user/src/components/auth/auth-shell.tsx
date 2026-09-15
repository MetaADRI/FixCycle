'use client';

import type { ReactNode } from 'react';

import { useRuntime } from '@/lib/runtime-context';

export interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps): ReactNode {
  const { runtime } = useRuntime();
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--fc-bg-primary)]">
      <div className="mx-auto flex w-full max-w-[430px] flex-col justify-end px-6 pb-6 pt-12 flex-1">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.4rem] bg-white/10 ring-1 ring-white/15">
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
        </div>
      </div>
      <div className="mx-auto w-full max-w-[430px] flex-1 rounded-t-[1.75rem] bg-[var(--fc-surface)] px-4 pb-8 pt-6 shadow-[0_-8px_24px_rgba(16,24,40,0.10)]">
        {children}
      </div>
    </div>
  );
}