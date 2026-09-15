'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  addMoneyToWallet,
  checkTransferUser,
  fetchCashoutHistory,
  fetchCashoutMethods,
  fetchWalletTransactions,
  requestCashout,
  transferWalletMoney,
} from '@fixcycle/api-client';
import type { CashoutHistoryItem, CheckUserResult, WalletTransaction } from '@fixcycle/api-client';

import { api } from '@/lib/api';

export type WalletFilter = 1 | 2 | 3;

export interface WalletView {
  loading: boolean;
  walletBalance: string;
  transactions: WalletTransaction[];
  cashoutHistory: CashoutHistoryItem[];
  cashoutMethods: Record<string, unknown>[];
  load: (filter?: WalletFilter) => Promise<void>;
  addMoney: (params: { amount: number; paymentOptionId?: number }) => Promise<{ success: boolean; message: string }>;
  searchReceiver: (searchBy: string) => Promise<CheckUserResult | null>;
  transfer: (params: { receiverId: number; amount: number }) => Promise<{ success: boolean; message: string }>;
  cashout: (params: { amount: number; cashoutMethodId?: number; accountNumber?: string }) => Promise<{ success: boolean; message: string }>;
}

export function useWallet(): WalletView {
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState('0');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [cashoutHistory, setCashoutHistory] = useState<CashoutHistoryItem[]>([]);
  const [cashoutMethods, setCashoutMethods] = useState<Record<string, unknown>[]>([]);

  const load = useCallback(async (filter: WalletFilter = 1) => {
    setLoading(true);
    try {
      const [wallet, history, methods] = await Promise.all([
        fetchWalletTransactions(api, { filter }),
        fetchCashoutHistory(api),
        fetchCashoutMethods(api),
      ]);
      setWalletBalance(wallet.walletBalance);
      setTransactions(wallet.transactions);
      setCashoutHistory(history);
      setCashoutMethods(methods);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshBalance = useCallback(async (filter: WalletFilter = 1) => {
    const wallet = await fetchWalletTransactions(api, { filter });
    setWalletBalance(wallet.walletBalance);
    setTransactions(wallet.transactions);
  }, []);

  const addMoney = useCallback(
    async (params: { amount: number; paymentOptionId?: number }) => {
      const res = await addMoneyToWallet(api, params);
      if (res.success) void refreshBalance();
      return res;
    },
    [refreshBalance],
  );

  const searchReceiver = useCallback(async (searchBy: string) => {
    return checkTransferUser(api, { searchBy });
  }, []);

  const transfer = useCallback(
    async (params: { receiverId: number; amount: number }) => {
      const res = await transferWalletMoney(api, params);
      if (res.success) void refreshBalance();
      return res;
    },
    [refreshBalance],
  );

  const cashout = useCallback(
    async (params: { amount: number; cashoutMethodId?: number; accountNumber?: string }) => {
      const res = await requestCashout(api, params);
      if (res.success) {
        void refreshBalance();
        void fetchCashoutHistory(api).then(setCashoutHistory);
      }
      return res;
    },
    [refreshBalance],
  );

  return { loading, walletBalance, transactions, cashoutHistory, cashoutMethods, load, addMoney, searchReceiver, transfer, cashout };
}