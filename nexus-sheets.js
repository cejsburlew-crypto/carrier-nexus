/**
 * nexus-sheets.js — Google Sheets data layer for Carrier Nexus.
 *
 * Architecture:
 *  - Each company has one Google Sheet (auto-created on first sync).
 *  - Tabs: Users | Loads | Settlements | Assignments | Permits | Contacts | Notes
 *  - "Push to Sheets" writes all localStorage data → Sheet.
 *  - "Pull from Sheets" reads Sheet data → localStorage (overwrites).
 *  - Falls back gracefully when Drive/Sheets token is not available.
 *
 * Requires: nexus-config.js loaded first (NEXUS_ACTIVE_COMPANY, NEXUS_GOOGLE_CLIENT_ID)
 */

window.NexusSheets = (function() {

  var SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

  // ─── Tab definitions ────────────────────────────────────────────────────────
  var TABS = {
    users:       { key: 'nexus_users',                    label: 'Users',       headers: ['id','email','name','role','active','createdAt','passwordHash'] },
    loads:       { key: 'nexus_loads',                    label: 'Loads',       headers: ['id','loadNumber','status','driver','dispatcher','broker','origin','destination','pickupDate','deliveryDate','rate','miles','notes'] },
    settlements: { key: 'nexus_settlements',              label: 'Settlements', headers: ['id','driver','short','role','start','end','loads','totalAdds','netPay','status','weekEnding'] },
    assignments: { key: 'nexus_dispatcher_assignments',   label: 'Assignments', headers: ['id','dispatcherEmail','driverEmail','assignedAt'] },
    permits:     { key: 'nexus_permits',                  label: 'Permits',     headers: ['id','driver','type','state','issueDate','expDate','permitNo','status'] },
    contacts:    { key: 'nexus_contacts',                 label: 'Contacts',    headers: ['id','name','company','role','email','phone','notes'] },
    notes:       { key: 'nexus_notes',                    label: 'Notes',       headers: ['id','subject','body','author','createdAt','linkedTo'] }
  };

  // ─── Token helper ────────────────────────────────────────────────────────────
  function getToken() {
    try {
      var t = localStorage.getItem('nexus_drive_token') || localStorage.getItem('nexus_google_token');
      return t ? JSON.parse(t).access_token || t : null;
    } catch(e) { return null; }
  }

  // ─── Sheets API helpers ──────────────────────────────────────────────────────
  async function sheetsGet(sheetId, range) {
    var token = getToken();
    if (!token) throw new Error('No Google token — connect Drive first');
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(range), {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!r.ok) throw new Error('Sheets read failed: ' + r.status);
    return r.json();
  }

  async function sheetsBatchUpdate(sheetId, requests) {
    var token = getToken();
    if (!token) throw new Error('No Google token');
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + ':batchUpdate', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: requests })
    });
    if (!r.ok) throw new Error('Sheets batchUpdate failed: ' + r.status);
    return r.json();
  }

  async function sheetsValuesClear(sheetId, range) {
    var token = getToken();
    if (!token) throw new Error('No Google token');
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(range) + ':clear', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }
    });
    if (!r.ok) throw new Error('Sheets clear failed: ' + r.status);
    return r.json();
  }

  async function sheetsValuesUpdate(sheetId, range, values) {
    var token = getToken();
    if (!token) throw new Error('No Google token');
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(range) + '?valueInputOption=USER_ENTERED', {
      method: 'PUT',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: values })
    });
    if (!r.ok) throw new Error('Sheets update failed: ' + r.status);
    return r.json();
  }

  // ─── Create a new spreadsheet ────────────────────────────────────────────────
  async function createSpreadsheet(title) {
    var token = getToken();
    if (!token) throw new Error('No Google token');
    var sheets = Object.values(TABS).map(function(t) {
      return { properties: { title: t.label } };
    });
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ properties: { title: title }, sheets: sheets })
    });
    if (!r.ok) throw new Error('Create spreadsheet failed: ' + r.status);
    var data = await r.json();
    return data.spreadsheetId;
  }

  // ─── Get or create sheet for active company ──────────────────────────────────
  async function getOrCreateSheetId() {
    var co = window.NEXUS_ACTIVE_COMPANY ? window.NEXUS_ACTIVE_COMPANY() : { id: 'default', name: 'Carrier Nexus' };
    var storageKey = 'nexus_sheets_id_' + co.id;
    var sheetId = localStorage.getItem(storageKey);
    if (sheetId) return sheetId;

    // Also check company config
    var companies = window.NEXUS_COMPANIES || [];
    var idx = companies.findIndex(function(c){ return c.id === co.id; });
    if (idx >= 0 && companies[idx].sheetsId) {
      sheetId = companies[idx].sheetsId;
      localStorage.setItem(storageKey, sheetId);
      return sheetId;
    }

    // Create new spreadsheet
    sheetId = await createSpreadsheet('Carrier Nexus — ' + co.name);
    localStorage.setItem(storageKey, sheetId);
    // Update config in memory
    if (idx >= 0) companies[idx].sheetsId = sheetId;
    return sheetId;
  }

  // ─── Convert array of objects to rows ────────────────────────────────────────
  function objectsToRows(objects, headers) {
    var rows = [headers];
    objects.forEach(function(obj) {
      rows.push(headers.map(function(h) {
        var v = obj[h];
        if (v === null || v === undefined) return '';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
      }));
    });
    return rows;
  }

  // ─── Convert rows to array of objects ────────────────────────────────────────
  function rowsToObjects(rows) {
    if (!rows || rows.length < 2) return [];
    var headers = rows[0];
    return rows.slice(1).map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) {
        obj[h] = row[i] !== undefined ? row[i] : '';
      });
      return obj;
    });
  }

  // ─── PUBLIC: Push localStorage → Google Sheets ──────────────────────────────
  async function pushToSheets(onProgress) {
    var sheetId = await getOrCreateSheetId();
    var tabNames = Object.keys(TABS);
    var results = [];

    for (var i = 0; i < tabNames.length; i++) {
      var tabKey = tabNames[i];
      var tab = TABS[tabKey];
      if (onProgress) onProgress(tab.label, i + 1, tabNames.length);

      try {
        var raw = localStorage.getItem(tab.key);
        var data = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(data)) data = [];

        var rows = objectsToRows(data, tab.headers);
        await sheetsValuesClear(sheetId, tab.label + '!A:Z');
        await sheetsValuesUpdate(sheetId, tab.label + '!A1', rows);
        results.push({ tab: tab.label, rows: data.length, ok: true });
      } catch(e) {
        results.push({ tab: tab.label, ok: false, error: e.message });
      }
    }

    // Save sheet URL + last sync time
    localStorage.setItem('nexus_sheets_last_push', new Date().toISOString());
    localStorage.setItem('nexus_sheets_url', 'https://docs.google.com/spreadsheets/d/' + sheetId);
    return { sheetId: sheetId, url: 'https://docs.google.com/spreadsheets/d/' + sheetId, results: results };
  }

  // ─── PUBLIC: Pull Google Sheets → localStorage ───────────────────────────────
  async function pullFromSheets(onProgress) {
    var sheetId = await getOrCreateSheetId();
    var tabNames = Object.keys(TABS);
    var results = [];

    for (var i = 0; i < tabNames.length; i++) {
      var tabKey = tabNames[i];
      var tab = TABS[tabKey];
      if (onProgress) onProgress(tab.label, i + 1, tabNames.length);

      try {
        var data = await sheetsGet(sheetId, tab.label + '!A:Z');
        var rows = data.values || [];
        var objects = rowsToObjects(rows);
        localStorage.setItem(tab.key, JSON.stringify(objects));
        results.push({ tab: tab.label, rows: objects.length, ok: true });
      } catch(e) {
        results.push({ tab: tab.label, ok: false, error: e.message });
      }
    }

    localStorage.setItem('nexus_sheets_last_pull', new Date().toISOString());
    return { results: results };
  }

  // ─── PUBLIC: Get sheet URL for active company ─────────────────────────────────
  function getSheetUrl() {
    return localStorage.getItem('nexus_sheets_url') || null;
  }

  function getLastSync() {
    return {
      push: localStorage.getItem('nexus_sheets_last_push'),
      pull: localStorage.getItem('nexus_sheets_last_pull')
    };
  }

  // ─── PUBLIC: Write a single record to a specific tab ─────────────────────────
  async function appendRow(tabKey, record) {
    var tab = TABS[tabKey];
    if (!tab) throw new Error('Unknown tab: ' + tabKey);
    var sheetId = await getOrCreateSheetId();
    var token = getToken();
    if (!token) throw new Error('No Google token');
    var row = tab.headers.map(function(h) { return record[h] !== undefined ? String(record[h]) : ''; });
    var r = await fetch('https://sheets.googleapis.com/v4/spreadsheets/' + sheetId + '/values/' + encodeURIComponent(tab.label + '!A:A') + ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] })
    });
    if (!r.ok) throw new Error('Append failed: ' + r.status);
    return r.json();
  }

  return {
    pushToSheets: pushToSheets,
    pullFromSheets: pullFromSheets,
    getSheetUrl: getSheetUrl,
    getLastSync: getLastSync,
    appendRow: appendRow,
    getOrCreateSheetId: getOrCreateSheetId,
    TABS: TABS
  };
})();
