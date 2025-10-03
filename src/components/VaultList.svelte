<script lang="ts">
  import { onMount } from 'svelte';
  import { listItems } from '../lib/storage/db';
  import type { VaultItem } from '../lib/types';
  import { itemsVersion } from '../lib/state/store';

  let items: VaultItem[] = [];
  let loading = true;
  $: version = $itemsVersion;

  onMount(async () => {
    try {
      items = await listItems();
    } finally {
      loading = false;
    }
  });

  // Reload when itemsVersion changes
  $: if (version !== undefined) {
    (async () => {
      items = await listItems();
    })();
  }
</script>

<div class="space-y-3">
  {#if loading}
    <div class="text-sm text-gray-500">Cargando…</div>
  {:else if items.length === 0}
    <div class="card p-4 text-sm text-gray-600">Aún no hay entradas. Crea tu primera contraseña.</div>
  {:else}
    {#each items as item}
      <div class="card p-4 flex items-center justify-between">
        <div>
          <div class="font-medium">{item.serviceName}</div>
          <div class="text-sm text-gray-500 flex gap-2 items-center">
            {#if item.username}<span>{item.username}</span>{/if}
            {#if item.url}<a class="text-brand-600 hover:underline" href={item.url} target="_blank" rel="noopener">{item.url}</a>{/if}
            {#if item.category}<span class="px-2 py-0.5 rounded bg-gray-100 border text-gray-600">{item.category}</span>{/if}
          </div>
        </div>
        <div class="text-xs text-gray-400">{new Date(item.updatedAt).toLocaleString()}</div>
      </div>
    {/each}
  {/if}
</div>
