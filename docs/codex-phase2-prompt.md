# Codex Prompt — SaborWeb Phase 2: Progressive Save + Abandon Flow

Paste this entire prompt into Codex.

---

## Context

You are working on **SaborWeb.com** — a Next.js 14 App Router project that sells premium restaurant websites to restaurants in Puerto Rico.

**Read `docs/claude-code-handoff.md` first.** It contains the full project context, architecture, business rules, and roadmap. Do not skip this.

The core promise: *We build your preview before you pay.* The site is a lead-generation funnel — no checkout on the homepage, all CTAs go to `/brief-builder`.

**Phase 1 (design + wizard restructure) is already complete.** Do not touch the homepage copy, hero design, or wizard step layout — those are done. Your job is Phase 2: progressive save and abandon-flow infrastructure.

---

## Your Task

Implement **progressive save** in the wizard so that partially completed forms are saved to Supabase at each step, enabling an abandon-flow email sequence through ActiveCampaign.

---

## Step-by-Step Implementation

### 1. Extend the Supabase schema

Add a `status` column to `restaurant_intake` if it doesn't exist:

```sql
ALTER TABLE restaurant_intake ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
```

Add `last_step` column to track where the user stopped:

```sql
ALTER TABLE restaurant_intake ADD COLUMN IF NOT EXISTS last_step INTEGER DEFAULT 0;
```

### 2. Add `PATCH /api/intake` support

File: `src/app/api/intake/route.ts`

Add a `PATCH` handler alongside the existing `POST`:

- Accept: `{ token: string, step: number, ...partialFormFields }`
- Look up the existing `restaurant_intake` row by token
- If it exists: update with the partial fields, set `status = 'draft'`, `last_step = step`
- If it doesn't exist: insert a new draft row
- Return `200` with `{ ok: true }`
- Do not require all fields — this is a partial save
- Use the service role key (server-side only — this is already the pattern in the existing POST handler)

### 3. Add progressive save to the wizard

File: `src/app/(wizard)/brief-builder/page.tsx`

Current flow: Step 0 creates a preview request + token. Steps 1–5 are local state only. Step 5 submits everything.

**New flow:**
- After Step 0 creates the token, each subsequent "Continue" click should:
  1. Call `PATCH /api/intake` with the current step's fields + token + step number
  2. If the PATCH returns an error, show a non-blocking warning (don't block navigation — save failures shouldn't trap the user)
  3. Advance to the next step

- After Step 0 creates the token, update the browser URL to add `?token=<token>` using `window.history.replaceState` (no page reload)

- Add a resume handler: on component mount, check `window.location.search` for `?token=` and `?step=`. If present:
  - Skip `POST /api/preview-request`
  - Set `createdRequest` from the token
  - Set `step` to the value from `?step=`
  - Optionally fetch partial saved data from a new `GET /api/intake?token=...` endpoint (see below)

### 4. Add `GET /api/intake` for resume data (optional but recommended)

File: `src/app/api/intake/route.ts`

Add a `GET` handler:

- Accept `?token=<token>` query param
- Look up `restaurant_intake` by token
- Return the saved partial fields so the wizard can pre-populate on resume
- Only return non-sensitive fields (no internal brief JSON)

### 5. ActiveCampaign abandon trigger

File: Create `src/app/api/intake/abandon/route.ts`

Or add to the existing PATCH handler as a side effect.

When a PATCH save is made:
- Check if the contact's email exists in ActiveCampaign (use `ACTIVECAMPAIGN_API_URL` and `ACTIVECAMPAIGN_API_KEY` env vars)
- If found: add tag `wizard-abandoned-step-{N}` and enroll in the abandon automation
- If not found: create the contact first, then tag + enroll
- The abandon email should link to: `https://saborweb.com/brief-builder?token=<token>&step=<last_step>`

**ActiveCampaign API pattern:**
```
POST {ACTIVECAMPAIGN_API_URL}/api/3/contacts
POST {ACTIVECAMPAIGN_API_URL}/api/3/contactTags
POST {ACTIVECAMPAIGN_API_URL}/api/3/contactAutomations
Headers: { 'Api-Token': ACTIVECAMPAIGN_API_KEY }
```

Only trigger the abandon automation if `status = 'draft'` and no final submission has been made. Use a 24-hour delay in the AC automation itself (not in code) before sending the first email.

### 6. Mark complete on final submit

In the existing `POST /api/intake` handler:
- Set `status = 'complete'` and `last_step = 5` on the final submission
- This prevents the abandon flow from firing for completed submissions

---

## Business Rules (do not violate)

- `SUPABASE_SERVICE_ROLE_KEY` must never appear in client-side code
- All Supabase writes go through server-side API routes
- Homepage must not gain any checkout or payment links
- All homepage CTAs must continue to point to `/brief-builder`
- Do not restructure the wizard steps — the 6-step layout is final
- Do not rewrite homepage copy or design

---

## Testing Checklist

Before marking complete, verify:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` passes with no errors
- [ ] Filling Step 0 and clicking Continue creates a row in `restaurant_intake` with `status = 'draft'`
- [ ] Navigating to `/brief-builder?token=<token>&step=2` resumes at step 2
- [ ] Final submission updates the row to `status = 'complete'`
- [ ] PATCH failures do not trap the user — they advance anyway with a toast or silent log
- [ ] No service role key or sensitive env var appears in any client component

---

## Files to Touch

- `src/app/api/intake/route.ts` — add PATCH + GET handlers, mark complete on POST
- `src/app/(wizard)/brief-builder/page.tsx` — add progressive save calls + URL sync + resume logic
- `src/app/api/intake/abandon/route.ts` — new file for AC abandonment trigger (or inline in PATCH)
- Supabase migration SQL (run via Supabase MCP or manually)

## Files to Read But Not Rewrite

- `docs/claude-code-handoff.md` — full project context
- `src/app/(marketing)/page.tsx` — homepage (do not touch)
- `src/lib/intake/shared.ts` — shared constants and brief generation
- `src/app/globals.css` — design system (do not touch unless fixing a bug)

---

## When Done

Summarize:
1. What you changed and why
2. Any schema migrations run
3. Any AC automation IDs or tag IDs that need to be configured
4. Any remaining work for Phase 3 (Admin CRM)
