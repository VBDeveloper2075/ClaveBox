import { writable } from 'svelte/store';
import type { VaultSession } from '../types';

export const session = writable<VaultSession>({
  unlocked: false
});

// Version para notificar cambios en la lista de items
export const itemsVersion = writable(0);

// Búsqueda global de items
export const searchQuery = writable('');

// Auto-lock timer
let lockTimer: number | null = null;
const LOCK_TIMEOUT = 15 * 60 * 1000; // 15 minutos en milisegundos

function createVaultStore() {
  return {
    lock() {
      // Limpiar timer si existe
      if (lockTimer) {
        clearTimeout(lockTimer);
        lockTimer = null;
      }
      
      // Limpiar todos los stores sensibles
      session.set({ unlocked: false, derived: undefined });
      searchQuery.set(''); // Limpiar búsquedas por seguridad
      
      console.log('[ClaveBox] Sesión bloqueada y memoria limpiada');
    },
    
    unlock() {
      session.set({ unlocked: true });
      this.resetLockTimer(); // Iniciar timer después del unlock
    },
    
    resetLockTimer() {
      // Cancelar timer anterior si existe
      if (lockTimer) {
        clearTimeout(lockTimer);
      }
      
      // Solo crear timer si la sesión está desbloqueada
      const currentSession = session;
      let isUnlocked = false;
      const unsubscribe = currentSession.subscribe(s => {
        isUnlocked = s.unlocked;
      });
      unsubscribe();
      
      if (isUnlocked) {
        lockTimer = window.setTimeout(() => {
          console.log('[ClaveBox] Auto-lock por inactividad');
          this.lock();
        }, LOCK_TIMEOUT);
      }
    },
    
    bumpItems() {
      itemsVersion.update((v) => v + 1);
      // Resetear timer en cada actividad
      this.resetLockTimer();
    }
  };
}

export const vaultStore = createVaultStore();

// Event listeners para detectar actividad del usuario
if (typeof window !== 'undefined') {
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const handleUserActivity = () => {
    // Solo resetear si hay una sesión activa
    let isUnlocked = false;
    const unsubscribe = session.subscribe(s => {
      isUnlocked = s.unlocked;
    });
    unsubscribe();
    
    if (isUnlocked) {
      vaultStore.resetLockTimer();
    }
  };
  
  // Throttle para evitar demasiadas llamadas
  let throttleTimer: number | null = null;
  const throttledActivity = () => {
    if (throttleTimer) return;
    
    throttleTimer = window.setTimeout(() => {
      handleUserActivity();
      throttleTimer = null;
    }, 1000); // Throttle de 1 segundo
  };
  
  // Agregar listeners de actividad
  activityEvents.forEach(event => {
    document.addEventListener(event, throttledActivity, { passive: true });
  });
}