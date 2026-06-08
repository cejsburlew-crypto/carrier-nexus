// ============================================================
// CARRIER NEXUS — DOCUMENTS DATA LAYER  (nexus-docs.js)
// Single source of truth for all drive-sourced documents.
// Works with localStorage (always) + Supabase (if configured).
//
// Table: nexus_documents (localStorage key: nexus_documents)
// ============================================================
(function(global) {
  'use strict';

  const LS_KEY  = 'nexus_documents';
  const CFG_KEY = 'nexus_drive_mappings_config';

  // ── STORAGE HELPERS ─────────────────────────────────────
  function lsGet()  { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e) { return []; } }
  function lsSet(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

  // ── SUPABASE PASSTHROUGH ────────────────────────────────
  function sb() {
    if (!global.NEXUS_SUPABASE_URL || !global.NEXUS_SUPABASE_KEY) return null;
    if (!global._nexus_sb) {
      global._nexus_sb = supabase.createClient(global.NEXUS_SUPABASE_URL, global.NEXUS_SUPABASE_KEY);
    }
    return global._nexus_sb;
  }

  // ── SETTLEMENT PERIOD HELPERS ───────────────────────────
  function getSettlementPeriod(dateStr, periodType) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();

    if (periodType === 'weekly') {
      const weekStart = new Date(d);
      weekStart.setDate(day - d.getDay());
      return weekStart.toISOString().split('T')[0];
    }
    if (periodType === 'biweekly') {
      // Bi-weekly anchored to Jan 1 of year
      const jan1 = new Date(y, 0, 1);
      const dayOfYear = Math.floor((d - jan1) / 86400000);
      const period = Math.floor(dayOfYear / 14);
      const start = new Date(jan1);
      start.setDate(1 + period * 14);
      return start.toISOString().split('T')[0];
    }
    if (periodType === 'semimonthly') {
      const half = day <= 15 ? '01' : '16';
      return `${y}-${String(m+1).padStart(2,'0')}-${half}`;
    }
    // monthly (default)
    return `${y}-${String(m+1).padStart(2,'0')}-01`;
  }

  // ── CORE CRUD ────────────────────────────────────────────
  const Docs = {

    // Save or update a document record
    async save(doc) {
      // Normalize
      const now = new Date().toISOString();
      const period = getSettlementPeriod(
        doc.docDate,
        localStorage.getItem('nexus_settlement_period') || 'biweekly'
      );
      const record = {
        id:               doc.id || ('doc_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
        driveFileId:      doc.driveFileId      || null,
        driveFolderId:    doc.driveFolderId    || null,
        fileName:         doc.fileName         || '',
        fileType:         doc.fileType         || 'other',
        fileSizeBytes:    doc.fileSizeBytes     || null,
        driveUrl:         doc.driveUrl         || null,
        driveThumbUrl:    doc.driveThumbUrl     || null,
        // Routing
        driverName:       doc.driverName        || null,
        driverId:         doc.driverId          || null,
        loadNumber:       doc.loadNumber        || null,
        category:         doc.category          || 'General',
        // Dates
        docDate:          doc.docDate           || null,
        settlementPeriod: period,
        settlementPeriodType: localStorage.getItem('nexus_settlement_period') || 'biweekly',
        // Content
        extractedText:    doc.extractedText     || null,
        // Status
        status:           doc.status            || 'routed',
        routedAt:         doc.routedAt          || now,
        routedBy:         doc.routedBy          || 'admin',
        reviewedAt:       doc.reviewedAt        || null,
        notes:            doc.notes             || null,
        createdAt:        doc.createdAt         || now,
        updatedAt:        now,
      };

      // localStorage
      const all = lsGet();
      const idx = all.findIndex(d => d.id === record.id || (d.driveFileId && d.driveFileId === record.driveFileId));
      if (idx > -1) { all[idx] = { ...all[idx], ...record }; }
      else           { all.push(record); }
      lsSet(all);

      // Supabase (if configured)
      const client = sb();
      if (client) {
        const sbRow = {
          id:                record.id,
          drive_file_id:     record.driveFileId,
          drive_folder_id:   record.driveFolderId,
          file_name:         record.fileName,
          file_type:         record.fileType,
          file_size_bytes:   record.fileSizeBytes,
          drive_url:         record.driveUrl,
          driver_name:       record.driverName,
          driver_id:         record.driverId,
          load_number:       record.loadNumber,
          category:          record.category,
          doc_date:          record.docDate,
          settlement_period: record.settlementPeriod,
          extracted_text:    record.extractedText,
          status:            record.status,
          routed_at:         record.routedAt,
          routed_by:         record.routedBy,
          notes:             record.notes,
          created_at:        record.createdAt,
          updated_at:        record.updatedAt,
        };
        try {
          await client.from('nexus_documents').upsert(sbRow, { onConflict: 'id' });
        } catch(e) { console.warn('Supabase nexus_documents upsert failed:', e); }
      }
      return record;
    },

    // Get all documents
    getAll() { return lsGet(); },

    // Filter helpers
    getByDriver(driverName) {
      return lsGet().filter(d => d.driverName && d.driverName.toLowerCase() === (driverName||'').toLowerCase());
    },
    getByLoad(loadNumber) {
      return lsGet().filter(d => d.loadNumber && String(d.loadNumber) === String(loadNumber));
    },
    getByCategory(cat) {
      return lsGet().filter(d => d.category && d.category.toLowerCase() === (cat||'').toLowerCase());
    },
    getByPeriod(periodStart) {
      return lsGet().filter(d => d.settlementPeriod === periodStart);
    },
    getByDriverAndPeriod(driverName, periodStart) {
      return lsGet().filter(d =>
        d.driverName && d.driverName.toLowerCase() === (driverName||'').toLowerCase() &&
        d.settlementPeriod === periodStart
      );
    },
    getInbox() {
      return lsGet().filter(d => d.status === 'inbox');
    },
    getRoutedToday() {
      const today = new Date().toISOString().split('T')[0];
      return lsGet().filter(d => d.routedAt && d.routedAt.startsWith(today));
    },

    // Delete
    delete(id) {
      lsSet(lsGet().filter(d => d.id !== id));
    },

    // Summary stats
    stats() {
      const all = lsGet();
      const drivers = [...new Set(all.map(d=>d.driverName).filter(Boolean))];
      const cats    = [...new Set(all.map(d=>d.category).filter(Boolean))];
      return {
        total:    all.length,
        inbox:    all.filter(d=>d.status==='inbox').length,
        routed:   all.filter(d=>d.status==='routed').length,
        drivers:  drivers.length,
        categories: cats.length,
      };
    },

    // Used by driver profile pages
    getDriverSummary(driverName) {
      const docs = this.getByDriver(driverName);
      const byCat = {};
      docs.forEach(d => {
        if (!byCat[d.category]) byCat[d.category] = [];
        byCat[d.category].push(d);
      });
      return { docs, byCat, count: docs.length };
    },

    // Get expenses total for a driver + settlement period
    getDriverExpensesForPeriod(driverName, periodStart) {
      return this.getByDriverAndPeriod(driverName, periodStart)
        .filter(d => d.category === 'Expenses');
    },
  };

  global.NexusDocs = Docs;
})(window);
