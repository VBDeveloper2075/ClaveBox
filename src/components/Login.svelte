<script lang="ts">
  import { session, vaultStore } from '../lib/state/store';
  import { getSaltB64, setSaltB64 } from '../lib/storage/db';
  import { deriveKeys, generateSalt, b64ToU8, u8ToB64 } from '../lib/crypto/crypto';

  let masterPhrase = '';
  let error = '';
  let show = false;
  let inputEl: HTMLInputElement;

  async function handleLogin() {
    error = '';
    if (!masterPhrase || masterPhrase.length < 6) {
      error = 'Ingresa una frase maestra de al menos 6 caracteres';
      return;
    }
    try {
      // Obtener o crear salt real
      let saltB64 = await getSaltB64();
      if (!saltB64) {
        const salt = generateSalt(16);
        saltB64 = u8ToB64(salt);
        await setSaltB64(saltB64);
      }
      const salt = b64ToU8(saltB64);
      // Derivar claves (Argon2id o fallback PBKDF2)
      const derived = await deriveKeys(masterPhrase, salt);
      // Guardar sesión desbloqueada con claves derivadas
      session.set({ unlocked: true, derived });
    } catch (e) {
      console.error(e);
      error = 'No se pudo derivar la clave. Recarga la página e inténtalo de nuevo.';
    }
  }
</script>

<div class="max-w-md mx-auto">
  <div class="card p-6 space-y-4">
    <h2 class="text-lg font-semibold">Accede a tu bóveda</h2>
    <label for="master-phrase" class="block text-sm font-medium">Frase Maestra</label>
    <div class="relative">
      <input id="master-phrase" class="input pr-10" bind:this={inputEl} bind:value={masterPhrase} type="password" placeholder="••••••••" />
      <button type="button" aria-label={show ? 'Ocultar' : 'Mostrar'} title={show ? 'Ocultar' : 'Mostrar'} class="absolute right-2 top-1/2 -translate-y-1/2 text-brand-600" on:click={() => { show = !show; if (inputEl) inputEl.type = show ? 'text' : 'password'; }}>
        {#if show}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 6a11.77 11.77 0 0 1 10 6 11.77 11.77 0 0 1-10 6 11.77 11.77 0 0 1-10-6 11.77 11.77 0 0 1 10-6m0 2a4 4 0 1 0 4 4 4 4 0 0 0-4-4Z"/></svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M2 5.27 3.28 4l16.97 16.97-1.27 1.27-2.21-2.21A11.31 11.31 0 0 1 12 18c-5 0-9.27-3-11-7a12.39 12.39 0 0 1 5.06-5.69L2 5.27ZM9.9 7.17 7.68 4.95A11.4 11.4 0 0 1 12 4c5 0 9.27 3 11 7a12.8 12.8 0 0 1-3.22 4.18l-2.18-2.18A4 4 0 0 0 12 8a3.9 3.9 0 0 0-2.1.57Z"/></svg>
        {/if}
      </button>
    </div>
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    <button class="button w-full" on:click={handleLogin}>Acceder</button>
    <p class="text-xs text-gray-500">Se cifra todo localmente. No hay recuperación de frase.</p>
  </div>
</div>
