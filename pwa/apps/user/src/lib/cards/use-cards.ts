'use client';

import { useCallback, useEffect, useState } from 'react';
import { deleteSavedCard, fetchSavedCards } from '@fixcycle/api-client';
import type { SavedCard } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface CardsView {
  loading: boolean;
  cards: SavedCard[];
  load: () => Promise<void>;
  remove: (cardId: string | number) => Promise<{ success: boolean; message: string }>;
}

export function useCards(): CardsView {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<SavedCard[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCards(await fetchSavedCards(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const remove = useCallback(
    async (cardId: string | number) => {
      const res = await deleteSavedCard(api, { cardId });
      if (res.success) void load();
      return res;
    },
    [load],
  );

  return { loading, cards, load, remove };
}