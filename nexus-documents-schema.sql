-- ============================================================
-- CARRIER NEXUS — nexus_documents TABLE
-- Single document store: everything routed from the Drive inbox.
-- Filter by driver_name, load_number, category, settlement_period.
-- ============================================================

CREATE TABLE IF NOT EXISTS nexus_documents (
  id                    TEXT PRIMARY KEY,
  -- Drive identity (file stays in Drive — we only store the link)
  drive_file_id         TEXT,
  drive_folder_id       TEXT,
  file_name             TEXT NOT NULL,
  file_type             TEXT,                   -- pdf | doc | sheet | image | other
  file_size_bytes       BIGINT,
  drive_url             TEXT,                   -- webViewLink
  -- Routing
  driver_name           TEXT,
  driver_id             TEXT,
  load_number           TEXT,
  category              TEXT,                   -- Rate Cons | Expenses | Permits | Personal | Health | Vehicles
  -- Dates
  doc_date              DATE,                   -- extracted from filename/content
  settlement_period     DATE,                   -- start of the settlement window
  settlement_period_type TEXT DEFAULT 'biweekly', -- weekly | biweekly | semimonthly | monthly
  -- Content (text only — PDF bytes never stored)
  extracted_text        TEXT,
  -- Workflow
  status                TEXT DEFAULT 'routed',  -- inbox | routed | reviewed | archived
  routed_at             TIMESTAMPTZ,
  routed_by             TEXT DEFAULT 'admin',
  reviewed_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES for common query patterns
CREATE INDEX IF NOT EXISTS idx_ndocs_driver      ON nexus_documents(driver_name);
CREATE INDEX IF NOT EXISTS idx_ndocs_load        ON nexus_documents(load_number);
CREATE INDEX IF NOT EXISTS idx_ndocs_category    ON nexus_documents(category);
CREATE INDEX IF NOT EXISTS idx_ndocs_period      ON nexus_documents(settlement_period);
CREATE INDEX IF NOT EXISTS idx_ndocs_driver_per  ON nexus_documents(driver_name, settlement_period);
CREATE INDEX IF NOT EXISTS idx_ndocs_status      ON nexus_documents(status);
CREATE INDEX IF NOT EXISTS idx_ndocs_drive_file  ON nexus_documents(drive_file_id);

-- RLS (row-level security) — enable if using Supabase
-- ALTER TABLE nexus_documents ENABLE ROW LEVEL SECURITY;

-- USEFUL QUERIES:
-- All docs for a driver:
--   SELECT * FROM nexus_documents WHERE driver_name = 'Guillermo Pinera' ORDER BY doc_date DESC;

-- All docs for a settlement period:
--   SELECT * FROM nexus_documents WHERE settlement_period = '2026-05-26' ORDER BY driver_name, category;

-- Driver expenses for a period:
--   SELECT * FROM nexus_documents
--   WHERE driver_name = 'Guillermo Pinera' AND category = 'Expenses'
--   AND settlement_period = '2026-05-26';

-- All rate cons tied to a load:
--   SELECT * FROM nexus_documents WHERE load_number = '363402';

-- Documents needing review:
--   SELECT * FROM nexus_documents WHERE status = 'inbox' ORDER BY created_at;

-- Count by category per driver:
--   SELECT driver_name, category, COUNT(*) as doc_count
--   FROM nexus_documents GROUP BY driver_name, category ORDER BY driver_name, category;
