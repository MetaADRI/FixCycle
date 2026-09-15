/**
 * Phase 12 — Wallet ledger, add money, transfer, cashout.
 * Mirrors: Api\UserController, Api\UserCashoutController
 */

import type { ApiClient } from '../client';
import type { ApiEnvelope } from '../envelope';

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function num(value: unknown): number | undefined {
  return typeof value === 'number' ? value : typeof value === 'string' && value.length > 0 ? Number(value) : undefined;
}
function num0(value: unknown, fb = 0): number { return num(value) ?? fb; }
function str0(value: unknown, fb = ''): string { return str(value) ?? fb; }
function arr(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? (value as Record<string, unknown>[]) : []; }
function obj(value: unknown): Record<string, unknown> { return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}; }
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }

export interface WalletTransaction {
  transactionName: string;
  type: string;
  amount: string;
  date: string;
  valueColor: string;
  description: string;
  raw: Record<string, unknown>;
}

export interface WalletResult {
  walletBalance: string;
  tapCustomerToken: string;
  transactions: WalletTransaction[];
  nextPageUrl: string;
  totalPages: number;
  currentPage: number;
}

export interface CheckUserResult {
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  raw: Record<string, unknown>;
}

export interface CashoutRequest {
  amount: number;
  cashoutMethodId?: number;
  accountNumber?: string;
  signal?: AbortSignal;
}

export interface CashoutHistoryItem {
  id: string;
  amount: string;
  status: string;
  date: string;
  methodName: string;
  raw: Record<string, unknown>;
}

export async function fetchWalletTransactions(
  client: ApiClient,
  params: { filter: 1 | 2 | 3; page?: number; signal?: AbortSignal },
): Promise<WalletResult> {
  const envelope = await client.post<unknown>('/user/wallet/transaction', {
    filter: params.filter,
    page: params.page ?? 1,
  }, { scope: 'user', signal: params.signal });
  const d = dataOf(envelope);
  return {
    walletBalance: str0(d['wallet_balance']),
    tapCustomerToken: str0(d['tap_customer_token']),
    transactions: arr(d['recent_transactoin']).map((t) => ({
      transactionName: str0(t['transaction_name']),
      type: str0(t['type']),
      amount: str0(t['amount']),
      date: str0(t['date']),
      valueColor: str0(t['value_color']),
      description: str0(t['amount_received_from'] ?? t['amount_transferred_to'] ?? t['description']),
      raw: t,
    })),
    nextPageUrl: str0((envelope as unknown as Record<string, unknown>)['next_page_url'] as string),
    totalPages: num0((envelope as unknown as Record<string, unknown>)['total_pages']),
    currentPage: num0((envelope as unknown as Record<string, unknown>)['current_page']),
  };
}

export async function addMoneyToWallet(
  client: ApiClient,
  params: { amount: number; paymentOptionId?: number; timestampValue?: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = { amount: params.amount };
  if (params.paymentOptionId) body['payment_option_id'] = params.paymentOptionId;
  if (params.timestampValue) body['timestampvalue'] = params.timestampValue;
  const envelope = await client.post<unknown>('/user/wallet/addMoney', body, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Failed to add money') };
}

export async function checkTransferUser(
  client: ApiClient,
  params: { searchBy: string; type?: string; signal?: AbortSignal },
): Promise<CheckUserResult | null> {
  const body: Record<string, unknown> = { search_by: params.searchBy };
  if (params.type) body['type'] = params.type;
  const envelope = await client.post<unknown>('/user/check-user', body, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') return null;
  const d = dataOf(envelope);
  return {
    userId: str0(d['id']),
    firstName: str0(d['first_name']),
    lastName: str0(d['last_name']),
    phone: str0(d['UserPhone']),
    email: str0(d['email']),
    raw: d,
  };
}

export async function transferWalletMoney(
  client: ApiClient,
  params: { receiverId: number; amount: number; type?: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = {
    receiver_id: params.receiverId,
    amount: params.amount,
  };
  if (params.type) body['type'] = params.type;
  const envelope = await client.post<unknown>('/user/transfer-money', body, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Transfer failed') };
}

export async function fetchCashoutHistory(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<CashoutHistoryItem[]> {
  const envelope = await client.post<unknown>('/user/cashout/history', {}, { scope: 'user', signal: params?.signal });
  const list = Array.isArray(envelope.data) ? (envelope.data as unknown[]) : arr(dataOf(envelope)['cashouts']);
  return (list as Record<string, unknown>[]).map((o) => ({
    id: str0(o['id']),
    amount: str0(o['amount']),
    status: str0(o['status']),
    date: str0(o['created_at'] ?? o['date']),
    methodName: str0(o['payment_method_name'] ?? o['method_name']),
    raw: o,
  }));
}

export async function requestCashout(
  client: ApiClient,
  params: CashoutRequest,
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = { amount: params.amount };
  if (params.cashoutMethodId) body['cashout_method_id'] = params.cashoutMethodId;
  if (params.accountNumber) body['account_number'] = params.accountNumber;
  const envelope = await client.post<unknown>('/user/cashout/request', body, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Cashout failed') };
}

export async function fetchCashoutMethods(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<Record<string, unknown>[]> {
  const envelope = await client.post<unknown>('/user/get-cashout-method', {}, { scope: 'user', signal: params?.signal });
  return Array.isArray(envelope.data) ? (envelope.data as Record<string, unknown>[]) : [];
}
