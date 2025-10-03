<script lang="ts">
  let length = 16;
  let useUpper = true;
  let useLower = true;
  let useDigits = true;
  let useSymbols = true;
  let avoidAmbiguous = true;
  let result = '';

  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I,O
  const lower = 'abcdefghijkmnpqrstuvwxyz'; // sin l,o
  const digits = '23456789'; // sin 0,1
  const symbols = '!@#$%^&*()-_=+[]{};:,.?';

  function buildAlphabet() {
    let a = '';
    if (useUpper) a += avoidAmbiguous ? upper : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLower) a += avoidAmbiguous ? lower : 'abcdefghijklmnopqrstuvwxyz';
    if (useDigits) a += avoidAmbiguous ? digits : '0123456789';
    if (useSymbols) a += symbols;
    return a || 'abcdefghijklmnopqrstuvwxyz';
  }

  function generate() {
    const alphabet = buildAlphabet();
    const arr = new Uint32Array(length);
    crypto.getRandomValues(arr);
    let out = '';
    for (let i = 0; i < length; i++) {
      out += alphabet[arr[i] % alphabet.length];
    }
    result = out;
  }

  function copy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
  }
</script>

<div class="space-y-3">
  <div class="grid grid-cols-2 gap-3 text-sm">
    <label class="flex items-center gap-2"><input type="checkbox" bind:checked={useUpper} /> Mayúsculas</label>
    <label class="flex items-center gap-2"><input type="checkbox" bind:checked={useLower} /> Minúsculas</label>
    <label class="flex items-center gap-2"><input type="checkbox" bind:checked={useDigits} /> Números</label>
    <label class="flex items-center gap-2"><input type="checkbox" bind:checked={useSymbols} /> Símbolos</label>
  </div>
  <div class="flex items-center gap-3">
    <label for="len" class="text-sm">Longitud</label>
    <input id="len" type="range" min="8" max="64" bind:value={length} class="flex-1" />
    <span class="text-sm w-10 text-right">{length}</span>
  </div>
  <label class="flex items-center gap-2 text-sm"><input type="checkbox" bind:checked={avoidAmbiguous} /> Evitar caracteres ambiguos</label>
  <div class="flex items-center gap-2">
    <button class="button" on:click={generate}>Generar</button>
    <button class="button" on:click={copy} disabled={!result}>Copiar</button>
  </div>
  <input class="input" readonly value={result} placeholder="La contraseña aparecerá aquí" />
</div>
