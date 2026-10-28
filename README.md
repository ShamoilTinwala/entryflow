# EntryFlow

Event registration and gate-entry management UI. The current application runtime is still a browser prototype: its app data is stored in localStorage and is not synchronized across devices. The Supabase migration under `supabase/migrations` is the starting server-side schema for a hosted backend; the UI does not yet use it for authentication or data access.

## Run locally

```bash
npm install
npm run dev
```

Use `admin@entryflow.local` and any password of at least 4 characters for the demo Global Admin. Demo accounts, invite links, and public guest pages only work in the browser storage that created them.

## Vercel preview hosting

Import this repository in Vercel and use the default Vite build settings (`npm run build`, output directory `dist`). `vercel.json` enables SPA route refreshes. This hosts the frontend only; it does not make localStorage shared or secure.

## Supabase backend foundation

1. Create a separate Supabase project for development/testing.
2. Apply `supabase/migrations/202610280001_entryflow_core.sql` after reviewing it for your project.
3. Enable anonymous sign-ins only if you intend to use the agreed one-use, device-bound invite flow. The migration's `claim_account_invite` function expects an authenticated anonymous device session.
4. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in local `.env.local` and in Vercel Preview environment variables. Never put a service-role key in a `VITE_` variable or browser code.

The migration establishes event-scoped tables, role-aware RLS policies, one-time invite claiming, and a projection-only public guest pass read. The application still needs a server-backed data adapter and manager-only provisioning functions before these rules take effect in the UI. Do not use production data until that integration and an authorization review are complete.

## Stack

Vite, React 19, React Router 7, Tailwind CSS 4, React Hook Form, Zod, Sonner.
