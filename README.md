# Opeari Beta (Dec 2025)

## Local Development

To run the application locally with full support for Netlify Functions (required for email sending), use the Netlify CLI:

```bash
npx netlify dev
```

This will start the local server (typically at `http://localhost:8888`) and proxy API requests to local functions.

**Note:** Running `npm run dev` (Vite only) will **not** support the `/.netlify/functions/*` endpoints, causing 404 errors for email confirmation.

## Environment Variables

Ensure your `RESEND_API_KEY` is set in your `.env` file or Netlify project settings to enable email sending.

## Admin Security Setup (Required)

The `/admin-waitlist` page is protected by a shared secret.

### 1. Production (Netlify)

Go to **Site Settings > Build & Deploy > Environment** and add:

- Key: `NETLIFY_ADMIN_SECRET`
- Value: (Your chosen secret password)

### 2. Local Development

Add the same variable to your local `.env` file:

```bash
NETLIFY_ADMIN_SECRET=your_local_secret
```

### 3. Usage

When you visit `/admin-waitlist`, you will be prompted to "Enter NETLIFY_ADMIN_SECRET". Enter the value you set above.

## Local Development – Golden Rules (Vite + Netlify + SPA)

Read this before touching routing, ports, or dev commands.
These rules exist to prevent silent failures, blank pages, and “it works on one port but not the other” bugs.

### 1️⃣ Single Source of Truth for SPA Routing

All SPA fallback and dev-path exclusions live in `public/_redirects`.

Do NOT define `[[redirects]]` in `netlify.toml`.

Having redirects in both places will cause Vite dev modules (e.g. `/src/main.tsx`) to be rewritten to HTML, breaking the dev server.

**✅ Correct:**

`public/_redirects` → SPA fallback + exclusions

**❌ Avoid:**

`[[redirects]]` in `netlify.toml`

### 2️⃣ Protect Vite Dev Module Paths

The following paths must never be rewritten to `index.html` during dev:

- `/src/*`
- `/@vite/*`
- `/@react-refresh`
- `/node_modules/*`
- `/assets/*`
- `/favicon.ico`
- `/manifest.webmanifest`
- `/icons/*`
- `/.netlify/functions/*`

These are explicitly handled in `public/_redirects`.

### 3️⃣ Ports Are Fixed and Non-Negotiable

- **Vite** must run on **5173**
- **Netlify Dev** must run on **8888**

Vite uses `strictPort: true` to prevent silent port drift.

If ports are occupied, kill them first:

```bash
kill -9 $(lsof -tiTCP:5173 -sTCP:LISTEN) 2>/dev/null || true
kill -9 $(lsof -tiTCP:8888 -sTCP:LISTEN) 2>/dev/null || true
```

Then start:

```bash
npm run dev:netlify
```

### 4️⃣ Only One Dev Command at a Time

❌ Do NOT run `npm run dev` and `npm run dev:netlify` simultaneously

✅ Use only `npm run dev:netlify` for local development

Netlify Dev proxies Vite internally — running both creates port conflicts.

### 5️⃣ Netlify Functions Must Match Module Type

This project uses:

```json
"type": "module"
```

Therefore:

✅ Netlify functions use **ESM syntax**

❌ No `require()` or `exports.handler`

Correct pattern:

```javascript
import { createClient } from '@supabase/supabase-js'

export const handler = async (event) => {
  ...
}
```

### 6️⃣ Build vs Dev Are Different Worlds

- `npm run build` validates **production**
- `npm run dev:netlify` validates **local routing + proxy behavior**

A successful build does not guarantee dev stability if redirects or ports are misconfigured.

### 7️⃣ If Something Looks “Randomly Broken”

Check these in order:

1. Are redirects defined in more than one place?
2. Are Vite module paths being rewritten to HTML?
3. Is Vite actually on 5173?
4. Is Netlify proxying to the same port?
5. Are there zombie processes?

90% of issues come from one of these.

### 🛑 Things We Intentionally Avoid

- Multiple SPA fallback definitions
- “Temporary” Vite workarounds like `assetsInclude` unless explicitly documented
- Letting Netlify guess ports
- Mixing CommonJS + ESM

### 🧠 Why This Exists

This setup prevents:

- Blank pages on refresh
- Internal Server Error in Vite
- JS files returning `text/html`
- Inconsistent behavior between browsers
- “Works on my machine” routing bugs

### ✅ Status

This project is currently configured to follow all of the above rules.
