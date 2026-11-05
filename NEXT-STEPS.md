# Next steps — sales panel

## What's built
Internal admin tool for managing Chess Preparatory users (see `../PRODUCT-VISION.md`,
§5 "Sales/admin panel"). Stack: Next.js App Router (v16), Sign in with Google, Redux
Toolkit + RTK Query for data fetching, Tailwind.

v1 is a single users page (`src/app/page.tsx`) — name, username, email, verified
status, players created, joined/last-login. No subscription/billing UI, since no
`Subscription` model exists on the backend yet (Paystack integration is a later
phase per the vision doc).

It talks to a **new, separate** admin-only GraphQL endpoint on the backend
(`chess-tracker-backend`'s `adminpanel` app, `/admin-graphql/`) — deliberately not
the consumer-facing `/graphql/` endpoint, so a bug or bypass in the mobile/web auth
flow can never reach admin data.

## How sign-in works
Admins sign in with Google. The panel sends Google's ID token to the backend
(`POST /admin-auth/google/`, next to `/admin-graphql/`), which checks it with the
same code the main website's Google sign-in uses (`users/google.py`), then checks
the address against the `ADMIN_EMAILS` allowlist. If it is on the list, the backend
answers with the panel's own session token (8 hours, `adminpanel/session.py`), kept
in localStorage and sent as a Bearer token to `/admin-graphql/`.

- That token is not a main-app login: it is signed with its own key, so neither
  kind works in the other's place, and signing in to the panel creates no account.
- The allowlist is checked on every request, so removing an address from
  `ADMIN_EMAILS` ends its sessions at once.
- No role/permission system: there's only ever one or a handful of admins.

`src/components/AuthGate.tsx` sends signed-out visitors to `/sign-in`. That is only
about where you land: the data is protected by the backend's check, not the page.

## Setup
1. **Google Cloud** (project `chess-preparatory`) → APIs & Services → Credentials →
   the web OAuth client → **Authorized JavaScript origins**: add the panel's
   address (`https://mbaku-preparatory-sales-panel.vercel.app`) and, for local work,
   `http://localhost:3000`. Without it Google refuses to show the button. The panel
   uses the main website's client ID by default (`src/lib/config.ts`), which the
   backend already accepts.
2. **Railway** (backend web service): `ADMIN_EMAILS`, comma-separated. Empty means
   nobody can sign in.
3. **Vercel**: `NEXT_PUBLIC_ADMIN_GRAPHQL_URL` = the backend's `/admin-graphql/` URL.
   The panel's origin must be in the backend's `CORS_ALLOWED_ORIGINS`.

Locally: `cp .env.example .env.local`, then `npm install && npm run dev`.

## Gotchas hit while building this (for future reference)
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`.** This app has neither any
  more: Clerk needed one to guard routes, and AuthGate does that job in the page.
- **The session hook has three states** (`useSession` in `src/lib/session.ts`):
  undefined while not yet known (the server render and hydration), null when
  signed out, or the session. Treating "not known" as signed out sent signed-in
  admins to `/sign-in` and straight back.
- **Google's button frame needs `color-scheme: light`** on its holder, or a dark
  page shows it on an opaque white box.
- Chose **RTK Query with a custom GraphQL base query** over Apollo Client
  specifically to avoid running two separate state/cache systems side by side
  (Apollo's own cache + Redux) — see the commit message on the initial scaffold
  commit for the fuller reasoning.

## Subscriptions (added 2026-11-05)
- **Overview** (`/overview`): paying now, expiring this week, new this month,
  lapsed, revenue this month and all time, every account by status.
- **Users** (`/`): subscription status and health per row, search, and a status
  filter (`?status=paying|active|expiring|lapsed|churned|never`).
- **A user** (`/users/[id]`): the subscription, the health score with its three
  parts, the ledger of payments and grants, and the panel history. Actions:
  record a payment made outside Paystack (needs the M-Pesa code), give free time,
  void a grant (needs a reason), edit terms (agreed price, founding member,
  price group).
- **Plans** (`/plans`): edit prices and what is on sale. A price change applies
  to the next sale only.
- **Audit** (`/audit`): every change made in the panel, with who and when.

The rules live in the backend (`subscriptions/services.py`); the panel only
fills in defaults. Access is prepaid time, not invoices: see the backend's
`subscriptions/models.py`.

## Not yet built (deliberately deferred)
- Payments arriving through Paystack: the panel shows them once the app's
  checkout creates grants (backend `subscriptions/services.grant_access`).
- Assigning a salesperson to an account (Bomahut has it; one admin doesn't need it).
- A Mbaku usage page (questions and cost per user).
- Support/ticket visibility — no backend model for this yet.
- Any role/permission tiers — explicitly out of scope until there's more than one
  admin (see vision doc's Best Practices section on the admin panel).
