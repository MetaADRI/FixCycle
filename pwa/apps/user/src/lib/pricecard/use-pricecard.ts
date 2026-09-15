'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchPriceCard } from '@fixcycle/api-client';
import type { PriceCardService } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface PriceCardView {
  loading: boolean;
  services: PriceCardService[];
  area: string;
  load: (params: { area: string; segmentId: string | number }) => Promise<void>;
  setArea: (area: string) => void;
}

export function usePriceCard(): PriceCardView {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<PriceCardService[]>([]);
  const [area, setArea] = useState('');

  const load = useCallback(async (params: { area: string; segmentId: string | number }) => {
    setLoading(true);
    try {
      setServices(await fetchPriceCard(api, params));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ area: 'Mumbai', segmentId: 1 });
  }, [load]);

  return { loading, services, area, load, setArea };
}