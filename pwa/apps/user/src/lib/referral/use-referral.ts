'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchReferral } from '@fixcycle/api-client';
import type { ReferralInfo } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface ReferralView {
  loading: boolean;
  referral: ReferralInfo | null;
  load: () => Promise<void>;
}

export function useReferral(): ReferralView {
  const [loading, setLoading] = useState(true);
  const [referral, setReferral] = useState<ReferralInfo | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setReferral(await fetchReferral(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { loading, referral, load };
}