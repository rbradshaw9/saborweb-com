# SaborWeb — Project Handoff & Status

> Last updated: April 21, 2026  
> Status: Phase 1 (Design + Conversion) **complete**. Phase 2 (Progressive Save + Automation) is next.

---

## What SaborWeb Is

SaborWeb.com sells premium restaurant websites to restaurants in Puerto Rico.

**Core sales promise:** We build your preview before you pay.

The entire site functions as a lead-generation funnel. The homepage does not sell — it converts visitors into preview-brief submissions. Payment happens later, after the restaurant owner sees a working preview and decides to claim it.

---

## Strategic Direction

- The main conversion event is a submission at `/brief-builder`.
- Homepage has **zero** checkout or payment links.
- Positioning: restaurant websites, previews, menu clarity, Google visibility, launch support.
- Do **not** position Sabor Web as a "bilingual agency." Spanish/English is a quiet feature, not the brand.
- The wizard brief should contain enough structured data for an LLM/agent (Codex, Claude) to build a full preview site with minimal follow-up.

---

## Phase 1 — Completed Work (April 2026)

### Homepage Overhaul (`src/app/(marketing)/page.tsx`)

**What changed:**
- Single-column hero. No form in the hero. No redundant CTA panel card.
- Hero headline rewritten: *"Your restaurant website, built before you pay."*
- Hero body: full zero-risk explanation in one sentence.
- Single primary CTA: "Get my free preview" → `/brief-builder`
- Social proof bar added immediately below the hero (live restaurant names)
- "How it works" and "Process" merged into one numbered 3-step section
- "What we need" section reframed as benefit-driven, specificity-first ("even just a handwritten list")
- Portfolio section upgraded: card descriptions sharpened, third card is a conversion CTA ("The next preview is yours")
- FAQ expanded to 5 Q&As, all answers rewritten to be more direct and reassuring (EN only; ES already included)
- Final CTA band: full-bleed coral section — *"Zero risk. Real results."* → *"See your restaurant online before you spend a dollar."*
- All homepage CTAs point to `/brief-builder`. No checkout links anywhere on the homepage.

### Wizard Restructure (`src/app/(wizard)/brief-builder/page.tsx`)

**What changed:**
- Moved from `src/app/(marketing)/brief-builder/page.tsx` to `src/app/(wizard)/brief-builder/page.tsx` (standalone layout, no marketing nav/footer)
- Restructured from **4 steps → 6 steps** to reduce cognitive load per screen:

| Step | Label | Fields |
|------|-------|--------|
| 0 | Contact | Name, restaurant, phone, email, city + optional links toggle |
| 1 | Restaurant | Cuisine, neighborhood, hours, address |
| 2 | Menu | Signature dishes, menu link, ordering/reservations, notes |
| 3 | Look & Feel | Style chips, font/photo chips, colors, references |
| 4 | Goals | Primary action chips, feature chips, ideal guest, objectives |
| 5 | Assets | Logo/photo status, file upload, file links, research note |

- Progress bar now shows "Step X / 6" with step label
- Copy is minimal and direct — headings + one-line subheads only
- Placeholder text is specific and context-setting (restaurant names, real examples)
- **All existing API calls are preserved:**
  - Step 0 → `POST /api/preview-request` (creates token)
  - Step 5 submit → `POST /api/intake/files` + `POST /api/intake`

### CSS Design System (`src/app/globals.css`)

**Additions made:**
- `button--ghost` — transparent with subtle border, for secondary hero actions
- `button--lg` — larger size modifier for hero + final CTA
- `button--white` — cream button for use on coral backgrounds
- `hero-v2__inner--single` + `hero-sub` — single-column hero layout (no aside card)
- `section-v2--coral` — full-bleed coral section with subtle gradient overlay
- `final-cta-band--centered` — centered layout override for coral CTA band
- `proof-card--cta` — portfolio card variant for the conversion CTA slot
- `proof-bar` + `proof-bar__*` — horizontal social proof strip under hero
- `eyebrow--light` — faded white eyebrow for colored backgrounds
- Mobile breakpoints added for all new components

### Navigation (`src/components/Nav.tsx`)

- All Nav CTA buttons now route to `/brief-builder` (from `/contact`)

---

## Architecture Overview

### Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Marketing homepage — conversion funnel |
| `/brief-builder` | 6-step intake wizard (standalone layout) |
| `/intake?token=...` | Legacy private intake (still functional) |
| `/preview/[slug]` | Restaurant preview sites |
| `/admin/*` | Internal admin area (future CRM/scraping dashboard) |
| `/api/preview-request` | Creates `preview_requests` row + intake token |
| `/api/intake` | Saves structured intake + generates build brief |
| `/api/intake/files` | Uploads logo/menu/photo files to Supabase Storage |
| `/api/checkout` | Stripe checkout — NOT linked from homepage |
| `/api/webhook/stripe` | Post-payment automation |

### Key Files

```
src/
├── app/
│   ├── (marketing)/
│   │   └── page.tsx              ← Homepage (fully rewritten)
│   ├── (wizard)/
│   │   └── brief-builder/
│   │       └── page.tsx          ← 6-step wizard (fully rewritten)
│   ├── (admin)/                  ← Future CRM dashboard (not yet built)
│   ├── api/
│   │   ├── preview-request/route.ts
│   │   ├── intake/route.ts       ← POST saves brief; PATCH support needed (Phase 2)
│   │   └── intake/files/route.ts
│   └── globals.css               ← Full design system (sw-* tokens)
├── components/
│   ├── Nav.tsx
│   ├── Footer.tsx
│   └── PackageGrid.tsx
└── lib/
    ├── intake/shared.ts          ← FEATURE_OPTIONS, STYLE_OPTIONS, brief generation
    └── LanguageContext.tsx
```

### Database (Supabase)

Tables in use:
- `preview_requests` — one row per lead created at Step 0
- `restaurant_intake` — full brief JSON, linked to preview_request via token
- `intake_files` — metadata for uploaded assets

Storage:
- `intake-assets` — logo, photo, menu PDF uploads

Security model:
- **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser**
- All writes go through API routes (server-side only)
- RLS is enabled

---

## Phase 2 — Next: Progressive Save + Abandon Flow

**Goal:** If someone starts the wizard but doesn't finish, capture their data at each step and trigger an email re-engagement sequence (via ActiveCampaign).

### What needs to be built

#### 1. `PATCH /api/intake` endpoint

Add `PATCH` support to `/api/intake/route.ts`:

```typescript
// Pseudocode
if (req.method === 'PATCH') {
  // Upsert partial data by token
  // Mark record as draft = true
  // Return 200
}
```

- Accept partial form fields + the token from `createdRequest`
- Upsert into `restaurant_intake` with `status: 'draft'`
- Do **not** require all fields to be present

#### 2. Wizard progressive save

In `src/app/(wizard)/brief-builder/page.tsx`:

- After **Step 0** creates the preview request and token, call `PATCH /api/intake` on each subsequent "Continue" click before advancing the step
- URL should update to include `?token=<token>` so the session is resumable
- On load, if `?token=` and `?step=` are in the URL, resume from that step

#### 3. Resume URL

Format: `/brief-builder?token=abc123&step=3`

- On mount, if token is in URL, skip `POST /api/preview-request` and go to specified step
- This URL goes into the abandon-flow email

#### 4. ActiveCampaign triggers

When a PATCH save is recorded:
- If the contact hasn't submitted yet within 24h → trigger abandon sequence
- Abandon email links back to `/brief-builder?token=<token>&step=<last_step>`

AC is already connected via the activecampaign MCP. Tags and automation IDs need to be mapped.

---

## Phase 3 — Future: Admin CRM + Scraping Engine

**Vision:** Internal dashboard for sourcing, scoring, and managing restaurant prospects.

### Planned features

- **Scraper engine**: Find restaurants with no website or outdated sites, 4+ star ratings, 50+ reviews (Google, Yelp, TripAdvisor)
- **CRM dashboard** at `/admin/restaurants`:
  - Scraped restaurant records with contact info
  - AI score/recommendation: "Build for this one" / "Skip"
  - Status tracking: Scraped → Contacted → Preview Built → Closed
- **Outreach**: Template messages for Facebook, Instagram, WhatsApp, Email
- **Domain search**: Check available domains for each restaurant
- **Subdomain system**: All preview sites live at `[slug].saborweb.com` unless a custom domain is configured (e.g., `rebarpr.com`)

### Architecture notes

- Admin area should live at `src/app/(admin)/`
- Requires Supabase Auth — restrict to `@saborweb.com` emails or specific user IDs
- New Supabase table: `restaurant_prospects`
- Scraping: consider Apify, Brightdata, or a custom Playwright crawler
- Domain search: Namecheap API or similar

---

## Design System

All design tokens use `--color-sw-*` CSS variables defined in `globals.css`:

```css
--color-sw-black:    #0F0F0F   /* Page backgrounds */
--color-sw-surface:  #161618   /* Section alternates */
--color-sw-card:     #1C1C1E   /* Cards */
--color-sw-elevated: #252528   /* Inputs, elevated UI */
--color-sw-rule-dark: rgba(255,255,255,0.07)  /* Dividers */
--color-sw-cream:    #F5F5F0   /* Primary text */
--color-sw-muted:    rgba(245,245,240,0.62)   /* Secondary text */
--color-sw-dim:      rgba(245,245,240,0.38)   /* Tertiary, labels */
--color-sw-coral:    #E8694A   /* Primary brand accent */
--color-sw-coral-dark: #C9552C /* Hover state */
--color-sw-gold:     #C9A96E   /* Eyebrows on dark */
--color-sw-green:    #4CAF6F   /* Success states */
```

Wizard uses `wz-*` prefixed classes.  
Marketing site uses `section-v2`, `hero-v2`, `btn-*`, `proof-bar`, etc.

---

## Business Rules (must not be violated)

1. Homepage has **zero** links to `/api/checkout` or Stripe
2. All homepage CTAs go to `/brief-builder`
3. Do not label Sabor Web as a "bilingual" service
4. `SUPABASE_SERVICE_ROLE_KEY` never in client-side code
5. Wizard must produce a brief usable by a coding agent to build a full preview site

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
ACTIVECAMPAIGN_API_URL=
ACTIVECAMPAIGN_API_KEY=
```

Set in `.env` (not `.env.local` — the file is `.env` in this project).

---

## Running the Project

```bash
npm run dev       # Start local dev server (port 3000)
npm run build     # Production build check
npm run lint      # ESLint check
```
