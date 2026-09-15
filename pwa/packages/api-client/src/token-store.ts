export type TokenScope = 'user' | 'driver' | 'store';

export interface TokenRecord {
  token: string;
  createdAt: number;
}

export interface TokenStore {
  getToken(scope: TokenScope): Promise<TokenRecord | null>;
  setToken(scope: TokenScope, token: string): Promise<void>;
  clearToken(scope: TokenScope): Promise<void>;
  clearAll(): Promise<void>;
}

export class InMemoryTokenStore implements TokenStore {
  private readonly records = new Map<TokenScope, TokenRecord>();

  async getToken(scope: TokenScope): Promise<TokenRecord | null> {
    return this.records.get(scope) ?? null;
  }

  async setToken(scope: TokenScope, token: string): Promise<void> {
    this.records.set(scope, { token, createdAt: Date.now() });
  }

  async clearToken(scope: TokenScope): Promise<void> {
    this.records.delete(scope);
  }

  async clearAll(): Promise<void> {
    this.records.clear();
  }
}

const STORAGE_PREFIX = 'fixcycle';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof crypto === 'undefined' || !('subtle' in crypto)) {
    return null;
  }
  return crypto.subtle;
}

async function getOrCreateEncryptionKey(): Promise<CryptoKey | null> {
  const subtle = getSubtleCrypto();
  if (!subtle) {
    return null;
  }
  const rawKey = sessionStorage.getItem(`${STORAGE_PREFIX}:crypto-key`);
  if (rawKey) {
    const material = new Uint8Array(JSON.parse(rawKey));
    return subtle.importKey('raw', material, 'AES-GCM', false, ['encrypt', 'decrypt']);
  }
  const key = await subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const exported = await subtle.exportKey('raw', key);
  sessionStorage.setItem(`${STORAGE_PREFIX}:crypto-key`, JSON.stringify(Array.from(new Uint8Array(exported))));
  return key;
}

function storageKey(scope: TokenScope): string {
  return `${STORAGE_PREFIX}:token:${scope}`;
}

function readRecord(raw: string): TokenRecord | null {
  try {
    const parsed = JSON.parse(raw) as TokenRecord;
    if (typeof parsed.token !== 'string' || parsed.token.length === 0) {
      return null;
    }
    return { token: parsed.token, createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now() };
  } catch {
    return null;
  }
}

// Encrypted at rest with an AES-GCM key that is scoped to the tab session
// (sessionStorage). Survives reload but is cleared when the tab closes.
// The threat model and the httpOnly-cookie BFF upgrade path are documented in
// the pwa README (phase 1 section).
export class EncryptedLocalStorageTokenStore implements TokenStore {
  async getToken(scope: TokenScope): Promise<TokenRecord | null> {
    const raw = localStorage.getItem(storageKey(scope));
    if (!raw) {
      return null;
    }
    const key = await getOrCreateEncryptionKey();
    if (!key) {
      return readRecord(raw);
    }
    try {
      const parsed = JSON.parse(raw) as { iv: number[]; data: number[] };
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(parsed.iv) },
        key,
        new Uint8Array(parsed.data),
      );
      return readRecord(decoder.decode(decrypted));
    } catch {
      return null;
    }
  }

  async setToken(scope: TokenScope, token: string): Promise<void> {
    const record: TokenRecord = { token, createdAt: Date.now() };
    const key = await getOrCreateEncryptionKey();
    if (!key) {
      localStorage.setItem(storageKey(scope), JSON.stringify(record));
      return;
    }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(record)));
    localStorage.setItem(storageKey(scope), JSON.stringify({ iv: Array.from(iv), data: Array.from(new Uint8Array(encrypted)) }));
  }

  async clearToken(scope: TokenScope): Promise<void> {
    localStorage.removeItem(storageKey(scope));
  }

  async clearAll(): Promise<void> {
    (['user', 'driver', 'store'] as const).forEach((scope) => {
      localStorage.removeItem(storageKey(scope));
    });
  }
}

export function createDefaultTokenStore(): TokenStore {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    return new EncryptedLocalStorageTokenStore();
  }
  return new InMemoryTokenStore();
}