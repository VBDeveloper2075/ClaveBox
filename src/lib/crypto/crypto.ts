import type { DerivedKeys } from '../types';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export async function deriveKeys(passphrase: string, salt: Uint8Array): Promise<DerivedKeys> {
  // Use Argon2id via WASM. Parameters can be tuned by device; start with sane defaults.
  const memMb = Number(import.meta.env.VITE_ARGON2_MEM_MB ?? 128);
  const iterations = Number(import.meta.env.VITE_ARGON2_ITER ?? 3);

  // Dynamic import to support different module shapes (named/default)
  let argon2Hash: any = undefined;
  // Import ONLY the bundled build to avoid Vite trying to resolve argon2.wasm and Node APIs
  try {
    const m2: any = await import('argon2-browser/dist/argon2-bundled.min.js');
    argon2Hash = m2 && (m2.hash || m2.default?.hash || m2.default);
  } catch {}
  let full: Uint8Array;
  if (typeof argon2Hash === 'function') {
    const res = await argon2Hash({
      pass: passphrase,
      salt,
      type: 'Argon2id',
      mem: memMb * 1024, // KiB
      time: iterations,
      hashLen: 64, // 64 bytes -> split
      parallelism: 1
    });
    full = new Uint8Array(res.hash);
  } else {
    // Fallback: PBKDF2 (WebCrypto). Menos resistente a GPU, pero funcional.
    console.warn('[ClaveBox] Argon2 no disponible, usando PBKDF2 temporalmente');
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(passphrase),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    const pbkdf2Iterations = 310_000; // recomendado moderno
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: pbkdf2Iterations, hash: 'SHA-256' },
      keyMaterial,
      512 // 64 bytes
    );
    full = new Uint8Array(bits);
  }
  const contentRaw = full.slice(0, 32);
  const indexKey = full.slice(32, 64);
  const contentKey = await crypto.subtle.importKey(
    'raw',
    contentRaw,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return { contentKey, indexKey, salt };
}

export function generateSalt(bytes = 16): Uint8Array {
  const s = new Uint8Array(bytes);
  crypto.getRandomValues(s);
  return s;
}

export type Cipher = { ciphertext: Uint8Array; nonce: Uint8Array };

export async function encryptJSON(key: CryptoKey, data: unknown): Promise<Cipher> {
  const nonce = new Uint8Array(12);
  crypto.getRandomValues(nonce);
  const plaintext = textEncoder.encode(JSON.stringify(data));
  const params: AesGcmParams = { name: 'AES-GCM', iv: nonce };
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt(params, key, plaintext));
  return { ciphertext, nonce };
}

export async function decryptJSON<T>(key: CryptoKey, cipher: Cipher): Promise<T> {
  const params: AesGcmParams = { name: 'AES-GCM', iv: cipher.nonce };
  const plain = new Uint8Array(await crypto.subtle.decrypt(params, key, cipher.ciphertext));
  return JSON.parse(textDecoder.decode(plain)) as T;
}

export function u8ToB64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

export function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
