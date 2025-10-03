<script lang="ts">
  import { encryptJSON } from '../lib/crypto/crypto';
  import { putItem } from '../lib/storage/db';
  import type { VaultItem } from '../lib/types';
  import { session, vaultStore } from '../lib/state/store';
  import { v4 as uuidv4 } from 'uuid';

  let serviceName = '';
  let url = '';
  let username = '';
  let password = '';
  let category = '';
  let notes = '';
  let error = '';
  $: current = $session;

  async function add() {
    error = '';
    if (!current.unlocked || !current.derived) {
      error = 'Debes estar desbloqueado';
      return;
    }
    if (!serviceName || !password) {
      error = 'Completa al menos Servicio y Contraseña';
      return;
    }
    const now = Date.now();
    const payload = { password }; // solo ciframos la contraseña en este MVP
    const { ciphertext, nonce } = await encryptJSON(current.derived.contentKey, payload);
    const item: VaultItem = {
      id: uuidv4(),
      serviceName,
      url: url || undefined,
      username: username || undefined,
      category: category || undefined,
      notes: notes || undefined,
      ciphertext,
      nonce,
      createdAt: now,
      updatedAt: now
    };
    await putItem(item);
    serviceName = url = username = password = category = notes = '';
    vaultStore.bumpItems();
  }
</script>

<div class="card p-4 space-y-3">
  <h3 class="font-medium">Nueva entrada</h3>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
    <div>
      <label for="svc" class="block text-sm">Servicio</label>
      <input id="svc" class="input" bind:value={serviceName} placeholder="Ej: Gmail" />
    </div>
    <div>
      <label for="usr" class="block text-sm">Usuario/Email</label>
      <input id="usr" class="input" bind:value={username} />
    </div>
    <div class="md:col-span-2">
      <label for="url" class="block text-sm">URL</label>
      <input id="url" class="input" bind:value={url} placeholder="https://..." />
    </div>
    <div>
      <label for="pwd" class="block text-sm">Contraseña</label>
      <input id="pwd" class="input" type="password" bind:value={password} />
    </div>
    <div>
      <label for="cat" class="block text-sm">Categoría</label>
      <input id="cat" class="input" bind:value={category} placeholder="Trabajo / Personal" />
    </div>
    <div class="md:col-span-2">
      <label for="notes" class="block text-sm">Notas</label>
      <textarea id="notes" class="input" rows="2" bind:value={notes}></textarea>
    </div>
  </div>
  {#if error}
    <p class="text-sm text-red-600">{error}</p>
  {/if}
  <div class="flex gap-2">
    <button class="button" on:click={add}>Guardar</button>
  </div>
</div>
