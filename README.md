# ClaveBox — Tu bóveda de contraseñas E2EE, minimalista y segura

## 🎯 ¿Qué es ClaveBox?
ClaveBox es una aplicación web (PWA) de gestión de contraseñas y cuentas con cifrado extremo a extremo (E2EE). Todo se cifra en tu navegador con tu Frase Maestra. El servidor nunca ve tus datos en claro.

- 🔐 Seguridad real: Argon2id + AES‑GCM en cliente.
- 🧠 Simple y rápida: diseño minimalista, búsqueda omnibox.
- 📱 Multiplataforma: funciona en desktop y móvil (PWA).
- ☁️ Sync opcional: Supabase solo almacena blobs cifrados.

---

## ✅ Beneficios de seguridad para tus usuarios y tu organización
- **Zero‑Knowledge**: tu Frase Maestra nunca sale de tu dispositivo.
- **Cifrado moderno**: derivación con Argon2id y cifrado AES‑256‑GCM por registro.
- **Integridad y confidencialidad**: cada ítem usa nonce único y AEAD.
- **Compartición segura** (futuro): enlaces efímeros E2EE.
- **Backups seguros**: exportación cifrada y clave de recuperación.
- **Hardening Web**: CSP estricta, sin eval, limpieza de clipboard, auto‑bloqueo.

---

## 🧭 Estado actual
- 🧱 Estructura de proyecto creada (Svelte + Vite + Tailwind + TS)
- 🔐 Módulos de cifrado y almacenamiento local listos (base)
- 🧩 Conector Supabase preparado para blobs cifrados
- 🖥️ UI mínima: Login, Lista y Generador (esqueleto)

---

## 🚀 Guía rápida de instalación y uso

### 📋 Prerrequisitos
- Node.js 18+
- Git

### 🛠️ Instalación
```bash
npm install
npm run dev
```
Abre http://localhost:5173

### 🌐 Variables de entorno (opcional Sync)
Copia `.env.example` a `.env` y completa:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

### ▶️ Flujo de uso
1) Ingresa una **Frase Maestra** (guárdala bien; no se puede recuperar).
2) Crea entradas: sitio, usuario, contraseña, notas seguras, TOTP.
3) Activa Sync (opcional) para respaldar tus datos como blobs cifrados.

---

## 🏗️ Arquitectura
- Frontend: Svelte + TypeScript + Tailwind (PWA).
- Crypto: WebCrypto (AES‑GCM) + Argon2id (WASM `argon2-browser`).
- Local: IndexedDB (`idb`).
- Sync: Supabase (Postgres/Storage) como repositorio de blobs cifrados.

```
[Frase Maestra]
   └─Argon2id──▶ [Clave de bóveda]
                      ├─▶ AES‑GCM cifrar/descifrar ítems
                      └─▶ Claves derivadas para índices/compartición

[IndexedDB] ◀── blobs cifrados ──▶ [Supabase]
```

---

## 🔒 Diseño de seguridad
- Derivación: Argon2id (mem configurable) + sal aleatoria por bóveda.
- Cifrado: AES‑GCM 256‑bit, nonce único por registro, AAD con metadatos mínimos.
- Claves separadas: contenido e índices (evita filtración lateral).
- Zero‑Knowledge: el backend nunca recibe tu frase ni claves.
- Limpieza: auto‑bloqueo por inactividad y borrado de claves de memoria.

> Nota: no subas tu `.env` ni datos en claro a ningún repositorio. `.gitignore` ya lo bloquea.

---

## 🖼️ UI y experiencia
- Inicio: un solo campo (Frase Maestra) + Acceder / Passkey (futuro)
- Lista: tarjetas con favicon, usuario, copiar en un clic
- Generador: longitud, A‑Z, a‑z, 0‑9, símbolos, evitar ambiguos
- Colecciones: etiquetas Trabajo / Personal / Bancos (futuro)

---

## 🧩 Roadmap
- [ ] Passkeys/WebAuthn para login sin frase
- [ ] Extensión de navegador (autocompletar)
- [ ] Compartición segura E2EE entre cuentas
- [ ] Auditoría de contraseñas débiles/repetidas
- [ ] Exportación/Importación cifrada

---

## 🆘 Soporte y contacto
¿Quieres una versión marca blanca o agregar features empresariales (SSO, SCIM, auditorías)? Escríbeme y lo planificamos.
