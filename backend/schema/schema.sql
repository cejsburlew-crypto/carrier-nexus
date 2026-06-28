-- ============================================================
-- CARRIER NEXUS v2 — MySQL Schema
-- All financial tables scoped by company_id → DOT/MC enforced
-- ============================================================
SET FOREIGN_KEY_CHECKS=0;
SET NAMES utf8mb4;

-- ── Companies ──────────────────────────────────────────────
CREATE TABLE companies (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  dba         VARCHAR(200),
  dot         VARCHAR(20) NOT NULL UNIQUE,
  mc          VARCHAR(20),
  scac        VARCHAR(10),
  fein        VARCHAR(20),
  address     VARCHAR(255),
  city        VARCHAR(100),
  state       CHAR(2),
  zip         VARCHAR(10),
  phone       VARCHAR(20),
  email       VARCHAR(150),
  website     VARCHAR(255),
  active      TINYINT(1) DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_dot (dot),
  INDEX idx_mc  (mc)
) ENGINE=InnoDB;

-- ── Users ──────────────────────────────────────────────────
CREATE TABLE users (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED NOT NULL,
  email       VARCHAR(150) NOT NULL,
  name        VARCHAR(150) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','dispatcher','approver','driver') NOT NULL DEFAULT 'driver',
  active      TINYINT(1) DEFAULT 0,
  member_id   VARCHAR(50),
  avatar      VARCHAR(255),
  last_login  TIMESTAMP NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_email (email),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_company_role (company_id, role)
) ENGINE=InnoDB;

-- ── Auth Tokens ────────────────────────────────────────────
CREATE TABLE auth_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(64))
) ENGINE=InnoDB;

-- ── Drivers ────────────────────────────────────────────────
CREATE TABLE drivers (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  user_id         INT UNSIGNED,
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150),
  phone           VARCHAR(20),
  cdl_number      VARCHAR(50),
  cdl_state       CHAR(2),
  cdl_expiry      DATE,
  medical_expiry  DATE,
  hire_date       DATE,
  status          ENUM('active','inactive','available','on_load','in_shop') DEFAULT 'active',
  member_id       VARCHAR(50),
  dispatcher_id   INT UNSIGNED,
  equipment_unit  VARCHAR(20),
  loads_completed INT DEFAULT 0,
  miles_driven    INT DEFAULT 0,
  on_time_pct     DECIMAL(5,2) DEFAULT 100.00,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_company (company_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB;

-- ── Equipment ──────────────────────────────────────────────
CREATE TABLE equipment (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id            INT UNSIGNED NOT NULL,
  unit_number           VARCHAR(20) NOT NULL,
  type                  ENUM('tractor','trailer','other') DEFAULT 'tractor',
  year                  SMALLINT,
  make                  VARCHAR(50),
  model                 VARCHAR(50),
  vin                   VARCHAR(17),
  license_plate         VARCHAR(20),
  license_state         CHAR(2),
  dot_number            VARCHAR(20),
  current_mileage       INT,
  annual_inspection_due DATE,
  status                ENUM('in_service','in_shop','available','retired') DEFAULT 'in_service',
  assigned_driver_id    INT UNSIGNED,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_company (company_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB;

-- ── Loads ──────────────────────────────────────────────────
CREATE TABLE loads (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  dispatcher_id    INT UNSIGNED,
  driver_id        INT UNSIGNED,
  rate_con_number  VARCHAR(50),
  broker_name      VARCHAR(150),
  broker_mc        VARCHAR(20),
  shipper_name     VARCHAR(150),
  consignee_name   VARCHAR(150),
  origin_city      VARCHAR(100),
  origin_state     CHAR(2),
  dest_city        VARCHAR(100),
  dest_state       CHAR(2),
  pickup_date      DATE,
  delivery_date    DATE,
  commodity        VARCHAR(200),
  weight           DECIMAL(10,2),
  rate             DECIMAL(10,2) NOT NULL DEFAULT 0,
  fuel_surcharge   DECIMAL(10,2) DEFAULT 0,
  accessorials     DECIMAL(10,2) DEFAULT 0,
  status           ENUM('pending','assigned','in_transit','delivered','invoiced','paid') DEFAULT 'pending',
  week_start       DATE,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)    REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)     REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_company_status (company_id, status),
  INDEX idx_week          (company_id, week_start),
  INDEX idx_driver        (driver_id)
) ENGINE=InnoDB;

-- ── Settlements ────────────────────────────────────────────
CREATE TABLE settlements (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  driver_id        INT UNSIGNED NOT NULL,
  week_start       DATE NOT NULL,
  week_end         DATE NOT NULL,
  gross_revenue    DECIMAL(12,2) DEFAULT 0,
  dispatch_pct     DECIMAL(5,2) DEFAULT 0,
  dispatch_fee     DECIMAL(12,2) DEFAULT 0,
  fuel_deductions  DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  balance_forward  DECIMAL(12,2) DEFAULT 0,
  net_pay          DECIMAL(12,2) GENERATED ALWAYS AS (gross_revenue - dispatch_fee - fuel_deductions - other_deductions + balance_forward) STORED,
  status           ENUM('draft','pending','approved','paid') DEFAULT 'draft',
  approved_by      INT UNSIGNED,
  approved_at      TIMESTAMP NULL,
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_driver_week (driver_id, week_start),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_company_week (company_id, week_start),
  INDEX idx_status       (status)
) ENGINE=InnoDB;

-- ── Settlement Line Items ──────────────────────────────────
CREATE TABLE settlement_line_items (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  settlement_id INT UNSIGNED NOT NULL,
  load_id       INT UNSIGNED,
  description   VARCHAR(255) NOT NULL,
  type          ENUM('revenue','deduction','fuel','advance','reimbursement') NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Documents ──────────────────────────────────────────────
CREATE TABLE documents (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  driver_id        INT UNSIGNED,
  load_id          INT UNSIGNED,
  type             ENUM('bol','ratecon','permit','settlement','cdl','insurance','w9','other') NOT NULL DEFAULT 'other',
  filename         VARCHAR(255) NOT NULL,
  drive_file_id    VARCHAR(100),
  drive_url        VARCHAR(500),
  confidence_score DECIMAL(5,2),
  status           ENUM('auto_filed','pending_review','filed','rejected') DEFAULT 'pending_review',
  notes            TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (load_id)    REFERENCES loads(id) ON DELETE SET NULL,
  INDEX idx_company_type (company_id, type),
  INDEX idx_status       (status)
) ENGINE=InnoDB;

-- ── Expenses ───────────────────────────────────────────────
CREATE TABLE expenses (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     INT UNSIGNED NOT NULL,
  driver_id      INT UNSIGNED,
  load_id        INT UNSIGNED,
  category       ENUM('fuel','toll','scale','permit','repair','advance','other') NOT NULL DEFAULT 'other',
  amount         DECIMAL(12,2) NOT NULL,
  date           DATE NOT NULL,
  description    VARCHAR(255),
  payment_method VARCHAR(50),
  reference      VARCHAR(100),
  receipt_url    VARCHAR(500),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (load_id)    REFERENCES loads(id) ON DELETE SET NULL,
  INDEX idx_company_date (company_id, date),
  INDEX idx_category     (category)
) ENGINE=InnoDB;

-- ── Maintenance Records ────────────────────────────────────
CREATE TABLE maintenance_records (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id           INT UNSIGNED NOT NULL,
  equipment_id         INT UNSIGNED NOT NULL,
  service_date         DATE NOT NULL,
  mileage              INT,
  service_type         VARCHAR(100) NOT NULL,
  description          TEXT,
  parts_cost           DECIMAL(10,2) DEFAULT 0,
  labor_hours          DECIMAL(5,2) DEFAULT 0,
  labor_rate           DECIMAL(8,2) DEFAULT 95.00,
  total_cost           DECIMAL(10,2) GENERATED ALWAYS AS (parts_cost + (labor_hours * labor_rate)) STORED,
  shop                 VARCHAR(150),
  technician           VARCHAR(100),
  next_service_mileage INT,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_equipment_date (equipment_id, service_date)
) ENGINE=InnoDB;

-- ── Work Orders ────────────────────────────────────────────
CREATE TABLE work_orders (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id   INT UNSIGNED NOT NULL,
  equipment_id INT UNSIGNED NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  priority     ENUM('low','medium','high','critical') DEFAULT 'medium',
  status       ENUM('open','in_progress','completed','cancelled') DEFAULT 'open',
  opened_date  DATE NOT NULL,
  closed_date  DATE,
  mechanic     VARCHAR(100),
  parts_cost   DECIMAL(10,2) DEFAULT 0,
  labor_hours  DECIMAL(5,2) DEFAULT 0,
  labor_rate   DECIMAL(8,2) DEFAULT 95.00,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ── Pre-Trip Inspections ───────────────────────────────────
CREATE TABLE pretrip_inspections (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  driver_id        INT UNSIGNED NOT NULL,
  equipment_id     INT UNSIGNED NOT NULL,
  inspection_date  DATE NOT NULL,
  odometer         INT,
  has_defects      TINYINT(1) DEFAULT 0,
  items_json       JSON NOT NULL,
  driver_signature TEXT,
  manager_ack      TINYINT(1) DEFAULT 0,
  manager_id       INT UNSIGNED,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)   REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
  INDEX idx_driver_date (driver_id, inspection_date)
) ENGINE=InnoDB;

-- ── IFTA Entries ───────────────────────────────────────────
CREATE TABLE ifta_entries (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  year       SMALLINT NOT NULL,
  quarter    TINYINT NOT NULL,
  state      CHAR(2) NOT NULL,
  miles      DECIMAL(10,2) DEFAULT 0,
  gallons    DECIMAL(10,3) DEFAULT 0,
  tax_rate   DECIMAL(6,4) DEFAULT 0.1800,
  tax_paid   DECIMAL(10,2) DEFAULT 0,
  tax_owed   DECIMAL(10,2) GENERATED ALWAYS AS ((miles/NULLIF(gallons,0)) * tax_rate - tax_paid) STORED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_co_qtr_state (company_id, year, quarter, state),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Permits ────────────────────────────────────────────────
CREATE TABLE permits (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id       INT UNSIGNED NOT NULL,
  load_id          INT UNSIGNED,
  permit_number    VARCHAR(50),
  issuing_state    CHAR(2) NOT NULL,
  permit_type      VARCHAR(100),
  valid_from       DATE,
  valid_to         DATE,
  max_width        DECIMAL(6,2),
  max_height       DECIMAL(6,2),
  max_length       DECIMAL(6,2),
  max_weight       DECIMAL(10,2),
  route_notes      TEXT,
  drive_file_id    VARCHAR(100),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE SET NULL,
  INDEX idx_company_state (company_id, issuing_state),
  INDEX idx_expiry (valid_to)
) ENGINE=InnoDB;

-- ── Hazard Reports ─────────────────────────────────────────
CREATE TABLE hazard_reports (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('police','dot_officer','scale_open','scale_closed','hazard','construction','all_clear') NOT NULL,
  lat         DECIMAL(10,7) NOT NULL,
  lng         DECIMAL(10,7) NOT NULL,
  description VARCHAR(255),
  reporter_id INT UNSIGNED,
  upvotes     INT DEFAULT 0,
  expires_at  TIMESTAMP NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_expires  (expires_at),
  INDEX idx_location (lat, lng)
) ENGINE=InnoDB;

-- ── Coaching Sessions ──────────────────────────────────────
CREATE TABLE coaching_sessions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id  INT UNSIGNED NOT NULL,
  driver_id   INT UNSIGNED NOT NULL,
  manager_id  INT UNSIGNED NOT NULL,
  date        DATE NOT NULL,
  category    ENUM('Safety','Performance','Attendance','Positive Recognition','Corrective Action','Other') NOT NULL,
  notes       TEXT,
  follow_up   DATE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id) ON DELETE CASCADE,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Drug Tests ─────────────────────────────────────────────
CREATE TABLE drug_tests (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id      INT UNSIGNED NOT NULL,
  driver_id       INT UNSIGNED NOT NULL,
  test_type       ENUM('Pre-Employment','Random','Post-Accident','Reasonable Suspicion','Return-to-Duty','Follow-Up') NOT NULL,
  test_date       DATE NOT NULL,
  result          ENUM('Negative','Positive','Refused','Cancelled') NOT NULL,
  collection_site VARCHAR(150),
  mro_name        VARCHAR(100),
  notes           TEXT,
  document_id     INT UNSIGNED,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)  REFERENCES drivers(id) ON DELETE CASCADE,
  INDEX idx_driver_type (driver_id, test_type)
) ENGINE=InnoDB;

-- ── Accident Register (49 CFR 390.15) ─────────────────────
CREATE TABLE accident_register (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id    INT UNSIGNED NOT NULL,
  driver_id     INT UNSIGNED,
  equipment_id  INT UNSIGNED,
  accident_date DATE NOT NULL,
  time_of_day   TIME,
  location      VARCHAR(255),
  state         CHAR(2),
  fatalities    TINYINT DEFAULT 0,
  injuries      TINYINT DEFAULT 0,
  towed_vehicles TINYINT DEFAULT 0,
  hazmat        TINYINT(1) DEFAULT 0,
  dot_reportable TINYINT(1) DEFAULT 0,
  description   TEXT,
  police_report VARCHAR(50),
  claim_id      INT UNSIGNED,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id)  REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id)   REFERENCES drivers(id) ON DELETE SET NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Insurance Policies ─────────────────────────────────────
CREATE TABLE insurance_policies (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id     INT UNSIGNED NOT NULL,
  policy_type    VARCHAR(100) NOT NULL,
  insurer        VARCHAR(150),
  policy_number  VARCHAR(50),
  coverage_amt   DECIMAL(12,2),
  premium        DECIMAL(10,2),
  effective_date DATE,
  expiry_date    DATE NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB;

-- ── Contacts ───────────────────────────────────────────────
CREATE TABLE contacts (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  name       VARCHAR(150) NOT NULL,
  type       ENUM('broker','shipper','consignee','mechanic','vendor','pilot_car','attorney','insurer','other') DEFAULT 'other',
  email      VARCHAR(150),
  phone      VARCHAR(20),
  address    VARCHAR(255),
  notes      TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_type (type)
) ENGINE=InnoDB;

-- ── Feedback ───────────────────────────────────────────────
CREATE TABLE feedback (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    INT UNSIGNED,
  name       VARCHAR(150),
  email      VARCHAR(150),
  category   VARCHAR(50),
  message    TEXT NOT NULL,
  screenshot_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── Seed: Default Companies ────────────────────────────────
INSERT INTO companies (name, dba, dot, mc, scac, fein, state, active) VALUES
('Carrier Trucking US, LLC', 'Carrier Trucking', '4326039', '1688495', 'CTUN', '33-1925253', 'FL', 1),
('Heavy Haulers LLC',        'Heavy Haulers',    'TBD',     NULL,      NULL,   NULL,          'FL', 1);

-- ── Seed: Admin User ───────────────────────────────────────
INSERT INTO users (company_id, email, name, password, role, active) VALUES
(1, 'crtruckus@gmail.com', 'Jim Burlew', '$2y$12$PLACEHOLDER_HASH', 'admin', 1);

SET FOREIGN_KEY_CHECKS=1;
