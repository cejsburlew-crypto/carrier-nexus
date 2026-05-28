# Carrier Nexus — System Specification

> **Status:** Living design document. This is the target architecture, not the current implementation.
> **Audience:** Future developers, future Claude sessions, and the founder.
> **Last updated:** 2026-05-27 · multi-tenant SaaS architecture locked

---

## 0. Why this document exists

The current Carrier Nexus repo is a collection of static HTML pages served by GitHub Pages. There is no backend, no database, no authentication, no audit log, and no real-time data ingestion. Numbers shown in pages like `settlements.html` are **hardcoded snapshots** that were originally produced by a desktop Claude session with WhatsApp / Gmail / Google Drive connectors, then frozen into HTML.

That workflow does not scale past a handful of drivers. This document captures the **target architecture** for a real heavy-haul owner-operator settlement and accounting system that can scale from 1 driver to 1,000, so that whoever builds the production system (a developer, a no-code platform, or a future Claude session with real tooling) has a clear, agreed design to build against.

This document is the source of truth for the design. The HTML in the repo is a UI sketch of that design.

---

## 1. Business context

Carrier Nexus serves a **lease-on heavy-haul / specialized trucking carrier** running owner-operators. The current system is too simplistic and dangerously mixes:

- Operational business expenses
- Personal driver advances
- Equipment charges (rentals, fees)
- Prior balances
- Cash advances
- Final settlement

This is not acceptable for a real carrier. The target system must produce **audit-defensible settlements**, scale to many drivers and equipment combinations, support specialized heavy-haul (oversize loads, modular trailers, jeeps, boosters, escorts), and survive disputes, audits, and growth.

### Equipment / load profile

The system must handle, as first-class concepts:

- Heavy haul and oversize loads
- Modular and configurable equipment combinations, including:
  - Tractor only
  - Tractor + Trailer
  - Tractor + Jeep
  - Tractor + Booster
  - Tractor + RGN + Jeep + Booster
  - Power only
  - Escort vehicle only
- Lease-on owner-operator drivers
- Company-owned assets
- Subcontracted equipment

The system must **not** be modeled as generic dry-van trucking.

---

## 2. Core design principles (non-negotiable)

1. **Personal expenses MUST NEVER be mixed with operational business expenses.** They live in separate tables, separate ledger accounts, and separate settlement sections. The system must make it structurally impossible to commingle them.
2. **Every asset must be identified by BOTH an Internal Unit ID AND a VIN / Serial Number.** Descriptions alone are not sufficient.
3. **Every financial transaction must be traceable** to a source document (rate confirmation, invoice, receipt, repair order, fuel-card export, etc.).
4. **Prior balances must reconcile mathematically.** Never display "negative prior balance" without an itemized reconciliation showing beginning balance, charges, payments, credits, adjustments, and ending balance.
5. **Settlements, once finalized, are immutable.** Any change requires a correction settlement that references the original; the original PDF is preserved.
6. **Every write to the system produces an audit log entry** (who, what, when, before, after).
7. **The system is not an accounting platform.** It produces clean, exportable data that feeds QuickBooks / Wave / Xero / etc. It does not replace them.
8. **Heavy-haul-specific concerns are first-class**, not optional plugins: oversize permits, escort recovery, axle configuration, modular equipment combinations.

---

## 2.5 User roles & document flow

Four roles. Each role has a defined scope, and the flow of a load through the system follows a fixed sequence: **Dispatcher → Driver → Dispatcher → Accountant → Owner.**

### Roles

- **Dispatcher.** Creates loads, assigns drivers and equipment, confirms loads are complete and that paperwork is uploaded. Cannot enter expenses or advances. Cannot finalize settlements.
- **Driver.** Reads their own loads. Uploads PODs / BOLs / receipts via Driver Command (mobile). Reports repairs, blowouts, fuel events. Cannot edit settlement amounts. Cannot view other drivers' data.
- **Accountant.** Reads everything. Builds draft settlements from the documents Dispatch confirmed. Classifies each line as Revenue / Carrier Fee / Permit / Operating / Personal Advance. Runs prior-balance reconciliation. Produces the draft PDF. **Cannot finalize.** **Cannot authorize personal advances.**
- **Owner.** Reads and writes everything. **Only role that can:** finalize a settlement (draft → finalized), authorize a personal advance, issue a vendor credit, override a reconciliation mismatch, or void/supersede a finalized settlement.

### Document flow per load

1. **Dispatcher** creates the load, attaches the rate confirmation, assigns the driver and the asset combination (tractor + trailer + jeep + booster + escort as applicable).
2. **Driver** runs the load. Via Driver Command they upload: POD/BOL, fuel receipts, hotel receipts, toll receipts, parking, repair invoices, photos of any blowouts or damage. Each upload tags the load_id automatically.
3. **Dispatcher** confirms the load is complete: paperwork is in, mileage is in, the load can be invoiced. Status flips to `delivered` then `billed`.
4. **Accountant** opens the settlement for the period, sees every confirmed load and every uploaded document, and builds the draft settlement: classifies each line, runs reconciliation, generates the draft PDF. Settlement status is `draft`.
5. **Owner** reviews the draft, authorizes any personal advances, and clicks Finalize. Status flips to `finalized`, the PDF is archived immutably, and the QBO export package is queued.

### Audit log implications

Every state transition (load `dispatched` → `delivered` → `billed`, settlement `draft` → `finalized`) writes an audit log entry with the actor (role + user_id), the before state, and the after state. A settlement that was finalized by anyone other than the Owner role is an integrity violation and must be flagged by the system.

---

## 2.6 Operating principle: AI is an assistant, not the system of record

During design and demo phases (the current static site), an AI assistant (Claude or otherwise) may be used to draft settlement numbers, classify lines, and generate proposals — effectively standing in for the Accountant role. This is acceptable **only while no real money is moving.**

Once Phase 1 goes live with real settlements paying real drivers:

- The **Accountant role must be a human** (in-house bookkeeper, fractional bookkeeper, or the carrier's CPA).
- AI may assist the human Accountant (e.g. extracting line items from receipts, suggesting classifications, flagging anomalies) but the human is the system of record and is professionally accountable.
- AI must never finalize a settlement. AI must never authorize a personal advance. These are Owner-only actions performed by the human Owner.
- The audit log records the human actor, not the AI tool. If AI assisted, that fact is noted in the audit memo, but the human's user_id is the actor.

Rationale: AI sessions are not continuous (no memory between sessions), are not licensed to practice accounting, and cannot be held professionally accountable. A carrier's books must be owned by a human who can be subpoenaed and who carries E&O insurance.

---

## 3. Entities (data model)

Twelve core entities. Each gets its own table / collection in the production system.

### 3.1 DRIVERS
- `driver_id` (PK)
- `legal_name`, `display_name`
- `driver_type`: `lease_on_owner_operator | company | subcontractor`
- `cdl_number`, `cdl_state`, `cdl_expiration`
- `medical_card_expiration`
- `hire_date`, `termination_date`
- `dispatch_pct` (default percentage, can be overridden per load)
- `home_terminal`
- `contact_phone`, `contact_email`, `whatsapp_number`
- `payment_method`, `payment_details_reference` (NOT stored in app — reference to external secure store)
- `status`: `active | inactive | terminated`

### 3.2 ASSETS (Equipment Registry)
- `asset_id` (PK, internal Unit ID, e.g. `Truck-24`, `RGN-07`, `Jeep-03`, `Booster-11`)
- `vin_or_serial` (REQUIRED — no asset is allowed without this)
- `asset_type`: `tractor | trailer | rgn | jeep | booster | dolly | step_deck | flatbed | escort_vehicle | flip_axle | specialized`
- `make`, `model`, `year`
- `plate_number`, `plate_state`, `plate_expiration`
- `ownership_type`: `company_owned | owner_operator_owned | leased | subcontracted`
- `owner_reference` (driver_id or external party)
- `assigned_driver_id` (nullable, current assignment)
- `insurance_policy_ref`, `insurance_expiration`
- `registration_expiration`
- `axle_configuration` (text, e.g. "3-axle RGN", "Jeep 3-axle", "Booster 2-axle")
- `permit_classification` (text)
- `weekly_rental_rate` (decimal)
- `monthly_rental_rate` (decimal)
- `rental_billing_method`: `monthly` (locked default — see §9 #6); `weekly_rental_rate` is derived as `monthly_rental_rate / 4.333` for display only
- `rental_payment_plan` (per asset assignment): `1_payment | 2_payments | 3_payments` per calendar month
- `status`: `active | in_maintenance | retired | sold`

### 3.3 LOADS
- `load_id` (PK)
- `load_number` (external broker ref)
- `broker_id`, `customer_id`
- `rate_confirmation_ref` (path / URL to source doc)
- `pickup_date`, `pickup_location`
- `delivery_date`, `delivery_location`
- `linehaul_revenue` (decimal)
- `fuel_surcharge` (decimal)
- `detention`, `layover`, `escort_recovery`, `permit_recovery`, `tonu_cancellation`, `other_credits` (each decimal, default 0)
- `assigned_driver_id`
- `assigned_assets` (array of asset_id — tractor + trailer(s) + jeep + booster + escort, in the actual combination used)
- `miles_loaded`, `miles_empty`
- `dispatch_pct_override` (nullable)
- `status`: `quoted | dispatched | in_transit | delivered | billed | paid | cancelled`

### 3.4 SETTLEMENTS
- `settlement_id` (PK)
- `driver_id`
- `period_start`, `period_end`
- `statement_number` (sequential per driver)
- `status`: `draft | finalized | corrected | superseded`
- `superseded_by_settlement_id` (nullable)
- `finalized_at`, `finalized_by` (user id)
- `period_documents_drive_link` (one Google Drive folder URL where the source paperwork for this period lives)
- `pdf_archive_ref` (path to immutable PDF once finalized)
- Calculated totals (denormalized, recomputed on finalize):
  - `gross_revenue`
  - `carrier_fees_total`
  - `permits_total`
  - `operating_expenses_total`
  - `personal_advances_total` (REPORTED SEPARATELY)
  - `prior_balance_beginning`, `prior_balance_ending`
  - `final_settlement_amount`
  - `direction`: `owed_to_driver | owed_to_carrier`

### 3.5 EXPENSES (Operating — never personal)
- `expense_id` (PK)
- `settlement_id` (nullable until applied)
- `driver_id`, `load_id` (nullable)
- `asset_id` (nullable)
- `category`: `fuel | def | repairs | tires | maintenance | hotels | tolls | parking | equipment_rental | securement | escort_charge | other_operating`
- `amount` (decimal)
- `vendor`
- `invoice_or_receipt_ref` (REQUIRED if above configurable threshold)
- `repair_order_number` (REQUIRED for repairs)
- `incurred_date`
- `entered_by`, `entered_at`
- `approved_by`, `approved_at` (for amounts over threshold)

### 3.6 ADVANCES (Personal — never operational)
- `advance_id` (PK)
- `settlement_id` (nullable until applied)
- `driver_id`
- `category`: `zelle_personal | doordash | uber | personal_purchase | family_expense | food | tiktok_shop | cash_advance | other_personal`
- `amount` (decimal)
- `authorized_by` (REQUIRED)
- `incurred_date`
- `description`
- `entered_by`, `entered_at`

**Hard rule:** ADVANCES and EXPENSES are separate tables. There is no foreign key, no enum, and no UI affordance that lets an entry move between them. To reclassify, you delete from one and create in the other, and the audit log captures both events.

### 3.7 PERMITS
- `permit_id` (PK)
- `load_id` (nullable)
- `permit_type`: `oversize | overweight | state_specific | temporary_registration | annual_blanket | other`
- `issuing_state`, `permit_number`
- `cost`
- `effective_date`, `expiration_date`
- `document_ref`
- `recovered_from_broker` (boolean)
- `recovery_amount` (decimal)

### 3.8 MAINTENANCE
- `maintenance_id` (PK)
- `asset_id` (REQUIRED)
- `event_type`: `preventive | repair | inspection | tire_replacement | breakdown | other`
- `odometer_reading`
- `wheel_position`
- `event_date`
- `vendor`, `invoice_ref`, `repair_order_number`
- `cost`
- `paid_by`: `company | owner_operator | warranty`
- `description`, `parts_replaced` (array)

### 3.9 INVOICES (Outbound)
- `invoice_id` (PK)
- `load_id`
- `broker_id` / `customer_id`
- `invoice_number`
- `amount`
- `issued_date`, `due_date`, `paid_date`
- `factoring_reference`
- `status`: `draft | sent | paid | partial | overdue | written_off`

### 3.10 PAYMENTS (Inbound)
- `payment_id` (PK)
- `invoice_id` (nullable)
- `amount`
- `received_date`
- `payer_reference`
- `payment_method`

### 3.11 BROKERS / CUSTOMERS
- `entity_id` (PK)
- `legal_name`, `dba`
- `mc_number`, `dot_number`
- `contact_name`, `phone`, `email`
- `billing_address`
- `payment_terms` (days)
- `factoring_required` (boolean)
- `credit_rating`

### 3.12 AUDIT_LOG
- `log_id` (PK)
- `timestamp`
- `actor` (user id)
- `entity_type`, `entity_id`
- `action`: `create | update | delete | finalize | supersede | upload | download | export`
- `before_state` (JSON snapshot)
- `after_state` (JSON snapshot)
- `ip_address`, `user_agent`

---

## 4. Settlement structure (the canonical 7 sections)

Every finalized settlement PDF must contain these seven sections, in this order. Personal Driver Advances (Section 5) is always rendered as visually and structurally separate from operating expenses.

### Section 1 — REVENUE
- Gross Linehaul
- Fuel Surcharge
- Detention
- Layover
- Escort Recovery
- Permit Recovery
- TONU / Cancellation
- Credits / Adjustments
- **Subtotal: Gross Revenue**

### Section 2 — CARRIER FEES
- Dispatch % (with clearly stated basis: gross linehaul vs. gross revenue)
- Factoring fee
- Trailer rental (if applicable)
- Insurance
- ELD fees
- Occupational accident
- Escrow contribution
- Technology fees
- **Subtotal: Carrier Fees**

### Section 3 — PERMITS & COMPLIANCE
- Oversize permits
- State-specific permits
- Temporary registrations
- Compliance / inspection charges
- **Subtotal: Permits & Compliance**

### Section 4 — OPERATING ADVANCES & BUSINESS EXPENSES
- Fuel
- DEF
- Repairs (with repair order numbers)
- Tires
- Maintenance
- Hotels
- Tolls
- Parking
- Equipment rentals (tied to asset_id)
- Securement equipment
- Escort charges
- **Subtotal: Operating Expenses**

### Section 5 — PERSONAL DRIVER ADVANCES (SEPARATE)
- Zelle personal advance
- DoorDash
- Uber
- Personal purchases
- Family expenses
- Food
- TikTok Shop
- Cash advance
- **Subtotal: Personal Advances** — rendered with visible separator above and below; never summed into operating expenses.

### Section 6 — PRIOR BALANCE RECONCILIATION
- Beginning balance (carried from previous settlement's ending balance)
- Prior period charges applied
- Prior period payments applied
- Credits applied
- Adjustments (with reason code)
- **Ending balance** = beginning + charges − payments − credits + adjustments
  - Must reconcile mathematically. UI rejects mismatches.

### Section 7 — FINAL SETTLEMENT
- Total gross revenue (from §1)
- Total deductions (§2 + §3 + §4 + §5 + applicable §6)
- **Final settlement amount**
- **Direction:** Owed to driver, or Owed to carrier
- Payment method, payment reference, payment date

---

## 5. Internal controls

- Every operating expense and every personal advance requires an attached receipt or invoice. There is no minimum amount — $0.01 requires a receipt. The UI must reject save attempts that have no attachment.
- All repair entries require a repair order number.
- All personal advances require an authorizer.
- Fuel charges should reconcile against fuel card exports (Tank, WEX, EFS, Comdata) within a tolerance; mismatches flagged.
- All finalized settlements produce an immutable PDF archive stored outside the editable application data.
- Every change creates an audit log entry.
- Prior balances must reconcile to the previous period's ending balance; mismatches block finalization.
- Dispatch percentage rows must explicitly state the calculation basis.
- Load revenue rows must reference a rate confirmation document.
- Equipment charges must reference an asset_id from the Equipment Registry.

---

## 6. Current implementation vs. target (gap analysis)

| Concern | Target | Current static site |
| --- | --- | --- |
| Storage | Real database (Postgres / Firestore / etc.) | Hardcoded JS arrays + localStorage |
| Multi-user | Per-user auth, roles, permissions | None |
| Audit log | Every write logged with before/after | None |
| Immutable PDFs | PDF archived to object storage on finalize | PDF generated on demand from current state |
| Personal vs. operational | Separate tables, structurally enforced | Single expenses field on settlement |
| Equipment registry | Full asset table with Unit ID + VIN + ownership + rental rates | Lightweight UI, no rental rate model |
| Prior balance reconciliation | Mathematical reconciliation, blocks finalize on mismatch | Single number, no breakdown |
| Document ingestion | WhatsApp / Gmail / Drive pipelines | None — done manually by desktop Claude |
| Settlement structure | 7 canonical sections | One lumped expenses total |
| Scale | 1 to 1,000 drivers | Practical limit: 1 user, handful of drivers |

---

## 7. Phasing

### Phase 0 — Current static site (where we are)
- Display layer only. Hardcoded data. localStorage for status overrides and Drive folder links.
- Goal: produce a usable artifact for the founder while design is finalized.

### Phase 1 — Real backend, single tenant
- Move data to a real database. Add auth. Implement entities §3.1–§3.6 and §3.12.
- Implement 7-section settlement structure (§4).
- Manual data entry via web forms. No automated ingestion yet.
- Enough to onboard the carrier and run real settlements.

### Phase 2 — Equipment registry, maintenance, permits
- Implement §3.2 (full asset registry with Unit ID + VIN), §3.7, §3.8.
- Equipment rental billing engine.
- PM scheduling from ELD mileage (Motive integration).

### Phase 3 — Document ingestion
- Gmail integration: pull rate cons, invoices, fuel card statements.
- WhatsApp Business integration: capture driver communication, link to loads.
- Google Drive structured filing.
- OCR receipt ingestion.

### Phase 4 — Intelligence & scale
- Multi-tenant. Tire failure prediction. Load profitability by broker. Fuel anomaly detection. PM forecasting.

---

## 7.5 QuickBooks Online export mapping

When a settlement is finalized, the system produces a QBO-ready export package. Each row in the canonical 7-section settlement maps to a specific QBO object and account type. The mapping below is the contract Phase 1 must honor.

### Vendor / Customer entities

- **Each Driver** → QBO **Vendor** (lease-on owner-operators are paid as vendors, not employees — confirm with CPA per state).
- **Each Broker / Customer** → QBO **Customer**.
- **Each fuel-card provider, repair shop, permit issuer, insurance carrier** → QBO **Vendor**.
- **Each Asset (truck, trailer, jeep, booster)** → QBO **Fixed Asset** (if company-owned) or referenced via custom field on related transactions (if owner-operator-owned).

### Section 1 — Revenue → QBO Customer Invoices

- Linehaul, Fuel Surcharge, Detention, Layover, Escort Recovery, Permit Recovery, TONU → separate line items on the broker **Invoice**, each tied to a QBO Income Item.
- Income Items recommended: `Linehaul Revenue`, `Fuel Surcharge Revenue`, `Accessorial Revenue`, `Permit Recovery Revenue`, `Escort Recovery Revenue`.

### Section 2 — Carrier Fees → QBO Bills / Journal Entries

- **Dispatch %** → NOT a separate transaction in QBO; it is a reduction of what the driver-vendor receives. Modeled as a **Journal Entry** crediting `Dispatch Fee Income` (carrier) and debiting `Driver Payable` (vendor balance).
- **Factoring fee** → QBO **Bill** to the factoring company, expense account `Factoring Expense`.
- **Trailer rental, ELD fees, occupational accident, technology fees** → **Bill** entries against the appropriate expense accounts.
- **Escrow contribution** → **Other Current Liability** account `Driver Escrow Held` — NOT an expense.

### Section 3 — Permits & Compliance → QBO Bills (or Pass-Through)

- Permits paid by the carrier and recovered from the broker: route through a `Permit Recovery Clearing` account so revenue (Section 1) and cost (Section 3) net to zero or to the carrier's actual margin.
- Permits paid by the carrier and absorbed: **Bill** against `Permits & Compliance` expense account.

### Section 4 — Operating Expenses → QBO Bills

- Each expense line → **Bill** entry against its specific expense account: `Fuel`, `DEF`, `Repairs & Maintenance`, `Tires`, `Hotels & Lodging`, `Tolls`, `Parking`, `Equipment Rental Income` (if carrier-billed) or `Equipment Rental Expense` (if carrier-paid), `Securement Supplies`, `Escort Services`.
- Vendor reference + receipt attachment + (for repairs) repair order number must flow through.

### Section 5 — Personal Driver Advances → QBO Other Current Asset (NEVER Expense)

- **Critical:** Personal advances are NOT expenses of the carrier. They are **loans to the driver** that get netted against the final settlement.
- QBO account: `Driver Advances Receivable — [Driver Name]` (Other Current Asset, one sub-account per driver).
- When the carrier pays out the advance: debit `Driver Advances Receivable`, credit `Bank`.
- When the advance is deducted from the settlement: debit `Driver Payable`, credit `Driver Advances Receivable`.
- The P&L is never touched. This is the rule that keeps personal spending from polluting the carrier's books.

### Section 6 — Prior Balance Reconciliation → QBO Journal Entries

- Beginning balance reads from the previous period's `Driver Payable` or `Driver Advances Receivable` ending balance.
- Any adjustments require a documented reason code and produce a Journal Entry with `Adjustment Reason` in the memo field.

### Section 7 — Final Settlement → QBO Bill or Vendor Credit

- If owed to driver: QBO **Bill** to the driver-vendor for the net amount, paid via the carrier's normal AP workflow.
- If owed to carrier: QBO **Vendor Credit** against the driver-vendor, applied to the next settlement.
- The immutable settlement PDF (§5) is attached to the QBO transaction.

### Export mechanism

- Phase 1: nightly batch export via QBO API (one-way: CN → QBO). OAuth 2.0 with refresh tokens. Sandbox environment for development.
- Phase 4: two-way sync (pull paid status from QBO back to CN invoices).
- All exports produce an audit log entry per object pushed. Failed pushes are queued for retry, not silently dropped.

### Chart of Accounts (minimum required in QBO before go-live)

- **Income:** Linehaul Revenue, Fuel Surcharge Revenue, Accessorial Revenue, Permit Recovery Revenue, Escort Recovery Revenue, Dispatch Fee Income, Equipment Rental Income
- **Expense:** Fuel, DEF, Repairs & Maintenance, Tires, Hotels & Lodging, Tolls, Parking, Permits & Compliance, Securement Supplies, Escort Services, Factoring Expense, Insurance, ELD Fees, Occupational Accident, Technology Fees, Equipment Rental Expense
- **Other Current Asset:** Driver Advances Receivable (with per-driver sub-accounts), Permit Recovery Clearing
- **Other Current Liability:** Driver Escrow Held, Driver Payable (with per-driver sub-accounts)
- **Fixed Asset:** Trucks, Trailers, RGNs, Jeeps, Boosters, Escort Vehicles

---

## 8. What this system is NOT

- Not an accounting platform. It exports to QuickBooks / Wave / Xero.
- Not a dispatch marketplace.
- Not a generic dry-van TMS.
- Not a replacement for an ELD or fuel card provider.
- Not a place to store passwords, full bank account numbers, or full payment card numbers. Sensitive identifiers are referenced, not stored.

---

## 9. Locked decisions (all founder questions resolved 2026-05-27)

1. **✅ LOCKED — Accounting target: QuickBooks Online.** Phase 1 data shapes must export cleanly to QBO. Personal Driver Advances map to a QBO **Other Current Asset / Employee Loan** account — never an Expense account — so they do not pollute the P&L. See §7.5 for the full mapping.
2. **✅ LOCKED — Platform: custom Postgres backend.** Recommended host for Phase 1: **Supabase** (managed Postgres + auth + object storage for PDF archives + row-level security ready for multi-tenant). The SPEC.md schema drops in as raw SQL. **Operational note:** This stack still requires a developer to implement Phase 1; managed hosting is mandatory — do not self-host. (Alternatives considered: Airtable + scripts (fastest, limited) vs. Supabase / Firebase (mid) vs. custom Postgres [chosen]).
3. **✅ LOCKED — Authentication: Google SSO only.** Confidence: low — may need to add email+password fallback if a driver doesn't have a Google account. Revisit if it blocks onboarding.
4. **✅ LOCKED — Receipt threshold: $0.00 (every transaction).** Every operating expense and every personal advance requires an attached receipt/invoice regardless of amount. There is no minimum. The UI must reject save attempts that have no attachment.
5. **✅ LOCKED — Dispatch %: applied to gross linehaul only.** Fuel surcharge, detention, layover, escort recovery, permit recovery, TONU and other accessorials are NOT subject to dispatch %. The settlement display must show the calculation basis explicitly on the dispatch fee line.
6. **✅ LOCKED — Equipment rental: monthly, payable in 1, 2, or 3 installments.** `monthly_rental_rate` is the source-of-truth field on each asset. The driver may pay the monthly rent in 1 lump, 2 installments, or 3 installments per calendar month — selectable per asset assignment via a `rental_payment_plan` field. Each installment posts as its own line under §4 Operating Expenses with a label like `Equipment Rental — RGN-07 (installment 2 of 3)`.
7. **✅ LOCKED — Hosting region: US only.** Supabase US region for Phase 1. No data residency in EU/CA/MX. PDF archives and document storage also US-region. Driver and broker data is US-jurisdiction only.
8. **✅ LOCKED — Settlement finalization: Owner role only.** The Accountant role prepares the draft settlement and runs reconciliation. Only the Owner role can flip the status from `draft` to `finalized` and authorize payment. Personal advance authorization (§3.6 `authorized_by`) is also Owner-only — Accountant cannot self-authorize advances. See §2.5 for the full role flow.

---

## 10. Glossary

- **POD** — Proof of Delivery.
- **BOL** — Bill of Lading.
- **Rate Con** — Rate Confirmation from broker.
- **RGN** — Removable Gooseneck trailer. Used for heavy haul.
- **Jeep** — Auxiliary axle assembly between tractor and trailer to spread weight.
- **Booster** — Auxiliary axle assembly behind the trailer to spread weight.
- **Escort vehicle** — Pilot/chase car required for oversize loads.
- **TONU** — Truck Order Not Used. Cancellation compensation.
- **Lease-on owner-operator** — Driver who owns the truck but operates under the carrier's authority.
- **Factoring** — Selling invoices to a third party at a discount in exchange for immediate cash.
- **Detention** — Compensation for driver time held at a shipper/receiver beyond agreed loading time.
- **Layover** — Compensation for forced overnight delay.

---

*End of specification.*

## 2.7. Multi-tenant SaaS architecture (LOCKED 2026-05-27)

**Decision:** Carrier Nexus is a multi-tenant SaaS product. Carrier Trucking US, LLC is the design partner and first tenant, not the sole tenant.

**Tenancy model:** Shared database, shared schema, row-level isolation by `carrier_id` foreign key on every domain entity. Enforced at the database layer via PostgreSQL Row-Level Security (RLS) policies, not just at the application layer. A bug in application code must never be able to leak data across carriers.

**Natural business key:** A carrier's **MC number** is the public identifier (with **DOT number** as secondary). Internal primary key is a UUID. MC# is what carriers see, what appears in folder names, what is used in support tickets.

**Tenant isolation is non-negotiable.** Acceptance criteria for Phase 1:
- Every domain table has `carrier_id NOT NULL` with FK to `carriers.carrier_id`.
- Every Postgres RLS policy filters by `current_setting('app.current_carrier_id')`.
- No application code path holds a "master" token that can read across carriers.
- Automated test suite includes cross-tenant access attempts; all must fail.
- Any cross-tenant data leak is a P0 security incident.

**What this changes vs. single-tenant draft:**
- Every entity in §3 gains `carrier_id`.
- Auth is mandatory (no anonymous use).
- Settings, rate cards, dispatch tiers, trailer rental rates, insurance pass-through — all per-carrier.
- PDF letterhead (FEIN, MC, DOT, SCAC, address) is loaded from the `carriers` row, not hardcoded.
- QBO export (§7.5) becomes per-carrier OAuth — each carrier connects their own QBO company.
- Google Drive integration is per-carrier (see §2.8).

---

## 2.8. Storage model: Per-tenant Google Drive + Postgres index (LOCKED 2026-05-27)

**Principle:** The carrier owns their documents. Carrier Nexus owns the index, the calculations, and the audit trail.

**What lives in Postgres (Carrier Nexus owns the storage):**
- All transactional records: carriers, users, drivers, assets, loads, settlements, line items, expenses, advances, permits, invoices, payments, audit_log
- Calculated values (net pay, dispatch %, totals)
- Pointers to Drive files (Drive file_id, mime_type, size, linked_entity)
- User authentication, sessions, RBAC roles

**What lives in each carrier's own Google Drive (the carrier owns the storage):**
- PODs, BOLs, rate confirmations
- Receipts (fuel, tolls, scales, repairs, parts) — operational only
- Personal advance acknowledgments — separate folder tree from receipts
- Permits
- Driver onboarding documents (CDL, medical card, MVR, agreements)
- Equipment registration, inspections, work orders
- Finalized settlement PDFs (immutable copies)
- Broker invoices
- Monthly accounting export CSVs
- Monthly audit log CSVs

**Why this split:**
- Carrier keeps full ownership of their documents — survives subscription cancellation
- Drastically reduces Carrier Nexus's data custody liability
- Drive handles storage scale, versioning, sharing, search — free of charge
- Privacy story is strong: "your documents stay in your Google account"
- Each carrier's data is physically isolated by Google's account boundary

**OAuth scope:** `https://www.googleapis.com/auth/drive.file` only. The app can only see files it created. Documents the carrier puts into Drive outside the app are invisible to the app. This is intentional — it limits blast radius if app credentials are ever compromised.

**Folder structure (provisioned automatically on first carrier signup):**

```
[Carrier's Google Drive root]
└── Carrier Nexus — MC-XXXXXXX — [Legal Name]/
    ├── 00_Carrier_Profile/
    │   ├── Authority_Documents/
    │   ├── Insurance/
    │   ├── W9_and_Tax/
    │   └── Logos_and_Letterhead/
    ├── 01_Drivers/
    │   └── [Driver_Name — driver_id]/
    │       ├── Onboarding/
    │       ├── Agreements/
    │       ├── Insurance/
    │       └── Settlements_PDFs/
    ├── 02_Equipment/
    │   └── [Unit_ID — VIN_last6]/
    │       ├── Registration_and_Title/
    │       ├── Inspections/
    │       ├── Maintenance/
    │       └── Photos/
    ├── 03_Loads/
    │   └── YYYY/YYYY-MM/Load_[id]_[broker]_[origin-dest]/
    │       ├── Rate_Confirmation/
    │       ├── BOL/
    │       ├── POD/
    │       ├── Permits/
    │       ├── Escort_Invoices/
    │       ├── Scale_Tickets/
    │       └── Photos/
    ├── 04_Permits/
    │   └── YYYY-MM/
    ├── 05_Receipts/                          ← OPERATIONAL ONLY
    │   └── YYYY-MM/[Driver]/
    │       ├── Fuel/
    │       ├── Tolls/
    │       ├── Scales/
    │       ├── Repairs_and_Parts/
    │       └── Other/
    ├── 06_Personal_Advances/                 ← SEPARATE from receipts (§2 rule)
    │   └── YYYY-MM/[Driver]/
    ├── 07_Settlements/
    │   └── YYYY/Week_YYYY-MM-DD_to_YYYY-MM-DD/
    │       ├── Draft/
    │       ├── Final/                        ← read-only after finalization
    │       ├── Superseded/                   ← prior versions kept forever (§5.3)
    │       └── Supporting_Index.csv
    ├── 08_Invoicing/
    │   └── YYYY-MM/Invoice_[id]_[broker]/
    │       ├── Invoice_PDF/
    │       ├── BOL_POD_packet/
    │       └── Factoring_submission/
    ├── 09_Accounting_Exports/
    │   └── YYYY-MM/
    │       ├── QBO_Bills_export.csv
    │       ├── QBO_Invoices_export.csv
    │       ├── QBO_JournalEntries.csv
    │       └── Reconciliation_log.txt
    └── 10_Audit/
        └── audit_log_YYYY-MM.csv             ← append-only mirror of Postgres audit_log
```

**Hard rules:**
1. **The app names and provisions the folder tree.** Carriers do not rename app-managed folders. If a carrier renames a folder, the app re-creates the expected structure on next sync and logs a warning.
2. **`05_Receipts/` and `06_Personal_Advances/` are NEVER merged**, even at the filesystem level. This enforces the §2 principle "do not mix personal expenses with operational expenses" at the storage layer.
3. **Finalized settlement PDFs in `07_Settlements/.../Final/` are set to read-only** via Drive permissions. Superseded versions move to `Superseded/` — never deleted, never overwritten.
4. **The monthly audit log CSV in `10_Audit/` is append-only.** Even Carrier Nexus cannot rewrite past months. If reconstruction is needed, a new file is written with a corrections suffix.
5. **One carrier per Drive root.** Carrier Nexus never asks a carrier to share their root folder with another carrier. Sharing of individual documents (e.g., a POD to a broker) is fine — that is the carrier's choice using normal Drive sharing.

---

## 2.9. Carrier onboarding flow (LOCKED 2026-05-27)

First-time signup sequence:

1. Carrier visits public landing page, clicks **Sign up**.
2. Carrier completes Google SSO. App captures: email, Google user_id, display name.
3. App prompts for carrier details: **MC number, DOT number**, legal name, DBA name, FEIN, address, phone, SCAC (optional).
4. App validates MC# format and checks for duplicates. Duplicate MC# blocks signup with message "An account already exists for MC-XXXXXXX. Contact your carrier admin to be invited."
5. App requests Google Drive scope `drive.file`. Carrier approves on Google's consent screen.
6. On approval, app:
   a. Creates the root folder `Carrier Nexus — MC-XXXXXXX — [Legal Name]` in carrier's Drive.
   b. Provisions the 00–10 subfolder tree.
   c. Writes a `README.md` in root explaining the structure and the immutability rules.
   d. Creates Postgres records: `carriers` row, `carrier_users` row (this user = Owner role), default `carrier_settings` row with dispatch tier defaults seeded.
   e. Writes `audit_log` event: `carrier_provisioned`, actor = this user.
7. Carrier lands on Owner dashboard with empty state and "Add your first driver" CTA.
8. Trial period starts (length TBD in §7.6).

**Subsequent users at the same carrier** are invited by the Owner via email, sign in with Google SSO, and are added to `carrier_users` with the role assigned by the Owner. They inherit access to that carrier's data; they do not get a new Drive folder.

---

## 2.10. Subscription cancellation and data portability (LOCKED 2026-05-27)

When a carrier cancels:

1. Subscription marked `canceled`, billing stops at end of current period.
2. At end of grace period, app's OAuth token for that carrier is revoked. App loses write access to the Drive folder.
3. **The carrier's Drive folder is never touched by the app on cancellation.** Carrier retains every document, in their own Google account, exactly as it was.
4. Postgres records are retained for **90 days** in case of resubscribe.
5. After 90 days, Postgres records are anonymized except where legal retention requires otherwise (tax records, finalized settlements per IRS retention guidance, audit log).
6. On request, carrier receives a full CSV export of their Postgres data before anonymization.
7. **Carrier Nexus has no "delete the Drive folder" feature, ever.** If the carrier wants to delete their documents, they do so themselves in Google Drive.
8. Resubscribe within 90 days restores access cleanly. Resubscribe after 90 days requires re-onboarding but can re-link the existing Drive folder.

---


## 3.0. CARRIERS (NEW — root entity, parent of all data) (LOCKED 2026-05-27)

```sql
CREATE TABLE carriers (
  carrier_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mc_number         TEXT UNIQUE NOT NULL,                  -- public business key
  dot_number        TEXT UNIQUE NOT NULL,
  scac              TEXT,                                   -- optional, 2-4 char carrier code
  fein              TEXT,                                   -- encrypted at rest
  legal_name        TEXT NOT NULL,
  dba_name          TEXT,
  address_street    TEXT NOT NULL,
  address_city      TEXT NOT NULL,
  address_state     CHAR(2) NOT NULL,                       -- US-only per §9
  address_zip       TEXT NOT NULL,
  phone             TEXT,
  email             TEXT NOT NULL,
  website           TEXT,
  authority_status  TEXT NOT NULL DEFAULT 'active',         -- active | inactive | revoked | suspended
  drive_root_id     TEXT,                                   -- Google Drive folder ID for this carrier's root
  qbo_realm_id      TEXT,                                   -- per-carrier QBO connection
  qbo_refresh_token TEXT,                                   -- encrypted at rest
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Every other domain table in §3 gains: `carrier_id UUID NOT NULL REFERENCES carriers(carrier_id)` and an RLS policy.

---

## 3.0a. CARRIER_USERS (NEW — membership + role) (LOCKED 2026-05-27)

```sql
CREATE TABLE carrier_users (
  carrier_user_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id        UUID NOT NULL REFERENCES carriers(carrier_id),
  user_id           UUID NOT NULL REFERENCES users(user_id),
  role              TEXT NOT NULL,                          -- owner | accountant | dispatcher | driver
  status            TEXT NOT NULL DEFAULT 'active',         -- active | suspended | removed
  invited_by        UUID REFERENCES users(user_id),
  invited_at        TIMESTAMPTZ,
  accepted_at       TIMESTAMPTZ,
  removed_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (carrier_id, user_id)
);
```

A user can belong to multiple carriers (a contract dispatcher might serve two carriers). Each membership has its own role. Cross-carrier data access is impossible — `current_carrier_id` is set per session and RLS enforces it.

Roles defined in §2.5. Owner is the only role that can finalize a settlement or authorize a personal advance (§2.5, §9 decision #8).

---

## 3.0b. USERS (NEW — global user identity) (LOCKED 2026-05-27)

```sql
CREATE TABLE users (
  user_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             TEXT UNIQUE NOT NULL,
  google_sub        TEXT UNIQUE,                            -- Google SSO subject ID
  display_name      TEXT,
  google_drive_token TEXT,                                  -- encrypted at rest
  google_drive_token_expires_at TIMESTAMPTZ,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Users are global (identified by Google account). `carrier_users` links a user to one or more carriers with a role.

---

## 3.0c. SUBSCRIPTIONS (NEW — your billing of carriers) (LOCKED 2026-05-27)

```sql
CREATE TABLE subscriptions (
  subscription_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id        UUID NOT NULL UNIQUE REFERENCES carriers(carrier_id),
  plan_id           TEXT NOT NULL,                          -- e.g. 'starter', 'pro', 'enterprise'
  status            TEXT NOT NULL,                          -- trialing | active | past_due | canceled | paused
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  trial_ends_at     TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  canceled_at       TIMESTAMPTZ,
  seats_purchased   INT,                                    -- if per-seat pricing
  driver_count_cap  INT,                                    -- if per-driver pricing tier
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Pricing model details deferred to §7.6.

---

## 3.13. CARRIER_SETTINGS (NEW — per-carrier rate card) (LOCKED 2026-05-27)

```sql
CREATE TABLE carrier_settings (
  carrier_id        UUID PRIMARY KEY REFERENCES carriers(carrier_id),

  -- Dispatch tier schedule. Rates expressed as decimals (0.14 = 14%).
  -- Tier index = active truck count under the O-O's name.
  dispatch_tier_1   NUMERIC(5,4) NOT NULL DEFAULT 0.15,    -- 1 truck
  dispatch_tier_2   NUMERIC(5,4) NOT NULL DEFAULT 0.14,
  dispatch_tier_3   NUMERIC(5,4) NOT NULL DEFAULT 0.13,
  dispatch_tier_4   NUMERIC(5,4) NOT NULL DEFAULT 0.12,
  dispatch_tier_5   NUMERIC(5,4) NOT NULL DEFAULT 0.11,
  dispatch_tier_6   NUMERIC(5,4) NOT NULL DEFAULT 0.10,
  dispatch_tier_7   NUMERIC(5,4) NOT NULL DEFAULT 0.09,
  dispatch_tier_8   NUMERIC(5,4) NOT NULL DEFAULT 0.08,
  dispatch_tier_9   NUMERIC(5,4) NOT NULL DEFAULT 0.07,
  dispatch_tier_10  NUMERIC(5,4) NOT NULL DEFAULT 0.06,
  dispatch_tier_11  NUMERIC(5,4) NOT NULL DEFAULT 0.05,
  dispatch_tier_12  NUMERIC(5,4) NOT NULL DEFAULT 0.04,
  dispatch_tier_13  NUMERIC(5,4) NOT NULL DEFAULT 0.03,
  dispatch_tier_14  NUMERIC(5,4) NOT NULL DEFAULT 0.02,
  dispatch_tier_15  NUMERIC(5,4) NOT NULL DEFAULT 0.01,    -- 15+ trucks

  -- Trailer rental defaults (monthly, USD)
  rental_rate_lowboy      NUMERIC(10,2),
  rental_rate_rgn         NUMERIC(10,2),
  rental_rate_stepdeck    NUMERIC(10,2),
  rental_rate_flatbed     NUMERIC(10,2),
  rental_rate_hotshot     NUMERIC(10,2),
  rental_rate_container   NUMERIC(10,2),

  -- Insurance pass-through (monthly $/truck)
  insurance_pass_through_per_truck NUMERIC(10,2),

  -- Receipt threshold (LOCKED at 0.00 per §9 founder decision #4)
  receipt_threshold NUMERIC(10,2) NOT NULL DEFAULT 0.00,

  updated_by        UUID REFERENCES users(user_id),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Tier resolution algorithm:**
```
effective_dispatch_rate(carrier_id, owner_operator_driver_id) =
  let truck_count = SELECT COUNT(*) FROM assets
                    WHERE carrier_id = $1
                      AND assigned_driver_id = $2
                      AND asset_type = 'truck'
                      AND status = 'active'
  let tier = LEAST(truck_count, 15)        -- 15+ caps at tier_15
  return carrier_settings.dispatch_tier_{tier}
```

The settlement display must show the tier and basis explicitly:
```
Dispatch 12% (2-truck tier) × $48,500 gross linehaul = $5,820
```

Driver-chosen `rental_payment_plan` (1/2/3 installments per month) is set per asset assignment, not per carrier. Owner can override.

Only Owner role may UPDATE `carrier_settings`. All changes logged to `audit_log` with before/after values.

---

## 5.2. Settlement immutability after finalization (LOCKED 2026-05-27)

A settlement has three states:

- **`draft`** — fully editable by Accountant. Not yet posted to QBO. PDF carries "DRAFT" watermark.
- **`final`** — IMMUTABLE. No field on the row can ever be changed. PDF is archived in Drive `07_Settlements/.../Final/` with read-only Drive permissions. Posted to QBO.
- **`superseded`** — was `final`, has been replaced by a newer version. The row itself is untouched; a new row is created (see §5.3). Original PDF moves to `07_Settlements/.../Superseded/` and stays there forever.

**Database-level enforcement (mandatory, not optional):**

```sql
CREATE OR REPLACE FUNCTION reject_finalized_settlement_change() RETURNS trigger AS $$
BEGIN
  IF OLD.status = 'final' THEN
    RAISE EXCEPTION 'Settlement % is finalized and immutable. Use supersession (§5.3) to issue a correction.', OLD.settlement_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlements_immutable
  BEFORE UPDATE OR DELETE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION reject_finalized_settlement_change();
```

The same trigger pattern applies to `settlement_lines`, `expenses` linked to a finalized settlement, `advances` linked to a finalized settlement, and `prior_balance_applications` linked to a finalized settlement.

**Rationale:** Once money has been paid based on a settlement, the record of that payment is a permanent accounting fact. Editing it after the fact is fraud. The only legitimate way to "change" a finalized settlement is to issue a correcting (superseding) settlement that explicitly references the original.

**No bypass.** Application admin UIs MUST NOT offer a "force edit finalized" button. Database-level enforcement means even a SQL console operator cannot accidentally edit. To intentionally edit, an operator must explicitly DISABLE the trigger, perform the edit, and re-enable — and that action itself is logged in Postgres logs. Such intervention is reserved for documented data-recovery scenarios (e.g., disaster recovery), never for normal corrections.

---

## 5.3. Settlement versioning and supersession (LOCKED 2026-05-27)

Every settlement belongs to a **version chain**. The chain is identified by a stable `settlement_chain_id`; each version is a separate row.

```sql
-- Added to settlements table:
settlement_chain_id   UUID NOT NULL,           -- same across all versions
version               INT NOT NULL DEFAULT 1,  -- 1, 2, 3, ...
supersedes_settlement_id  UUID REFERENCES settlements(settlement_id),
superseded_by_settlement_id UUID REFERENCES settlements(settlement_id),
supersession_reason   TEXT,                    -- required when version > 1
finalized_at          TIMESTAMPTZ,
finalized_by_user_id  UUID REFERENCES users(user_id),
UNIQUE (carrier_id, settlement_chain_id, version)
```

**Supersession flow:**

1. Owner clicks "Reopen for correction" on a finalized settlement.
2. App requires a free-text `supersession_reason`. Empty reason is rejected.
3. App creates a new `settlements` row:
   - Same `settlement_chain_id`
   - `version` = previous version + 1
   - `supersedes_settlement_id` = previous row's settlement_id
   - `status` = `draft`
   - All line items copied from previous version as starting point
4. App updates the previous row (still allowed because we're not editing data — only setting `superseded_by_settlement_id` and `status = 'superseded'`). This single field update is exempted from the immutability trigger via a whitelist of supersession-transition columns.
5. App moves the previous version's PDF from `Final/` to `Superseded/` in Drive.
6. App writes audit_log events: `settlement_reopened` on old row, `settlement_supersession_created` on new row.
7. Accountant edits the new draft.
8. Owner finalizes the new version. New PDF written to `Final/`.
9. QBO export issues a correcting entry (vendor credit + new bill, never edit posted bills).

**Querying:** The default API for "show me settlement X" returns the **current** version (the one where `superseded_by_settlement_id IS NULL`). To see history, request the full chain.

**Display:** Settlements UI shows version badge (e.g., "v2 — superseded v1 on 2026-05-28") on any non-v1 settlement. Driver-facing PDF shows version in footer.

---

## 3.12. AUDIT_LOG (EXPANDED 2026-05-27 — full field list now locked)

```sql
CREATE TABLE audit_log (
  event_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id        UUID NOT NULL REFERENCES carriers(carrier_id),
  entity_type       TEXT NOT NULL,                          -- 'settlement', 'load', 'advance', 'expense', 'asset', 'driver', 'user', 'carrier_settings', etc.
  entity_id         UUID NOT NULL,
  entity_version    INT,                                    -- for versioned entities (settlements)
  action            TEXT NOT NULL,                          -- 'created', 'updated', 'field_changed', 'finalized', 'reopened', 'superseded', 'deleted_soft', 'login', 'pdf_exported', 'qbo_synced'
  actor_user_id     UUID NOT NULL REFERENCES users(user_id),   -- the human; AI is never the actor per §2.6
  actor_role        TEXT NOT NULL,                          -- role at time of action
  field_path        TEXT,                                   -- e.g. 'carrier_fees.dispatch.rate' or 'status'
  value_before      JSONB,
  value_after       JSONB,
  reason            TEXT,                                   -- required for supersession, optional otherwise
  ip_address        INET,
  user_agent        TEXT,
  session_id        UUID,
  timestamp_utc     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_carrier_time ON audit_log (carrier_id, timestamp_utc DESC);
CREATE INDEX idx_audit_entity ON audit_log (carrier_id, entity_type, entity_id);
```

**Append-only.** No UPDATE or DELETE permitted via application role. A separate `audit_admin` Postgres role (only used for legally compelled redactions) can soft-delete, but never edit values.

**Monthly export to Drive.** First day of each month, app exports the previous month's `audit_log` entries for each carrier to that carrier's `10_Audit/audit_log_YYYY-MM.csv` file. Once written, that file is set read-only in Drive. This gives the carrier a permanent paper trail in their own custody, independent of Carrier Nexus's continued operation.

---


## 7.6. Pricing, plans, and billing (NEW — your revenue model) (LOCKED 2026-05-27)

**Stripe** for subscription billing. One Stripe Customer per carrier, one Subscription per carrier. Tax handled via Stripe Tax (US state sales tax on SaaS where applicable).

**Plan structure (initial proposal — actual prices TBD by founder):**

| Plan | Driver cap | Trucks cap | Storage | Price/mo (placeholder) |
|------|------------|------------|---------|------------------------|
| Trial | 5 | 5 | Carrier's own Drive | Free, 14 days |
| Starter | 10 | 10 | Carrier's own Drive | $TBD |
| Pro | 50 | 50 | Carrier's own Drive | $TBD |
| Enterprise | Unlimited | Unlimited | Carrier's own Drive | Contact sales |

Since documents live in the carrier's own Google Drive (§2.8), Carrier Nexus's variable infrastructure cost per carrier is essentially Postgres rows + bandwidth. This makes per-driver pricing reasonable.

**Dunning:** Standard Stripe dunning. After final retry failure, subscription moves to `past_due`. After 14 days past due, app moves to `paused` (read-only access). After 60 days, subscription is canceled (see §2.10).

**Cancellation:** Self-serve via Owner settings. No retention dark patterns.

---

## 7. Phased rollout plan (REVISED 2026-05-27 for multi-tenant SaaS)

The previous phase plan assumed single-tenant. Multi-tenant SaaS changes Phase 1 significantly.

### Phase 0 — Spec lock (CURRENT)
- SPEC.md complete and locked. **DONE for foundation.**
- HTML repo remains as design artifact / UI sketch.
- No more single-tenant feature work in the HTML — every new change must be designed against the multi-tenant target.

### Phase 1 — Multi-tenant MVP (real backend)
Cannot be built in static HTML. Requires:
- Postgres database (Supabase recommended) with RLS policies
- Auth (Google SSO via Supabase Auth or Auth0)
- Server-side API (Supabase Edge Functions, or Node/Python backend)
- Google Drive integration (per-carrier OAuth, folder provisioning)
- Frontend (Next.js or similar) — the existing HTML can serve as visual reference
- Stripe integration for billing
- Domain, SSL, monitoring, error tracking

**Phase 1 minimum feature set:**
1. Carrier signup with Google SSO + MC#/DOT capture
2. Drive folder provisioning on first connect
3. Owner can invite users (dispatcher, accountant, driver) by email
4. Carrier settings page (dispatch tiers, rental rates, insurance)
5. Drivers & equipment registry
6. Load creation linked to a driver and asset
7. Settlement build (draft → finalize) with the 7-section structure of §4
8. Immutability + supersession (§5.2, §5.3)
9. Audit log (§3.12)
10. PDF generation with carrier-specific letterhead
11. Drive document upload from any record
12. Stripe subscription billing (trial → paid)
13. QBO export (§7.5) per-carrier

**Realistic Phase 1 cost & timeline (honest estimates):**
- 6–12 months development with one experienced full-stack developer
- $20k–$50k in development costs
- $50–$200/month in infrastructure (Supabase, Stripe fees, domain, monitoring)
- $1k–$5k in legal (ToS, Privacy Policy, DPA template)
- $1k–$3k/year in insurance (E&O + cyber)
- A human bookkeeper/CPA on contract (per §2.6) before any paying customer

### Phase 2 — Production polish
- Mobile Driver Command app (receipt upload, load status)
- Dispatcher load board
- Accountant dashboard with batch settlement build
- Reporting (driver profitability, equipment utilization)
- QBO sync improvements (auto-push, error reconciliation)
- Webhook events for integrations

### Phase 3 — Scale
- Multi-region (still US-only data residency per §9, but multi-region compute for performance)
- SOC 2 Type I, then Type II
- API for carrier integrations (TMS, factoring companies, brokers)
- White-label option for very large carriers

### Phase 4 — Market expansion
- Adjacent verticals (flatbed-general, dry van — only if heavy-haul wedge is dominant)
- International (CA, MX) — requires data residency changes, defers locked §9 decision #7

---

## 9. Locked decisions (additions 2026-05-27)

**9. ✅ LOCKED — Product is multi-tenant SaaS.** Carrier Nexus serves many carriers. Carrier Trucking US, LLC is the design partner and first tenant. Tenant isolation is enforced at the database layer via Postgres RLS on `carrier_id`. See §2.7.

**10. ✅ LOCKED — Carrier identity = MC number (primary) + DOT number (secondary).** Internal PK is UUID; public business key is MC#. Duplicate MC# blocks signup. See §3.0.

**11. ✅ LOCKED — Storage model: Postgres for transactions, per-carrier Google Drive for documents.** OAuth scope: `drive.file` only. Carrier owns all documents in their own Google account. See §2.8.

**12. ✅ LOCKED — Folder structure is provisioned by the app, named by MC#.** `Carrier Nexus — MC-XXXXXXX — [Legal Name]/` with the 00–10 subfolder tree. `05_Receipts/` and `06_Personal_Advances/` are NEVER merged. See §2.8.

**13. ✅ LOCKED — Finalized settlements are immutable.** Enforced at the database layer via trigger, not just in application code. See §5.2.

**14. ✅ LOCKED — Version chain and supersession.** Reopening a finalized settlement creates a new versioned row with a mandatory `supersession_reason`. The original row is preserved exactly. PDFs move to `Superseded/`, never deleted. See §5.3.

**15. ✅ LOCKED — Dispatch % tier schedule.** 1 truck = 15%, decrementing by 1% per additional truck, floor at 1% for 15+ trucks. Editable per-carrier in `carrier_settings` (Owner-only). Tier resolved live from active truck count under the O-O's name. See §3.13.

**16. ✅ LOCKED — Per-carrier QBO connection.** Each carrier connects their own QBO company via OAuth. No shared QBO connection. See §3.0 `qbo_realm_id`.

**17. ✅ LOCKED — Audit log includes carrier_id, actor (human user), IP, user agent, before/after values.** Append-only. Monthly mirror to carrier's Drive `10_Audit/`. See §3.12.

**18. ✅ LOCKED — Driver chooses rental_payment_plan (1/2/3 installments per month).** Set per asset assignment. Owner can override. See §3.2 ASSETS.

---

## 11. Pre-launch checklist (NEW 2026-05-27)

Before accepting the first paying carrier, all of the following must be in place. This list is non-negotiable.

**Legal & compliance:**
- [ ] Terms of Service (SaaS-experienced attorney)
- [ ] Privacy Policy (CCPA-compliant minimum; GDPR not required while US-only)
- [ ] Data Processing Agreement template (carriers may demand one)
- [ ] Acceptable Use Policy
- [ ] Subprocessor list (Supabase, Stripe, Google, etc.) — published
- [ ] Breach notification procedure documented
- [ ] Records retention policy aligned with IRS rules for trucking

**Insurance:**
- [ ] Errors & Omissions (E&O) — minimum $1M
- [ ] Cyber liability — minimum $1M, with breach response coverage
- [ ] General liability
- [ ] Annual review of coverage as customer count grows

**Technical:**
- [ ] Postgres backups (point-in-time recovery, tested restore)
- [ ] Encryption at rest (Supabase default) and in transit (TLS 1.2+)
- [ ] Secrets management (no API keys in code or env files in repo)
- [ ] Error monitoring (Sentry or equivalent)
- [ ] Uptime monitoring with alerting
- [ ] RLS policy test suite (automated, runs on every deploy)
- [ ] Cross-tenant access penetration test (annual minimum)
- [ ] Audit log retention plan (7 years recommended for accounting data)

**Operational:**
- [ ] Human bookkeeper or CPA on contract (per §2.6 — AI is not the system of record)
- [ ] Customer support channel (email minimum, ticketing system preferred)
- [ ] Status page (status.carriernexus.com or similar)
- [ ] Incident response runbook
- [ ] Onboarding playbook for new carriers
- [ ] Documentation site (how-tos, FAQ)

**Business:**
- [ ] LLC or corp formed (Carrier Nexus or chosen entity name) — separate from Carrier Trucking US, LLC
- [ ] Business bank account
- [ ] Sales tax registration in states where required
- [ ] Stripe account set up and verified
- [ ] Pricing finalized (§7.6 placeholders filled in)
- [ ] First non-Carrier-Trucking-US design partner / beta customer identified

This checklist is the gate for Phase 1 going from internal testing to first external paying customer. Do not skip items.

---
