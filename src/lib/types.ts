export type KeyBytes = Uint8Array; // 32 bytes

export type DerivedKeys = {
  contentKey: CryptoKey; // AES-GCM key for content
  indexKey: KeyBytes; // raw bytes for hashing lightweight indexes
  salt: Uint8Array; // per-vault random salt
};

export type VaultSession = {
  unlocked: boolean;
  derived?: DerivedKeys;
};

export type VaultItem = {
  id: string;
  serviceName: string; // NombreServicio
  url?: string; // URL
  username?: string; // Usuario/Email
  category?: string; // Categoria
  notes?: string; // Notas (no sensible en este MVP)
  // Encrypted payload (ContraseñaCifrada y potencialmente otros sensibles)
  ciphertext: Uint8Array; // AES-GCM
  nonce: Uint8Array; // 12 bytes
  createdAt: number;
  updatedAt: number;
};
