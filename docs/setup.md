# Sabor Web Setup And Launch Checklist

This project uses Next.js 16, Supabase, Stripe, Resend, Sentry, Vercel, OpenAI, and optional platform integrations.

## Local Setup

Copy `.env.example` to `.env` and fill in the values needed for the flow you are testing.

Minimum local app shell:

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PORTAL_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ANALYTICS_ENABLED=false
```

## Production Required Env

Core site and Supabase:

```bash
NEXT_PUBLIC_SITE_URL=https://saborweb.com
NEXT_PUBLIC_PORTAL_URL=https://app.saborweb.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAILS=
INTEGRATION_CREDENTIAL_SECRET=
```

Stripe checkout and webhook:

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
STRIPE_PRICE_DOMAIN_SETUP_ADDON=
```

Notifications:

```bash
RESEND_API_KEY=
NOTIFY_EMAIL=hello@saborweb.com
EMAIL_FROM="Sabor Web <hello@saborweb.com>"
EMAIL_REPLY_TO=hello@saborweb.com
```

Automation and cron:

```bash
CRON_SECRET=
AGENT_WORKER_SECRET=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.5
OPENAI_AUDITOR_MODEL=gpt-5.5
OPENAI_MENU_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=high
SABORWEB_RESEARCH_MODE=prompt_first
SABORWEB_ALWAYS_BUILD=true
```

Publishing:

```bash
VERCEL_API_TOKEN=
VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID=
VERCEL_CLIENT_PROJECTS_JSON={}
VERCEL_DEPLOY_HOOK_URL=
DEPLOY_HOOK_SABORWEB=
GITHUB_REPO_FULL_NAME=
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
GITHUB_REPO_TOKEN=
GITHUB_PRODUCTION_BRANCH=main
SABORWEB_PRODUCTION_BRANCH=main
```

For Ryan's personal Vercel account, keep `VERCEL_TEAM_ID` blank. The application publishing code reads
`VERCEL_API_TOKEN`; the Vercel CLI reads `VERCEL_TOKEN`, so local `.env.local` should set both to the same
personal-account token when CLI work is needed.

Observability and analytics:

```bash
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
SENTRY_ORG=saborweb
SENTRY_PROJECT=javascript-nextjs
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.2
SENTRY_PROFILES_SAMPLE_RATE=0
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_ANALYTICS_ENABLED=true
GA4_API_SECRET=
```

Optional integrations used by admin workflows:

```bash
ASANA_ACCESS_TOKEN=
APIFY_API_TOKEN=
APIFY_RESTAURANT_RESEARCH_ACTOR_ID=
FIRECRAWL_API_KEY=
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_WEB_OAUTH_CLIENT_ID=
GOOGLE_WEB_OAUTH_CLIENT_SECRET=
GOOGLE_MAPS_API_KEY=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
CLOUDFLARE_API_TOKEN=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
POSTHOG_API_KEY=
POSTHOG_HOST=https://us.posthog.com
```

## Supabase

The schema lives in `supabase/migrations`.

Public-facing intake tables:

- `preview_requests`
- `restaurant_intake`
- `intake_files`

Platform/admin tables include:

- `restaurant_sites`
- `site_events`
- `agent_runs`
- `research_sources`
- `site_specs`
- `site_versions`
- `site_assets`
- `integration_connections`
- `integration_credentials`

All public tables have RLS enabled. Public visitors submit through Next.js route handlers, and those handlers use the server-only service role key. The private Storage bucket is `intake-assets`.

## Verification

Run before merging or deploying:

```bash
npm run lint
npm run build
npm run test:e2e
npm audit
```

Manual launch smoke checks:

- Submit a free preview request from `/contact`.
- Verify the owner email and open the private brief-builder link.
- Save a draft in the brief builder, reload, and confirm the draft persists.
- Upload a logo/menu/photo file and confirm it lands in the private `intake-assets` bucket.
- Submit the completed intake and confirm the generated brief is saved in Supabase.
- Confirm a queued `agent_runs` row is created for verified completed intake.
- Sign in to `/admin/login` with an allowlisted admin email.
- Open the project in admin, run or inspect integrations, and confirm project status changes are logged in `site_events`.
- Start Stripe test checkout from a claim/package flow.
- Send a Stripe CLI `checkout.session.completed` webhook and confirm the site moves to paid/claimed.
- Hit cron endpoints with bearer secrets and confirm unauthorized calls return 401.
- Check `/robots.txt`, `/sitemap.xml`, a missing page, and the homepage metadata in production.
