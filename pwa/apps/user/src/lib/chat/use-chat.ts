'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchChatHistory, sendChatMessage } from '@fixcycle/api-client';
import type { ChatMessage } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface ChatView {
  loading: boolean;
  messages: ChatMessage[];
  load: () => Promise<void>;
  send: (message: string) => Promise<{ success: boolean; message: string }>;
}

export function useChat(): ChatView {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMessages(await fetchChatHistory(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const send = useCallback(
    async (message: string) => {
      const res = await sendChatMessage(api, { message });
      if (res.success && res.sentMessage) {
        setMessages((prev) => [...prev, res.sentMessage as ChatMessage]);
      }
      return res;
    },
    [],
  );

  return { loading, messages, load, send };
}