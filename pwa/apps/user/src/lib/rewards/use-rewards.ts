'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchRewardGiftList,
  fetchRewardHistory,
  fetchRewardPoints,
  redeemRewardGift,
  redeemRewardPoints,
} from '@fixcycle/api-client';
import type { RewardGift, RewardHistoryItem, RewardSummary } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface RewardsView {
  loading: boolean;
  summary: RewardSummary | null;
  gifts: RewardGift[];
  history: RewardHistoryItem[];
  load: () => Promise<void>;
  redeemPoints: (params: { points: number }) => Promise<{ success: boolean; message: string }>;
  redeemGift: (params: { giftId: string | number }) => Promise<{ success: boolean; message: string }>;
}

export function useRewards(): RewardsView {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [gifts, setGifts] = useState<RewardGift[]>([]);
  const [history, setHistory] = useState<RewardHistoryItem[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, g, h] = await Promise.all([fetchRewardPoints(api), fetchRewardGiftList(api), fetchRewardHistory(api)]);
      setSummary(s);
      setGifts(g);
      setHistory(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const redeemPoints = useCallback(
    async (params: { points: number }) => {
      const res = await redeemRewardPoints(api, { rewardPoints: params.points });
      if (res.success) void load();
      return res;
    },
    [load],
  );

  const redeemGift = useCallback(
    async (params: { giftId: string | number }) => {
      const res = await redeemRewardGift(api, params);
      if (res.success) void load();
      return res;
    },
    [load],
  );

  return { loading, summary, gifts, history, load, redeemPoints, redeemGift };
}