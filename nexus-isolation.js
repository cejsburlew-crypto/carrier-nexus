/**
 * nexus-isolation.js — Company Data Isolation Layer v2
 * Stamps every financial record with company DOT + MC + ID.
 * Filters every read to only return matching records.
 * Belt-and-suspenders: works even if localStorage proxy fails.
 */
(function(window) {
  'use strict';

  function getActiveCompany() {
    try {
      var rawGet = Storage.prototype._rawGet || null;
      var coId = rawGet
        ? rawGet.call(localStorage, 'nexus_active_company')
        : localStorage.getItem('nexus_active_company');
      coId = coId || 'co_001';
      var companies = JSON.parse(localStorage.getItem('nexus_companies') || '[]');
      var co = companies.find(function(c) { return c.id === coId; });
      if (!co) co = { id: coId, name: 'Unknown', dot: '', mc: '', scac: '', fein: '' };
      // Normalize: company-management.html uses 'usdot', isolation uses 'dot'
      if (!co.dot && co.usdot) co.dot = co.usdot;
      return co;
    } catch(e) {
      return { id: 'co_001', name: 'Carrier Trucking US, LLC', dot: '4326039', mc: '1688495', scac: 'CTUN', fein: '33-1925253' };
    }
  }

  function matchesCompany(record, co) {
    if (typeof record !== 'object' || !record) return false;
    // Legacy record (no stamps) — only show for co_001
    if (!record._dot && !record._mc && !record._coId) return co.id === 'co_001';
    // Match by company ID (fastest)
    if (record._coId && record._coId === co.id) return true;
    // Match by DOT (globally unique)
    if (record._dot && co.dot && record._dot === co.dot) return true;
    // Match by MC (also unique)
    if (record._mc && co.mc && record._mc === co.mc) return true;
    return false;
  }

  var NI = {
    getCompany: getActiveCompany,

    stamp: function(record) {
      var co = getActiveCompany();
      if (typeof record === 'object' && record) {
        record._coId    = co.id;
        record._dot     = co.dot  || '';
        record._mc      = co.mc   || '';
        record._scac    = co.scac || '';
        record._stamped = new Date().toISOString();
      }
      return record;
    },

    get: function(key) {
      try {
        var raw = localStorage.getItem(key);
        if (!raw) return [];
        var records = JSON.parse(raw);
        if (!Array.isArray(records)) return records;
        var co = getActiveCompany();
        return records.filter(function(r) { return matchesCompany(r, co); });
      } catch(e) { return []; }
    },

    set: function(key, records) {
      try { localStorage.setItem(key, JSON.stringify(records)); } catch(e) {}
    },

    add: function(key, record) {
      try {
        var raw = localStorage.getItem(key);
        var all = (raw && JSON.parse(raw)) || [];
        if (!Array.isArray(all)) all = [];
        this.stamp(record);
        all.push(record);
        localStorage.setItem(key, JSON.stringify(all));
        return record;
      } catch(e) { return record; }
    },

    update: function(key, idField, idValue, updates) {
      try {
        var raw = localStorage.getItem(key);
        var all = (raw && JSON.parse(raw)) || [];
        var idx = -1;
        for (var i = 0; i < all.length; i++) { if (all[i][idField] === idValue) { idx = i; break; } }
        if (idx >= 0) {
          all[idx] = Object.assign({}, all[idx], updates);
          localStorage.setItem(key, JSON.stringify(all));
          return all[idx];
        }
      } catch(e) {}
      return null;
    },

    remove: function(key, idField, idValue) {
      try {
        var raw = localStorage.getItem(key);
        var all = (raw && JSON.parse(raw)) || [];
        all = all.filter(function(r) { return r[idField] !== idValue; });
        localStorage.setItem(key, JSON.stringify(all));
      } catch(e) {}
    },

    // One-time migration: stamp all unstamped co_001 records
    migrateStamps: function() {
      var rawGet = Storage.prototype._rawGet;
      var rawSet = Storage.prototype._rawSet;
      if (!rawGet || !rawSet) return;
      if (rawGet.call(localStorage, 'nexus_stamp_migration_v1')) return;
      var CT = { id: 'co_001', dot: '4326039', mc: '1688495', scac: 'CTUN' };
      var KEYS = [
        'nexus_settlements','nexus_dispatch_loads','nexus_expenses',
        'nexus_fuel_records','nexus_maintenance_records','nexus_permits',
        'nexus_tires','nexus_pretrip_records','nexus_accident_register',
        'nexus_drug_tests','nexus_invoices','nexus_scale_tickets',
        'nexus_customers','nexus_brokers','nexus_factoring_invoices',
        'nexus_work_orders','nexus_documents','nexus_vehicles',
        'nexus_avail_drivers','nexus_weekly_settlements','nexus_drivers',
        'nexus_gps_vehicles','nexus_coaching_log','nexus_dvir_records',
        'nexus_incidents','nexus_claims','nexus_coi_records','nexus_ifta_records'
      ];
      KEYS.forEach(function(key) {
        ['co_001:' + key, key].forEach(function(k) {
          var raw = rawGet.call(localStorage, k);
          if (!raw) return;
          try {
            var recs = JSON.parse(raw);
            if (!Array.isArray(recs)) return;
            var changed = false;
            recs.forEach(function(r) {
              if (typeof r === 'object' && r && !r._coId) {
                r._coId = CT.id; r._dot = CT.dot; r._mc = CT.mc; r._scac = CT.scac;
                changed = true;
              }
            });
            if (changed) rawSet.call(localStorage, k, JSON.stringify(recs));
          } catch(e) {}
        });
      });
      rawSet.call(localStorage, 'nexus_stamp_migration_v1', '1');
    },

    // Initialize a new company with empty stores (first visit)
    initCompany: function(coId) {
      var rawGet = Storage.prototype._rawGet;
      var rawSet = Storage.prototype._rawSet;
      if (!rawGet || !rawSet) return;
      var initKey = 'nexus_init_' + coId + '_v2';
      if (rawGet.call(localStorage, initKey)) return;
      var ARRAYS = [
        'nexus_settlements','nexus_dispatch_loads','nexus_expenses',
        'nexus_fuel_records','nexus_maintenance_records','nexus_permits',
        'nexus_tires','nexus_pretrip_records','nexus_accident_register',
        'nexus_drug_tests','nexus_invoices','nexus_scale_tickets',
        'nexus_customers','nexus_brokers','nexus_factoring_invoices',
        'nexus_work_orders','nexus_documents','nexus_vehicles',
        'nexus_avail_drivers','nexus_drivers','nexus_gps_vehicles',
        'nexus_coaching_log','nexus_dvir_records','nexus_incidents',
        'nexus_claims','nexus_coi_records','nexus_ifta_records',
        'nexus_weekly_settlements'
      ];
      ARRAYS.forEach(function(key) {
        var sk = coId + ':' + key;
        if (rawGet.call(localStorage, sk) === null) {
          rawSet.call(localStorage, sk, '[]');
        }
      });
      rawSet.call(localStorage, initKey, '1');
    }
  };

  // Auto-run on load
  NI.migrateStamps();

  // Init current company if it's not co_001
  var _rg = Storage.prototype._rawGet;
  if (_rg) {
    var _cur = _rg.call(localStorage, 'nexus_active_company') || 'co_001';
    if (_cur !== 'co_001') NI.initCompany(_cur);
  }

  window.NexusIsolation = NI;
})(window);
