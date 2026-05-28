# WORK QUEUE — prioritized backlog

What is queued, what is in progress, what is done. Update this when items change state.

Priority levels:
- **P0** — blocking, do next
- **P1** — high-value, do soon
- **P2** — useful, do when ready
- **P3** — nice to have / explore later

---

## Done (recent first)

- [x] **SPEC.md — multi-tenant SaaS architecture lock** (commit b236ffd, 2026-05-27). Added §2.7 multi-tenancy, §2.8 Drive storage model, §2.9 onboarding, §2.10 cancellation, §3.0 CARRIERS, §3.0a CARRIER_USERS, §3.0b USERS, §3.0c SUBSCRIPTIONS, §3.13 CARRIER_SETTINGS with 15-tier dispatch schedule, §5.2 immutability, §5.3 supersession, §3.12 expanded audit log, §7.6 billing, §7 revised roadmap, §9 locked decisions 9-18, §11 pre-launch checklist.
- [x] **SPEC.md — all founder decisions locked** (commit 6848691). Added §2.5 roles + §2.6 AI-not-system-of-record, locked decisions 3-8.
- [x] **SPEC.md — QBO + Postgres decisions, §7.5 QBO mapping** (commit 8a0bd37).
- [x] **SPEC.md — initial creation** (commit 88a4719).
- [x] **HANDOFF.md + docs/RULES.md + docs/WORK_QUEUE.md** (this commit set).
- [x] **settlements.html — PDF template literal fix** (commit ac2a033).
- [x] **settlements.html — chronological week sort** (commit 6aa8aa9).
- [x] **settlements.html — localStorage status overrides** (commit 33db149).

---

## P0 — do next (none right now)

No P0 items. SPEC.md is locked; founder needs to decide direction before more code work.

---

## P1 — high-value

### P1.1 Developer brief / RFP

**Goal:** A one-page document the founder can hand to a freelance developer or agency to get quotes for Phase 1.

**Inputs:** SPEC.md, RULES.md, founder's budget (open question).

**Output:** `docs/DEVELOPER_BRIEF.md` covering scope (Phase 1 feature list from SPEC §7), tech stack (Next.js + Supabase + Stripe + Google Drive API + QBO API), milestones, evaluation criteria, payment terms, NDA expectations, IP ownership.

**Estimate:** 1 session (1–2 hours of writing).

**Blocked by:** Founder confirmation on budget range and timeline preferences.

---

### P1.2 No-code feasibility analysis

**Goal:** Determine if Phase 1 can be built on a no-code platform vs. needing a custom developer.

**Platforms to evaluate:** Bubble, Retool, Softr+Supabase, WeWeb, FlutterFlow, Glide, Adalo.

**Hard requirements that constrain choice:**
- Postgres RLS for tenant isolation (SPEC §2.7) — most no-code tools don't expose RLS
- DB-trigger-enforced immutability (SPEC §5.2) — only platforms with custom Postgres support
- Per-tenant Google Drive OAuth (SPEC §2.8) — must support per-user OAuth flows
- QBO OAuth + API integration (SPEC §7.5)
- Stripe billing (SPEC §7.6)
- Custom PDF generation

**Output:** `docs/NO_CODE_ANALYSIS.md` with platform-by-platform scoring matrix and recommendation.

**Estimate:** 1 session.

**Blocked by:** Nothing. Can be done independently of P1.1.

---

## P2 — demo polish (static HTML pitch artifact)

These items improve the static HTML demo. They do NOT move toward Phase 1 production. They are pitch artifacts — useful when showing developers what is intended, or showing potential customers / beta carriers the vision.

### P2.1 settlements.html — data model expansion

**Goal:** Expand the in-memory `settlements` array to match SPEC §4 seven-section structure.

**Add per-settlement fields:**
```js
revenue: { linehaul, fsc, detention, layover, escort_recovery, permit_recovery, tonu, other }
carrier_fees: [{ label, basis, rate, amount }]
permits_detail: [{ permit_id, state, cost }]
expenses_detail: [{ date, vendor, category, amount, receipt_url, load_ref }]
advances: [{ date, amount, method, memo, authorized_by, receipt_url }]
prior_balance: { opening, applied_this_period, closing, lineage: [{ from_settlement_id, amount, reason }] }
```

**Per-load fields:**
```js
{ ref, broker, date, linehaul, fsc, detention, layover, escort_rec, permit_rec, tonu, other }
```

Keep existing `total_adds`, `overhead`, `permits`, `expenses`, `net_pay` as derived/legacy display fields so the current table still works during migration.

**Do not invent data.** New fields stay empty where real values are unknown.

**Estimate:** 1–2 sessions.

**Risk:** Touches the script block in settlements.html which also contains the fragile PDF template literal. Test the PDF modal after every change.

---

### P2.2 settlements.html — page-2 PDF rebuild

**Goal:** Add a page 2 to the settlement PDF using SPEC §4's seven-section structure: Revenue, Carrier Fees, Permits, Operating Expenses, Personal Advances (clearly separated with "NOT AN EXPENSE" banner), Prior Balance Reconciliation, Final Settlement.

**Constraints:**
- Page 1 must not change
- Sections with no data render as "— no items this period —", never with fabricated data
- Personal Advances section carries hard-coded label per RULE 1
- Prior Balance section shows lineage table; flag legacy lump sums visibly
- Footer says "Page 2 of 2"

**Blocked by:** P2.1 (data model must expand first).

**Estimate:** 1–2 sessions.

**Risk:** PDF template literal in `exportSettlementPDF()` is fragile. Fix in commit ac2a033 is the reference point. Test print preview after every change.

---

### P2.3 Carrier Settings / Rate Card page

**Goal:** New page `carrier-settings.html` (admin-only) where Owner sets:
- Dispatch tier schedule (15 rows, defaults seeded from SPEC §3.13)
- Trailer rental rates by trailer type (lowboy, RGN, step-deck, flatbed, hotshot, container chassis)
- Insurance pass-through per truck
- Receipt threshold (read-only, locked $0.00, with note linking to SPEC §9 #4)

**Storage:** localStorage key `cn_carrier_settings`. (Real backend in Phase 1.)

**Sidebar link:** Add under Finance section, between Invoicing and Expenses, label "Rate Card." This is an enhancement, not a restructure per RULE 2.

**Owner-only gate:** Visual banner only at top — "OWNER ROLE ONLY · Audit log records all changes." No real auth in demo.

**Estimate:** 1–2 sessions.

---

### P2.4 settlements.html — dispatch % reads from rate card

**Goal:** When rendering settlement PDFs, derive the dispatch rate from `cn_carrier_settings` based on the driver's truck count (per SPEC §3.13 tier resolution algorithm).

**Placeholder note:** Until ASSETS→driver assignment data exists, hardcode truck_count = 1 with a comment to fix.

**Show in PDF:** "Dispatch X% (N-truck tier) on $Y linehaul = $Z" per SPEC §3.13.

**Blocked by:** P2.3 (settings page must exist first).

---

### P2.5 Period Documents Drive folder link field

**Goal:** Each settlement gets a per-period Drive folder URL field (one slot, editable inline, opens in new tab). Stored in localStorage with the settlement.

**Estimate:** 1 session, low risk. (This was the originally-deferred "Path A" item.)

---

## P2.6 invoicing.html review

**Goal:** Read through invoicing.html (founder switched the tab to it at one point) to understand its current state and align it to SPEC §4 / SPEC distinction between invoicing (broker A/R) and settlements (driver A/P).

**Output:** Notes added to WORK_QUEUE.md identifying any structural fixes needed.

**Estimate:** 1 session of reading + note-taking.

---

## P3 — nice to have / explore later

### P3.1 Roles × permissions matrix in SPEC

A table in SPEC.md showing every entity × every role × CRUD permission. Useful as a developer brief artifact and for the future human Accountant role.

### P3.2 Chart of Accounts detail for QBO

Expand SPEC §7.5 with a specific recommended Chart of Accounts the founder's CPA can review. Includes: Revenue accounts (Linehaul, FSC, Detention, Layover, etc.), COGS accounts (Driver Pay, Fuel, Permits), Asset accounts (Driver Advances Receivable), etc.

### P3.3 Driver Command mobile flow

More detail in SPEC on the mobile experience for drivers: receipt upload, load status, settlement view, advance request. Currently only sketched in driver-command.html.

### P3.4 Onboarding playbook

A non-technical document for what the founder does when a new carrier signs up: pre-call checklist, demo script, contract template, kickoff agenda. Sales-side, not engineering.

### P3.5 Status page / incident response plan

For Phase 1+. Public status page (status.carriernexus.com), incident response runbook, customer communication templates for outages.

### P3.6 Equipment registry consolidation

The demo has equipment.html, fleet-command.html, and maintenance.html. In Phase 1 these may consolidate around a single Assets table. Plan the consolidation in SPEC.

### P3.7 ASSETS → driver assignment UI

Needed so that the dispatch tier lookup (SPEC §3.13) has real truck counts to query. Adds a join table or a foreign key, plus a UI on equipment.html or drivers.html to assign trucks to owner-operators.

---

## Open questions (need founder input)

1. **Budget for Phase 1?** Range estimates: $20–50k for a custom developer over 6–12 months, $5–20k for a no-code build (faster, more limited). Founder has said "no developer / no budget" in past but is now talking SaaS — budget must be revisited.

2. **Domain name?** carriernexus.com appears available (verify before claiming). Other options: getnexus.com, nexushaul.com, etc. Branding decision.

3. **LLC for the SaaS business?** Currently the founder owns Carrier Trucking US, LLC. The SaaS business needs to be a separate entity to limit liability cross-contamination (operating-carrier risk vs. software-vendor risk are very different).

4. **First non-CTUS beta customer?** Per SPEC §11 pre-launch checklist, this is required before Phase 1 ships to a paying customer. Founder needs to identify a friendly carrier willing to beta.

5. **Pricing model?** SPEC §7.6 has placeholders. Per-driver, per-truck, or flat per-carrier? Annual vs. monthly? Free tier or trial?

6. **Driver Google account assumption?** SPEC §9 #3 locked Google SSO but noted low confidence. Many heavy-haul drivers may not have Google accounts. May need email+password fallback for Driver role specifically.

7. **Trailer rental rate defaults?** SPEC §3.13 has `rental_rate_lowboy`, etc., but no default values seeded. Founder's actual current rates would be useful for the demo and for the rate card UI.

---

## How to use this file

When working a session:
1. Pick the highest-priority item that is not blocked.
2. Confirm with the founder before starting.
3. Update the item's status as you go.
4. When done, move to "Done" with commit hash.
5. If you discover a new task, add it under the appropriate priority.

Keep this file honest. If something is blocked, say so. If priorities have shifted, surface that to the founder rather than silently reordering.
