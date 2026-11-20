# EntryFlow

Event passes and gate check-in for a multi-device team. The production build uses the same-origin Vercel function at `/api/entryflow`, backed by Supabase Postgres. Online gates wait for a committed response before showing admission. Other connected screens poll every four seconds.

## Deploy on Vercel

1. Create a Supabase project. In its SQL Editor, run **supabase/migrations/202611190001_hosted_store.sql**. It creates one protected application-state row. The older October migration is a separate schema prototype. The hosted API only uses the November migration. If you already use the October tables for real data, migrate those records separately before switching.
2. In Supabase **Authentication / Users**, create a confirmed admin user with an email and password you control. Copy the user's UUID. Anonymous sign-in is unnecessary for this version. Device invites use a server-issued session.
3. Push this version of the repository to your Git provider, then import it into Vercel. Select **Vite**, the repository root, Node.js **22.x**, build command `npm run build`, and output directory `dist`. Deploy the full repository so Vercel includes the Node function. A static upload of dist only serves the interface.
4. In the Vercel project's **Settings / Environment Variables**, add the variables below for Production. Use a separate Supabase project and admin UUID if you enable Preview deployments. Redeploy after setting or changing variables.
5. Use a stable HTTPS domain for all team and guest links. Open the deployment, sign in with the confirmed admin email and password, and create an event. New installations start empty.

| Vercel variable | Value |
| --- | --- |
| SUPABASE_URL | Your project's HTTPS URL |
| SUPABASE_PUBLISHABLE_KEY | Supabase publishable key or legacy anon key, used for password verification |
| SUPABASE_SECRET_KEY | Supabase secret key or legacy service_role key, used only by the server function |
| ENTRYFLOW_ADMIN_USER_ID | UUID copied from the confirmed administrator's Auth user |

Keep these values in Vercel's environment settings. The secret key must never have a VITE_ prefix. The Data API must be enabled for the public schema; browser roles have no access to the application-state table.

## First event and device check

- Set the event to **Live** before admitting people. Create a Host invite, open it on the host's device, and issue a two-person pass. A named team member using a password also needs a confirmed Supabase Auth user matching the email assigned in EntryFlow.
- Open the guest pass link from another browser. Use the same Gate Scanner sign-in link on multiple devices to share one account. On supported browsers use the camera; manual pass-code entry is also available.
- Admit one person at gate A. Gate B should show one remaining after its next refresh. Have both gates try for the final spot. Only one admission should succeed. Confirm the result from Supervisor, then undo from the winning scanner and verify the remaining count.
- Disconnect a scanner and try a check-in. An interrupted response can mean the server already recorded it. Reconnect, check the pass and activity, then retry the same action if needed. A disconnected scanner cannot independently authorize entry.
- Staff device sessions last 30 days. Removing access takes effect on the next server request. Reopen the same link after signing out or switching devices. Revoking the link blocks further sign-ins and existing sessions on their next request. Password-based staff sign in again with their credentials.

## Local development

Use Node.js 22.12 or later.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Plain Vite development uses the existing local browser demo. Its admin login is admin@entryflow.local with any password of four or more characters. Demo browser records stay on that browser. To exercise the hosted path locally, copy .env.example to .env.local, fill in a development project's credentials, set VITE_HOSTED=true, and run `vercel dev`. Production builds always use the hosted API.

## Storage and verification

Each successful mutation writes its updated state, audit entry and retry receipt together using a Postgres revision check. Conflicting writes reload the latest state and re-evaluate role, quota and remaining admission counts. The API filters responses by event and role. Public links use random bearer tokens. The reference implementation stores a single JSON document and rewrites it on mutation, so benchmark the actual hosted event size and gate traffic before event day.

`npm test` exercises the Vercel handler against a simulated Supabase Auth and PostgREST transport, including competing scans, reusable sign-in links, undo, occupancy and access removal. The two-device preview check above also verifies the actual hosting configuration.
