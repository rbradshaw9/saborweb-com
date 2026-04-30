# SaborWeb — Portal-First Launch Plan

> **For IDE agents:** Read this document top-to-bottom before writing code. This plan is intentionally portal-first: owner self-service ships before the hybrid runtime renderer. Do not reintroduce `middleware.ts`; this repo uses Next.js 16 `src/proxy.ts`.

---

## 1. Executive Summary

The launch priority is now **Customer Portal V1**, not the hybrid runtime renderer.

The current generated-site pipeline writes bespoke React files to `src/generated-sites/[slug]/Site.tsx`, commits them through the GitHub API, and registers them in `src/generated-sites/components.tsx`. That approach is acceptable for the first 5-20 restaurants. The real launch bottleneck is support burden: every menu, hours, phone, or address change should not become a Slack message to Ryan.

Portal V1 solves that by giving owners a small self-service surface for the fields they will actually change. The hybrid runtime renderer remains important, but it moves to a follow-up architecture track after the first owner-editable site is live.

The hidden coupling is Goodstart: its menu, hours, and restaurant basics are currently hardcoded in a bespoke component. Portal edits cannot safely rewrite that TypeScript file. Therefore, **Portal V1 includes a Goodstart content migration**: the bespoke layout stays, but owner-editable content moves into a typed Supabase-backed manifest snapshot.

---

## 2. Current Launch State

### Completed P0 hardening

- Public launch surface now has metadata, robots, sitemap, and 404 coverage.
- Public Sentry example routes were removed.
- Dependency updates and audit cleanup are complete.
- CI quality workflow exists in `.github/workflows/quality.yml`.
- Local verification has passed: lint, build, e2e, audit, and launch-surface checks.
- Service-backed smoke checks passed for intake, checkout config, signed Stripe webhook handling, and admin auth gates.

### Current routing truth

- Next.js 16 uses `src/proxy.ts`, not `src/middleware.ts`.
- Restaurant subdomains under `*.saborweb.com` rewrite to `/site/[slug]`.
- Custom domains resolve through `/site-domain/[host]` and the `custom_domains` table.
- `app.saborweb.com` must be reserved for the customer portal.
- `/preview/[slug]`, `/site/[slug]`, and `/site-domain/[host]` currently render entries from `GENERATED_SITE_COMPONENTS`.

### Current data truth

- `restaurant_sites.generated_site_manifest` already exists and is the preferred place for a portal-owned render snapshot.
- `customer_accounts`, `project_memberships`, `menus`, `menu_categories`, `menu_items`, `business_hours`, and `change_requests` already exist.
- RLS is enabled on the portal-related tables, but Portal V1 should not depend on browser-side Supabase access.
- Goodstart is the only registered generated component today.

---

## 3. Launch Architecture

### Portal-first model

```
Owner logs in at app.saborweb.com
        │
        ▼
Server-side portal action/API route
        │
        ├── Validate Supabase Auth user
        ├── assertOwnsRestaurant(userId, slugOrSiteId)
        ├── Read/write Supabase with service-role client
        └── Update restaurant_sites.generated_site_manifest
                         │
                         ▼
              /site/goodstart or goodstart.saborweb.com
              bespoke Goodstart component
              same layout, editable content from manifest
```

### Security model

Portal V1 uses server-only data access.

- Do not call Supabase directly from browser components for customer-owned data.
- Server actions/API routes use the Supabase service-role client.
- Every customer-owned operation must call one shared authorization helper:
  - `assertOwnsRestaurant(userId, slugOrSiteId)`
  - Accepts either a slug or site id.
  - Looks up `customer_accounts.auth_user_id`.
  - Requires an active `project_memberships` row.
  - Allows `owner` and `manager` for edits; `viewer` is read-only.
- Keep RLS enabled as defense in depth, but do not make Portal V1 rely on RLS policy complexity.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or any secret key to the browser.

### Billing model

- The portal shows package/payment status from `restaurant_sites`.
- The billing page links to Stripe Customer Portal for payment methods, invoices, and subscription management.
- Do not rebuild invoice history or payment method management in SaborWeb V1.
- Do not hard-code package prices in portal UI; read from `src/lib/packages.ts`.

---

## 4. Phase 0: Portal Prerequisites

**Goal:** Prepare routing, auth shell, and shared server authorization before owner-editable data ships.

**Dependencies:** None.

### 4.1 Route `app.saborweb.com`

Update `src/proxy.ts`.

- Treat `app.saborweb.com` as a reserved subdomain.
- Rewrite it to the internal `/portal` segment backed by `src/app/(portal)/portal/`.
- Preserve the incoming path: `app.saborweb.com/sites/goodstart/menu` rewrites to `/portal/sites/goodstart/menu`.
- Do not let `app` fall through to `/site/app`.
- Keep restaurant wildcard behavior unchanged:
  - `goodstart.saborweb.com` -> `/site/goodstart`
  - custom non-SaborWeb host -> `/site-domain/[host]`
  - apex and `www` stay marketing.

Acceptance criteria:

- Host `app.saborweb.com` reaches the portal shell.
- Host `goodstart.saborweb.com` still renders Goodstart live mode.
- Host `saborweb.com` and `www.saborweb.com` are unaffected.
- Custom-domain routing remains unchanged.

### 4.2 Portal shell

Create a minimal portal route group.

- Route group: `src/app/(portal)/portal/`.
- Login route: `src/app/(portal)/portal/login/page.tsx`.
- Authenticated dashboard route: `src/app/(portal)/portal/sites/page.tsx`.
- Site dashboard route: `src/app/(portal)/portal/sites/[slug]/page.tsx`.
- Use the existing visual language, but keep the portal utilitarian and dense: status, next actions, edit entry points.
- No direct Supabase browser client for portal data.

Acceptance criteria:

- Anonymous portal users redirect to login.
- Authenticated users see only their active restaurant memberships.
- Empty-state copy exists for users with no active sites.

### 4.3 Shared portal authorization

Create one server-side portal auth module.

Suggested file:

- `src/lib/portal/auth.ts`

Required exports:

- `getPortalUser()` — reads the server-side Supabase Auth session/user.
- `assertOwnsRestaurant(userId, slugOrSiteId, options?)` — returns the site and membership or throws a typed authorization error.
- `listPortalSites(userId)` — returns active memberships and site summary cards.

Rules:

- Use service-role Supabase only on the server.
- Check `customer_accounts.auth_user_id`, not owner email alone.
- Require `project_memberships.status = 'active'`.
- For edits, require role `owner` or `manager`.
- For read-only views, allow `owner`, `manager`, or `viewer`.

Acceptance criteria:

- Cross-site access attempts fail server-side.
- All portal pages/actions share the same authorization helper.
- Tests cover owner access, viewer read-only access, missing membership, removed membership, and wrong user.

---

## 5. Phase 1: Goodstart Editable Content Migration

**Goal:** Keep Goodstart's bespoke layout, but make owner-editable content come from Supabase so portal edits do not require a git commit or LLM file rewrite.

**Dependencies:** Phase 0 auth helpers can be built in parallel; Goodstart migration must land before menu/hours editing ships.

### 5.1 Define the editable content payload

Create a typed content contract for Goodstart's editable fields.

Suggested files:

- `src/generated-sites/goodstart/content.ts`
- `src/generated-sites/goodstart/default-content.ts`

Payload shape:

- `restaurant`: name, alternateName, cuisine, address fields, phone, phoneHref, mapsUrl, social URLs.
- `hours`: day, shortDay, opens, closes, display, closed state if needed.
- `menuCategories`: category name, description, sorted items, price text, badges, source/provenance flags, visibility.
- `updatedAt` and `source`: metadata for debugging.

Rules:

- Keep non-editable layout/style constants in the component.
- Keep translated UI chrome in the component.
- Treat the payload as the source of truth only for owner-editable facts.
- Provide a default Goodstart payload that exactly matches the current hardcoded content.

Acceptance criteria:

- TypeScript catches malformed Goodstart content.
- The default payload renders visually equivalent to the current Goodstart site.
- No owner-editable facts remain duplicated as independent hardcoded constants in `Site.tsx`.

### 5.2 Load Goodstart content for public rendering

Update the Goodstart render path so public routes can pass content into the bespoke component.

Implementation direction:

- Keep `src/generated-sites/components.tsx` backward-compatible.
- Extend generated-site component props to optionally include editable content.
- Add a server loader that reads `restaurant_sites.generated_site_manifest` for `goodstart`.
- If the manifest is missing or invalid, fall back to `GOODSTART_DEFAULT_CONTENT`.
- Use the same loader from `/preview/[slug]`, `/site/[slug]`, and `/site-domain/[host]`.

Rules:

- Public render must never 500 because of malformed editable content.
- Invalid/missing fields fall back to defaults.
- Do not introduce the full archetype registry in this phase.

Acceptance criteria:

- `/site/goodstart`, `/preview/goodstart`, and `goodstart.saborweb.com` render the same layout.
- Updating Goodstart's manifest in Supabase changes public menu/hours/basic content without a git commit or Vercel redeploy.
- Malformed manifest content logs a server warning and falls back to defaults.

### 5.3 Seed Goodstart manifest

Create an admin-only or migration-safe way to seed `restaurant_sites.generated_site_manifest` for Goodstart.

Rules:

- Seed from `GOODSTART_DEFAULT_CONTENT`.
- Do not overwrite a non-empty manifest unless explicitly requested by an admin action.
- Keep this operation idempotent.

Acceptance criteria:

- A fresh environment can seed Goodstart editable content.
- Existing Goodstart edits are not overwritten by deploys.

---

## 6. Phase 2: Portal V1A — Dashboard And Billing Link

**Goal:** Give owners a place to log in, see their site status, and reach Stripe Customer Portal.

**Dependencies:** Phase 0.

### Dashboard

Routes:

- `src/app/(portal)/portal/sites/page.tsx`
- `src/app/(portal)/portal/sites/[slug]/page.tsx`

Content:

- Site name and status.
- Live URL and preview URL.
- Package/payment status.
- Last updated timestamp.
- Primary edit links: basics, hours, menu, support request.
- Billing link if a Stripe customer id exists.

Acceptance criteria:

- Owner sees Goodstart card if they have an active membership.
- Viewer role can view dashboard but cannot access edit actions.
- Dashboard does not expose internal words like "manifest", "archetype", or "revalidate".

### Billing

Route:

- `src/app/(portal)/portal/sites/[slug]/billing/page.tsx`

Behavior:

- Show current package and payment status.
- Create a Stripe Customer Portal session server-side.
- Redirect/link the owner to Stripe-hosted billing management.
- If no Stripe customer id exists, show a support CTA rather than a broken billing button.

Acceptance criteria:

- Stripe portal session is generated only after `assertOwnsRestaurant`.
- Wrong-site billing access fails.
- No invoice or payment-method UI is rebuilt locally.

---

## 7. Phase 3: Portal V1B — Basics, Hours, And Menu Editing

**Goal:** Let owners update the highest-support-burden fields themselves.

**Dependencies:** Phase 1 Goodstart content migration.

### 7.1 Restaurant basics

Route:

- `src/app/(portal)/portal/sites/[slug]/settings/page.tsx`

Editable fields:

- Restaurant name and alternate name.
- Phone number.
- Address display fields.
- Maps URL.
- Facebook and Instagram URLs.
- Cuisine label.

Save behavior:

- Normalize phone numbers and `tel:` hrefs server-side.
- Validate URLs server-side.
- Update the Goodstart editable manifest snapshot.
- Record a `change_requests` row or equivalent audit event for traceability.

Acceptance criteria:

- Basics edits update `/site/goodstart` without redeploy.
- Invalid URLs are rejected with clear field errors.
- Viewer role cannot save changes.

### 7.2 Hours editor

Route:

- `src/app/(portal)/portal/sites/[slug]/hours/page.tsx`

Behavior:

- Weekly schedule with one row per day.
- Use time inputs/selects, not free-text.
- Support closed days.
- Generate display labels server-side from structured times.
- Save to the manifest snapshot and, optionally, `business_hours` rows for future reporting.

Acceptance criteria:

- Hours edits update the public Visit section and JSON-LD/opening-hours data.
- Closed-day handling renders correctly.
- Bad time ranges are rejected server-side.

### 7.3 Menu editor

Route:

- `src/app/(portal)/portal/sites/[slug]/menu/page.tsx`

Behavior:

- Edit categories and menu items.
- Support add, update, reorder, hide/show, and delete.
- Fields: name, description, price text, badges, availability/visibility.
- Preserve source/provenance metadata when editing existing items.
- Save to the manifest snapshot and, optionally, normalized `menus` tables for future reporting.

Acceptance criteria:

- Menu edits update Goodstart's public menu without redeploy.
- Reordering persists.
- Empty menu/category states render cleanly.
- Prices are stored as display text for V1; do not force numeric parsing.

### 7.4 Support/change requests

Route:

- `src/app/(portal)/portal/sites/[slug]/support/page.tsx`

Behavior:

- Owner can submit a plain-language help request.
- Store in `change_requests` with site id, customer account id, request type, title, description, and payload.
- Email support via existing Resend patterns.

Acceptance criteria:

- Support request creates a row tied to the right site and customer account.
- Owner receives confirmation.
- Support inbox/admin visibility is documented for the next admin iteration.

---

## 8. Phase 4: PreviewGate And Marketing i18n Cleanup

**Goal:** Complete useful launch polish that does not block Portal V1 data ownership.

These items are valuable, but they are not prerequisites for owner self-service except where routing touches `app.saborweb.com`.

### 8.1 PreviewGate component

Create `src/components/PreviewGate.tsx` as the single preview chrome component.

Use it in:

- `src/app/preview/cinco-de-maya/page.tsx`
- `src/components/GeneratedRestaurantSite.tsx`
- `src/generated-sites/goodstart/Site.tsx`

Behavior:

- `mode="live"` renders children directly.
- `mode="preview"` renders a dismissable sticky banner and first-view overlay.
- Bilingual copy via `lang`.
- Claim CTA links to `/claim/[slug]`.

Acceptance criteria:

- `/preview/goodstart` shows preview chrome.
- `/site/goodstart` has no preview chrome.
- Existing Cinco de Maya preview still works.

### 8.2 Marketing i18n routing

Use `src/proxy.ts` for routing decisions.

Rules:

- English marketing pages remain at root paths like `/services`.
- Spanish marketing pages use `/es/services`.
- Language toggle maps `/services` <-> `/es/services`, preserving query strings.
- Use Next.js metadata alternates for hreflang; verify the Next 16 API in `node_modules/next/dist/docs/` before implementation.

Acceptance criteria:

- Spanish-preferred first visit can route to `/es`.
- English root pages remain canonical for English.
- Hreflang alternates exist on marketing pages.
- Existing legacy redirects are preserved.

---

## 9. Phase 5: Hybrid Runtime Renderer

**Goal:** Reduce per-site generation/deploy cost after the first owner-facing value is live.

This phase should not block Portal V1.

### Direction

- Add archetype registry only after Goodstart content loading proves the manifest-editing model.
- First archetype remains `coastal-cafe`.
- New sites can later render from Supabase using archetype id, theme, manifest, and bounded bespoke slots.
- Existing generated components remain backward-compatible.

### Suggested future pieces

- `src/generated-sites/archetypes/index.ts`
- `src/lib/theme.ts`
- `src/lib/archetype-rendering.ts`
- A migration for `archetype_id`, `theme`, and `bespokes` if those fields are still needed beyond `generated_site_manifest`.
- Fallback order:
  1. Registered bespoke component with editable manifest.
  2. Archetype renderer from Supabase.
  3. Legacy render payload if still supported.
  4. `notFound()`.

Acceptance criteria:

- A test restaurant can render from Supabase without a git commit.
- Goodstart continues to work through the bespoke component path.
- Invalid theme/manifest data falls back safely instead of 500ing.

---

## 10. Phase 6: Workflow Migration

**Goal:** Replace the cron/GitHub-commit build flow only when real operating pain justifies it.

The current Vercel Cron plus `agent_runs` worker is acceptable for launch volume.

### Defer Inngest until one of these is true

- Per-site agent/deploy cost becomes meaningful.
- Vercel deploy-per-site rhythm slows sales or support.
- LLM-authored component defects become frequent.
- The queue needs stronger step-level retries and observability.

### If/when it is needed

- Introduce Inngest behind a feature flag.
- Keep the existing cron path during transition.
- Persist site output to Supabase, not git.
- Remove GitHub commits only after the Supabase renderer path has proven reliable.

---

## 11. Testing And Acceptance Matrix

### Required automated checks

- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- `npm audit`
- `git diff --check`

### Portal security scenarios

- Anonymous portal routes redirect to login.
- Authenticated owner can access their site.
- Viewer can read but cannot edit.
- Removed membership cannot access.
- User with no membership cannot access a guessed slug.
- Billing portal session cannot be generated for another owner's site.

### Goodstart content scenarios

- Default Goodstart content renders unchanged.
- Supabase manifest override updates public basics, hours, and menu.
- Missing manifest falls back to defaults.
- Malformed manifest falls back to defaults and logs a warning.
- Menu reorder, hidden item, closed day, and phone normalization all render correctly.

### Existing launch scenarios

- Public intake still creates/resumes/completes requests.
- Checkout config still works for all packages and add-ons.
- Signed Stripe webhook still marks paid/claimed correctly.
- Admin gates still redirect anonymous users.
- `goodstart.saborweb.com`, `/site/goodstart`, and `/preview/goodstart` still render.

---

## 12. Out Of Scope For Portal V1

- Full archetype migration for every generated site.
- LLM rewriting `Site.tsx` in response to portal edits.
- Browser-side Supabase data access for customer-owned portal data.
- Local invoice/payment-method management UI.
- Self-serve plan upgrade/downgrade.
- Multi-user team management beyond honoring existing roles.
- Customer-facing custom-domain setup UI.
- Analytics dashboard.
- Online ordering, reservations, SMS marketing, and add-on store.
- Unbounded LLM SVG generation.

---

## 13. Open Decisions

### Portal URL shape

Recommended: `app.saborweb.com`.

Use the subdomain because it reads as a product surface and keeps portal routing distinct from marketing. The route group can still live in the same Next.js app.

### Goodstart manifest storage

Recommended: `restaurant_sites.generated_site_manifest`.

Use this existing column for the Goodstart editable snapshot unless implementation discovers a concrete reason to introduce a separate typed column. Keep normalized `menus` and `business_hours` tables optional in V1; they can be populated for reporting, but the public render source should be one validated manifest snapshot.

### Publishing model

Recommended for V1: save-and-publish in one step for basics/hours/menu edits, with audit rows.

Draft preview/version history is valuable, but it should not block the first self-service release. Add draft/publish/version workflow after the first owner can successfully update Goodstart.

---

## Appendix: Key Files Reference

| Purpose | Path |
|---|---|
| Next 16 request proxy | `src/proxy.ts` |
| Portal route group | `src/app/(portal)/portal/` |
| Portal auth helpers | `src/lib/portal/auth.ts` |
| Existing Supabase admin client | `src/lib/supabase/admin.ts` |
| Generated component registry | `src/generated-sites/components.tsx` |
| Goodstart bespoke component | `src/generated-sites/goodstart/Site.tsx` |
| Goodstart content contract | `src/generated-sites/goodstart/content.ts` |
| Goodstart default content | `src/generated-sites/goodstart/default-content.ts` |
| Preview route | `src/app/preview/[slug]/[[...segments]]/page.tsx` |
| Live subdomain route target | `src/app/site/[slug]/[[...segments]]/page.tsx` |
| Custom domain route target | `src/app/site-domain/[host]/[[...segments]]/page.tsx` |
| Portal membership tables | `customer_accounts`, `project_memberships` |
| Editable content column | `restaurant_sites.generated_site_manifest` |
| Pricing source | `src/lib/packages.ts` |
| Existing generated-site autopilot migration | `supabase/migrations/20260427100000_generated_site_autopilot.sql` |
| Existing autonomous platform tables | `supabase/migrations/20260422170000_create_autonomous_platform_foundation.sql` |

---

*Last updated: 2026-04-29. Authors: Ryan Bradshaw + Codex.*
