'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  changePassword,
  deleteAccount,
  fetchAccountDocuments,
  fetchAccountProfile,
  saveAccountDocument,
  updateAccountProfile,
} from '@fixcycle/api-client';
import type { AccountDocument, AccountProfile } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface AccountView {
  loading: boolean;
  profile: AccountProfile | null;
  documents: AccountDocument[];
  load: () => Promise<void>;
  saveProfile: (params: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    smokerType?: string;
    userGender?: string;
  }) => Promise<{ success: boolean; message: string }>;
  updatePassword: (params: { currentPassword: string; newPassword: string }) => Promise<{ success: boolean; message: string }>;
  saveDocument: (params: { documentId: number; documentNumber: string; expiryDate?: string }) => Promise<{ success: boolean; message: string }>;
  removeAccount: (params?: { reason?: string }) => Promise<{ success: boolean; message: string }>;
}

export function useAccount(): AccountView {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [documents, setDocuments] = useState<AccountDocument[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, docs] = await Promise.all([fetchAccountProfile(api), fetchAccountDocuments(api)]);
      setProfile(p);
      setDocuments(docs);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveProfile = useCallback(
    async (params: { firstName?: string; lastName?: string; email?: string; phone?: string; smokerType?: string; userGender?: string }) => {
      const res = await updateAccountProfile(api, params);
      if (res.profile) setProfile(res.profile);
      return res;
    },
    [],
  );

  const updatePassword = useCallback(
    async (params: { currentPassword: string; newPassword: string }) => changePassword(api, params),
    [],
  );

  const saveDocument = useCallback(
    async (params: { documentId: number; documentNumber: string; expiryDate?: string }) => {
      const res = await saveAccountDocument(api, params);
      if (res.success) void load();
      return res;
    },
    [load],
  );

  const removeAccount = useCallback(async (params?: { reason?: string }) => {
    return deleteAccount(api, params?.reason ? { accountCancelReason: params.reason } : undefined);
  }, []);

  return { loading, profile, documents, load, saveProfile, updatePassword, saveDocument, removeAccount };
}