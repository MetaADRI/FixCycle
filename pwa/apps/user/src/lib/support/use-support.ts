'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchSupportChannels, fetchSupportThreads, sendSupportMessage } from '@fixcycle/api-client';
import type { SupportChannel, SupportThread } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface SupportView {
  loading: boolean;
  threads: SupportThread[];
  channels: SupportChannel[];
  load: () => Promise<void>;
  send: (params: { subject?: string; message: string }) => Promise<{ success: boolean; message: string }>;
}

export function useSupport(): SupportView {
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [channels, setChannels] = useState<SupportChannel[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([fetchSupportThreads(api), fetchSupportChannels(api)]);
      setThreads(t);
      setChannels(c);
      if (t.length === 0) {
        setChannels((prev) => prev);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(
    async (params: { subject?: string; message: string }) => {
      const res = await sendSupportMessage(api, params);
      if (res.success) void load();
      return res;
    },
    [load],
  );

  return { loading, threads, channels, load, send };
}