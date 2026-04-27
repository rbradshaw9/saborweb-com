---
name: build-preview-site
description: Build handcrafted SaborWeb restaurant preview routes from admin build packets, intake briefs, or restaurant research. Use when creating or updating native `/preview/[slug]` pages, turning a Build Packet into an IDE-agent implementation plan, wiring preview/claim handoff, or QAing a bilingual restaurant preview before owner review.
---

# Build Preview Site

## What Good Looks Like

The build agent is expected to create a restaurant-specific website, not a generic renderer payload with swapped text. Use the research/build brief as creative direction, then design and code a real preview experience with strong first-viewport branding, persuasive local copy, mobile-first CTAs, and a menu system that feels like an actual restaurant website.

Study these examples before building:

- `src/app/preview/cinco-de-maya/page.tsx` for a handcrafted native site with a rich menu, preview banner, claim CTA, gallery, specials, sticky navigation, and restaurant-specific visual system.
- `src/app/preview/rebar/page.tsx` for the external/custom preview pattern. The local route only redirects; use this when a custom site is intentionally hosted on its own preview subdomain.
- Do not use `src/components/GeneratedRestaurantSite.tsx` or `src/components/RestaurantSiteRenderer.tsx` for new restaurant builds. They are legacy references only, not an acceptable delivery target.

## Core Workflow

1. Start from the AI Review/PM build brief when available. Treat it as the source of truth for business facts, assumptions, design direction, page structure, acceptance criteria, and owner-confirmation items.
2. Use the submitted admin/public intake details first. Research/crawled data supplements and verifies; it does not override clearly supplied owner/admin facts unless there is a strong conflict.
3. Read the existing route examples before coding, especially `src/app/preview/cinco-de-maya/page.tsx` for quality, menu interaction, and preview chrome.
4. Create or update the generated restaurant implementation under the controlled generated-site path the pipeline expects, or create a handcrafted native route when explicitly assigned. Keep route slugs aligned with `preview_requests.client_slug` and `restaurant_sites.slug`.
5. Build the actual usable restaurant preview as the first screen. Do not make a marketing landing page about SaborWeb.
6. Verify claim/preview consistency: `restaurant_sites.preview_url` should point at the preview and `restaurant_sites.claim_url` should remain `/claim/[slug]`.

## Preview Requirements

- Use a restaurant-specific visual direction: cuisine, neighborhood, price point, service style, and audience should shape the layout.
- Match the restaurant’s real vibe. A coastal cafe, taqueria, cocktail bar, fine-dining restaurant, and bakery should not share the same layout, color system, section rhythm, or copy voice.
- Include a persistent preview/claim banner or obvious owner handoff path when the existing route pattern calls for it.
- Include bilingual support in the content strategy. At minimum, make labels and CTAs understandable for Puerto Rico restaurant owners and guests; use Spanish naturally for local-facing copy when the packet or intake indicates Spanish preference.
- Make the hero immediately identify the restaurant by name and give the owner a believable first impression of the final site.
- Include the practical restaurant sections the packet calls for: menu highlights, hours, location/contact, ordering/reservations/directions, gallery/assets, specials/events, and social proof where supported by data.
- Do not invent facts that affect operations: hours, pricing, address, phone, ordering links, reservation links, and dietary claims must come from the packet, intake, or scraped sources. If missing, use explicit placeholders or omit the claim.

## Menu Build Rules

Menus are core product UI, not decorative content.

- If a source-backed menu exists, build a complete, scannable menu experience with categories, item names, descriptions, badges, prices only where verified, and mobile-friendly category navigation.
- If no source-backed menu exists, still build the menu section. Use clearly labeled editable placeholders or an inferred starter menu only when the brief explicitly allows assumptions. Never invent prices.
- When using an inferred/starter menu, mark it in structured data or comments as owner-editable/needs confirmation, but keep the public presentation polished. The site should not look broken just because the owner has not provided final menu data.
- Preserve menu provenance internally: `sourceBacked`, `inferred`, `priceText`, `sourceUrl`, and `missingFields` should survive in the editable data contract when available.
- Prefer category cards plus a full menu module over a tiny “featured items” tease. Restaurants sell through menus.
- Menu labels should be natural for the brand and locale. Puerto Rico examples: `Menú`, `Desayuno`, `Café`, `Jugos`, `Especiales`, `Cócteles`, `Cómo llegar`.
- Do not publish fake discounts, specials, awards, reviews, dietary labels, allergens, or “best seller” claims unless sourced or explicitly included in the brief.

## Website Quality Bar

The finished preview should feel like a thoughtful custom website:

- Strong first viewport: restaurant name, location/neighborhood, cuisine/vibe, one-sentence value prop, and three clear actions such as menu, directions, call/order/reserve.
- Distinct art direction: color palette, typography, image treatment, spacing, and section rhythm should be tailored to the restaurant.
- High-converting CTAs: phone links use `tel:`, map links go to the best Google Maps query/profile, social links are visible, claim CTA is present for SaborWeb.
- Local SEO: title, description, local keywords, Open Graph data, one H1, semantic H2/H3 structure, and Restaurant/Cafe schema where the implementation surface supports metadata.
- Owner-editable contract: menu and hours are customer-managed later; gallery, layout, brand presentation, SEO copy, and page composition remain operator-managed unless the brief says otherwise.
- Owner-confirmation list: the final handoff must name uncertain facts such as legal name, hours, address formatting, menu/prices, photos, map link, contact form destination, and services like catering/events.

## Implementation Rules

- Prefer a single self-contained route component for each handcrafted preview unless shared code already exists for the exact pattern.
- For generated-site autopilot work, generate real restaurant-specific code/data in the repo path the pipeline expects. The generic renderer is not part of the delivery path for new builds.
- Keep secrets and private tokens out of client code. Never expose Supabase service role, Stripe, Vercel, OpenAI, Asana, Apify, Resend, or intake resume tokens.
- Use `next/image` for local/static images when practical, and place project-specific assets under `public/sites/[slug]/`.
- For external previews, implement the native route as a redirect only when the site is intentionally hosted elsewhere.
- Use existing analytics helpers if tracking preview interactions. Do not add new analytics vendors or keys.
- Keep homepage and package checkout behavior out of preview builds unless the packet explicitly asks for claim/checkout integration.
- Avoid one-size-fits-all generated layouts. If the restaurant is visual and casual, use imagery, warm CTAs, playful section labels, and menu-forward design. If it is refined, use restraint, typography, and reservations/contact workflows.

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
