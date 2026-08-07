# Next steps — sales panel

## What's built
Internal admin tool for managing Mbaku Preparatory users (see `../PRODUCT-VISION.md`,
§5 "Sales/admin panel"). Stack: Next.js App Router (v16), Clerk for auth, Redux
Toolkit + RTK Query for data fetching, Tailwind.

v1 is a single users page (`src/app/page.tsx`) — name, username, email, verified
status, players created, joined/last-login. No subscription/billing UI, since no
`Subscription` model exists on the backend yet (Paystack integration is a later
phase per the vision doc).

It talks to a **new, separate** admin-only GraphQL endpoint on the backend
(`chess-tracker-backend`'s `adminpanel` app, `/admin-graphql/`) — deliberately not
the consumer-facing `/graphql/` endpoint, so a bug or bypass in the mobile/web auth
flow can never reach admin data. Auth there is a Clerk session token (Bearer),
verified against Clerk's JWKS, checked against a static `ADMIN_EMAILS` allowlist —
no role/permission system, since there's only ever one or a handful of admins at
this stage.

## Blockers — need account-level setup only you can do

### 1. Clerk dashboard: add the `email` claim to the session token
By default Clerk session tokens don't carry an email claim. The backend's
`adminpanel/clerk_auth.py` requires one to check against the allowlist — without
this, every request fails with "Session token has no email claim."

Go to the Clerk dashboard → **Configure → Sessions → Customize session token**,
and add:
```json
{"email": "{{user.primary_email_address}}"}
```

### 2. Get Clerk API keys into this app
Clerk dashboard → **API Keys**, then:
```
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.

### 3. Add yourself to the backend's admin allowlist
On Railway, the `Mbaku-Preparatory` (backend) service → **Variables** → add
`ADMIN_EMAILS` (comma-separated if more than one admin later) with your email —
must match the email Clerk puts in the token from step 1.

Also set `CLERK_JWKS_URL` there — found in the Clerk dashboard under
**API Keys → Advanced**, looks like `https://<your-clerk-domain>/.well-known/jwks.json`.

### 4. Deploy this app
Vercel is the natural choice (matches `chess-tracker-frontend`'s setup). Once it
has a URL, add that origin to the backend's `CORS_ALLOWED_ORIGINS` and
`CSRF_TRUSTED_ORIGINS` Railway env vars, or the browser will get CORS errors
calling `/admin-graphql/`.

### 5. Point at the right backend
`NEXT_PUBLIC_ADMIN_GRAPHQL_URL` in `.env.local` (or Vercel env vars) — defaults to
`http://localhost:8000/admin-graphql/` for local dev. Set it to the Railway
backend's `/admin-graphql/` URL for anything deployed.

## Once all of the above is done
```
npm install   # if you haven't already
npm run dev
```
Sign in via Clerk, should land on the users table. If you get "not an authorized
admin," double check steps 1 and 3 match exactly (case-insensitive, but must be
the same address).

## Gotchas hit while building this (for future reference)
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** (function export `proxy`
  instead of `middleware`) — this repo already uses the new convention
  (`src/proxy.ts`). If you're pattern-matching against older Clerk/Next.js
  tutorials that show `middleware.ts`, that's now deprecated (still works per
  Next's docs, but don't add a *second* file — pick one).
- **This Clerk version (7.6.4, check `package.json` if it's changed) dropped
  `<SignedIn>`/`<SignedOut>`** wrapper components that older Clerk docs/tutorials
  show. Turned out unnecessary here anyway — `proxy.ts` already calls
  `auth.protect()` on every route via the matcher, so by the time `layout.tsx`
  renders, the user is guaranteed authenticated.
- **RTK Query can't call React hooks** (like `useAuth()`) inside `prepareHeaders`,
  since base queries run outside the component tree. Used Clerk's `getToken()`
  utility from `@clerk/nextjs` instead (`src/redux/api/adminApi.ts`) — it's
  explicitly documented as safe to call from non-component code like this.
- Chose **RTK Query with a custom GraphQL base query** over Apollo Client
  specifically to avoid running two separate state/cache systems side by side
  (Apollo's own cache + Redux) — see the commit message on the initial scaffold
  commit for the fuller reasoning.

## Not yet built (deliberately deferred)
- Subscription/plan status, manual overrides (extend trial, refund) — blocked on
  Paystack integration landing first (Phase 4 in the vision doc).
- Support/ticket visibility — no backend model for this yet.
- Any role/permission tiers — explicitly out of scope until there's more than one
  admin (see vision doc's Best Practices section on the admin panel).
