-- ============================================================
-- CARRIER NEXUS — nexus_records TABLE
-- One table: rate cons, permits, expenses, all record types.
-- record_type determines which fields are populated.
-- ============================================================

CREATE TABLE IF NOT EXISTS nexus_records (

  -- ── IDENTITY ─────────────────────────────────────────────
  id                      TEXT PRIMARY KEY,
  record_type             TEXT NOT NULL,        -- rate_con | permit | expense | personal | health | vehicle | other

  -- ── DATES ────────────────────────────────────────────────
  record_date             DATE,                 -- date of the transaction / document
  settlement_period       DATE,                 -- start date of the settlement window
  settlement_period_type  TEXT DEFAULT 'biweekly',

  -- ── OUR TEAM ─────────────────────────────────────────────
  our_driver              TEXT,
  our_driver_id           TEXT,
  our_dispatcher          TEXT,
  truck_unit              TEXT,                 -- unit / truck number
  trailer_type            TEXT,                 -- flatbed | step deck | RGN | lowboy | van | reefer

  -- ── RATE CON / LOAD ───────────────────────────────────────
  rate_con_number         TEXT,                 -- rate con / load number
  bol_number              TEXT,                 -- bill of lading number
  customer_company        TEXT,
  customer_dispatch_name  TEXT,
  customer_dispatch_phone TEXT,
  customer_dispatch_email TEXT,
  load_description        TEXT,
  load_weight             TEXT,                 -- e.g. "48,000 lbs"
  load_height             TEXT,                 -- e.g. "14'6\""
  load_width              TEXT,                 -- e.g. "8'6\""
  origin_address          TEXT,
  destination_address     TEXT,
  total_miles             INTEGER,
  agreed_rate             NUMERIC(12,2),        -- gross rate on the rate con
  fuel_advance            NUMERIC(12,2),
  detention_amount        NUMERIC(12,2),
  lumper_fees             NUMERIC(12,2),

  -- ── PERMIT ───────────────────────────────────────────────
  permit_state            TEXT,
  permit_number           TEXT,
  permit_amount           NUMERIC(12,2),

  -- ── EXPENSE ──────────────────────────────────────────────
  expense_type            TEXT,                 -- fuel | toll | repair | food | hotel | scale | insurance | other
  expense_amount          NUMERIC(12,2),
  expense_vendor          TEXT,

  -- ── FINANCIAL / BILLING ──────────────────────────────────
  invoice_number          TEXT,
  invoice_amount          NUMERIC(12,2),
  invoice_status          TEXT DEFAULT 'unbilled', -- unbilled | billed | paid | factored
  payment_received_date   DATE,
  factoring_ref           TEXT,
  driver_pay_amount       NUMERIC(12,2),        -- what driver receives
  dispatcher_commission   NUMERIC(12,2),        -- what dispatcher earns

  -- ── DELIVERY / POD ───────────────────────────────────────
  pod_received            BOOLEAN DEFAULT FALSE,
  pod_date                DATE,

  -- ── DRIVE DOCUMENT (file stays in Drive — link only) ─────
  drive_file_id           TEXT,
  drive_folder_id         TEXT,
  drive_url               TEXT,
  file_name               TEXT,
  file_type               TEXT,                 -- pdf | doc | sheet | image | other
  file_size_bytes         BIGINT,
  extracted_text          TEXT,                 -- text from Google Docs/Sheets only

  -- ── WORKFLOW ─────────────────────────────────────────────
  status                  TEXT DEFAULT 'active', -- inbox | active | reviewed | archived
  notes                   TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  created_by              TEXT DEFAULT 'admin'
);

-- ── INDEXES ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nr_driver        ON nexus_records(our_driver);
CREATE INDEX IF NOT EXISTS idx_nr_type          ON nexus_records(record_type);
CREATE INDEX IF NOT EXISTS idx_nr_rc_number     ON nexus_records(rate_con_number);
CREATE INDEX IF NOT EXISTS idx_nr_period        ON nexus_records(settlement_period);
CREATE INDEX IF NOT EXISTS idx_nr_driver_period ON nexus_records(our_driver, settlement_period);
CREATE INDEX IF NOT EXISTS idx_nr_status        ON nexus_records(status);
CREATE INDEX IF NOT EXISTS idx_nr_date          ON nexus_records(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_nr_customer      ON nexus_records(customer_company);
CREATE INDEX IF NOT EXISTS idx_nr_invoice       ON nexus_records(invoice_status);

-- ── USEFUL QUERIES ───────────────────────────────────────────

-- All records for a driver in a settlement period:
-- SELECT * FROM nexus_records
-- WHERE our_driver = 'Guillermo Pinera' AND settlement_period = '2026-05-26'
-- ORDER BY record_date;

-- Driver settlement summary:
-- SELECT
--   record_type,
--   COUNT(*) AS count,
--   SUM(CASE WHEN record_type='rate_con' THEN agreed_rate     ELSE 0 END) AS gross_revenue,
--   SUM(CASE WHEN record_type='permit'   THEN permit_amount   ELSE 0 END) AS permits,
--   SUM(CASE WHEN record_type='expense'  THEN expense_amount  ELSE 0 END) AS expenses,
--   SUM(driver_pay_amount) AS driver_pay,
--   SUM(dispatcher_commission) AS dispatch_commission
-- FROM nexus_records
-- WHERE our_driver = 'Guillermo Pinera' AND settlement_period = '2026-05-26'
-- GROUP BY record_type;

-- All rate cons for a customer:
-- SELECT * FROM nexus_records
-- WHERE record_type = 'rate_con' AND customer_company ILIKE '%Brazos%'
-- ORDER BY record_date DESC;

-- Unpaid invoices:
-- SELECT our_driver, rate_con_number, customer_company, agreed_rate, invoice_status
-- FROM nexus_records
-- WHERE record_type = 'rate_con' AND invoice_status IN ('unbilled','billed')
-- ORDER BY record_date;

-- All permits by state:
-- SELECT permit_state, COUNT(*) as count, SUM(permit_amount) as total_cost
-- FROM nexus_records WHERE record_type = 'permit'
-- GROUP BY permit_state ORDER BY total_cost DESC;
