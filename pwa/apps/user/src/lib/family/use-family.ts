'use client';

import { useCallback, useEffect, useState } from 'react';
import { addFamilyMember, deleteFamilyMember, fetchFamilyMembers } from '@fixcycle/api-client';
import type { FamilyMember } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export interface FamilyView {
  loading: boolean;
  members: FamilyMember[];
  load: () => Promise<void>;
  addMember: (params: { name: string; phone: string; email?: string; relationship?: string }) => Promise<{ success: boolean; message: string }>;
  removeMember: (memberId: string | number) => Promise<{ success: boolean; message: string }>;
}

export function useFamily(): FamilyView {
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<FamilyMember[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMembers(await fetchFamilyMembers(api));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const addMember = useCallback(
    async (params: { name: string; phone: string; email?: string; relationship?: string }) => {
      const res = await addFamilyMember(api, params);
      if (res.success) void load();
      return res;
    },
    [load],
  );

  const removeMember = useCallback(
    async (memberId: string | number) => {
      const res = await deleteFamilyMember(api, { memberId });
      if (res.success) void load();
      return res;
    },
    [load],
  );

  return { loading, members, load, addMember, removeMember };
}