'use client';

import type { CSSProperties, ReactNode } from 'react';

import type { AddMoneyItem } from '@fixcycle/api-client';
import { Icon } from '@fixcycle/ui';

import type { SelectedLocation } from './location-picker';

export interface AddMoneyProps {
  item: AddMoneyItem;
  fallbackBalance?: string;
  location?: SelectedLocation;
  currency: string;
  onAddMoney: () => void;
}

export function AddMoney({ item, fallbackBalance, currency, onAddMoney }: AddMoneyProps): ReactNode {
  const balanceSource = item.title?.trim() || fallbackBalance?.trim();
  const ctaLabel = item.btnText?.trim() || 'Add money';
  const btnStyle: CSSProperties | undefined = item.btnColor?.trim()
    ? { backgroundColor: item.btnColor.trim() }
    : undefined;
  const bgImage = item.image?.trim();

  return (
    <div
      className="relative overflow-hidden rounded-[var(--fc-radius-lg)] bg-[var(--fc-bg-secondary)] p-4 text-white"
      style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
    >
      <span className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs text-white/80">
            <Icon name="wallet" size={16} />
            {currency || 'Wallet'}
          </span>
          <span className="text-lg font-extrabold">
            {balanceSource || '0.00'}
          </span>
        </div>
        <button
          type="button"
          onClick={onAddMoney}
          className="min-h-[44px] rounded-full bg-white px-4 text-sm font-bold text-[var(--fc-bg-secondary)] shadow-sm active:opacity-90"
          style={btnStyle}
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
