<script lang="ts">
  const items = [
    { label: 'New Item', icon: '＋', primary: true },
    { label: 'All Items', icon: '🛡️' },
    { label: 'Favorites', icon: '⭐' },
    { label: 'Social Media', icon: '👥' },
    { label: 'Banking', icon: '🏦', active: true },
    { label: 'Work', icon: '💼' },
    { label: 'Settings', icon: '⚙️' }
  ];
</script>

<aside class="sidebar">
  <div class="space-y-2">
    {#each items as it}
      {#if it.primary}
        <button class="w-full button">{it.label}</button>
      {:else}
        <a class="nav-item {it.active ? 'bg-gray-800 text-white' : ''}" href="#">
          <span class="text-lg">{it.icon}</span>
          <span>{it.label}</span>
        </a>
      {/if}
    {/each}
  </div>
</aside>
