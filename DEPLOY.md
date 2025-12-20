# Deployment Checklist

## Environment Variables (Netlify)

When deploying to Netlify, go to **Site Settings > Build & Deploy > Environment** and add these variables. Do NOT commit them to Git.

| Variable Key | Description | Where to find it |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Connection URL for Database | Supabase Settings > API |
| `SUPABASE_ANON_KEY` | Public API Key | Supabase Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** Admin Key (for Functions) | Supabase Settings > API |
| `RESEND_API_KEY` | Email Service API Key | Resend Dashboard |
| `NETLIFY_ADMIN_SECRET` | Password for `/admin-waitlist` | You pick this password! |

## Build Settings

These are already configured in `netlify.toml`, but verify if asked:

- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Functions Directory:** `netlify/functions`

## Verification

After deployment:

1. Visit `https://your-site.app/waitlist` and sign up.
    - Confirm you get a success message.
    - Confirm you receive an email.
2. Visit `https://your-site.app/admin-waitlist`.
    - Enter your `NETLIFY_ADMIN_SECRET`.
    - Confirm you see the new user.
