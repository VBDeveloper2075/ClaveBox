<script lang="ts">
  import { encryptJSON } from '../lib/crypto/crypto';
  import { putItem } from '../lib/storage/db';
  import type { VaultItem } from '../lib/types';
  import { session, vaultStore } from '../lib/state/store';
  import { v4 as uuidv4 } from 'uuid';
  import { onMount } from 'svelte';
  import { listItems } from '../lib/storage/db';

  let serviceName = '';
  let url = '';
  let username = '';
  let password = '';
  let category = '';
  let notes = '';
  let error = '';
  $: current = $session;

  // Autocompletado de categoría
  const defaultCategories = ['Personal', 'Trabajo', 'Finanzas', 'Impuestos', 'Gobierno', 'Compras'];
  let categories: string[] = [...defaultCategories];
  $: catSuggestions = category
    ? categories.filter((c) => c.toLowerCase().startsWith(category.toLowerCase()) && c.toLowerCase() !== category.toLowerCase())
    : [];

  onMount(async () => {
    try {
      const items = await listItems();
      const set = new Set<string>();
      for (const it of items) if (it.category) set.add(it.category);
      // Mezclar con defaults y ordenar
      categories = Array.from(new Set([...defaultCategories, ...set]))
        .sort((a, b) => a.localeCompare(b));
    } catch {}
  });

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
    // Normalizaciones
    serviceName = serviceName.trim();
    username = username.trim();
    category = category.trim();
    notes = notes.trim();
    let finalUrl = url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }
    const now = Date.now();
    const payload = { password }; // solo ciframos la contraseña en este MVP
    const { ciphertext, nonce } = await encryptJSON(current.derived.contentKey, payload);
    const item: VaultItem = {
      id: uuidv4(),
      serviceName,
      url: finalUrl || undefined,
      username: username || undefined,
      category: category || undefined,
      notes: notes || undefined,
      ciphertext,
      nonce,
      createdAt: now,
      updatedAt: now
    };
    await putItem(item);
    // Actualizar lista de categorías si es nueva
    if (category && !categories.includes(category)) {
      categories = [...categories, category].sort((a, b) => a.localeCompare(b));
    }
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
    <div class="relative">
      <label for="cat" class="block text-sm">Categoría</label>
      <input
        id="cat"
        class="input"
        bind:value={category}
        placeholder="Trabajo / Personal"
        on:keydown={(e) => {
          if (e.key === 'Tab' && catSuggestions[0]) {
            e.preventDefault();
            category = catSuggestions[0];
          }
        }}
      />
      {#if category && catSuggestions[0]}
        <div class="absolute -top-5 left-0 text-xs px-2 py-0.5 rounded border bg-gray-900/90 text-brand-600 border-gray-700 shadow z-20 pointer-events-none">
          {catSuggestions[0]}
        </div>
      {/if}
      {#if catSuggestions.length > 0}
        <div class="mt-1 flex flex-wrap gap-1 text-xs">
          {#each catSuggestions.slice(0,5) as s}
            <button
              type="button"
              class="px-2 py-0.5 rounded border text-brand-600 border-brand-200 hover:bg-brand-50"
              on:click={() => (category = s)}>{s}</button>
          {/each}
        </div>
      {/if}
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
