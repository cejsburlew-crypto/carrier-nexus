# Carrier Nexus — System Specification

> **Status:** Living design document. This is the target architecture, not the current implementation.
> **Audience:** Future developers, future Claude sessions, and the founder.
> **Last updated:** 2026-05-27

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
- `rental_billing_method`: `per_week_assigned | per_day_assigned | per_load | none`
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

- All operating deductions over a configurable threshold (default $100) require an attached receipt / invoice.
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

## 8. What this system is NOT

- Not an accounting platform. It exports to QuickBooks / Wave / Xero.
- Not a dispatch marketplace.
- Not a generic dry-van TMS.
- Not a replacement for an ELD or fuel card provider.
- Not a place to store passwords, full bank account numbers, or full payment card numbers. Sensitive identifiers are referenced, not stored.

---

## 9. Open questions (for the founder)

1. **Accounting software target.** QuickBooks Online? Wave? Xero? Determines the export format.
2. **Database / platform choice for Phase 1.** Airtable + scripts (fastest, limited) vs. Supabase / Firebase (mid) vs. custom Postgres (most flexible).
3. **Authentication.** Google SSO only? Email + password? Magic link?
4. **Receipt threshold.** What dollar amount requires a receipt to be attached?
5. **Dispatch percentage basis.** Calculated on gross linehaul, or on gross revenue including fuel surcharge?
6. **Equipment rental billing method default.** Weekly while assigned? Daily while assigned? Per load?
7. **Hosting / region.** US only? Specific state for data residency?
8. **Who is allowed to finalize a settlement?** Owner only? Bookkeeper? Defines the roles table.

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
