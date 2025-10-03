<script lang="ts">
  import { session, vaultStore } from '../lib/state/store';
  import { getSaltB64, setSaltB64 } from '../lib/storage/db';
  import { deriveKeys, generateSalt, b64ToU8, u8ToB64 } from '../lib/crypto/crypto';

  let masterPhrase = '';
  let error = '';

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
    <input id="master-phrase" class="input" bind:value={masterPhrase} type="password" placeholder="••••••••" />
    {#if error}
      <p class="text-sm text-red-600">{error}</p>
    {/if}
    <button class="button w-full" on:click={handleLogin}>Acceder</button>
    <p class="text-xs text-gray-500">Se cifra todo localmente. No hay recuperación de frase.</p>
  </div>
</div>
