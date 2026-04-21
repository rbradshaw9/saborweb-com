---
description: How to implement the Sabor Web preview gate for a new client site
---

## Overview

Every Sabor Web client site gets a **preview gate** before they pay. The gate:
- Blocks entry with a glassmorphic popup over a softly blurred version of the actual site
- Shows a sticky "Site by Sabor Web" banner at all times
- Provides a bilingual (EN/ES) plan-picker modal with links to Stripe checkout
- Disappears automatically when the client pays (via Stripe webhook + Vercel redeploy)

---

## Step 1 — Add the PreviewWrapper component

Copy `/rebar/src/components/PreviewBanner.tsx` into the new client project. Customize:

### Design tokens to match the site

| Token | What to change | Rebar example |
|---|---|---|
| `gold` | Primary accent color | `#C4923A` |
| `surface` | Gate card background | `#13120E` |
| `text` | Body text | `#E8E0CA` |
| `muted` | Secondary text | `rgba(232,224,202,0.55)` |
| `bannerBg` | Banner background | `#C4923A` |
| `bannerText` | Banner text color | `#13120E` |
| Gate overlay opacity | Enough to tease the site (0.4–0.5) | `rgba(4,3,2,0.45)` |
| Gate overlay blur | Light haze, site still readable | `blur(6px)` |

> **Banner rule:** The banner must be bold, high-contrast, and impossible to miss. Use the site's primary accent color as the background with dark text (or vice versa). Never use a muted or translucent banner.

### Copy to localize

- `COPY.gate.heading` — EN/ES gate headline
- `COPY.gate.sub` — EN/ES gate subheadline  
- `COPY.gate.enter` — "Enter Preview" button label
- `COPY.gate.claim` — "Claim this site" link label
- `COPY.banner.text` — Sticky banner message
- `COPY.modal.heading` / `COPY.modal.sub` — Plan modal headline

### Plans to update

Update `PLANS` array with the correct plan keys (`presencia`, `visibilidad`, `crecimiento`), prices, and features. The plan keys must match what's passed to `saborweb.com/api/checkout?pkg=...`.

---

## Step 2 — Wire into layout.tsx

```tsx
import PreviewBanner from '@/components/PreviewBanner';

// In RootLayout body:
<body style={{ paddingTop: '44px' }}>
  <PreviewBanner />
  {/* rest of site */}
</body>
```

---

## Step 3 — Update saborweb.com webhook (once per client)

In `/saborweb-com/src/app/api/webhook/stripe/route.ts`:

1. Add the client key and Vercel project ID to `CLIENT_PROJECTS`:
   ```ts
   const CLIENT_PROJECTS = {
     rebar: 'prj_5ePdnMUKfVSE5vSVEVQYbw4apR32',
     newclient: 'prj_XXXXXXXXXXXXXXXXX',   // ← add new client
   };
   ```

2. Add the client's checkout URLs in `PreviewBanner.tsx`:
   ```tsx
   href={`https://saborweb.com/api/checkout?pkg=${plan.key}&client=newclient`}
   ```

3. Create a deploy hook in Vercel for the new client project and add to saborweb env vars:
   ```
   DEPLOY_HOOK_NEWCLIENT = https://api.vercel.com/v1/integrations/deploy/prj_.../...
   ```

---

## Step 4 — Set go-live env var on client's Vercel project

The `PreviewBanner` component always renders. To disable it when the client goes live, the webhook automatically:
1. Sets `NEXT_PUBLIC_PREVIEW_MODE=false` on the client's Vercel project
2. Triggers a redeploy via the deploy hook

> **Important:** `NEXT_PUBLIC_*` vars are baked in at build time. Always trigger a full redeploy (not just env var change) after updating them. The deploy hook handles this automatically.

---

## Go-Live Checklist

When the client pays:
- [ ] Stripe fires `checkout.session.completed` → saborweb.com webhook receives it
- [ ] Email notification sent to `NOTIFY_EMAIL`
- [ ] `NEXT_PUBLIC_PREVIEW_MODE=false` set on client's Vercel project
- [ ] Deploy hook triggers full rebuild (~60 seconds)
- [ ] Gate, banner, and modal disappear from the live site

---

## Design Principles

1. **The banner is non-negotiable.** Always gold (or site accent), full width, obvious. Never subtle.
2. **The gate should tease.** 40–50% opacity, light blur (4–8px). The site should be recognizable behind it — this is the sales tool.
3. **Match the site's palette.** The gate card, button colors, and modal should feel native to the site, not generic.
4. **Always bilingual.** EN/ES toggle built in. Add other languages if needed.
