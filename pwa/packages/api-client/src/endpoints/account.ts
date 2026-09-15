/**
 * Phase 12 — Account profile, edit, password, documents, delete.
 * Mirrors: Account\UserController, Api\UserController
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
function obj(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}
function dataOf(envelope: ApiEnvelope<unknown>): Record<string, unknown> { return obj(envelope.data); }

export interface AccountProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  countryCode: string;
  gender: string;
  smokerType: string;
  referralCode: string;
  walletBalance: string;
  outstandingAmount: string;
  profileImageUrl?: string;
  raw: Record<string, unknown>;
}

export interface AccountDocument {
  id: number;
  documentId: number;
  documentNumber: string;
  documentName: string;
  expiryDate: string;
  status: string;
  raw: Record<string, unknown>;
}

export async function fetchAccountProfile(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<AccountProfile> {
  const envelope = await client.post<unknown>('/user/details', {}, { scope: 'user', signal: params?.signal });
  const d = dataOf(envelope);
  return {
    id: str0(d['id']),
    firstName: str0(d['first_name']),
    lastName: str0(d['last_name']),
    email: str0(d['email']),
    phone: str0(d['UserPhone']),
    phoneCode: str0(d['phone_code']),
    countryCode: str0(d['country_code']),
    gender: str0(d['user_gender']),
    smokerType: str0(d['smoker_type']),
    referralCode: str0(d['ReferralCode']),
    walletBalance: str0(d['wallet_balance']),
    outstandingAmount: str0(d['outstanding_amount']),
    profileImageUrl: str(d['UserProfileImage']),
    raw: d,
  };
}

export async function updateAccountProfile(
  client: ApiClient,
  params: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    smokerType?: string;
    userGender?: string;
    profileImage?: string;
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; message: string; profile?: AccountProfile }> {
  const body: Record<string, unknown> = {};
  if (params.firstName !== undefined) body['first_name'] = params.firstName;
  if (params.lastName !== undefined) body['last_name'] = params.lastName;
  if (params.email !== undefined) body['email'] = params.email;
  if (params.phone !== undefined) body['phone'] = params.phone;
  if (params.smokerType !== undefined) body['smoker_type'] = params.smokerType;
  if (params.userGender !== undefined) body['user_gender'] = params.userGender;
  if (params.profileImage !== undefined) {
    body['profile_image'] = params.profileImage;
    body['api_type'] = 1;
  }
  const envelope = await client.post<unknown>('/user/edit-profile', body, { scope: 'user', signal: params.signal });
  if (envelope.result !== '1') {
    return { success: false, message: str0(envelope.message, 'Update failed') };
  }
  const d = dataOf(envelope);
  return {
    success: true,
    message: str0(envelope.message, 'Profile updated'),
    profile: {
      id: str0(d['id']),
      firstName: str0(d['first_name']),
      lastName: str0(d['last_name']),
      email: str0(d['email']),
      phone: str0(d['UserPhone']),
      phoneCode: str0(d['phone_code']),
      countryCode: str0(d['country_code']),
      gender: str0(d['user_gender']),
      smokerType: str0(d['smoker_type']),
      referralCode: str0(d['ReferralCode']),
      walletBalance: str0(d['wallet_balance']),
      outstandingAmount: str0(d['outstanding_amount']),
      profileImageUrl: str(d['UserProfileImage']),
      raw: d,
    },
  };
}

export async function changePassword(
  client: ApiClient,
  params: { currentPassword: string; newPassword: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const envelope = await client.post<unknown>('/user/change-password', {
    current_password: params.currentPassword,
    password: params.newPassword,
    password_confirmation: params.newPassword,
  }, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Password change failed') };
}

export async function fetchAccountDocuments(
  client: ApiClient,
  params?: { signal?: AbortSignal },
): Promise<AccountDocument[]> {
  const envelope = await client.post<unknown>('/user/userDocList', {}, { scope: 'user', signal: params?.signal });
  const d = dataOf(envelope);
  const list = Array.isArray(envelope.data) ? (envelope.data as unknown[]) : (Array.isArray(d['documents']) ? d['documents'] as unknown[] : []);
  return (list as Record<string, unknown>[]).map((o) => ({
    id: num0(o['id']),
    documentId: num0(o['document_id']),
    documentNumber: str0(o['document_number']),
    documentName: str0(o['document_name'] ?? o['name']),
    expiryDate: str0(o['expiry_date']),
    status: str0(o['status']),
    raw: o,
  }));
}

export async function saveAccountDocument(
  client: ApiClient,
  params: {
    documentId: number;
    documentNumber: string;
    expiryDate?: string;
    signal?: AbortSignal;
  },
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = {
    document_id: params.documentId,
    document_number: params.documentNumber,
  };
  if (params.expiryDate) body['expiry_date'] = params.expiryDate;
  const envelope = await client.post<unknown>('/user/userDocSave', body, { scope: 'user', signal: params.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Document save failed') };
}

export async function deleteAccount(
  client: ApiClient,
  params?: { cancelReasonId?: number; accountCancelReason?: string; signal?: AbortSignal },
): Promise<{ success: boolean; message: string }> {
  const body: Record<string, unknown> = {};
  if (params?.cancelReasonId) body['cancel_reason_id'] = params.cancelReasonId;
  if (params?.accountCancelReason) body['account_cancel_reason'] = params.accountCancelReason;
  const envelope = await client.post<unknown>('/user/account-delete', body, { scope: 'user', signal: params?.signal });
  return { success: envelope.result === '1', message: str0(envelope.message, 'Account deletion failed') };
}
