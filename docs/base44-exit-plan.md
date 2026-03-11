# Code Review + Base44 Exit Plan

This document captures:
1. Key code-quality improvements to prioritize.
2. A concrete migration path to remove Base44 dependencies and run the app as a standalone product.

## 1) Code review findings and high-impact improvements

### A. Introduce an API adapter layer (highest priority)
**Problem:** UI components directly call `base44.entities.*`, `base44.integrations.*`, and `base44.auth.*`, which couples business logic to one vendor SDK.

**Improvement:** Add a stable app-level interface (`apiClient`) with modules like:
- `apiClient.auth.me/login/logout`
- `apiClient.activities.list/create/update/delete`
- `apiClient.categories.list/create/update/delete`
- `apiClient.ai.suggest`
- `apiClient.notifications.sendReminder`

Then update components/pages to consume only this interface.

**Why this matters:**
- Enables swapping Base44 for your own backend without touching most UI code.
- Improves testability (mock one adapter in tests).
- Centralizes error handling/retry policies.

---

### B. Remove fragile deep SDK import usage
**Problem:** `src/lib/AuthContext.jsx` imports `@base44/sdk/dist/utils/axios-client`, which is an internal SDK path and may break on package updates.

**Improvement:** Replace this with:
- Native `fetch`/Axios in your own wrapper, or
- Public SDK exports only.

**Why this matters:** Better upgrade safety and fewer hidden breakages.

---

### C. Normalize auth + app-state flow
**Problem:** Auth state and app public settings are loaded together with multiple nested `try/catch` flows.

**Improvement:**
- Split into separate hooks/services:
  - `useAppPublicSettings()`
  - `useCurrentUser()`
- Use consistent typed error shape: `{ code, message, details }`.

**Why this matters:** Easier debugging and cleaner routing/guard logic.

---

### D. Move side-effect logic out of UI components
**Problem:** Calendar-related components call integrations directly (`InvokeLLM`, email send) from presentation components.

**Improvement:** Move those calls into domain services (`services/reminders`, `services/suggestions`).

**Why this matters:** Cleaner components and easier unit/integration testing.

---

### E. Improve observability and production hardening
**Suggestions:**
- Add request IDs and structured logging for API failures.
- Add runtime env validation (`zod`) for required env vars.
- Add error boundaries around app shell routes.


## 2) How to remove Base44 dependencies (standalone app path)

## Current Base44 coupling map
- Build/runtime plugin: `@base44/vite-plugin` in `vite.config.js`.
- SDK client: `@base44/sdk` in `src/api/base44Client.js`.
- Direct Base44 usage across app pages/components/auth.
- Env contract based on `VITE_BASE44_*` keys.

## Target architecture

Frontend (React + Vite)
→ Calls your own backend API (`/api/*`) only
→ Uses your own auth provider (JWT session/cookies)
→ Uses provider-agnostic service modules

Backend (Node/Fastify/Express/Nest/whatever you choose)
→ Own database models: users, categories, activities
→ Own auth/session endpoints
→ Optional integrations: email + LLM providers

## Migration phases (recommended)

### Phase 0 — Freeze surface area
1. Create `src/api/client/index.ts` exposing app-level methods.
2. Replace direct `base44.*` calls with adapter calls, one feature at a time.
3. Keep Base44 behind `base44Adapter` for now.

### Phase 1 — Build standalone backend
Implement endpoints equivalent to current usage:
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `GET /api/activities`
- `POST /api/activities`
- `PATCH /api/activities/:id`
- `DELETE /api/activities/:id`
- `POST /api/ai/suggestions`
- `POST /api/notifications/reminder`

### Phase 2 — Add new adapter
1. Implement `standaloneAdapter` using `fetch('/api/...')`.
2. Switch one module at a time:
   - categories
   - activities
   - auth
   - integrations
3. Validate parity with existing UI behavior.

### Phase 3 — Remove Base44 packages and plugin
When no imports remain:
1. Remove from `package.json`:
   - `@base44/sdk`
   - `@base44/vite-plugin`
2. Replace `vite.config.js` plugin config with plain React Vite config.
3. Delete `src/api/base44Client.js`.
4. Rename env vars from `VITE_BASE44_*` to app-owned names, e.g.:
   - `VITE_API_BASE_URL`
   - `VITE_AUTH_MODE`

### Phase 4 — Cleanup and enforce
1. Add ESLint `no-restricted-imports` rule to block any new `@base44/*` imports.
2. Remove legacy Base44-related token keys from local storage and docs.

## Minimal config changes once migrated

### `vite.config.js` (after full migration)
```js
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()]
});
```

### package removal command
```bash
npm uninstall @base44/sdk @base44/vite-plugin
```

## Suggested implementation order (fastest path)
1. Categories CRUD adapter migration.
2. Activities CRUD adapter migration.
3. Auth migration.
4. LLM/email integration migration.
5. Remove plugin/deps and update env/docs.

## Acceptance checklist for “Base44-free” status
- [x] `rg -n "@base44|base44\." src vite.config.js package.json` returns no matches.
- [x] App boots with only app-owned env vars.
- [ ] Login/logout + CRUD + reminders/suggestions work against your backend.
- [ ] CI lint/typecheck/build pass.

