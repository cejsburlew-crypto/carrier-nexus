# HANDOFF — Carrier Nexus

**For:** Any future session (desktop Claude, browser Claude, a developer, a no-code consultant) picking this project up.

**Read order:**

1. **This file** (HANDOFF.md) — 5 minute orientation.
2. **SPEC.md** — source of truth for the system design. Long, dense, locked.
3. **docs/RULES.md** — non-negotiable rules the founder has stated. Re-read before any code change.
4. **docs/WORK_QUEUE.md** — what's queued, in priority order.
5. **settlements.html** — the most-developed UI page. Read it before touching the PDF code; the template literal is fragile (fixed in commit ac2a033).

---

## What this project is

Carrier Nexus is being designed as a **multi-tenant SaaS** for heavy-haul / specialized trucking carriers — owner-operator settlement, accounting, document management, QBO export. The founder (Jim Burlew, Carrier Trucking US, LLC, MC-1688495) is the design partner and intended first tenant. The product is intended to be sold to many other carriers.

Current state of the repo:

- **SPEC.md** — ~1,100 lines, the locked target architecture. This is the design contract.
- **25 HTML files** — a static GitHub Pages site at cejsburlew-crypto.github.io/carrier-nexus. This is a **UI sketch / pitch artifact**, not the production code. It is single-tenant, uses localStorage, has hardcoded data. **Do not invest more effort in making this static HTML 'production ready.'** It cannot become Phase 1.
- **No backend exists.** No database, no auth, no API, no Drive integration, no Stripe. All of that is Phase 1 work that requires a real developer or no-code platform.

## What's locked vs. open

**Locked (do not relitigate without founder authorization):**

- Multi-tenant SaaS, Postgres RLS by carrier_id, MC# as business key (SPEC §2.7)
- Storage: Postgres for transactions, per-carrier Google Drive for documents, drive.file OAuth scope (SPEC §2.8)
- QuickBooks Online as accounting export target. Personal advances → QBO Other Current Asset, NEVER Expense (SPEC §7.5)
- Google SSO for auth (low-confidence lock — may add email+password if drivers lack Google)
- Receipt threshold = $0.00, every transaction requires receipt
- Dispatch % applies to gross linehaul only — not FSC, detention, layover, recoveries, TONU
- Dispatch tier schedule: 1 truck=15%, decrementing 1% per additional truck, floor 1% at 15+ trucks (SPEC §3.13)
- Equipment rental: monthly, payable in 1/2/3 installments, driver chooses (SPEC §3.2)
- US-only hosting (Supabase US region)
- Settlement finalization: Owner role only. Personal advance authorization: Owner only (SPEC §2.5)
- Settlement immutability after finalization, DB-trigger enforced (SPEC §5.2)
- Supersession requires mandatory reason; originals never edited or deleted (SPEC §5.3)
- Audit log includes carrier_id, actor (human, not AI), IP, user agent, before/after values, monthly Drive mirror (SPEC §3.12)
- AI is NOT the system of record. AI may stand in as Accountant role only during demo phase. Production Accountant role MUST be a human bookkeeper/CPA. (SPEC §2.6)

**Open (founder has not decided):**

- Specific Stripe pricing tiers (SPEC §7.6 has placeholders)
- Whether to build Phase 1 with a custom developer vs. no-code platform
- Domain name for the SaaS business
- LLC formation for the SaaS business (separate from Carrier Trucking US, LLC)
- Which attorney drafts ToS/Privacy/DPA
- E&O and cyber insurance carrier selection
- First non-Carrier-Trucking-US beta customer

## What's in commit history (the decision log)

Most recent first. Read commit messages — they are the running narrative of decisions.

- **b236ffd** — SPEC.md: lock multi-tenant SaaS + Drive storage + immutability (the big architecture commit)
- **6848691** — SPEC.md: lock all founder decisions, add §2.5 roles + §2.6 AI-not-system-of-record
- **8a0bd37** — SPEC.md: lock QBO + Postgres decisions, add §7.5 QBO export mapping
- **88a4719** — Add SPEC.md
- **ac2a033** — PDF template literal fix on settlements.html (touch carefully)
- **6aa8aa9** — Chronological week sort on settlements.html
- **33db149** — localStorage persistence for settlement status overrides
- Earlier: settlements UI scaffolding, color/format, Revert to Draft action

## What NOT to do

These are absolute:

1. **Do not change the main menu structure** unless you are enhancing or streamlining it. Adding new pages is fine; reorganizing is not.
2. **Do not mix personal advances with operational expenses** in any UI, any data model, any export, any folder structure. Ever.
3. **Do not finalize a settlement automatically.** Only the Owner role can finalize, and per §2.6, AI cannot act as the Owner.
4. **Do not edit a finalized settlement.** Use supersession (§5.3).
5. **Do not open the founder's private Google Drive folders** without explicit per-folder authorization in the current session. (Folder IDs from prior sessions exist but are not authorized.)
6. **Do not invent data.** If you don't have a real number, leave the field empty or write "TBD by founder." Never fabricate dispatch percentages, dollar amounts, dates, or driver details.
7. **Do not bypass the immutability trigger** in any production code. If you find yourself wanting to, you are doing supersession wrong.
8. **Do not commit secrets** — API keys, OAuth tokens, FEINs, SSNs, bank info — to the repo, ever.
9. **Do not treat the static HTML as the production target.** It is a sketch.
10. **Do not skip the pre-launch checklist** (SPEC §11) before accepting a paying customer.

## How prior sessions edited this repo

For context only — if you are desktop Claude with filesystem access, none of this applies; just edit the files directly.

The prior browser-extension Claude sessions edited via GitHub's web UI:
- CodeMirror 6 editor
- Multi-line content inserted via ClipboardEvent paste with DataTransfer (form_input strips newlines)
- Find/Replace with Regexp mode for multi-line replacements
- Commit directly to main (no PRs)
- Each commit reviewed by founder verbally before being made

If you have filesystem and git access, just clone, edit, commit, push. Much faster.

## The founder's working style

Observed across many sessions:

- Terse, sometimes one-letter replies ("go", "c", "b", "yes")
- Will paste large blocks of spec or requirements without much preamble
- Strong opinions on specific business rules (the personal/operational split, the MC# as identifier, the no-data-invention rule)
- Domain expert in heavy-haul trucking — trust their business rules even when they sound unusual
- Limited interest in technical infrastructure details — wants outcomes, not architecture lectures
- Will say "go to bed" or "work all night" — understand that AI can only act when prompted; clarify expectations honestly
- Will sometimes ask AI to do things AI cannot do (open private Drive folders, run all night, ingest WhatsApp). Be honest about limits.

## Suggested next moves

Not prescriptive — the founder chooses.

1. **Developer brief / RFP** — distill SPEC.md into a one-pager hand-offable to a freelancer or agency
2. **No-code feasibility analysis** — evaluate Bubble / Retool / Softr+Supabase / WeWeb / FlutterFlow against §2.7 (multi-tenant RLS) and §5.2 (DB-level immutability triggers). Both are tough for no-code.
3. **Demo polish on the static HTML** — page-2 PDF rebuild using §4's seven-section structure; new Carrier Settings page reading the locked dispatch tier schedule from §3.13; settlements data model expanded to match §4. These improve the pitch artifact but do not move toward Phase 1.
4. **Phase 1 build** — real backend. Cannot be done by Claude alone; requires founder action (form LLC, hire developer or pick no-code platform, set up Supabase/Stripe/Google Cloud accounts, retain attorney for ToS/Privacy, buy insurance).

See docs/WORK_QUEUE.md for the prioritized backlog.

## Final note

This project has had many sessions. The repo is the only persistent memory. If something was decided in conversation but isn't in SPEC.md, RULES.md, or a commit message, it didn't happen — confirm with the founder before acting on it.

If in doubt, ask. The founder prefers a paused agent over a wrong commit.
