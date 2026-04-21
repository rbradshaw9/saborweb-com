# Sabor Web Setup

This project uses Next.js 16, Supabase, Stripe, Resend, and Vercel.

## Local Environment

Copy `.env.example` to `.env` and fill in the missing values.

Required for the Supabase intake flow:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://dybcsjhzxptxkdtnisye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Required for Stripe checkout:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRESENCIA_SETUP=
STRIPE_PRICE_PRESENCIA_MONTHLY=
STRIPE_PRICE_VISIBILIDAD_SETUP=
STRIPE_PRICE_VISIBILIDAD_MONTHLY=
STRIPE_PRICE_CRECIMIENTO_SETUP=
STRIPE_PRICE_CRECIMIENTO_MONTHLY=
```

Required for notifications:

```bash
RESEND_API_KEY=
NOTIFY_EMAIL=hello@saborweb.com
```

Required for client preview go-live automation:

```bash
VERCEL_API_TOKEN=
VERCEL_TEAM_ID=
VERCEL_CLIENT_PROJECTS_JSON={"client-slug":"prj_xxx"}
DEPLOY_HOOK_CLIENT_SLUG=
```

For deploy hook env var names, uppercase the client slug and replace non-alphanumeric characters with underscores.

Example:

```bash
client_slug = rebar
DEPLOY_HOOK_REBAR=https://api.vercel.com/v1/integrations/deploy/...
```

## Supabase

The schema lives in `supabase/migrations`.

The v1 intake tables are:

- `preview_requests`
- `restaurant_intake`
- `intake_files`

All public tables have RLS enabled. Public users submit through Next.js route handlers, and the handlers use the server-only service role key.

The private Storage bucket is:

- `intake-assets`

## Verification

Run:

```bash
npm run lint
npm run build
```

Manual smoke checks:

- Submit a free preview request from `/contact`.
- Open the returned `/intake?token=...` link.
- Submit restaurant intake details.
- Upload a logo/menu/photo file.
- Confirm the generated brief is saved in Supabase.
- Confirm checkout redirects only after Stripe price env vars are configured.
