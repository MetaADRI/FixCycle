'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  activateSubscription,
  fetchActiveSubscription,
  fetchSubscriptionHistory,
  fetchSubscriptionPackages,
} from '@fixcycle/api-client';
import type { SubscriptionPackage } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface SubscriptionsView {
  loading: boolean;
  packages: SubscriptionPackage[];
  history: SubscriptionPackage[];
  active: SubscriptionPackage | null;
  load: () => Promise<void>;
  activate: (params: { packageId: string | number; paymentMethodId?: string | number }) => Promise<{ success: boolean; message: string }>;
}

export function useSubscriptions(): SubscriptionsView {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [history, setHistory] = useState<SubscriptionPackage[]>([]);
  const [active, setActive] = useState<SubscriptionPackage | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pkgs, h, act] = await Promise.all([
        fetchSubscriptionPackages(api),
        fetchSubscriptionHistory(api),
        fetchActiveSubscription(api),
      ]);
      setPackages(pkgs);
      setHistory(h);
      setActive(act);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const activate = useCallback(
    async (params: { packageId: string | number; paymentMethodId?: string | number }) => {
      const res = await activateSubscription(api, { packageId: params.packageId, paymentMethodId: params.paymentMethodId });
      if (res.success) void load();
      return res;
    },
    [load],
  );

  return { loading, packages, history, active, load, activate };
}