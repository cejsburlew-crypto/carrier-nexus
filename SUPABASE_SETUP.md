# Carrier Nexus — Supabase Backend Setup

## What this does
Replaces localStorage with a real PostgreSQL database hosted on Supabase.
All data syncs across devices. Auth is real email/password. Multi-tenant ready.

---

## Step 1 — Create Supabase Project

1. Go to https://supabase.com and sign in (or create a free account)
2. Click **New Project**
3. Name it: `carrier-nexus`
4. Set a strong database password — **save it somewhere safe**
5. Choose region closest to you (e.g. `us-east-1`)
6. Click **Create new project** — wait ~2 minutes for provisioning

---

## Step 2 — Run the Schema

1. In your Supabase project, go to **SQL Editor** (left sidebar)
2. Click **+ New query**
3. Open `schema.sql` from this folder
4. Paste the entire contents into the editor
5. Click **Run** — you should see "Success. No rows returned"

---

## Step 3 — Get Your API Keys

1. Go to **Project Settings** → **API** (gear icon, left sidebar)
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public** key (long JWT string)

---

## Step 4 — Configure the App

1. Open `nexus-config.js` in this folder
2. Replace the placeholder values:

```js
window.NEXUS_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';  // ← paste URL
window.NEXUS_SUPABASE_KEY = 'YOUR_ANON_KEY';                      // ← paste key
```

3. Save the file

> ⚠️ **Do NOT commit nexus-config.js to a public GitHub repo.**
> Add it to `.gitignore` if you push the source. The anon key is safe for
> browser use but there's no reason to expose it publicly.

---

## Step 5 — Create Your First User

1. In Supabase, go to **Authentication** → **Users** → **Invite user**
2. Enter your email and send the invite
3. Check your email, set your password
4. Back in Supabase **SQL Editor**, run the seed block at the bottom of `schema.sql`:

```sql
INSERT INTO companies (id, name, dot_number, mc_number, phone, email)
VALUES (
  'aaaaaaaa-0000-0000-0000-000000000001',
  'Carrier Trucking US, LLC',
  '4012345', '1234567',
  '(555) 000-0001', 'jim@carriertrucking.com'
);

-- Replace with your actual UUID from Authentication → Users
UPDATE profiles
SET company_id = 'aaaaaaaa-0000-0000-0000-000000000001',
    name       = 'Jim Burlew',
    role       = 'admin'
WHERE id = 'YOUR-USER-UUID-HERE';
```

---

## Step 6 — Upload nexus-config.js to GitHub Pages

Upload `nexus-config.js` to the carrier-nexus GitHub repo alongside the HTML files.

---

## Step 7 — Migrate Existing Data (Optional)

If you have data in localStorage from the old app:

1. Open the live site in Chrome
2. Open DevTools → Console
3. Run: `await NexusDB.migrate()`
4. All localStorage data will be pushed to Supabase

---

## How It Works

| State | Behavior |
|-------|----------|
| `nexus-config.js` has real keys | All data reads/writes go to Supabase |
| `nexus-config.js` has placeholder keys | Falls back to localStorage (dev mode) |
| Offline | Falls back to localStorage automatically |

The data layer (`nexus-db.js`) handles the switch transparently. The UI is identical in both modes.

---

## Verify It's Working

After logging in, open DevTools Console and run:
```js
NexusDB.backendStatus()  // should return "supabase"
await NexusDB.Expenses.list()  // should return [] or your records
```

---

## File Summary

| File | Purpose |
|------|---------|
| `schema.sql` | Paste into Supabase SQL Editor once |
| `nexus-config.js` | Your project URL + anon key |
| `nexus-db.js` | Data layer — all CRUD, auth, realtime |
| All `*.html` pages | Already wired to NexusDB |
