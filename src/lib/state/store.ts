import { writable } from 'svelte/store';
import type { VaultSession } from '../types';

export const session = writable<VaultSession>({
  unlocked: false
});

// Version para notificar cambios en la lista de items
export const itemsVersion = writable(0);

function createVaultStore() {
  return {
    lock() {
      session.set({ unlocked: false });
    },
    unlock() {
      session.set({ unlocked: true });
    },
    bumpItems() {
      itemsVersion.update((v) => v + 1);
    }
  };
}

export const vaultStore = createVaultStore();
