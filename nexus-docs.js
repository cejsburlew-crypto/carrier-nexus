// ============================================================
// CARRIER NEXUS — RECORDS DATA LAYER  (nexus-docs.js)
// One table covers everything: rate cons, permits, expenses.
// record_type determines which fields are populated.
// Works with localStorage always + Supabase if configured.
// Table name: nexus_records
// ============================================================
(function(global) {
  'use strict';

  const LS_KEY = 'nexus_records';

  // ── SUPABASE ─────────────────────────────────────────────
  function sb() {
    if (!global.NEXUS_SUPABASE_URL || !global.NEXUS_SUPABASE_KEY) return null;
    if (!global._nexus_sb) {
      global._nexus_sb = supabase.createClient(
        global.NEXUS_SUPABASE_URL, global.NEXUS_SUPABASE_KEY
      );
    }
    return global._nexus_sb;
  }

  // ── STORAGE ───────────────────────────────────────────────
  function lsGet()  { try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch(e) { return []; } }
  function lsSet(d) { localStorage.setItem(LS_KEY, JSON.stringify(d)); }

  // ── SETTLEMENT PERIOD ────────────────────────────────────
  function calcPeriod(dateStr, type) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d)) return null;
    const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    if (type === 'weekly') {
      const s = new Date(d); s.setDate(day - d.getDay());
      return s.toISOString().split('T')[0];
    }
    if (type === 'biweekly') {
      const jan1 = new Date(y,0,1);
      const doy  = Math.floor((d - jan1) / 86400000);
      const pn   = Math.floor(doy / 14);
      const s    = new Date(jan1); s.setDate(1 + pn * 14);
      return s.toISOString().split('T')[0];
    }
    if (type === 'semimonthly') {
      return `${y}-${String(m+1).padStart(2,'0')}-${day <= 15 ? '01' : '16'}`;
    }
    return `${y}-${String(m+1).padStart(2,'0')}-01`;
  }

  // ── CORE SAVE ────────────────────────────────────────────
  const NexusDocs = {

    async save(doc) {
      const now      = new Date().toISOString();
      const period   = calcPeriod(doc.recordDate || doc.docDate, localStorage.getItem('nexus_settlement_period') || 'biweekly');

      const record = {
        // ── Identity ──────────────────────────────────────
        id:                   doc.id || ('rec_' + Date.now() + '_' + Math.random().toString(36).slice(2,6)),
        recordType:           doc.recordType           || 'expense',   // rate_con | permit | expense | personal | health | vehicle | other

        // ── Dates ─────────────────────────────────────────
        recordDate:           doc.recordDate           || doc.docDate || null,
        settlementPeriod:     period,
        settlementPeriodType: localStorage.getItem('nexus_settlement_period') || 'biweekly',

        // ── Our Team ──────────────────────────────────────
        ourDriver:            doc.ourDriver            || doc.driverName || null,
        ourDriverId:          doc.ourDriverId          || doc.driverId   || null,
        ourDispatcher:        doc.ourDispatcher        || null,
        truckUnit:            doc.truckUnit            || null,
        trailerType:          doc.trailerType          || null,          // flatbed | step deck | RGN | lowboy | van | reefer

        // ── Rate Con / Load ───────────────────────────────
        rateConNumber:        doc.rateConNumber        || doc.loadNumber || null,
        bolNumber:            doc.bolNumber            || null,
        customerCompany:      doc.customerCompany      || null,
        customerDispatchName: doc.customerDispatchName || null,
        customerDispatchPhone:doc.customerDispatchPhone|| null,
        customerDispatchEmail:doc.customerDispatchEmail|| null,
        loadDescription:      doc.loadDescription      || null,
        loadWeight:           doc.loadWeight           || null,          // lbs or tons
        loadHeight:           doc.loadHeight           || null,          // ft/in
        loadWidth:            doc.loadWidth            || null,          // ft/in
        originAddress:        doc.originAddress        || null,
        destinationAddress:   doc.destinationAddress   || null,
        totalMiles:           doc.totalMiles           || null,
        agreedRate:           doc.agreedRate           || null,         // $ gross rate
        fuelAdvance:          doc.fuelAdvance          || null,
        detentionAmount:      doc.detentionAmount      || null,
        lumperFees:           doc.lumperFees           || null,

        // ── Permit Fields ─────────────────────────────────
        permitState:          doc.permitState          || null,
        permitNumber:         doc.permitNumber         || null,
        permitAmount:         doc.permitAmount         || null,

        // ── Expense Fields ────────────────────────────────
        expenseType:          doc.expenseType          || null,         // fuel | toll | repair | food | hotel | scale | other
        expenseAmount:        doc.expenseAmount        || null,
        expenseVendor:        doc.expenseVendor        || null,

        // ── Financial / Billing ───────────────────────────
        invoiceNumber:        doc.invoiceNumber        || null,
        invoiceAmount:        doc.invoiceAmount        || null,
        invoiceStatus:        doc.invoiceStatus        || null,         // unbilled | billed | paid | factored
        paymentReceivedDate:  doc.paymentReceivedDate  || null,
        factoringRef:         doc.factoringRef         || null,
        driverPayAmount:      doc.driverPayAmount      || null,
        dispatcherCommission: doc.dispatcherCommission || null,

        // ── Delivery / POD ────────────────────────────────
        podReceived:          doc.podReceived          || false,
        podDate:              doc.podDate              || null,

        // ── Drive Document ────────────────────────────────
        driveFileId:          doc.driveFileId          || null,
        driveFolderId:        doc.driveFolderId        || null,
        driveUrl:             doc.driveUrl             || null,
        fileName:             doc.fileName             || null,
        fileType:             doc.fileType             || null,
        fileSizeBytes:        doc.fileSizeBytes        || null,
        extractedText:        doc.extractedText        || null,

        // ── Workflow ──────────────────────────────────────
        status:               doc.status               || 'active',     // inbox | active | reviewed | archived
        notes:                doc.notes                || null,
        createdAt:            doc.createdAt            || now,
        updatedAt:            now,
        createdBy:            doc.createdBy            || 'admin',
      };

      // localStorage
      const all = lsGet();
      const idx = all.findIndex(r => r.id === record.id);
      if (idx > -1) { all[idx] = { ...all[idx], ...record }; }
      else           { all.unshift(record); }
      lsSet(all);

      // Supabase
      const client = sb();
      if (client) {
        try {
          await client.from('nexus_records').upsert({
            id:                     record.id,
            record_type:            record.recordType,
            record_date:            record.recordDate,
            settlement_period:      record.settlementPeriod,
            settlement_period_type: record.settlementPeriodType,
            our_driver:             record.ourDriver,
            our_driver_id:          record.ourDriverId,
            our_dispatcher:         record.ourDispatcher,
            truck_unit:             record.truckUnit,
            trailer_type:           record.trailerType,
            rate_con_number:        record.rateConNumber,
            bol_number:             record.bolNumber,
            customer_company:       record.customerCompany,
            customer_dispatch_name: record.customerDispatchName,
            customer_dispatch_phone:record.customerDispatchPhone,
            customer_dispatch_email:record.customerDispatchEmail,
            load_description:       record.loadDescription,
            load_weight:            record.loadWeight,
            load_height:            record.loadHeight,
            load_width:             record.loadWidth,
            origin_address:         record.originAddress,
            destination_address:    record.destinationAddress,
            total_miles:            record.totalMiles,
            agreed_rate:            record.agreedRate,
            fuel_advance:           record.fuelAdvance,
            detention_amount:       record.detentionAmount,
            lumper_fees:            record.lumperFees,
            permit_state:           record.permitState,
            permit_number:          record.permitNumber,
            permit_amount:          record.permitAmount,
            expense_type:           record.expenseType,
            expense_amount:         record.expenseAmount,
            expense_vendor:         record.expenseVendor,
            invoice_number:         record.invoiceNumber,
            invoice_amount:         record.invoiceAmount,
            invoice_status:         record.invoiceStatus,
            payment_received_date:  record.paymentReceivedDate,
            factoring_ref:          record.factoringRef,
            driver_pay_amount:      record.driverPayAmount,
            dispatcher_commission:  record.dispatcherCommission,
            pod_received:           record.podReceived,
            pod_date:               record.podDate,
            drive_file_id:          record.driveFileId,
            drive_folder_id:        record.driveFolderId,
            drive_url:              record.driveUrl,
            file_name:              record.fileName,
            file_type:              record.fileType,
            file_size_bytes:        record.fileSizeBytes,
            extracted_text:         record.extractedText,
            status:                 record.status,
            notes:                  record.notes,
            created_at:             record.createdAt,
            updated_at:             record.updatedAt,
            created_by:             record.createdBy,
          }, { onConflict: 'id' });
        } catch(e) { console.warn('Supabase nexus_records upsert:', e); }
      }
      return record;
    },

    // ── READ ─────────────────────────────────────────────
    getAll()                { return lsGet(); },
    getById(id)             { return lsGet().find(r => r.id === id); },
    getByDriver(name)       { return lsGet().filter(r => r.ourDriver && r.ourDriver.toLowerCase() === (name||'').toLowerCase()); },
    getByLoad(rc)           { return lsGet().filter(r => r.rateConNumber && String(r.rateConNumber) === String(rc)); },
    getByType(type)         { return lsGet().filter(r => r.recordType === type); },
    getByPeriod(p)          { return lsGet().filter(r => r.settlementPeriod === p); },
    getByDriverAndPeriod(name, p) {
      return lsGet().filter(r =>
        r.ourDriver && r.ourDriver.toLowerCase() === (name||'').toLowerCase() &&
        r.settlementPeriod === p
      );
    },
    getInbox()              { return lsGet().filter(r => r.status === 'inbox'); },

    // Driver settlement summary for a period
    driverPeriodSummary(driverName, periodStart) {
      const recs      = this.getByDriverAndPeriod(driverName, periodStart);
      const rateCons  = recs.filter(r => r.recordType === 'rate_con');
      const permits   = recs.filter(r => r.recordType === 'permit');
      const expenses  = recs.filter(r => r.recordType === 'expense');
      const grossRevenue    = rateCons.reduce((s,r) => s + (parseFloat(r.agreedRate)||0), 0);
      const totalPermits    = permits.reduce((s,r)  => s + (parseFloat(r.permitAmount)||0), 0);
      const totalExpenses   = expenses.reduce((s,r) => s + (parseFloat(r.expenseAmount)||0), 0);
      const totalDeductions = totalPermits + totalExpenses
        + rateCons.reduce((s,r) => s + (parseFloat(r.fuelAdvance)||0) + (parseFloat(r.lumperFees)||0), 0);
      return {
        recs, rateCons, permits, expenses,
        grossRevenue, totalPermits, totalExpenses, totalDeductions,
        netPay: grossRevenue - totalDeductions,
      };
    },

    delete(id) { lsSet(lsGet().filter(r => r.id !== id)); },

    stats() {
      const all     = lsGet();
      const drivers = [...new Set(all.map(r => r.ourDriver).filter(Boolean))];
      return {
        total:    all.length,
        rateCons: all.filter(r => r.recordType === 'rate_con').length,
        permits:  all.filter(r => r.recordType === 'permit').length,
        expenses: all.filter(r => r.recordType === 'expense').length,
        inbox:    all.filter(r => r.status === 'inbox').length,
        drivers:  drivers.length,
      };
    },
  };

  // Expose globally
  global.NexusDocs    = NexusDocs;   // primary name
  global.NexusRecords = NexusDocs;   // alias
})(window);
