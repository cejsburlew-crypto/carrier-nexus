// ── Company ────────────────────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  dba?: string;
  dot: string;
  mc?: string;
  scac?: string;
  fein?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  email?: string;
  website?: string;
  active: boolean;
}

// ── User ───────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'dispatcher' | 'approver' | 'driver';
export interface User {
  id: number;
  company_id: number;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  member_id?: string;
  avatar?: string;
}

// ── Auth Session ───────────────────────────────────────────────────────────
export interface AuthSession {
  token: string;
  user: User;
  company: Company;
  expires_at: string;
}

// ── Load ───────────────────────────────────────────────────────────────────
export type LoadStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'invoiced' | 'paid';
export interface Load {
  id: number;
  company_id: number;
  dispatcher_id?: number;
  driver_id?: number;
  rate_con_number?: string;
  broker_name?: string;
  broker_mc?: string;
  shipper_name?: string;
  consignee_name?: string;
  origin_city?: string;
  origin_state?: string;
  dest_city?: string;
  dest_state?: string;
  pickup_date?: string;
  delivery_date?: string;
  commodity?: string;
  weight?: number;
  rate: number;
  fuel_surcharge?: number;
  accessorials?: number;
  status: LoadStatus;
  week_start?: string;
  notes?: string;
  created_at: string;
}

// ── Driver ─────────────────────────────────────────────────────────────────
export interface Driver {
  id: number;
  company_id: number;
  user_id?: number;
  name: string;
  email?: string;
  phone?: string;
  cdl_number?: string;
  cdl_state?: string;
  cdl_expiry?: string;
  medical_expiry?: string;
  hire_date?: string;
  status: 'active' | 'inactive' | 'available' | 'on_load' | 'in_shop';
  member_id?: string;
  dispatcher_id?: number;
  equipment_unit?: string;
}

// ── Equipment ──────────────────────────────────────────────────────────────
export interface Equipment {
  id: number;
  company_id: number;
  unit_number: string;
  type: 'tractor' | 'trailer' | 'other';
  year?: number;
  make?: string;
  model?: string;
  vin?: string;
  license_plate?: string;
  license_state?: string;
  dot_number?: string;
  current_mileage?: number;
  annual_inspection_due?: string;
  status: 'in_service' | 'in_shop' | 'available' | 'retired';
  assigned_driver_id?: number;
}

// ── Settlement ─────────────────────────────────────────────────────────────
export type SettlementStatus = 'draft' | 'pending' | 'approved' | 'paid';
export interface Settlement {
  id: number;
  company_id: number;
  driver_id: number;
  week_start: string;
  week_end: string;
  gross_revenue: number;
  dispatch_pct: number;
  dispatch_fee: number;
  fuel_deductions: number;
  other_deductions: number;
  balance_forward: number;
  net_pay: number;
  status: SettlementStatus;
  approved_by?: number;
  approved_at?: string;
  notes?: string;
  created_at: string;
}

// ── Document ───────────────────────────────────────────────────────────────
export type DocType = 'bol' | 'ratecon' | 'permit' | 'settlement' | 'cdl' | 'insurance' | 'w9' | 'other';
export interface Document {
  id: number;
  company_id: number;
  driver_id?: number;
  load_id?: number;
  type: DocType;
  filename: string;
  drive_file_id?: string;
  drive_url?: string;
  confidence_score?: number;
  status: 'auto_filed' | 'pending_review' | 'filed' | 'rejected';
  notes?: string;
  created_at: string;
}

// ── Maintenance ────────────────────────────────────────────────────────────
export interface MaintenanceRecord {
  id: number;
  company_id: number;
  equipment_id: number;
  service_date: string;
  mileage: number;
  service_type: string;
  description?: string;
  parts_cost: number;
  labor_hours: number;
  labor_rate: number;
  total_cost: number;
  shop?: string;
  technician?: string;
  next_service_mileage?: number;
  created_at: string;
}

// ── IFTA Entry ─────────────────────────────────────────────────────────────
export interface IFTAEntry {
  id: number;
  company_id: number;
  year: number;
  quarter: 1 | 2 | 3 | 4;
  state: string;
  miles: number;
  gallons: number;
  tax_rate: number;
  tax_paid: number;
  tax_owed?: number;
  created_at: string;
}

// ── Expense ────────────────────────────────────────────────────────────────
export interface Expense {
  id: number;
  company_id: number;
  driver_id?: number;
  load_id?: number;
  category: string;
  amount: number;
  date: string;
  description?: string;
  payment_method?: string;
  reference?: string;
  created_at: string;
}

// ── Hazard Report ──────────────────────────────────────────────────────────
export type HazardType = 'police' | 'dot_officer' | 'scale_open' | 'scale_closed' | 'hazard' | 'construction' | 'all_clear';
export interface HazardReport {
  id: number;
  type: HazardType;
  lat: number;
  lng: number;
  description?: string;
  reporter_id?: number;
  expires_at: string;
  created_at: string;
}

// ── PreTrip Inspection ─────────────────────────────────────────────────────
export interface PreTripInspection {
  id: number;
  company_id: number;
  driver_id: number;
  equipment_id: number;
  inspection_date: string;
  odometer: number;
  has_defects: boolean;
  items: PreTripItem[];
  driver_signature?: string;
  manager_ack?: boolean;
  manager_id?: number;
  created_at: string;
}

export interface PreTripItem {
  category: string;
  item: string;
  status: 'pass' | 'fail' | 'na';
  notes?: string;
}

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PagedResult<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  last_page: number;
}

// ── API Response ───────────────────────────────────────────────────────────
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}
