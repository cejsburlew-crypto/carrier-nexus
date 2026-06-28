# Carrier Nexus v2 — Angular + PHP

## Architecture

```
frontend/   Angular 17 SPA (TypeScript, SCSS, lazy-loaded modules)
backend/    PHP 8.3 REST API (PDO/MySQL, JWT auth, company-scoped)
```

## Frontend — Angular

### Setup
```bash
cd frontend
npm install
ng serve          # dev server at localhost:4200
ng build          # production build → dist/
```

### Deploy to GitHub Pages
```bash
ng build --base-href /carrier-nexus/
# Copy dist/carrier-nexus-app/browser/ to gh-pages branch
```

### Module Structure
| Module | Routes |
|--------|--------|
| Dashboard | `/dashboard`, `/dashboard/fleet-command` |
| Dispatch | `/dispatch/active-loads`, `/dispatch/board`, `/dispatch/load-board` |
| Drivers | `/drivers/roster`, `/drivers/portal`, `/drivers/coaching`, `/drivers/drug-testing`, `/drivers/hall-of-bragging` |
| Equipment | `/equipment/registry`, `/equipment/maintenance`, `/equipment/work-orders`, `/equipment/pm-schedule`, `/equipment/pretrip`, `/equipment/tires`, `/equipment/scale-tickets`, `/equipment/gps` |
| Documents | `/documents/vault`, `/documents/inbox`, `/documents/upload`, `/documents/pods`, `/documents/permits` |
| Compliance | `/compliance/fmcsa`, `/compliance/dot`, `/compliance/cfr`, `/compliance/expiration`, `/compliance/pilot`, `/compliance/accidents`, `/compliance/drug-alcohol`, `/compliance/sos`, `/compliance/boc3`, `/compliance/entity` |
| Financials | `/financials/overview`, `/financials/settlements`, `/financials/weekly`, `/financials/expenses`, `/financials/ifta`, `/financials/fuel`, `/financials/invoicing`, `/financials/factoring`, `/financials/commissions` |
| Communications | `/communications/board`, `/communications/feed`, `/communications/contacts` |
| Safety | `/safety/hazard-map`, `/safety/route`, `/safety/claims`, `/safety/incidents`, `/safety/weight-calc` |
| Admin | `/admin/users`, `/admin/companies`, `/admin/settings` |

## Backend — PHP

### Setup (Docker — Recommended)
```bash
cd backend
cp .env.example .env      # Edit with your credentials
docker-compose up -d      # API at localhost:8000, MySQL at localhost:3306
```

### Setup (Manual)
```bash
# 1. Create MySQL database
mysql -u root -p < backend/schema/schema.sql

# 2. Configure PHP web server to point to backend/
# 3. Set environment variables in .env or server config
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Invalidate token |
| POST | /api/auth/switch-company | Switch active company (admin) |
| GET | /api/dashboard/stats | Dashboard KPIs |
| GET/POST | /api/loads | List / create loads |
| PUT/DELETE | /api/loads/{id} | Update / delete load |
| GET/POST | /api/drivers | List / create drivers |
| GET | /api/drivers/leaderboard | Performance rankings |
| GET/POST | /api/settlements | List / create settlements |
| GET/POST | /api/equipment | Fleet registry |
| GET/POST | /api/expenses | Expenses |
| GET/POST | /api/documents | Document vault |
| GET/POST | /api/maintenance_records | Maintenance history |
| GET/POST | /api/work_orders | Work orders |
| GET/POST | /api/permits | Permit tracking |
| GET/POST | /api/drug-tests | Drug & alcohol tests |
| GET/POST | /api/coaching-sessions | Coaching log |
| GET | /api/companies | Company list (admin) |

### Company Isolation
Every API endpoint reads `company_id` from the JWT token — never from the request body. Financial, driver, equipment, and document data is always filtered by the authenticated company's ID. DOT and MC numbers are stamped on company creation and used for cross-reference.

## Data Migration from localStorage

The existing static site uses `localStorage` with the prefix pattern `co_001:nexus_key`. To migrate:

1. Open the existing site in a browser
2. Open DevTools → Application → Local Storage
3. Export all `co_001:` keys
4. Use `backend/api/migrate/import.php` (to be built) to POST the JSON to the new API

## Environment Variables (backend)
```
DB_HOST      MySQL host (default: localhost)
DB_NAME      Database name (default: carrier_nexus)
DB_USER      MySQL user
DB_PASS      MySQL password
JWT_SECRET   Random string, min 32 chars — change in production
```
