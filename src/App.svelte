<script lang="ts">
  import { onMount } from 'svelte';
  import Login from './components/Login.svelte';
  import VaultList from './components/VaultList.svelte';
  import PasswordGenerator from './components/PasswordGenerator.svelte';
  import AddEntry from './components/AddEntry.svelte';
  import { session, vaultStore } from './lib/state/store';
  import { initDB } from './lib/storage/db';

  onMount(() => {
    initDB();
  });
</script>

<div class="min-h-screen flex flex-col">
  <header class="border-b bg-white">
    <div class="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold">🔐 ClaveBox</h1>
      <div class="flex items-center gap-2" >
        {#if $session.unlocked}
          <button class="button" on:click={() => vaultStore.lock()}>Bloquear</button>
        {/if}
      </div>
    </div>
  </header>

  <main class="flex-1">
    <div class="mx-auto max-w-5xl px-4 py-6">
      {#if !$session.unlocked}
        <Login />
      {:else}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <AddEntry />
            <VaultList />
          </div>
          <div class="space-y-6">
            <div class="card p-4">
              <h2 class="font-medium mb-2">Generador de Contraseñas</h2>
              <PasswordGenerator />
            </div>
          </div>
        </div>
      {/if}
    </div>
  </main>

  <footer class="border-t bg-white">
    <div class="mx-auto max-w-5xl px-4 py-4 text-sm text-gray-500">
      E2EE • Tus datos jamás salen en claro
    </div>
  </footer>
</div>
