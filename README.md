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
