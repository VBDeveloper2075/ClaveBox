<script lang="ts">
  import { onMount } from 'svelte';
  import { listItems, deleteItem, putItem } from '../lib/storage/db';
  import type { VaultItem } from '../lib/types';
  import { itemsVersion, session, vaultStore } from '../lib/state/store';
  import { decryptJSON, encryptJSON } from '../lib/crypto/crypto';

  let items: VaultItem[] = [];
  let loading = true;
  $: version = $itemsVersion;

  // UI feedback state
  let copyingId: string | null = null;
  let copiedId: string | null = null;
  let deletingId: string | null = null;
  let errorMsg: string | null = null;

  // Edit modal state
  let showEdit = false;
  let editing: VaultItem | null = null;
  let eService = '';
  let eUrl = '';
  let eUser = '';
  let eCategory = '';
  let eNotes = '';
  let ePassword = '';
  let saving = false;

  onMount(async () => {
    try {
      items = await listItems();
    } finally {
      loading = false;
    }
  });

  function openEdit(item: VaultItem) {
    editing = item;
    eService = item.serviceName ?? '';
    eUrl = item.url ?? '';
    eUser = item.username ?? '';
    eCategory = item.category ?? '';
    eNotes = item.notes ?? '';
    ePassword = '';
    showEdit = true;
  }

  async function saveEdit() {
    if (!editing) return;
    try {
      saving = true;
      const now = Date.now();
      const updated: VaultItem = { ...editing };
      updated.serviceName = eService.trim() || editing.serviceName;
      const urlTrim = eUrl.trim();
      updated.url = urlTrim ? (/^https?:\/\//i.test(urlTrim) ? urlTrim : `https://${urlTrim}`) : undefined;
      updated.username = eUser.trim() || undefined;
      updated.category = eCategory.trim() || undefined;
      updated.notes = eNotes.trim() || undefined;
      updated.updatedAt = now;

      // If user typed a new password, re-encrypt; otherwise keep existing ciphertext/nonce
      const pwd = ePassword.trim();
      if (pwd) {
        if (!$session.unlocked || !$session.derived) throw new Error('Sesión bloqueada');
        const { ciphertext, nonce } = await encryptJSON($session.derived.contentKey, { password: pwd });
        updated.ciphertext = ciphertext;
        updated.nonce = nonce;
      }

      await putItem(updated);
      showEdit = false;
      editing = null;
      vaultStore.bumpItems();
    } catch (e) {
      console.error(e);
      errorMsg = 'No se pudo guardar los cambios.';
    } finally {
      saving = false;
    }
  }

  // Reload when itemsVersion changes
  $: if (version !== undefined) {
    (async () => {
      items = await listItems();
    })();
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
      setTimeout(() => {
        if (copiedId === item.id) copiedId = null;
      }, 2000);
    } catch (e) {
      console.error(e);
      errorMsg = 'No se pudo copiar la contraseña.';
    } finally {
      copyingId = null;
    }
  }

  async function removeItem(item: VaultItem) {
    errorMsg = null;
    const ok = confirm(`Eliminar "${item.serviceName}"? Esta acción no se puede deshacer.`);
    if (!ok) return;
    try {
      deletingId = item.id;
      await deleteItem(item.id);
      vaultStore.bumpItems();
    } catch (e) {
      console.error(e);
      errorMsg = 'No se pudo eliminar.';
    } finally {
      deletingId = null;
    }
  }
</script>

  {#if loading}
    <div class="text-sm text-gray-500">Cargando…</div>
  {:else if items.length === 0}
    <div class="card p-4 text-sm text-gray-600">Aún no hay entradas. Crea tu primera contraseña.</div>
  {:else}
    {#if errorMsg}
      <div class="text-sm text-red-600">{errorMsg}</div>
    {/if}
    {#each items as item}
      <div class="card p-4 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <div class="font-medium truncate">{item.serviceName}</div>
          <div class="text-sm text-gray-500 flex gap-2 items-center">
            {#if item.username}<span class="truncate">{item.username}</span>{/if}
            {#if item.url}<a class="text-brand-600 hover:underline truncate" href={item.url} target="_blank" rel="noopener">{item.url}</a>{/if}
            {#if item.category}<span class="px-2 py-0.5 rounded bg-gray-100 border text-gray-600">{item.category}</span>{/if}
          </div>
        </div>
        <div class="flex items-center gap-1">
          <button class="button px-2 py-1" aria-label="Editar" title="Editar" on:click={() => openEdit(item)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 0 0 0-1.42l-2.34-2.34a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
            </svg>
          </button>
          <button class="button px-2 py-1" aria-label="Copiar" title="Copiar" disabled={copyingId === item.id} on:click={() => copyPassword(item)}>
            {#if copiedId === item.id}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4c-1.1 0-2 .9-2 2v12h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            {/if}
          </button>
          <button class="button px-2 py-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100" aria-label="Eliminar" title="Eliminar" disabled={deletingId === item.id} on:click={() => removeItem(item)}>
            {#if deletingId === item.id}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 19c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z"/></svg>
            {/if}
          </button>
        </div>
        <div class="text-xs text-gray-400 shrink-0">{new Date(item.updatedAt).toLocaleString()}</div>
      </div>
    {/each}
  {/if}
 
 {#if showEdit}
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="card bg-white w-full max-w-lg p-4 space-y-3">
      <h3 class="font-medium">Editar entrada</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-sm">Servicio</label>
          <input class="input" bind:value={eService} />
        </div>
        <div>
          <label class="block text-sm">Usuario/Email</label>
          <input class="input" bind:value={eUser} />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm">URL</label>
          <input class="input" bind:value={eUrl} placeholder="https://..." />
        </div>
        <div>
          <label class="block text-sm">Nueva contraseña (opcional)</label>
          <input class="input" type="password" bind:value={ePassword} />
        </div>
        <div>
          <label class="block text-sm">Categoría</label>
          <input class="input" bind:value={eCategory} />
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm">Notas</label>
          <textarea class="input" rows="2" bind:value={eNotes}></textarea>
        </div>
      </div>
      {#if errorMsg}
        <p class="text-sm text-red-600">{errorMsg}</p>
      {/if}
      <div class="flex gap-2 justify-end">
        <button class="button" on:click={() => (showEdit = false, editing = null)}>Cancelar</button>
        <button class="button" disabled={saving} on:click={saveEdit}>{saving ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </div>
  </div>
{/if}
