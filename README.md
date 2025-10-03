# ClaveBox — Tu bóveda de contraseñas E2EE, minimalista y segura

## 🎯 ¿Qué es ClaveBox?
ClaveBox es una aplicación web (PWA) de gestión de contraseñas y cuentas con cifrado extremo a extremo (E2EE). Todo se cifra en tu navegador con tu Frase Maestra. El servidor nunca ve tus datos en claro.

- 🔐 Seguridad real: Argon2id + AES‑GCM en cliente.
- 🧠 Simple y rápida: diseño minimalista, búsqueda omnibox.
- 📱 Multiplataforma: funciona en desktop y móvil (PWA).


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
- 🔐 Cifrado extremo a extremo en el navegador
- 💾 Almacenamiento local seguro (sin cuentas, sin servidores)
- 📝 CRUD completo: crear, editar, copiar y eliminar
- 🔎 Búsqueda lateral con resultados instantáneos
- 🔧 Generador de contraseñas potente

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

### 🌐 Variables de entorno
No es necesario configurar variables para usar ClaveBox. Funciona 100% en tu navegador.

### ▶️ Cómo usar
1) Ingresa una **Frase Maestra** (es tu llave; no se recupera).
2) Crea entradas: servicio, usuario, contraseña y notas.
3) Usa el buscador lateral para encontrar rápido y el botón copiar para pegar donde necesites.

---

## 🏗️ Arquitectura (en una frase)
Aplicación web ligera que cifra todo en tu dispositivo y guarda localmente. No enviamos tus secretos a ningún servidor.

Beneficios para ti y tu equipo:
- **Privacidad total**: tus contraseñas nunca salen en claro.
- **Rápida y sin fricción**: funciona offline, sin registros ni contraseñas maestras guardadas.
- **Control local**: tus datos están en tu dispositivo; tú decides si exportas un respaldo.

---

## 🔒 Seguridad (alto nivel)
- Derivación robusta de clave a partir de tu Frase Maestra.
- Cifrado autenticado por ítem con claves efímeras.
- Cierre de bóveda borra claves de la memoria.
- Política de contenido del sitio que limita ejecución y orígenes.

> Nota: no subas tu `.env` ni datos en claro a ningún repositorio. `.gitignore` ya lo bloquea.

---

## 🖼️ Experiencia
- Inicio simple: ingresa tu Frase Maestra y accede.
- Lista clara: ver servicio, usuario y enlaces.
- Acciones rápidas: copiar, editar y eliminar en un toque.
- Generador de contraseñas siempre a mano.

---

## 🧩 Roadmap
- [ ] Passkeys/WebAuthn
- [ ] Extensión de navegador (autocompletar)
- [ ] Compartición segura E2EE
- [ ] Auditoría de contraseñas
- [ ] Exportación/Importación cifrada

---

## 🆘 Soporte y contacto
¿Quieres una versión marca blanca o agregar features empresariales (SSO, SCIM, auditorías)? Escríbeme y lo planificamos.
