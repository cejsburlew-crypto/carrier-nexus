# Carrier Nexus — System Specification

> **Status:** Living design document. This is the target architecture, not the current implementation.
> **Audience:** Future developers, future Claude sessions, and the founder.
> **Last updated:** 2026-05-27 · all founder decisions locked

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
