'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchPromotions } from '@fixcycle/api-client';
import type { PromotionItem } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface PromotionsView {
  loading: boolean;
  promotions: PromotionItem[];
  load: () => Promise<void>;
}

export function usePromotions(): PromotionsView {
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPromotions(await fetchPromotions(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, promotions, load };
}