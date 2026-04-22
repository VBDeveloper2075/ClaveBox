<script lang="ts">
  import { session, vaultStore } from '../lib/state/store';
  import { rotatePassphrase } from '../lib/storage/rotatePassphrase';

  let current = '';
  let next = '';
  let confirm = '';
  let busy = false;
  let err: string | null = null;
  let ok: string | null = null;

  async function submit() {
    err = ok = null;
    const derived = $session.derived;
    if (!derived) {
      err = 'Sesión no disponible.';
      return;
    }
    if (next !== confirm) {
      err = 'La confirmación no coincide.';
      return;
    }
    if (next.length < 6) {
      err = 'La nueva frase debe tener al menos 6 caracteres.';
      return;
    }
    busy = true;
    try {
      const newDerived = await rotatePassphrase(derived, current, next);
      session.set({ unlocked: true, derived: newDerived });
      current = next = confirm = '';
      ok = 'Frase maestra actualizada.';
      vaultStore.bumpItems();
      setTimeout(() => (ok = null), 2500);
    } catch (e) {
      err = e instanceof Error ? e.message : 'Error al cambiar la frase.';
    } finally {
      busy = false;
    }
  }
</script>

<details class="text-xs border-t border-gray-100 pt-3 mt-3">
  <summary class="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">Cambiar frase maestra</summary>
  <p class="text-gray-500 mt-2 leading-snug">
    Sin la frase actual no se puede recuperar la bóveda (E2EE). Si vas a cambiarla, exporta un respaldo antes.
  </p>
  <div class="mt-2 space-y-2">
    <div>
      <label class="block text-gray-600 mb-0.5" for="cp-current">Frase actual</label>
      <input id="cp-current" class="input w-full text-sm" type="password" autocomplete="current-password" bind:value={current} />
    </div>
    <div>
      <label class="block text-gray-600 mb-0.5" for="cp-next">Frase nueva</label>
      <input id="cp-next" class="input w-full text-sm" type="password" autocomplete="new-password" bind:value={next} />
    </div>
    <div>
      <label class="block text-gray-600 mb-0.5" for="cp-confirm">Confirmar frase nueva</label>
      <input id="cp-confirm" class="input w-full text-sm" type="password" autocomplete="new-password" bind:value={confirm} />
    </div>
    {#if err}
      <p class="text-red-600">{err}</p>
    {/if}
    {#if ok}
      <p class="text-gray-600">{ok}</p>
    {/if}
    <button type="button" class="button w-full text-sm" disabled={busy} on:click={submit}>
      {busy ? 'Procesando…' : 'Aplicar cambio'}
    </button>
  </div>
</details>
