-- ============================================================
-- CARRIER NEXUS — SUPABASE SCHEMA
-- Paste this entire file into Supabase → SQL Editor → Run
-- ============================================================

-- ── EXTENSIONS ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── COMPANIES (multi-tenant root) ───────────────────────────
CREATE TABLE IF NOT EXISTS companies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  dot_number   TEXT,
  mc_number    TEXT,
  address      TEXT,
  city         TEXT,
  state        TEXT,
  zip          TEXT,
  phone        TEXT,
  email        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROFILES (extends auth.users) ───────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id   UUID REFERENCES companies(id) ON DELETE CASCADE,
  name         TEXT,
  email        TEXT,
  role         TEXT DEFAULT 'viewer',   -- admin | dispatcher | viewer
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── TRUSTED DEVICES (2FA device recognition) ────────────────
-- A row means "this browser skipped the TOTP prompt until expires_at"
-- for this user. TOTP factors themselves live in Supabase's native
-- auth.mfa_factors — not duplicated here.
CREATE TABLE IF NOT EXISTS trusted_devices (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id     TEXT NOT NULL,
  label         TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL,
  revoked_at    TIMESTAMPTZ,
  UNIQUE (user_id, device_id)
);

-- ── DRIVERS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  status             TEXT DEFAULT 'active',   -- active | inactive | terminated
  pay_type           TEXT DEFAULT 'percentage',
  pay_rate           NUMERIC(6,4),            -- 0.30 = 30%
  cdl_number         TEXT,
  cdl_state          TEXT,
  cdl_expiry         DATE,
  phone              TEXT,
  email              TEXT,
  address            TEXT,
  hire_date          DATE,
  truck_unit         TEXT,
  emergency_contact  TEXT,
  emergency_phone    TEXT,
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── FLEET / EQUIPMENT ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS fleet (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_number    TEXT NOT NULL,
  type_key       TEXT NOT NULL,   -- TRUCK_DRY, TRAILER_RGN, JEEP_2AX, etc.
  type_group     TEXT,            -- TRUCK | TRAILER | JEEP | BOOSTER | SPREADER
  status         TEXT DEFAULT 'active',
  year           INTEGER,
  make           TEXT,
  model          TEXT,
  vin            TEXT,
  license_plate  TEXT,
  license_state  TEXT,
  -- truck-specific
  engine         TEXT,
  transmission   TEXT,
  sleeper        TEXT,
  -- trailer-specific
  length_ft      NUMERIC(5,1),
  capacity_tons  NUMERIC(7,2),
  -- common
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── LOADS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  load_number     TEXT,
  status          TEXT DEFAULT 'available',  -- available | assigned | in_transit | delivered | invoiced
  driver_id       UUID REFERENCES drivers(id) ON DELETE SET NULL,
  driver_name     TEXT,
  truck_unit      TEXT,
  trailer_unit    TEXT,
  dispatcher      TEXT,
  broker          TEXT,
  shipper         TEXT,
  origin          TEXT,
  destination     TEXT,
  pickup_date     DATE,
  delivery_date   DATE,
  rate            NUMERIC(10,2),
  miles           INTEGER,
  commodity       TEXT,
  weight_lbs      INTEGER,
  po_number       TEXT,
  bol_number      TEXT,
  ref_number      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── SETTLEMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlements (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id         UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  settlement_number  TEXT,
  person_name        TEXT NOT NULL,
  role               TEXT DEFAULT 'driver',   -- driver | dispatcher
  period_start       DATE,
  period_end         DATE,
  total_adds         NUMERIC(10,2) DEFAULT 0,
  gross_pay          NUMERIC(10,2) DEFAULT 0,
  net_pay            NUMERIC(10,2) DEFAULT 0,
  pay_percent        NUMERIC(6,4),
  dispatcher_rate    NUMERIC(6,4) DEFAULT 0.05,
  service_adj        NUMERIC(10,2) DEFAULT 0,
  status             TEXT DEFAULT 'draft',    -- draft | approved | paid
  loads              JSONB DEFAULT '[]',
  deductions         JSONB DEFAULT '[]',
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── EXPENSES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  date         DATE NOT NULL DEFAULT CURRENT_DATE,
  driver       TEXT,
  category     TEXT,   -- Fuel | Repair | Parts | Permit | Tire | Miscellaneous | Tolls | Meals
  description  TEXT,
  load_ref     TEXT,
  amount       NUMERIC(10,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERMITS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permits (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  permit_number  TEXT,
  state          TEXT,
  permit_type    TEXT,   -- OS | OW | OSOW | Superload | Trip | IFTA
  issue_date     DATE,
  expiry_date    DATE,
  load_ref       TEXT,
  unit           TEXT,
  cost           NUMERIC(8,2),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── INVOICES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number  TEXT,
  customer        TEXT,
  load_ref        TEXT,
  issue_date      DATE DEFAULT CURRENT_DATE,
  due_date        DATE,
  amount          NUMERIC(10,2),
  status          TEXT DEFAULT 'draft',   -- draft | sent | paid | overdue
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── CONTACTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id      UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  contact_type    TEXT,   -- Broker | Shipper | Vendor | Mechanic
  contact_person  TEXT,
  phone           TEXT,
  email           TEXT,
  address         TEXT,
  mc_number       TEXT,
  dot_number      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── MAINTENANCE ORDERS ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_orders (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  wo_number    TEXT,
  unit         TEXT,
  repair_type  TEXT,
  description  TEXT,
  vendor       TEXT,
  date         DATE DEFAULT CURRENT_DATE,
  cost         NUMERIC(10,2),
  odometer     INTEGER,
  status       TEXT DEFAULT 'open',   -- open | in_progress | completed | pending_parts
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCUMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id   UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  doc_type     TEXT,
  driver       TEXT,
  load_ref     TEXT,
  expiry_date  DATE,
  status       TEXT DEFAULT 'current',   -- current | expiring | expired | missing
  file_url     TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_drivers_company    ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_fleet_company      ON fleet(company_id);
CREATE INDEX IF NOT EXISTS idx_loads_company      ON loads(company_id);
CREATE INDEX IF NOT EXISTS idx_loads_driver       ON loads(driver_id);
CREATE INDEX IF NOT EXISTS idx_loads_status       ON loads(status);
CREATE INDEX IF NOT EXISTS idx_settlements_company ON settlements(company_id);
CREATE INDEX IF NOT EXISTS idx_expenses_company   ON expenses(company_id);
CREATE INDEX IF NOT EXISTS idx_permits_company    ON permits(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company   ON invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_company   ON contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_maint_company      ON maintenance_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_docs_company       ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user ON trusted_devices(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE trusted_devices    ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers            ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet              ENABLE ROW LEVEL SECURITY;
ALTER TABLE loads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE permits            ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents          ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's company_id
CREATE OR REPLACE FUNCTION my_company_id()
RETURNS UUID LANGUAGE sql STABLE AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$;

-- Helper: is the current user an admin in the given company?
-- SECURITY DEFINER so this check bypasses profiles' own RLS instead of
-- recursing into it.
CREATE OR REPLACE FUNCTION is_company_admin(cid UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin' AND company_id = cid
  )
$$;

-- Profiles: readable by the row owner and by admins in the same company;
-- writable only by the row owner.
DROP POLICY IF EXISTS "profiles_own" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_company_admin(company_id));
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Trusted devices: only the owning user can see or manage their own rows
CREATE POLICY "trusted_devices_own" ON trusted_devices
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Companies: members only
CREATE POLICY "companies_member" ON companies
  FOR ALL USING (id = my_company_id());

-- All tenant tables: company match
DO $$ DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'drivers','fleet','loads','settlements','expenses',
    'permits','invoices','contacts','maintenance_orders','documents'
  ] LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL USING (company_id = my_company_id())',
      tbl || '_company', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- SEED: Demo company (run after creating your first auth user)
-- Replace 'YOUR-USER-UUID' with the UUID from auth.users
-- ============================================================
/*
INSERT INTO companies (id, name, dot_number, mc_number, phone, email)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Carrier Trucking US, LLC',
  '4012345',
  '1234567',
  '(555) 000-0001',
  'jim@carriertrucking.com'
);

UPDATE profiles
SET company_id = 'aaaaaaaa-0000-0000-0000-000000000001',
    name       = 'Jim Burlew',
    role       = 'admin'
WHERE id = 'YOUR-USER-UUID';
*/
