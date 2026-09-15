'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button } from '@fixcycle/ui';

import { LanguagePicker } from '@/components/onboarding/language-picker';
import { ONBOARDING_SLIDES } from '@/components/onboarding/slides';
import { t } from '@/lib/i18n';
import { useRuntime } from '@/lib/runtime-context';

export function OnboardingCarousel(): ReactNode {
  const { runtime } = useRuntime();
  const [index, setIndex] = useState(0);
  const last = ONBOARDING_SLIDES.length - 1;
  const slide = ONBOARDING_SLIDES[index];
  if (!slide) {
    return null;
  }
  const Illustration = slide.Illustration;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-4 pt-3">
        <LanguagePicker />
        <button
          type="button"
          onClick={() => (window.location.href = '/login')}
          className="text-sm font-semibold text-[var(--fc-bg-secondary)]"
        >
          {t('onboard.skip', runtime.locale)}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-6">
        <Illustration className="h-48 w-48" />
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="text-xl font-extrabold text-[var(--fc-text-primary)]">{t(slide.titleKey, runtime.locale)}</h2>
          <p className="max-w-[300px] text-sm leading-relaxed text-[var(--fc-text-secondary)]">
            {t(slide.bodyKey, runtime.locale)}
          </p>
        </div>

        <div className="flex h-2 items-center gap-2">
          {ONBOARDING_SLIDES.map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? 'w-6 bg-[var(--fc-bg-secondary)]' : 'w-2 bg-[var(--fc-border)]'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 pb-6 pt-2">
        {index === last ? (
          <Button block onClick={() => (window.location.href = '/login')}>
            {t('onboard.done', runtime.locale)}
          </Button>
        ) : (
          <div className="flex items-center gap-3">
            <Button block variant="secondary" onClick={() => setIndex((current) => Math.min(last, current + 1))}>
              {t('onboard.next', runtime.locale)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}