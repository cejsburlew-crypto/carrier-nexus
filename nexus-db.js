// ============================================================
// CARRIER NEXUS — DATA LAYER  (nexus-db.js)
// Supabase backend with localStorage fallback for offline/dev.
//
// CONFIG: Set NEXUS_SUPABASE_URL and NEXUS_SUPABASE_KEY in
// nexus-config.js (never commit real keys to public repos).
// If those vars are absent the layer runs on localStorage.
// ============================================================

(function (global) {
  'use strict';

  // ── CONFIG ────────────────────────────────────────────────
  // Overridden by nexus-config.js loaded before this file.
  const CFG = {
    url:  global.NEXUS_SUPABASE_URL  || '',
    key:  global.NEXUS_SUPABASE_KEY  || '',
    get configured() { return !!(this.url && this.key); }
  };

  // ── SUPABASE CLIENT ───────────────────────────────────────
  let _sb = null;
  function sb() {
    if (_sb) return _sb;
    if (!CFG.configured) return null;
    // Supabase JS v2 loaded via CDN <script> before this file
    _sb = supabase.createClient(CFG.url, CFG.key);
    return _sb;
  }

  // ── AUTH ──────────────────────────────────────────────────
  const Auth = {
    async signIn(email, password) {
      if (!sb()) throw new Error('Supabase not configured');
      const { data, error } = await sb().auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    async signOut() {
      if (!sb()) { localStorage.removeItem('nexus_session'); return; }
      await sb().auth.signOut();
    },
    async getSession() {
      if (sb()) {
        const { data } = await sb().auth.getSession();
        if (data && data.session) return data.session;
        // Supabase has no live session — fall back to local session
      }
      const raw = localStorage.getItem('nexus_session');
      return raw ? JSON.parse(raw) : null;
    },
    async getUser() {
      if (!sb()) return null;
      const { data } = await sb().auth.getUser();
      return data.user;
    },
    onAuthChange(cb) {
      if (!sb()) return;
      sb().auth.onAuthStateChange(cb);
    },
    async getProfile() {
      if (!sb()) return null;
      const user = await Auth.getUser();
      if (!user) return null;
      const { data } = await sb().from('profiles').select('*').eq('id', user.id).single();
      return data;
    },
    async getCompanyId() {
      const profile = await Auth.getProfile();
      return profile ? profile.company_id : null;
    },
    async requireAuth() {
      const session = await Auth.getSession();
      if (!session) {
        window.location.href = 'login.html';
        return false;
      }
      return true;
    }
  };

  // ── LOCAL STORAGE FALLBACK ────────────────────────────────
  // Simple CRUD on JSON arrays stored in localStorage.
  // Uses same key names the pages already use.
  const LS = {
    get(key) {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); }
      catch { return []; }
    },
    set(key, val) {
      localStorage.setItem(key, JSON.stringify(val));
    },
    insert(key, item) {
      const rows = LS.get(key);
      const newItem = { ...item, id: item.id || crypto.randomUUID(), created_at: new Date().toISOString() };
      rows.push(newItem);
      LS.set(key, rows);
      return newItem;
    },
    update(key, id, patch) {
      const rows = LS.get(key).map(r => r.id === id ? { ...r, ...patch } : r);
      LS.set(key, rows);
    },
    delete(key, id) {
      LS.set(key, LS.get(key).filter(r => r.id !== id));
    }
  };

  // ── GENERIC CRUD FACTORY ──────────────────────────────────
  // For each table, builds { list, get, create, update, delete, query }
  function makeTable(tableName, lsKey) {
    return {
      async list(filters = {}) {
        if (sb()) {
          try {
            let q = sb().from(tableName).select('*').order('created_at', { ascending: false });
            for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
            const { data, error } = await q;
            if (error) throw error;
            if (data && data.length > 0) return data; // fall through to LS if empty
          } catch(e) {
            console.warn('[NexusDB] Supabase ' + tableName + '.list failed, using localStorage:', e.message);
          }
        }
        let rows = LS.get(lsKey);
        for (const [col, val] of Object.entries(filters))
          rows = rows.filter(r => r[col] === val);
        return rows;
      },

      async get(id) {
        if (sb()) {
          try {
            const { data, error } = await sb().from(tableName).select('*').eq('id', id).single();
            if (error) throw error;
            return data;
          } catch(e) {
            console.warn('[NexusDB] Supabase ' + tableName + '.get failed, using localStorage:', e.message);
          }
        }
        return LS.get(lsKey).find(r => r.id === id) || null;
      },

      async create(item) {
        if (sb()) {
          try {
            const { data, error } = await sb().from(tableName).insert(item).select().single();
            if (error) throw error;
            return data;
          } catch(e) {
            // If Supabase rejects because a column doesn't exist in the schema cache,
            // strip that column and retry once — prevents localStorage fallback for
            // legitimate records that just have an unmigrated field (e.g. add_deduct).
            const missing = (e.message||'').match(/Could not find the '([^']+)' column/);
            if (missing) {
              const stripped = Object.assign({}, item);
              delete stripped[missing[1]];
              console.warn('[NexusDB] Retrying ' + tableName + '.create without unknown column: ' + missing[1]);
              try {
                const { data: d2, error: e2 } = await sb().from(tableName).insert(stripped).select().single();
                if (!e2) return d2;
              } catch(_) {}
            }
            console.warn('[NexusDB] Supabase ' + tableName + '.create failed, using localStorage:', e.message);
          }
        }
        return LS.insert(lsKey, item);
      },

      async update(id, patch) {
        if (sb()) {
          try {
            const { data, error } = await sb().from(tableName).update(patch).eq('id', id).select().single();
            if (error) throw error;
            return data;
          } catch(e) {
            console.warn('[NexusDB] Supabase ' + tableName + '.update failed, using localStorage:', e.message);
          }
        }
        LS.update(lsKey, id, patch);
        return { id, ...patch };
      },

      async delete(id) {
        if (sb()) {
          try {
            const { error } = await sb().from(tableName).delete().eq('id', id);
            if (error) throw error;
            return true;
          } catch(e) {
            console.warn('[NexusDB] Supabase ' + tableName + '.delete failed, using localStorage:', e.message);
          }
        }
        LS.delete(lsKey, id);
        return true;
      },

      // Raw Supabase query builder (Supabase only)
      query() {
        if (!sb()) throw new Error('Supabase not configured');
        return sb().from(tableName).select('*');
      }
    };
  }

  // ── TABLES ────────────────────────────────────────────────
  const Drivers     = makeTable('drivers',            'nexus_drivers');
  const Fleet       = makeTable('fleet',              'nexus_fleet');
  const Loads       = makeTable('loads',              'nexus_loads');
  const Settlements = makeTable('settlements',        'nexus_settlements');
  const Expenses    = makeTable('expenses',           'nexus_expenses');
  const Permits     = makeTable('permits',            'nexus_permits');
  const Invoices    = makeTable('invoices',           'nexus_invoices');
  const Contacts    = makeTable('contacts',           'nexus_contacts');
  const Maintenance = makeTable('maintenance_orders', 'nexus_maintenance');
  const Documents   = makeTable('documents',          'nexus_documents');

  // ── SETTLEMENTS — HELPERS ─────────────────────────────────
  Settlements.calculate = function (s) {
    if (s.role === 'dispatcher') {
      s.net_pay = Math.round(
        ((s.total_adds || 0) * (s.dispatcher_rate || 0.05) + (s.service_adj || 0)) * 100
      ) / 100;
    } else {
      const deductTotal = (s.deductions || []).reduce((a, d) => a + (d.amount || 0), 0);
      s.net_pay = Math.round(((s.gross_pay || 0) - deductTotal) * 100) / 100;
    }
    return s;
  };

  // ── LOADS — HELPERS ───────────────────────────────────────
  Loads.byStatus = function (status) {
    return Loads.list({ status });
  };
  Loads.byDriver = function (driverId) {
    return Loads.list({ driver_id: driverId });
  };

  // ── INVOICES — AUTO-NUMBER ────────────────────────────────
  Invoices.nextNumber = async function () {
    const year = new Date().getFullYear();
    const all  = await Invoices.list();
    const nums = all
      .map(i => parseInt((i.invoice_number || '').split('-')[2] || '0'))
      .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `INV-${year}-${String(next).padStart(3,'0')}`;
  };

  // ── MAINTENANCE — AUTO-NUMBER ─────────────────────────────
  Maintenance.nextWO = async function () {
    const year = new Date().getFullYear();
    const all  = await Maintenance.list();
    const nums = all
      .map(m => parseInt((m.wo_number || '').split('-')[2] || '0'))
      .filter(n => !isNaN(n));
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    return `WO-${year}-${String(next).padStart(3,'0')}`;
  };

  // ── REAL-TIME SUBSCRIPTIONS ───────────────────────────────
  const Realtime = {
    subscribe(tableName, cb) {
      if (!sb()) return null;
      return sb()
        .channel(`rt_${tableName}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: tableName }, cb)
        .subscribe();
    },
    unsubscribe(channel) {
      if (!sb() || !channel) return;
      sb().removeChannel(channel);
    }
  };

  // ── MIGRATION — localStorage → Supabase ──────────────────
  // Call NexusDB.migrate() once from the console to push local
  // data into Supabase after first-time setup.
  async function migrate() {
    if (!sb()) { console.warn('Supabase not configured'); return; }
    const companyId = await Auth.getCompanyId();
    if (!companyId) { console.warn('No company_id on profile. Set it first.'); return; }

    const tables = [
      { table: Drivers,     key: 'nexus_drivers'     },
      { table: Fleet,       key: 'nexus_fleet'        },
      { table: Loads,       key: 'nexus_loads'        },
      { table: Settlements, key: 'nexus_settlements'  },
      { table: Expenses,    key: 'nexus_expenses'     },
      { table: Permits,     key: 'nexus_permits'      },
      { table: Invoices,    key: 'nexus_invoices'     },
      { table: Contacts,    key: 'nexus_contacts'     },
      { table: Maintenance, key: 'nexus_maintenance'  },
      { table: Documents,   key: 'nexus_documents'    },
    ];

    for (const { table, key } of tables) {
      const rows = LS.get(key);
      if (!rows.length) continue;
      const tagged = rows.map(r => ({ ...r, company_id: companyId }));
      const { error } = await sb().from(table.tableName).upsert(tagged);
      if (error) console.error(`Error migrating ${key}:`, error);
      else console.log(`Migrated ${rows.length} rows from ${key}`);
    }
    console.log('Migration complete.');
  }

  // ── STATUS INDICATOR ─────────────────────────────────────
  function backendStatus() {
    return CFG.configured ? 'supabase' : 'localStorage';
  }

  // ── EXPORT ────────────────────────────────────────────────
  global.NexusDB = {
    Auth,
    Drivers,
    Fleet,
    Loads,
    Settlements,
    Expenses,
    Permits,
    Invoices,
    Contacts,
    Maintenance,
    Documents,
    Realtime,
    migrate,
    backendStatus,
    // Expose config check
    get isConfigured() { return CFG.configured; }
  };

})(window);

// --- AUTO-SEED ON VERSION MISMATCH ---
(function(){
  try {
    var stored = localStorage.getItem('nexus_data_version');
    var target = window.NEXUS_DATA_VERSION;
    if (stored !== target && target) {
      if (window.NEXUS_SEED_LOADS && window.NEXUS_SEED_LOADS.length)
        localStorage.setItem('nexus_loads_v2', JSON.stringify(window.NEXUS_SEED_LOADS));
      if (window.NEXUS_SEED_SETTLEMENTS && window.NEXUS_SEED_SETTLEMENTS.length)
        localStorage.setItem('nexus_settlements', JSON.stringify(window.NEXUS_SEED_SETTLEMENTS));
      localStorage.setItem('nexus_data_version', target);
      console.log('[NexusDB] Seeded to version', target);
    }
  } catch(e) {}
})();
