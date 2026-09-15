// AES-256-CBC encryption mirrors of the PHP helpers in
// app/Helpers/common-helper.php (encryptText / decryptText):
//   - UTF-8 key string (16/24/32 bytes) and IV string (16 bytes)
//   - OPENSSL_RAW_DATA output encoded as standard base64 (with padding)
// The key strings are forwarded from the merchant resource (general_config)
// by getEncryptionConfig in @fixcycle/config.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSubtle(): SubtleCrypto | null {
  if (typeof crypto === 'undefined' || !('subtle' in crypto)) {
    return null;
  }
  return crypto.subtle;
}

async function importCbcKey(secret: string): Promise<CryptoKey | null> {
  const subtle = getSubtle();
  if (!subtle) {
    return null;
  }
  try {
    return await subtle.importKey('raw', encoder.encode(secret), { name: 'AES-CBC' }, false, [
      'encrypt',
      'decrypt',
    ]);
  } catch {
    return null;
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function encryptText(secret: string, iv: string, plainText: string): Promise<string> {
  const subtle = getSubtle();
  const key = await importCbcKey(secret);
  if (!subtle || !key) {
    throw new Error('WebCrypto AES-CBC is not available');
  }
  const encrypted = await subtle.encrypt({ name: 'AES-CBC', iv: encoder.encode(iv) }, key, encoder.encode(plainText));
  return bytesToBase64(new Uint8Array(encrypted));
}

export async function decryptText(secret: string, iv: string, encryptedText: string): Promise<string> {
  const subtle = getSubtle();
  const key = await importCbcKey(secret);
  if (!subtle || !key) {
    throw new Error('WebCrypto AES-CBC is not available');
  }
  const decrypted = await subtle.decrypt({ name: 'AES-CBC', iv: encoder.encode(iv) }, key, base64ToBytes(encryptedText));
  return decoder.decode(decrypted);
}

// Decrypt a value only when the response field is actually encrypted
// (merchant flag enabled). Any failure falls back to the raw value so a
// merchant that disables encryption still works without a hard dependency.
export async function tryDecrypt(secret: string, iv: string, value: string): Promise<string> {
  try {
    return await decryptText(secret, iv, value);
  } catch {
    return value;
  }
}

export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 'subtle' in crypto;
}