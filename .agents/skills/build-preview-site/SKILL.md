---
name: build-preview-site
description: Build handcrafted SaborWeb restaurant preview routes from admin build packets, intake briefs, or restaurant research. Use when creating or updating native `/preview/[slug]` pages, turning a Build Packet into an IDE-agent implementation plan, wiring preview/claim handoff, or QAing a bilingual restaurant preview before owner review.
---

# Build Preview Site

## Core Workflow

1. Start from the admin Build Packet when available. Treat it as the source of truth for missing inputs, scrape targets, asset plan, design direction, build tasks, and acceptance criteria.
2. Read the existing route examples before coding:
   - `src/app/preview/cinco-de-maya/page.tsx` for a native handcrafted preview.
   - `src/app/preview/rebar/page.tsx` for an external preview redirect.
   - `src/app/(marketing)/claim/[slug]/page.tsx` for the claim handoff expectations.
3. Create or update `src/app/preview/[slug]/page.tsx` for native previews. Keep route slugs aligned with `preview_requests.client_slug` and `restaurant_sites.slug`.
4. Build the actual usable restaurant preview as the first screen. Do not make a marketing landing page about SaborWeb.
5. Verify claim/preview consistency: `restaurant_sites.preview_url` should point at the preview and `restaurant_sites.claim_url` should remain `/claim/[slug]`.

## Preview Requirements

- Use a restaurant-specific visual direction: cuisine, neighborhood, price point, service style, and audience should shape the layout.
- Include a persistent preview/claim banner or obvious owner handoff path when the existing route pattern calls for it.
- Include bilingual support in the content strategy. At minimum, make labels and CTAs understandable for Puerto Rico restaurant owners and guests; use Spanish naturally for local-facing copy when the packet or intake indicates Spanish preference.
- Make the hero immediately identify the restaurant by name and give the owner a believable first impression of the final site.
- Include the practical restaurant sections the packet calls for: menu highlights, hours, location/contact, ordering/reservations/directions, gallery/assets, specials/events, and social proof where supported by data.
- Do not invent facts that affect operations: hours, pricing, address, phone, ordering links, reservation links, and dietary claims must come from the packet, intake, or scraped sources. If missing, use explicit placeholders or omit the claim.

## Implementation Rules

- Prefer a single self-contained route component for each handcrafted preview unless shared code already exists for the exact pattern.
- Keep secrets and private tokens out of client code. Never expose Supabase service role, Stripe, Vercel, OpenAI, Asana, Apify, Resend, or intake resume tokens.
- Use `next/image` for local/static images when practical, and place project-specific assets under `public/sites/[slug]/`.
- For external previews, implement the native route as a redirect only when the site is intentionally hosted elsewhere.
- Use existing analytics helpers if tracking preview interactions. Do not add new analytics vendors or keys.
- Keep homepage and package checkout behavior out of preview builds unless the packet explicitly asks for claim/checkout integration.

## QA Before Handoff

Run:

```bash
npm run lint
npm run build
```

Then manually or with browser automation verify:

- `/preview/[slug]` renders without runtime errors.
- Mobile and desktop do not horizontally overflow.
- Main CTAs point to valid phone, map, ordering, reservation, social, or `/claim/[slug]` destinations.
- Text does not overlap, truncate badly, or sit unreadably over images.
- The preview feels specific to the restaurant, not a generic template with swapped text.
- Any open packet gaps are called out in the final handoff instead of silently fabricated.

See `references/saborweb-preview-conventions.md` for a compact checklist and route conventions.
