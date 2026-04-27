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

Use the AI Review/PM build brief in this order:

1. Acceptance criteria
2. Build tasks
3. Scrape plan
4. Asset/logo/menu plan
5. Missing inputs
6. Design direction
7. Content plan

If packet data conflicts with live scraped data, preserve the safer fact and note the discrepancy in the final response.

## Research And Prompt Strategy

Research is a support function. The goal is not to maximize crawl volume; the goal is to produce a better build prompt and a better website.

- Use owner/admin submitted details first.
- Use GPT research/reasoning to create a high-quality build brief with design direction, local SEO, page plan, menu contract, and owner-confirmation list.
- Use crawlers such as Firecrawl/Apify when they add concrete evidence: official website text, menus, images, contact info, hours, social proof, or source links.
- Do not block builds because a restaurant has no standalone website or no source-backed menu. Mark those as assumptions/placeholders and build a polished editable experience.
- Keep crawl results behind the scenes unless useful. Public copy should sound like a local restaurant website, not an audit report.

## Menu Patterns

Good restaurant menus are interactive, structured, and easy to scan.

- Follow the Cinco de Maya pattern for rich native menus: category tabs/buttons, typed menu data, featured favorites, badges only when supported, mobile-friendly layout, and no cramped table UI.
- For missing menus, create a complete editable skeleton or inferred starter menu only when allowed by the brief. Use placeholder item names/prices when the owner must supply final content.
- Prices are only displayed when verified or owner-provided.
- Menu data should preserve provenance fields where possible: source-backed vs inferred, missing prices, source URL, and owner-confirmation notes.
- A menu preview should always link or scroll to the full menu section.

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
