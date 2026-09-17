import { apiBaseUrl, publicEnv } from '@fixcycle/config';

import { parseEnvelope, type ApiEnvelope } from './envelope';
import {
  ApiError,
  EnvelopeInvalidError,
  HttpStatusError,
  NetworkError,
  ResultFailureError,
  ResultPendingError,
  UnauthorizedError,
} from './errors';
import { createDefaultTokenStore, type TokenStore, type TokenScope } from './token-store';

export interface ApiRequestOptions {
  scope?: TokenScope;
  token?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface CreateClientOptions {
  apiBase?: string;
  publicKey?: string;
  secretKey?: string;
  locale?: string;
  tokenStore?: TokenStore;
}

const DEFAULT_TIMEOUT_MS = 15000;

// Render free tier sleeps after inactivity; the first request after wake restarts
// the container and can take 30-90s. Retry on timeout with escalating budgets so
// cold starts succeed, while warm requests stay fast.
const TIMEOUT_RETRY_BUDGETS_MS = [15000, 60000, 120000];

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export class ApiClient {
  readonly apiBase: string;
  readonly merchantPublicKey: string;
  readonly merchantSecretKey: string;
  locale: string;
  readonly tokenStore: TokenStore;

  constructor(options: CreateClientOptions = {}) {
    this.apiBase = options.apiBase !== undefined ? options.apiBase.replace(/\/+$/, '') : apiBaseUrl();
    this.merchantPublicKey = options.publicKey ?? publicEnv.merchantPublicKey;
    this.merchantSecretKey = options.secretKey ?? publicEnv.merchantSecretKey;
    this.locale = options.locale ?? publicEnv.locale;
    this.tokenStore = options.tokenStore ?? createDefaultTokenStore();
  }

  setLocale(locale: string): void {
    this.locale = locale;
  }

  async post<T>(path: string, body?: unknown, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
    return this.request<T>('POST', path, body, options);
  }

  async get<T>(path: string, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
    return this.request<T>('GET', path, undefined, options);
  }

  async postForm<T>(path: string, form: FormData, options: ApiRequestOptions = {}): Promise<ApiEnvelope<T>> {
    return this.request<T>('POST', path, form, { ...options, formData: true });
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: ApiRequestOptions & { formData?: boolean } = {},
  ): Promise<ApiEnvelope<T>> {
    let lastError: unknown;
    const budgets = options.timeoutMs !== undefined
      ? [options.timeoutMs]
      : TIMEOUT_RETRY_BUDGETS_MS;
    const progress: string[] = [];

    for (let attempt = 0; attempt < budgets.length; attempt += 1) {
      try {
        return await this.requestOnce<T>(method, path, body, { ...options, timeoutMs: budgets[attempt] });
      } catch (error) {
        lastError = error;
        if (!(error instanceof NetworkError) || !(error.cause instanceof Error) || error.cause.name !== 'TimeoutError') {
          throw error;
        }
        progress.push(String(budgets[attempt]));
      }
      if (attempt + 1 < budgets.length && process.env.NODE_ENV !== 'test' && typeof window !== 'undefined') {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    const detail = progress.length > 0 ? ` after ${progress.join('ms -> ')}ms` : '';
    throw new NetworkError(`Request to ${path} timed out${detail}`, lastError);
  }

  private async requestOnce<T>(
    method: string,
    path: string,
    body?: unknown,
    options: ApiRequestOptions & { formData?: boolean } = {},
  ): Promise<ApiEnvelope<T>> {
    const url = `${this.apiBase}${path.startsWith('/') ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.headers ?? {}),
    };
    if (this.merchantPublicKey.length > 0) {
      headers['publicKey'] = this.merchantPublicKey;
    }
    if (this.merchantSecretKey.length > 0) {
      headers['secretKey'] = this.merchantSecretKey;
    }
    headers['locale'] = this.locale;

    let token = options.token;
    if (!token && options.scope) {
      const record = await this.tokenStore.getToken(options.scope);
      if (record) {
        token = record.token;
      }
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let bodyInit: BodyInit | undefined;
    if (body instanceof FormData) {
      bodyInit = body;
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      bodyInit = JSON.stringify(body);
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const signal = options.signal ?? AbortSignal.timeout(timeoutMs);

    let response: globalThis.Response;
    try {
      response = await fetch(url, { method, headers, body: bodyInit, signal, credentials: 'omit' });
    } catch (error) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new NetworkError(`Request to ${path} timed out`, error);
      }
      throw new NetworkError(`Network error while calling ${path}`, error);
    }

    const text = await response.text();
    let payload: unknown;
    if (text.length === 0) {
      payload = null;
    } else {
      try {
        payload = JSON.parse(text);
      } catch (error) {
        if (!response.ok) {
          throw new HttpStatusError(response.status, text.trim() || `HTTP ${response.status}`, undefined);
        }
        throw new EnvelopeInvalidError(`Response from ${path} is not JSON`, error);
      }
    }

    if (response.status === 401) {
      if (options.scope) {
        await this.tokenStore.clearToken(options.scope);
      }
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      const envelope = isPlainRecord(payload) ? parseEnvelopeSafely(payload) : undefined;
      throw new HttpStatusError(response.status, `HTTP ${response.status} from ${path}`, envelope);
    }

    if (!isPlainRecord(payload)) {
      throw new EnvelopeInvalidError(`Response from ${path} is not a Fixcycle envelope`);
    }

    const envelope = parseEnvelope(payload);
    const result = envelope.result;
    if (result === '999') {
      if (options.scope) {
        await this.tokenStore.clearToken(options.scope);
      }
      throw new UnauthorizedError(envelope.message ?? 'Session expired');
    }
    if (result === '0') {
      throw new ResultFailureError(envelope.message ?? 'Request failed', envelope);
    }
    if (result === '2') {
      throw new ResultPendingError(envelope.message ?? 'Request pending', envelope);
    }
    return envelope as ApiEnvelope<T>;
  }
}

function parseEnvelopeSafely(payload: Record<string, unknown>): ApiEnvelope<unknown> | undefined {
  try {
    return parseEnvelope(payload);
  } catch {
    return undefined;
  }
}

export function createApiClient(options: CreateClientOptions = {}): ApiClient {
  return new ApiClient(options);
}

export type { ApiError };
export { UnauthorizedError, NetworkError, ResultFailureError, ResultPendingError };