import type { DerivedKeys, VaultItem } from '../types';
import { deriveKeys, decryptJSON, encryptJSON, generateSalt, u8ToB64 } from '../crypto/crypto';
import { listItems, commitVaultRekey } from './db';

type PasswordPayload = { password: string };

async function contentKeysEqual(a: CryptoKey, b: CryptoKey): Promise<boolean> {
  const ra = new Uint8Array(await crypto.subtle.exportKey('raw', a));
  const rb = new Uint8Array(await crypto.subtle.exportKey('raw', b));
  if (ra.length !== rb.length) return false;
  for (let i = 0; i < ra.length; i++) {
    if (ra[i] !== rb[i]) return false;
  }
  return true;
}

/**
 * Verifica la frase actual, recifra todas las entradas con una nueva frase y un salt nuevo.
 * Persistencia atómica (transacción IndexedDB).
 */
export async function rotatePassphrase(
  currentDerived: DerivedKeys,
  currentPassphrase: string,
  newPassphrase: string
): Promise<DerivedKeys> {
  if (newPassphrase.length < 6) {
    throw new Error('La nueva frase debe tener al menos 6 caracteres.');
  }
  const verified = await deriveKeys(currentPassphrase, currentDerived.salt);
  if (!(await contentKeysEqual(currentDerived.contentKey, verified.contentKey))) {
    throw new Error('La frase actual no coincide.');
  }

  const newSalt = generateSalt(16);
  const newDerived = await deriveKeys(newPassphrase, newSalt);
  const items = await listItems();
  const now = Date.now();
  const updated: VaultItem[] = [];

  for (const item of items) {
    const payload = await decryptJSON<PasswordPayload>(currentDerived.contentKey, {
      ciphertext: item.ciphertext,
      nonce: item.nonce
    });
    const { ciphertext, nonce } = await encryptJSON(newDerived.contentKey, payload);
    updated.push({
      ...item,
      ciphertext,
      nonce,
      updatedAt: now
    });
  }

  await commitVaultRekey(u8ToB64(newSalt), updated);
  return newDerived;
}
