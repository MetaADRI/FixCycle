'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSosContact, deleteSosContact, fetchSosContacts, sendSosRequest } from '@fixcycle/api-client';
import type { SosContact } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface SosView {
  loading: boolean;
  contacts: SosContact[];
  load: () => Promise<void>;
  addContact: (params: { name: string; number: string }) => Promise<{ success: boolean; message: string }>;
  removeContact: (contactId: string | number) => Promise<{ success: boolean; message: string }>;
  sendSos: (params: {
    bookingId: string | number;
    latitude: number | string;
    longitude: number | string;
  }) => Promise<{ success: boolean; message: string }>;
}

export function useSos(): SosView {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<SosContact[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setContacts(await fetchSosContacts(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addContact = useCallback(
    async (params: { name: string; number: string }) => {
      const res = await createSosContact(api, params);
      if (res.success) void load();
      return res;
    },
    [load],
  );

  const removeContact = useCallback(
    async (contactId: string | number) => {
      const res = await deleteSosContact(api, { contactId });
      if (res.success) void load();
      return res;
    },
    [load],
  );

  const sendSos = useCallback(async (params: { bookingId: string | number; latitude: number | string; longitude: number | string }) => {
    return sendSosRequest(api, params);
  }, []);

  return { loading, contacts, load, addContact, removeContact, sendSos };
}