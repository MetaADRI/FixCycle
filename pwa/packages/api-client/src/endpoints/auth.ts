import { mapCountries, type CountryOption, type EncryptionConfig } from '@fixcycle/config';
import { z } from 'zod';

import type { ApiClient } from '../client';
import type { ApiEnvelope, ApiEnvelopeSchema } from '../envelope';
import { encryptText, tryDecrypt } from '../crypto';

// ---------------------------------------------------------------------------
// View models
// ---------------------------------------------------------------------------

export interface TokenPayload {
  accessToken: string;
  refreshToken?: string;
  pushNotification?: unknown;
  isGuest: boolean;
  isSocialIdExist?: boolean;
  number?: string;
  email?: string;
  raw: Record<string, unknown>;
}

export interface OtpSendResult {
  autoFill: boolean;
  otp?: string;
  defaultOtpEnabled: boolean;
  defaultOtp?: string;
  isNumberRegistered: boolean;
}

export interface CountryPayload {
  country_id?: string | number;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  phoneCode: string;
  countryCode: string;
  gender: string;
  smokerType: string;
  networkCode: string;
  referralCode: string;
  signupStatus: string;
  walletBalance: string;
  outstandingAmount: string;
  profileImageUrl?: string;
  raw: Record<string, unknown>;
}

export interface CmsPage {
  slug: string;
  title: string;
  description: string;
}

export type OtpType = 1 | 2 | 3;
export type OtpChannel = 'EMAIL' | 'PHONE';
export type SocialProvider = 'google' | 'facebook';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const recordSchema = z.record(z.string(), z.unknown());

const tokenDataSchema = z
  .object({
    access_token: z.string().optional(),
    refresh_token: z.string().optional(),
    push_notification: z.unknown().optional(),
    is_guest: z.union([z.boolean(), z.number()]).optional(),
    is_social_id_exist: z.union([z.boolean(), z.number()]).optional(),
    number: z.string().optional(),
    email: z.string().optional(),
  })
  .passthrough();

const otpSendDataSchema = z
  .object({
    auto_fill: z.union([z.boolean(), z.number()]).optional(),
    otp: z.union([z.string(), z.number()]).optional(),
    default_otp_enable: z.union([z.boolean(), z.number()]).optional(),
    default_otp: z.union([z.string(), z.number()]).optional(),
    is_number_registered: z.union([z.boolean(), z.number()]).optional(),
  })
  .passthrough();

const cmsPageSchema = z
  .object({
    title: z.unknown().optional(),
    description: z.unknown().optional(),
    name: z.unknown().optional(),
    slug: z.string().optional(),
  })
  .passthrough();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toBoolean(value: boolean | number | undefined): boolean {
  return value === true || value === 1;
}

function parseTokenPayload(data: Record<string, unknown>): TokenPayload {
  const parsed = tokenDataSchema.parse(data);
  const accessToken = parsed.access_token;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('API response did not include an access token');
  }
  return {
    accessToken,
    refreshToken: parsed.refresh_token,
    pushNotification: parsed.push_notification,
    isGuest: toBoolean(parsed.is_guest),
    isSocialIdExist:
      parsed.is_social_id_exist === undefined ? undefined : toBoolean(parsed.is_social_id_exist),
    number: parsed.number,
    email: parsed.email,
    raw: data,
  };
}

function unwrapEnvelopeData<T>(envelope: ApiEnvelope<unknown>, path: string): T {
  if (!envelope.data || typeof envelope.data !== 'object') {
    throw new Error(`API response for ${path} did not include data`);
  }
  return envelope.data as T;
}

// Encrypt the exact field set each Laravel method decrypts, mirroring
// Account\UserController (Login / SignUp / SocialSignup). Only applied when the
// merchant has enabled encryption with valid keys. Empty/absent fields are kept
// untouched.
const ENCRYPTED_FIELDS_SIGNUP = [
  'email',
  'latitude',
  'last_name',
  'password',
  'phone',
  'first_name',
  'longitude',
] as const;

const ENCRYPTED_FIELDS_LOGIN = ['phone', 'password'] as const;

const ENCRYPTED_FIELDS_SOCIAL_SIGNUP = ['email', 'phone', 'first_name'] as const;

async function encryptField(
  encryption: EncryptionConfig | null | undefined,
  value: string,
): Promise<string> {
  if (!encryption || !encryption.enabled) {
    return value;
  }
  if (value.length === 0) {
    return value;
  }
  try {
    return await encryptText(encryption.secret, encryption.iv, value);
  } catch {
    return value;
  }
}

async function applyEncryption<T extends Record<string, unknown>>(
  payload: T,
  fields: readonly string[],
  encryption: EncryptionConfig | null | undefined,
): Promise<Record<string, unknown>> {
  if (!encryption || !encryption.enabled) {
    return payload;
  }
  const out: Record<string, unknown> = { ...payload };
  for (const field of fields) {
    const value = out[field];
    if (typeof value !== 'string') {
      continue;
    }
    out[field] = await encryptField(encryption, value);
  }
  return out;
}

export function isTokenEnvelope(envelope: unknown): envelope is ApiEnvelopeSchema {
  if (typeof envelope !== 'object' || envelope === null) {
    return false;
  }
  const record = envelope as Record<string, unknown>;
  if (record['result'] !== '1' || typeof record['data'] !== 'object' || record['data'] === null) {
    return false;
  }
  return tokenDataSchema.safeParse(record['data']).success;
}

// ---------------------------------------------------------------------------
// OTP send  /user/otp
// OtpType: 1 = signup register check, 2 = forgot password, 3 = login
// ---------------------------------------------------------------------------

export interface SendOtpParams {
  type: OtpType;
  for: OtpChannel;
  user_name: string;
  phone?: string;
  email?: string;
  encryption?: EncryptionConfig | null;
}

export async function sendOtp(client: ApiClient, params: SendOtpParams): Promise<OtpSendResult> {
  const base: Record<string, unknown> = {
    type: params.type,
    for: params.for,
    user_name: params.user_name,
  };
  if (params.for === 'PHONE') {
    base['phone'] = params.phone !== undefined ? params.phone : params.user_name;
  } else {
    base['email'] = params.email !== undefined ? params.email : params.user_name;
  }

  // The server decrypts user_name (Api\UserController@Otp) and derives the
  // phone/email fields from it, so the client must encrypt user_name whenever
  // the merchant has encryption enabled. phone/email are included (plaintext is
  // fine because the server overwrites them with the decrypted user_name).
  const body = await applyEncryption(base, ['user_name', 'phone', 'email'], params.encryption);

  const envelope = await client.post<Record<string, unknown>>('/user/otp', body);
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/otp');
  const parsed = otpSendDataSchema.parse(data);

  const maybeDecrypt = async (value: string | number | undefined): Promise<string | undefined> => {
    const text = typeof value === 'number' ? String(value) : value;
    if (text === undefined || text.length === 0) {
      return undefined;
    }
    if (params.encryption && params.encryption.enabled) {
      return tryDecrypt(params.encryption.secret, params.encryption.iv, text);
    }
    return text;
  };

  const [otp, defaultOtp] = await Promise.all([maybeDecrypt(parsed.otp), maybeDecrypt(parsed.default_otp)]);

  return {
    autoFill: toBoolean(parsed.auto_fill),
    otp,
    defaultOtpEnabled: toBoolean(parsed.default_otp_enable),
    defaultOtp,
    isNumberRegistered: toBoolean(parsed.is_number_registered),
  };
}

// ---------------------------------------------------------------------------
// Password login  /user/on-board  (Account\UserController@Login)
// ---------------------------------------------------------------------------

export interface LoginWithPasswordParams {
  phone: string;
  password: string;
  logintype?: string;
  countryCode?: string;
  encryption?: EncryptionConfig | null;
}

export async function loginWithPassword(
  client: ApiClient,
  params: LoginWithPasswordParams,
): Promise<TokenPayload> {
  const payload = await applyEncryption(
    {
      requested_from: 'web',
      phone: params.phone,
      password: params.password,
      ...(params.logintype ? { logintype: params.logintype } : {}),
      ...(params.countryCode ? { country_code: params.countryCode } : {}),
    },
    ENCRYPTED_FIELDS_LOGIN,
    params.encryption,
  );
  const envelope = await client.post<Record<string, unknown>>('/user/on-board', payload);
  return parseTokenPayload(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/on-board'));
}

// ---------------------------------------------------------------------------
// OTP login  /user/on-board/otp  (Account\UserController@loginOtp)
// The server does NOT decrypt the phone on this route, so no field encryption.
// ---------------------------------------------------------------------------

export interface LoginWithOtpParams {
  phone: string;
  loginOtp: string;
}

export async function loginWithOtp(
  client: ApiClient,
  params: LoginWithOtpParams,
): Promise<TokenPayload> {
  const envelope = await client.post<Record<string, unknown>>('/user/on-board/otp', {
    requested_from: 'web',
    phone: params.phone,
    login_otp: params.loginOtp,
  });
  return parseTokenPayload(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/on-board/otp'));
}

// ---------------------------------------------------------------------------
// Signup  /user/normal-reg  (Account\UserController@SignUp)
// ---------------------------------------------------------------------------

export interface SignupParams {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password?: string;
  countryId?: string | number;
  gender?: string;
  smokerType?: string;
  userCpfNumber?: string;
  networkCode?: string;
  referralCode?: string;
  isRegister?: boolean;
  loginOtp?: string;
  logintype?: string;
  device?: Record<string, unknown>;
  encryption?: EncryptionConfig | null;
}

export async function signup(client: ApiClient, params: SignupParams): Promise<unknown> {
  const base: Record<string, unknown> = {
    requested_from: 'web',
    first_name: params.firstName,
    last_name: params.lastName,
    email: params.email,
    phone: params.phone,
    password: params.password,
    country_id: params.countryId,
    user_gender: params.gender,
    smoker_type: params.smokerType,
    user_cpf_number: params.userCpfNumber,
    network_code: params.networkCode,
    referral_code: params.referralCode,
    ...(params.isRegister ? { is_register: 1 } : {}),
    ...(params.loginOtp ? { login_otp: params.loginOtp } : {}),
    ...(params.logintype ? { logintype: params.logintype } : {}),
    ...(params.device ?? {}),
  };

  const payload = await applyEncryption(base, ENCRYPTED_FIELDS_SIGNUP, params.encryption);
  const envelope = await client.post<unknown>('/user/normal-reg', payload);
  if (envelope.data && typeof envelope.data === 'object') {
    const record = envelope.data as Record<string, unknown>;
    if (typeof record['access_token'] === 'string') {
      return parseTokenPayload(record);
    }
  }
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Forgot password  /user/forgotpassword  (Account\UserController@ForgotPassword)
// ---------------------------------------------------------------------------

export interface ForgotPasswordParams {
  for: OtpChannel;
  password: string;
  phone: string;
  questionId?: string;
  answer?: string;
  encryption?: EncryptionConfig | null;
}

export async function forgotPassword(
  client: ApiClient,
  params: ForgotPasswordParams,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    requested_from: 'web',
    for: params.for,
    password: params.password,
    phone: params.phone,
  };
  if (params.questionId !== undefined) {
    body['question_id'] = params.questionId;
  }
  if (params.answer !== undefined) {
    body['answer'] = params.answer;
  }

  // The server decrypts password and phone (Account\UserController@ForgotPassword)
  // when encryption is enabled.
  const encrypted = await applyEncryption(body, ['password', 'phone'], params.encryption);

  const envelope = await client.post<unknown>('/user/forgotpassword', encrypted);
  return envelope.data;
}

// ---------------------------------------------------------------------------
// User details  /user/details  (Account\UserController@Details)
// ---------------------------------------------------------------------------

const userProfileSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    UserProfileImage: z.unknown().optional(),
    profile_image: z.unknown().optional(),
    email: z.string().nullable().optional(),
    UserEmail: z.string().nullable().optional(),
    UserPhone: z.string().nullable().optional(),
    phone_code: z.unknown().optional(),
    country_code: z.string().nullable().optional(),
    user_gender: z.unknown().optional(),
    smoker_type: z.string().nullable().optional(),
    network_code: z.string().nullable().optional(),
    ReferralCode: z.string().nullable().optional(),
    signup_status: z.unknown().optional(),
    wallet_balance: z.unknown().optional(),
    outstanding_amount: z.unknown().optional(),
  })
  .passthrough();

export function parseUserProfile(data: Record<string, unknown>): UserProfile {
  const parsed = userProfileSchema.parse(data);
  return {
    id: String(parsed.id),
    firstName: parsed.firstName ?? '',
    lastName: parsed.lastName ?? '',
    email: parsed.email || parsed.UserEmail || '',
    phone: parsed.UserPhone ?? '',
    phoneCode: typeof parsed.phone_code === 'string' ? parsed.phone_code : '',
    countryCode: parsed.country_code ?? '',
    gender: typeof parsed.user_gender === 'string' ? parsed.user_gender : '',
    smokerType: parsed.smoker_type ?? '',
    networkCode: parsed.network_code ?? '',
    referralCode: parsed.ReferralCode ?? '',
    signupStatus: typeof parsed.signup_status === 'string' ? parsed.signup_status : '',
    walletBalance:
      typeof parsed.wallet_balance === 'string' ? parsed.wallet_balance : String(parsed.wallet_balance ?? ''),
    outstandingAmount:
      typeof parsed.outstanding_amount === 'string'
        ? parsed.outstanding_amount
        : String(parsed.outstanding_amount ?? ''),
    profileImageUrl: pickImageUrl(parsed['UserProfileImage']),
    raw: data,
  };
}

function pickImageUrl(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    const candidate = record['full_url'] ?? record['web_image'] ?? record['url'];
    return typeof candidate === 'string' && candidate.length > 0 ? candidate : undefined;
  }
  return undefined;
}

export interface DevicePayload {
  requested_from: 'web';
  unique_no: string;
  package_name: string;
  apk_version: string;
  device: number;
  operating_system: string;
  language_code: string;
}

const DEVICE_ID_KEY = 'fixcycle:device-unique-no';

export function getOrCreateDeviceId(): string {
  if (typeof localStorage === 'undefined') {
    return 'pwa-unique';
  }
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const created = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `pwa-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    localStorage.setItem(DEVICE_ID_KEY, created);
  } catch {
    // storage unavailable (private mode etc.) — fall back to a stable id
  }
  return created;
}

export function buildWebDevicePayload(client: ApiClient): DevicePayload {
  return {
    requested_from: 'web',
    unique_no: getOrCreateDeviceId(),
    package_name: 'com.fixcycle.pwa.user',
    apk_version: '1.0.0',
    device: 2,
    operating_system: 'WEB',
    language_code: client.locale,
  };
}

export async function fetchUserDetails(
  client: ApiClient,
  options?: { signal?: AbortSignal },
): Promise<UserProfile> {
  const envelope = await client.post<Record<string, unknown>>(
    '/user/details',
    buildWebDevicePayload(client),
    { scope: 'user', signal: options?.signal },
  );
  return parseUserProfile(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/details'));
}

// ---------------------------------------------------------------------------
// Logout  /user/logout  (Account\UserController@Logout)
// ---------------------------------------------------------------------------

export async function logoutUser(client: ApiClient): Promise<void> {
  try {
    await client.post<unknown>('/user/logout', buildWebDevicePayload(client), { scope: 'user' });
  } finally {
    await client.tokenStore.clearToken('user');
  }
}

// ---------------------------------------------------------------------------
// Guest login  /user/guest/login  (Account\UserController@guestLogin)
// ---------------------------------------------------------------------------

export interface GuestLoginParams {
  countryId?: string | number;
}

export async function guestLogin(
  client: ApiClient,
  params: GuestLoginParams = {},
): Promise<TokenPayload> {
  const envelope = await client.post<Record<string, unknown>>('/user/guest/login', {
    ...buildWebDevicePayload(client),
    ...(params.countryId !== undefined ? { country_id: params.countryId } : {}),
  });
  return parseTokenPayload(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/guest/login'));
}

// ---------------------------------------------------------------------------
// Social sign in  /user/social-on-board  (Account\UserController@SocialSign)
// ---------------------------------------------------------------------------

export interface SocialSignInParams {
  socialId: string;
}

export async function socialSignIn(
  client: ApiClient,
  params: SocialSignInParams,
): Promise<TokenPayload & { isSocialIdExist: boolean }> {
  const envelope = await client.post<Record<string, unknown>>('/user/social-on-board', {
    ...buildWebDevicePayload(client),
    social_id: params.socialId,
  });
  const token = parseTokenPayload(unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/social-on-board'));
  return { ...token, isSocialIdExist: token.isSocialIdExist ?? false };
}

// ---------------------------------------------------------------------------
// Social signup  /user/social-reg  (Account\UserController@SocialSignup)
// ---------------------------------------------------------------------------

export interface SocialSignupParams {
  socialId: string;
  platform: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  countryId?: string | number;
  gender?: string;
  latitude?: string;
  longitude?: string;
  encryption?: EncryptionConfig | null;
}

export async function socialSignup(
  client: ApiClient,
  params: SocialSignupParams,
): Promise<unknown> {
  const base: Record<string, unknown> = {
    ...buildWebDevicePayload(client),
    social_id: params.socialId,
    platfrom: params.platform,
    first_name: params.firstName,
    last_name: params.lastName,
    phone: params.phone,
    email: params.email,
    country_id: params.countryId,
    user_gender: params.gender,
    latitude: params.latitude,
    longitude: params.longitude,
  };
  const payload = await applyEncryption(base, ENCRYPTED_FIELDS_SOCIAL_SIGNUP, params.encryption);
  const envelope = await client.post<unknown>('/user/social-reg', payload);
  if (envelope.data && typeof envelope.data === 'object') {
    const record = envelope.data as Record<string, unknown>;
    if (typeof record['access_token'] === 'string') {
      return parseTokenPayload(record);
    }
  }
  return envelope.data;
}

// ---------------------------------------------------------------------------
// Countries  /user/countryList  (Api\CommonController@CountryList)
// ---------------------------------------------------------------------------

export async function fetchCountries(client: ApiClient): Promise<CountryOption[]> {
  const envelope = await client.post<unknown>('/user/countryList', {});
  const raw = unwrapEnvelopeData<unknown>(envelope, '/user/countryList');
  return mapCountries(raw instanceof Array ? raw : raw && typeof raw === 'object' ? recordSchema.parse(raw)['countries'] : raw);
}

// ---------------------------------------------------------------------------
// CMS page  /user/cms/pages  (Api\CommonController@UserCmsPage)
// ---------------------------------------------------------------------------

export interface FetchCmsPageParams {
  slug: string;
  locale?: string;
}

function pickLocalized(value: unknown, locale: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const picked = pickLocalized(item, locale);
      if (picked.length > 0) {
        return picked;
      }
    }
    return '';
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (typeof record[locale] === 'string') {
      return record[locale];
    }
    for (const key of ['en', 'name', 'title', 'description']) {
      const picked = pickLocalized(record[key], locale);
      if (picked.length > 0) {
        return picked;
      }
    }
    const first = Object.values(record).find((item) => typeof item === 'string');
    return typeof first === 'string' ? first : '';
  }
  return '';
}

export async function fetchCmsPage(
  client: ApiClient,
  params: FetchCmsPageParams,
): Promise<CmsPage> {
  const envelope = await client.post<Record<string, unknown>>('/user/cms/pages', {
    slug: params.slug,
    requested_from: 'web',
  });
  const data = unwrapEnvelopeData<Record<string, unknown>>(envelope, '/user/cms/pages');
  const parsed = cmsPageSchema.parse(data);
  const locale = params.locale ?? client.locale;
  return {
    slug: parsed.slug ?? params.slug,
    title: pickLocalized(parsed.title, locale),
    description: pickLocalized(parsed.description, locale),
  };
}