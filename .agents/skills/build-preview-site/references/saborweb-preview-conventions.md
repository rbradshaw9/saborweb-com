# SaborWeb Preview Conventions

## Route Patterns

- Native preview: `src/app/preview/[slug]/page.tsx`
- External preview redirect: `src/app/preview/[slug]/page.tsx` with `redirect('https://...')`
- Static assets: `public/sites/[slug]/...`
- Claim route: `/claim/[slug]`
- Admin source: `/admin/sites/[slug]?tab=packet`

Keep Supabase rows aligned:

- `preview_requests.client_slug`
- `restaurant_sites.slug`
- `restaurant_sites.preview_url`
- `restaurant_sites.claim_url`

## Build Packet Interpretation

Use the packet in this order:

1. Acceptance criteria
2. Build tasks
3. Scrape plan
4. Asset/logo/menu plan
5. Missing inputs
6. Design direction
7. Content plan

If packet data conflicts with live scraped data, preserve the safer fact and note the discrepancy in the final response.

## Preview Chrome

Native previews should make it clear they are owner-review previews, not final customer portals. Reuse the existing preview banner pattern where suitable:

- A small fixed or top banner saying the preview is ready to claim.
- A CTA to `/claim/[slug]`.
- A dismiss affordance when the banner would obscure the restaurant experience.

Do not let preview chrome dominate the restaurant. The restaurant should still be the first-viewport signal.

## Bilingual Rules

- Prefer Spanish-first CTAs for Puerto Rico restaurants when intake language is Spanish.
- Use English where the brand already presents itself that way or the packet requests it.
- Keep operational labels clear: `Menu`, `Menú`, `Hours`, `Horario`, `Directions`, `Cómo llegar`, `Order`, `Ordenar`, `Reserve`, `Reservar`.
- Avoid machine-translation stiffness. Short natural bilingual labels are better than long duplicated paragraphs.

## Asset Rules

- Uploaded logos, menus, and photos win over generated placeholders.
- Public social/Google/website images may guide direction, but do not hotlink fragile third-party image URLs unless explicitly acceptable.
- If a logo is missing, use a polished text mark or monogram and say so in the handoff.
- If food photos are missing, use tasteful section design and avoid pretending generated or placeholder images are real restaurant dishes.

## QA Checklist

- Lint/build pass.
- Desktop at about 1440px wide has no horizontal overflow.
- Mobile at about 390px wide has no horizontal overflow.
- Hero identifies the restaurant by name, cuisine/vibe, city or neighborhood, and primary action.
- Menu content is sourced or clearly marked as sample/placeholder.
- Hours, address, phone, and links are sourced or omitted.
- `/claim/[slug]` works for the matching `restaurant_sites` row.
- Final handoff lists what was built, what data was assumed, what still needs owner confirmation, and verification performed.
