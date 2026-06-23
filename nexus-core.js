/**
 * nexus-core.js — Carrier Nexus Data Abstraction Layer
 * Wraps localStorage collections with CRUD, eventing, and sync queue.
 * Reads/writes the SAME localStorage keys used by all existing pages.
 * Purely additive — no migration, no renaming of existing keys.
 */
(function (window) {
  'use strict';

  // ── ID generation ──────────────────────────────────────────────────────────
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older environments
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // ── Event bus ─────────────────────────────────────────────────────────────
  var _listeners = {};

  function on(event, handler) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (h) { return h !== handler; });
  }

  function emit(event, data) {
    var handlers = _listeners[event] || [];
    handlers.forEach(function (h) {
      try { h(data); } catch (e) { console.warn('[NexusCore] Event handler error on "' + event + '":', e); }
    });
  }

  // ── Sync queue ────────────────────────────────────────────────────────────
  var SYNC_QUEUE_KEY = 'nexus_sync_queue';
  var MAX_QUEUE = 1000;

  var syncQueue = {
    push: function (collection, operation, id) {
      var queue = this.getQueue();
      queue.push({ collection: collection, operation: operation, id: id, timestamp: Date.now() });
      if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
      try { localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue)); } catch (e) {}
    },
    getQueue: function () {
      try { return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]'); } catch (e) { return []; }
    },
    clear: function () {
      try { localStorage.removeItem(SYNC_QUEUE_KEY); } catch (e) {}
    }
  };

  // ── Sync provider ─────────────────────────────────────────────────────────
  var sync = {
    _provider: null,
    setProvider: function (provider) {
      // Accepts 'firestore' | 'supabase' | null — no-op for now
      this._provider = provider;
    },
    push: function (collection, record) {
      syncQueue.push(collection, 'upsert', record && record.id);
    }
  };

  // ── Collection factory ────────────────────────────────────────────────────
  function makeCollection(name, storageKey) {
    return {
      _key: storageKey,
      _name: name,

      getAll: function () {
        try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch (e) { return []; }
      },

      get: function (id) {
        return this.getAll().find(function (r) { return r.id === id; }) || null;
      },

      add: function (record) {
        var all = this.getAll();
        var entry = Object.assign({}, record);
        if (!entry.id) entry.id = generateId();
        entry.created_at = entry.created_at || new Date().toISOString();
        all.push(entry);
        try { localStorage.setItem(storageKey, JSON.stringify(all)); } catch (e) {}
        emit(name + ':add', entry);
        syncQueue.push(name, 'add', entry.id);
        return entry;
      },

      update: function (id, changes) {
        var all = this.getAll();
        var idx = all.findIndex(function (r) { return r.id === id; });
        if (idx === -1) return null;
        var updated = Object.assign({}, all[idx], changes, { updated_at: new Date().toISOString() });
        all[idx] = updated;
        try { localStorage.setItem(storageKey, JSON.stringify(all)); } catch (e) {}
        emit(name + ':update', updated);
        syncQueue.push(name, 'update', id);
        return updated;
      },

      delete: function (id) {
        var all = this.getAll();
        var idx = all.findIndex(function (r) { return r.id === id; });
        if (idx === -1) return false;
        all[idx] = Object.assign({}, all[idx], { deleted_at: new Date().toISOString() });
        try { localStorage.setItem(storageKey, JSON.stringify(all)); } catch (e) {}
        emit(name + ':delete', { id: id });
        syncQueue.push(name, 'delete', id);
        return true;
      },

      query: function (fn) {
        return this.getAll().filter(function (r) { return !r.deleted_at; }).filter(fn);
      }
    };
  }

  // ── Collections (keys match existing pages exactly) ───────────────────────
  var collections = {
    Loads:        makeCollection('Loads',        'nexus_loads_v2'),
    Expenses:     makeCollection('Expenses',     'nexus_expenses'),
    Documents:    makeCollection('Documents',    'nexus_documents'),
    Invoices:     makeCollection('Invoices',     'nexus_invoices'),
    Drivers:      makeCollection('Drivers',      'NEXUS_LOCAL_USERS'),
    Equipment:    makeCollection('Equipment',    'nexus_equipment'),
    Vendors:      makeCollection('Vendors',      'nexus_vendors'),
    ScaleTickets: makeCollection('ScaleTickets', 'nexus_scale_tickets'),
    DVIRs:        makeCollection('DVIRs',        'nexus_dvir'),
    IFTA:         makeCollection('IFTA',         'nexus_ifta'),
  };

  // ── Stats helper ──────────────────────────────────────────────────────────
  function stats() {
    var expenses = collections.Expenses.getAll().filter(function (r) { return !r.deleted_at; });
    var expTotal = expenses.reduce(function (sum, r) {
      return sum + (parseFloat(r.amount) || 0);
    }, 0);
    return {
      loadCount:     collections.Loads.getAll().filter(function (r) { return !r.deleted_at; }).length,
      expenseTotal:  expTotal,
      documentCount: collections.Documents.getAll().filter(function (r) { return !r.deleted_at; }).length,
      driverCount:   collections.Drivers.getAll().filter(function (r) { return !r.deleted_at; }).length,
      invoiceCount:  collections.Invoices.getAll().filter(function (r) { return !r.deleted_at; }).length,
    };
  }

  // ── Expose on window ──────────────────────────────────────────────────────
  window.NexusCore = Object.assign(
    {
      _listeners: _listeners,
      on: on,
      off: off,
      emit: emit,
      generateId: generateId,
      stats: stats,
      syncQueue: syncQueue,
      sync: sync,
    },
    collections
  );

  console.log('NexusCore initialized — ' + Object.keys(collections).length + ' collections ready');

})(window);
