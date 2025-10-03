<script lang="ts">
  import { onMount } from 'svelte';
  import { listItems, exportVaultJSON, importVaultJSON } from '../lib/storage/db';
  import type { VaultItem } from '../lib/types';
  import { itemsVersion, searchQuery, session } from '../lib/state/store';
  import { decryptJSON } from '../lib/crypto/crypto';

  let items: VaultItem[] = [];
  let loading = true;
  $: version = $itemsVersion;
  $: q = $searchQuery.trim().toLowerCase();
  $: results = q
    ? items.filter((i) =>
        (i.serviceName || '').toLowerCase().includes(q) ||
        (i.username || '').toLowerCase().includes(q) ||
        (i.url || '').toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      )
    : [];

  onMount(async () => {
    try {
      items = await listItems();
    } finally {
      loading = false;
    }
  });

  $: if (version !== undefined) {
    (async () => {
      items = await listItems();
    })();
  }

  let copyingId: string | null = null;
  let copiedId: string | null = null;
  let errorMsg: string | null = null;
  let infoMsg: string | null = null;
  let fileEl: HTMLInputElement;

  async function doExport() {
    try {
      const txt = await exportVaultJSON();
      const blob = new Blob([txt], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `clavebox-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      infoMsg = 'Exportado';
      setTimeout(() => (infoMsg = null), 1500);
    } catch (e) {
      console.error(e);
      errorMsg = 'No se pudo exportar.';
    }
  }

  async function handleImportChange(e: Event) {
    errorMsg = null;
    infoMsg = null;
    const input = e.currentTarget as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const res = await importVaultJSON(txt, 'merge');
      infoMsg = `Importado: ${res.imported}, omitidos: ${res.skipped}`;
      items = await listItems();
    } catch (err) {
      console.error(err);
      errorMsg = 'No se pudo importar.';
    }
    input.value = '';
  }

  async function copyPassword(item: VaultItem) {
    errorMsg = null;
    if (!$session.unlocked || !$session.derived) {
      errorMsg = 'Debes estar desbloqueado para copiar.';
      return;
    }
    try {
      copyingId = item.id;
      const payload = await decryptJSON<{ password: string }>($session.derived.contentKey, {
        ciphertext: item.ciphertext,
        nonce: item.nonce
      });
      await navigator.clipboard.writeText(payload.password);
      copiedId = item.id;
      setTimeout(() => { if (copiedId === item.id) copiedId = null; }, 2000);
    } catch (e) {
      console.error(e);
      errorMsg = 'No se pudo copiar la contraseña.';
    } finally {
      copyingId = null;
    }
  }
</script>

<div class="card p-3 space-y-3 sticky top-6">
  <div class="flex items-center justify-between gap-2">
    <div class="text-sm font-medium">Buscar</div>
    <div class="flex items-center gap-1">
      <button class="button px-2 py-1 text-xs" title="Exportar" aria-label="Exportar" on:click={doExport}>
        ⬇️
      </button>
      <button class="button px-2 py-1 text-xs" title="Importar" aria-label="Importar" on:click={() => fileEl?.click()}>
        ⬆️
      </button>
      <input class="hidden" type="file" accept="application/json" bind:this={fileEl} on:change={handleImportChange}/>
    </div>
  </div>
  <input
    class="input w-full"
    placeholder="Buscar por servicio, usuario, URL o categoría"
    bind:value={$searchQuery}
  />
  {#if errorMsg}
    <div class="text-sm text-red-600">{errorMsg}</div>
  {/if}
  {#if infoMsg}
    <div class="text-sm text-gray-500">{infoMsg}</div>
  {/if}
  {#if q && !loading}
    {#if results.length === 0}
      <div class="text-sm text-gray-500">Sin resultados</div>
    {:else}
      <div class="space-y-2 max-h-[60vh] overflow-auto pr-1">
        {#each results as item}
          <div class="border rounded p-2 text-sm flex items-center justify-between gap-2">
            <div class="min-w-0">
              <div class="font-medium truncate">{item.serviceName}</div>
              <div class="text-gray-500 truncate">
                {#if item.username}{item.username}{/if}
                {#if item.url} · <a class="text-brand-600 hover:underline" href={item.url} target="_blank" rel="noopener">{item.url}</a>{/if}
                {#if item.category} · {item.category}{/if}
              </div>
            </div>
            <button class="button text-xs" disabled={copyingId === item.id} on:click={() => copyPassword(item)}>
              {#if copiedId === item.id}
                Copiado
              {:else if copyingId === item.id}
                Copiando…
              {:else}
                Copiar
              {/if}
            </button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>
