/**
 * nexus-sidebar.js — Carrier Nexus canonical sidebar.
 * v4: 14 logical sections, full nav coverage, all pages wired.
 *     Collapsible sections, Collapse All / Expand All, state persisted in localStorage,
 *     active section always auto-expanded. nexus-core.js + nexus-search.js injection.
 */

// ═══════════════════════════════════════════════════════════════════
// COMPANY-SCOPED STORAGE PROXY
// Automatically prefixes all nexus_ data keys with the active
// company ID so each company sees its own clean data.
// Requires ZERO changes to any page — transparent to all callers.
// ═══════════════════════════════════════════════════════════════════
(function installNexusStorageProxy() {
  if (Storage.prototype._nexusProxied) return; // only install once

  // Keys that are GLOBAL — shared across all companies
  var GLOBAL_KEYS = {
    'nexus_active_company': 1,
    'nexus_session': 1,
    'nexus_theme': 1,
    'nexus_sidebar_sections': 1,
    'nexus_companies': 1,
    'nexus_onboarding_complete': 1,
    'nexus_fmcsa_webkey': 1,
    'nexus_search_history': 1,
    'nexus_route_prefill': 1,
    'NEXUS_LOCAL_USERS': 1,
    'nexus_eld_config': 1,
    'nexus_driver_hire_status': 1,
    'nexus_hazard_reports': 1,
    'nexus_feedback': 1,
  };

  function needsPrefix(key) {
    if (typeof key !== 'string') return false;
    if (GLOBAL_KEYS[key]) return false;
    return key.startsWith('nexus_') || key.startsWith('nexus-');
  }

  var _get = Storage.prototype.getItem;
  var _set = Storage.prototype.setItem;
  var _del = Storage.prototype.removeItem;

  Storage.prototype._nexusProxied = true;
  Storage.prototype._rawGet = _get; // expose for internal use
  Storage.prototype._rawSet = _set; // expose for internal use
  Storage.prototype._rawRemove = _del; // expose for internal use

  Storage.prototype.getItem = function(key) {
    if (!needsPrefix(key)) return _get.call(this, key);
    var cid = _get.call(this, 'nexus_active_company') || 'co_001';
    var scopedVal = _get.call(this, cid + ':' + key);
    // Graceful fallback for co_001: if no scoped key yet, return the
    // legacy unscoped value so existing Carrier Trucking data still appears.
    // After migration, unscoped keys are deleted, so legacy will be null — return null.
    // Guard against __migrated__ sentinel for defense in depth.
    if (scopedVal === null && cid === 'co_001') {
      var legacy = _get.call(this, key);
      return (legacy === null || legacy === '__migrated__') ? null : legacy;
    }
    return scopedVal;
  };

  Storage.prototype.setItem = function(key, value) {
    if (!needsPrefix(key)) { _set.call(this, key, value); return; }
    var cid = _get.call(this, 'nexus_active_company') || 'co_001';
    _set.call(this, cid + ':' + key, value);
  };

  Storage.prototype.removeItem = function(key) {
    if (!needsPrefix(key)) { _del.call(this, key); return; }
    var cid = _get.call(this, 'nexus_active_company') || 'co_001';
    _del.call(this, cid + ':' + key);
  };
})();

(function migrateUnscoped() {
  var _rawGet = Storage.prototype._rawGet;
  var _rawSet = Storage.prototype._rawSet;
  var _rawRemove = Storage.prototype._rawRemove;
  if (!_rawGet || !_rawSet || !_rawRemove) return;
  if (_rawGet.call(localStorage, 'nexus_migration_v2_done')) return;
  var keysToMigrate = [];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (!k) continue;
    if ((k.startsWith('nexus_') || k.startsWith('nexus-')) &&
        !k.match(/^co_\d{3}:/)) {
      keysToMigrate.push(k);
    }
  }
  keysToMigrate.forEach(function(k) {
    var val = _rawGet.call(localStorage, k);
    if (val === null) return;
    var scoped = 'co_001:' + k;
    if (_rawGet.call(localStorage, scoped) === null) {
      _rawSet.call(localStorage, scoped, val);
    }
    _rawRemove.call(localStorage, k);
  });
  _rawSet.call(localStorage, 'nexus_migration_v2_done', '1');
})();

// ── Session company restore: re-confirm nexus_active_company from session on every page load ──
(function() {
  var _raw = Storage.prototype._rawGet ? function(k){ return Storage.prototype._rawGet.call(localStorage,k); } : function(k){ return localStorage.getItem(k); };
  var _rawSet = Storage.prototype._rawSet ? function(k,v){ Storage.prototype._rawSet.call(localStorage,k,v); } : function(k,v){ localStorage.setItem(k,v); };
  var _sess = JSON.parse(_raw('nexus_session') || 'null');
  if (_sess && _sess.company) {
    _rawSet('nexus_active_company', _sess.company);
  }
})();

(function() {
  const page = location.pathname.split('/').pop() || 'index.html';

  /* ── Theme: apply BEFORE layout to prevent flash ── */
  (function(){
    var t = localStorage.getItem('nexus_theme') || 'light';
    document.documentElement.setAttribute('data-nexus-theme', t);
  })();
  // === NEXUS THEME: CSS Variables (light mode defaults) ===
  (function injectNexusCSSVars(){
    if (document.getElementById('nexus-css-vars')) return;
    var style = document.createElement('style');
    style.id = 'nexus-css-vars';
    style.textContent = [
      ':root {',
      '  --bg: #f0f2f5;',
      '  --panel: #ffffff;',
      '  --panel2: #f8f9fa;',
      '  --border: #d0d7de;',
      '  --text: #111827;',
      '  --mid: #4b5563;',
      '  --blue: #1d4ed8;',
      '  --green: #15803d;',
      '  --yellow: #a16207;',
      '  --red: #dc2626;',
      '  --orange: #c2410c;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  })();

  // ── Inject nexus-core.js and nexus-search.js if not already present ──
  ['nexus-core.js', 'nexus-search.js'].forEach(function(src) {
    if (!document.querySelector('script[src^="' + src + '"]')) {
      var s = document.createElement('script');
      s.src = src + '?v=6';
      document.head.appendChild(s);
    }
  });

  function active(href) {
    return (href === page || (href.includes('?') && page === href.split('?')[0])) ? ' active' : '';
  }

  // ── Collapse state ──
  var COLLAPSE_KEY = 'nexus_sidebar_sections';
  function getCollapseState() {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_KEY) || '{}'); } catch(e) { return {}; }
  }
  function setCollapseState(s) {
    localStorage.setItem(COLLAPSE_KEY, JSON.stringify(s));
  }

  // Section definitions — key, label, pages in section (for auto-expand)
  // Note: pages may appear in multiple sections; auto-expand picks FIRST match.
  var SECTIONS = [
    { key:'ops',        label:'Operations',         pages:['fleet-command.html','active-loads.html','load-board.html','dispatch-board.html','settlements.html','weekly-settlements.html','settlement-review.html','drivers.html','permits.html','work-orders.html','load-tracking.html','pods.html','issues.html'] },
    { key:'dispatch',   label:'Dispatch',            pages:['dispatch-pro.html','dispatcher-hub.html','commissions.html','pilot-escorts.html','available-dispatchers.html','available-drivers.html'] },
    { key:'driver',     label:'Driver Portal',       pages:['driver-command.html','driver-availability.html','driver-intake.html','driver-profile.html','my-pay.html','equipment-marketplace.html','social-recruiting.html'] },
    { key:'finance',    label:'Finance',             pages:['invoicing.html','expenses.html','financials.html','factoring.html','fuel-cards.html','ifta.html','whatsapp-import.html','analysis.html'] },
    { key:'compliance', label:'Compliance',          pages:['cfr-compliance.html','fmcsa-compliance.html','fmcsa-resources.html','dot-view.html','drug-alcohol.html','accident-register.html','boc3.html','expiration-hub.html','incident-report.html','coaching-log.html','alerts.html','sos-compliance.html','entity-compliance.html'] },
    { key:'insurance',  label:'Insurance',           pages:['insurance-kpi.html','insurance-planner.html','coi-management.html','claims.html'] },
    { key:'fleet',      label:'Fleet & Equipment',   pages:['equipment.html','equipment-weights.html','maintenance.html','pm-schedule.html','tires.html','fuel.html','dvir.html','pretrip.html','scale-tickets.html','weight-calculator.html','dot-compliance.html'] },
    { key:'routewx',    label:'Route Intelligence',  pages:['route-compliance.html','gps-tracker.html','pilot-escorts.html','driver-services.html'] },
    { key:'docs',       label:'Documents',           pages:['documents.html','upload.html','inbox-sync.html','doc-inbox.html','emails.html','doc-privacy.html'] },
    { key:'taxhr',      label:'Tax & HR',            pages:['tax-forms.html','w9.html','member-management.html'] },
    { key:'contacts',   label:'Contacts',            pages:['contacts.html'] },
    { key:'intel',      label:'Intelligence',        pages:['nexus-ai.html','search.html','eld-settings.html','drive-settings.html'] },
    { key:'comms',      label:'Communications',      pages:['comms.html','nexus-connect.html'] },
    { key:'admin',      label:'Admin',               pages:['admin-users.html','company-management.html','admin-integrations.html','public-profile.html','onboarding.html','data-import.html'] },
  ];

  // Determine which section the current page lives in (first match wins)
  var activeSection = '';
  SECTIONS.forEach(function(s) {
    if (!activeSection && s.pages.indexOf(page) > -1) activeSection = s.key;
  });

  // Build collapse state — auto-expand active section
  var colState = getCollapseState();
  if (activeSection) colState[activeSection] = false;

  function isSectionCollapsed(key) {
    if (key === activeSection) return false; // never collapse active
    return colState[key] === true;
  }

  // ── Company selector ──
  var companies = window.NEXUS_COMPANIES || [];
  var activeCompany = (window.NEXUS_ACTIVE_COMPANY && window.NEXUS_ACTIVE_COMPANY()) || companies[0] || { name: 'Carrier Trucking US, LLC', id: 'carrier-trucking-us', color: '#e91e8c' };
  var companyColor = activeCompany.color || '#e91e8c';

  var companyOptions = companies.map(function(c) {
    var isActive = c.id === activeCompany.id;
    return '<button onclick="window.NEXUS_SET_COMPANY(\'' + c.id + '\')" style="width:100%;text-align:left;background:' + (isActive ? 'rgba(255,255,255,.06)' : 'transparent') + ';border:none;color:' + (isActive ? '#fff' : '#9ca3af') + ';padding:8px 14px;font-size:12px;font-family:\'Barlow\',sans-serif;cursor:pointer;display:flex;align-items:center;gap:8px;border-radius:4px;">' +
      '<span style="width:7px;height:7px;border-radius:50%;background:' + c.color + ';flex-shrink:0;"></span>' +
      c.name + (isActive ? ' <span style="margin-left:auto;font-size:10px;color:#6b7280;">active</span>' : '') +
      '</button>';
  }).join('');

  // Single unified company row — always clickable to open switcher
  var companySelectorHtml = '<div id="nexus-co-selector" onclick="openCompanySwitcher()" ' +
    'style="padding:10px 16px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;cursor:pointer;transition:background .15s;" ' +
    'onmouseover="this.style.background=\'#f5f7ff\'" onmouseout="this.style.background=\'\'">' +
      '<span id="nexus-co-dot" style="width:9px;height:9px;border-radius:50%;background:' + companyColor + ';flex-shrink:0;display:inline-block;"></span>' +
      '<span id="nexus-co-name" style="font-family:\'Barlow Condensed\',sans-serif;font-size:14px;font-weight:700;color:#111827;letter-spacing:.02em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + activeCompany.name + '</span>' +
      (companies.length > 1 ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' : '') +
    '</div>';

  // ── Build section HTML ──
  function chevron(key) {
    var rot = isSectionCollapsed(key) ? '0deg' : '90deg';
    return '<svg class="sb-chevron" data-sec="' + key + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;flex-shrink:0;transition:transform .2s;transform:rotate(' + rot + ');opacity:.45;"><polyline points="6 4 10 8 6 12"/></svg>';
  }

  function sectionLabel(key, label) {
    return '<button class="sb-sec-btn" data-sec="' + key + '" ' +
      'style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 16px 4px;background:none;border:none;cursor:pointer;text-align:left;">' +
      '<span style="font-family:\'Barlow\',\'Barlow Condensed\',sans-serif;font-size:13px;font-weight:800;color:#111827;letter-spacing:0.1px;">' + label + '</span>' +
      chevron(key) +
      '</button>';
  }

  function sectionLinks(key, linksHtml) {
    var hidden = isSectionCollapsed(key);
    return '<div class="sb-sec-links" data-sec="' + key + '" style="overflow:hidden;max-height:' + (hidden ? '0' : '800px') + ';transition:max-height .22s ease' + (hidden ? '' : '-in-out') + ';">' + linksHtml + '</div>';
  }

  function sec(key, label, linksHtml) {
    return '<div class="sidebar-section" data-sec-wrap="' + key + '">' +
      sectionLabel(key, label) +
      sectionLinks(key, linksHtml) +
      '</div>';
  }

  function lnk(href, svgPath, label) {
    return '<a href="' + href + '" class="sidebar-link' + active(href) + '">' + svgPath + label + '</a>';
  }

  // SVG icon shorthand
  var I = {
    grid:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h7v2H2z"/></svg>',
    loads:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V3zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V9zm4 4h6v2H5z"/></svg>',
    settle:  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm1 3v1h6V4H5zm0 3v1h6V7H5zm0 3v1h4v-1H5z"/></svg>',
    builder: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 5h14v1H1zm2-3h10v2H3zm0 6h2v6H3zm4 0h2v6H7zm4 0h2v6h-2z"/></svg>',
    review:  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zm0 4h8v2H2zm0 4h12v2H2z"/></svg>',
    driver:  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z"/></svg>',
    permit:  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10v14H3zm2 3h6v1H5zm0 3h6v1H5zm0 3h4v1H5z"/></svg>',
    clock:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2v4.5l3.5 2-.5-.87-3-1.63V5h-1z"/></svg>',
    issue:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    board:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2H1zm0 4h14v2H1zm0 4h14v2H1z"/></svg>',
    comm:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 9.5l-3-3 1-1 2 2 3-3 1 1-4 4z"/></svg>',
    team:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    person:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>',
    invoice: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm1 3v1h8V4H4zm0 3v1h8V7H4zm0 3v1h5v-1H4z"/></svg>',
    chat:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    expense: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 4H7v2H5v2h2v2h2V9h2V7H9V5z"/></svg>',
    bar:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 12h2v-4H2zm3 0h2V6H5zm3 0h2V4H8zm3 0h2V2h-2z"/></svg>',
    ifta:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zM4 8h2v1H4V8zm6 0h2v1h-2V8zm-3-3h2v2H7V5zm0 5h2v2H7v-2z"/></svg>',
    vault:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h5l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm5 0v4h4"/></svg>',
    upload:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    sync:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
    email:   '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="11" rx="1" fill="none" stroke="currentColor"/><path d="M1 4l7 5 7-5"/></svg>',
    inbox:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2h14v2H1zm0 4h14v2H1zm0 4h6v4H1zm8 0h6v4H9z"/></svg>',
    contact: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2 13c0-2.761 2.686-5 6-5s6 2.239 6 5H2z"/></svg>',
    tax:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10v14H3zm2 3h6v1H5zm0 3h6v1H5zm0 3h4v1H5z"/></svg>',
    truck:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 4h9v8H1zm9 2h3l2 3v3h-5V6zM3 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/></svg>',
    wrench:  '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 2.5l-1.4 1.4A4 4 0 106.1 9.8L4.7 11.2A6 6 0 1113.5 2.5zm-3 3A2 2 0 108 10a2 2 0 002.5-2.5z"/></svg>',
    cal:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>',
    dot:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.5 4h1v5h-1zm0 6h1v1.5h-1z"/></svg>',
    tire:    '<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>',
    fuel:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h7l3 3v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm1 6h6V6H4zm0 3h4V9H4z"/></svg>',
    dvir:    '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 1h12v14H2zm2 3h8v1H4zm0 3h8v1H4zm0 3h5v1H4z"/></svg>',
    members: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zm-7 6s-1 0-1-1 1-4 8-4 8 3 8 4-1 1-1 1H3zM3 5a2 2 0 110 4 2 2 0 010-4z"/></svg>',
    admin:   '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm5 11c0-2.21-2.24-4-5-4S3 9.79 3 12v1h10v-1z"/></svg>',
    ai:      '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 4H7v5l4.5 2.7-.7-1.2-3.8-2.3V5z"/></svg>',
    file:    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V7L8 2z"/><polyline points="8 2 8 7 13 7"/></svg>',
    eld:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 00-3 3c0 1.3.83 2.4 2 2.82V8H5v2h2v1.18A3 3 0 108 14.93V10h2V8H8V6.82A3.001 3.001 0 008 1zm0 12a1 1 0 110-2 1 1 0 010 2zm0-8a1 1 0 110-2 1 1 0 010 2z"/></svg>',
    map:     '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2l5 2 4-2 5 2v11l-5-2-4 2-5-2V2zm5 2.5v8l4-2V4.5l-4 2z"></path></svg>',
    connect: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    scale:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 9l9-6 9 6"/><path d="M6 16s0 4 6 4 6-4 6-4"/><line x1="3" y1="9" x2="21" y2="9"/></svg>',
    search:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    service: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93A10 10 0 0 1 19.07 19.07"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>',
    market:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l1-6h16l1 6"/><path d="M3 9h18v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9z"/><path d="M9 9v6m6-6v6"/></svg>',
    people:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    signal:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>',
    wallet:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M16 12h.01M2 10h20"/><path d="M14 12a2 2 0 0 1 4 0v2a2 2 0 0 1-4 0v-2z"/></svg>',
    shield:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    gps:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    weight:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l2 7H4L6 3z"/><path d="M4 10v9a2 2 0 002 2h12a2 2 0 002-2v-9"/><path d="M12 3v7"/></svg>',
    rocket:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>',
    doc:     '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V7L8 2z"/><polyline points="8 2 8 7 13 7"/></svg>',
  };

  // ── Nav HTML — 14 sections ──
  var navHtml =

    // 1. OPERATIONS
    sec('ops', 'Operations',
      lnk('fleet-command.html',        I.grid,    'Operations Dashboard') +
      lnk('active-loads.html',         I.loads,   'Active Loads') +
      lnk('load-board.html',           I.board,   'Load Board') +
      lnk('dispatch-board.html',       I.monitor, 'Dispatch Board') +
      lnk('settlements.html',          I.settle,  'Settlements') +
      lnk('weekly-settlements.html',   I.builder, 'Settlement Builder') +
      lnk('settlement-review.html',    I.review,  'Approval Queue') +
      lnk('drivers.html',              I.driver,  'Drivers') +
      lnk('permits.html',              I.permit,  'Permits') +
      lnk('work-orders.html',          I.wrench,  '🔧 Work Orders') +
      lnk('load-tracking.html',        I.loads,   '📦 Load Tracking') +
      lnk('pods.html',                 I.clock,   'Missing PODs') +
      lnk('issues.html',               I.issue,   'Issues')
    ) +

    // 2. DISPATCH
    sec('dispatch', 'Dispatch',
      lnk('dispatch-pro.html',             I.rocket,  '🚀 Dispatch PRO') +
      lnk('dispatcher-hub.html',           I.monitor, 'Dispatcher Hub') +
      lnk('commissions.html',              I.comm,    'Commissions') +
      lnk('pilot-escorts.html',            I.truck,   '🚁 Pilot Escorts') +
      lnk('available-dispatchers.html',    I.team,    'Dispatcher Roster') +
      lnk('available-drivers.html',        I.person,  'Driver Pool')
    ) +

    // 3. DRIVER PORTAL
    sec('driver', 'Driver Portal',
      lnk('driver-command.html',       I.signal,  'Driver Command') +
      lnk('driver-availability.html',  I.signal,  'Availability Network') +
      lnk('driver-intake.html',        I.upload,  'Driver Intake') +
      lnk('driver-profile.html',       I.person,  'My Profile') +
      lnk('my-pay.html',               I.wallet,  'My Pay') +
      lnk('equipment-marketplace.html',I.market,  'Equipment Marketplace') +
      lnk('social-recruiting.html',    I.people,  'Community & Jobs')
    ) +

    // 4. FINANCE
    sec('finance', 'Finance',
      lnk('invoicing.html',            I.invoice, 'Invoicing') +
      lnk('expenses.html',             I.expense, 'Expenses') +
      lnk('financials.html',           I.bar,     'Financials') +
      lnk('factoring.html',            I.invoice, '💳 Factoring') +
      lnk('fuel-cards.html',           I.fuel,    '⛽ Fuel Cards') +
      lnk('ifta.html',                 I.ifta,    'IFTA Reporting') +
      lnk('whatsapp-import.html',      I.chat,    'WhatsApp Import') +
      lnk('analysis.html',             I.bar,     'Analytics')
    ) +

    // 5. COMPLIANCE
    sec('compliance', 'Compliance',
      lnk('cfr-compliance.html',       I.dot,     '📋 49 CFR Compliance') +
      lnk('fmcsa-compliance.html',     I.dot,     '⚖️ FMCSA Compliance') +
      lnk('fmcsa-resources.html',      I.doc,     '🛡️ FMCSA Resources') +
      lnk('dot-view.html',             I.dot,     '🚔 DOT View') +
      lnk('drug-alcohol.html',         I.dot,     '🧪 Drug & Alcohol') +
      lnk('accident-register.html',    I.dot,     '🚨 Accident Register') +
      lnk('boc3.html',                 I.doc,     '📋 BOC-3') +
      lnk('expiration-hub.html',       I.clock,   '⏰ Expiration Hub') +
      lnk('alerts.html',               I.clock,   '🔔 Expiration Alerts') +
      lnk('incident-report.html',      I.dot,     'Incident Reports') +
      lnk('coaching-log.html',         I.dvir,    'Driver Coaching') +
      lnk('sos-compliance.html',         I.doc,     '🏛️ SOS / State Compliance') +
      lnk('entity-compliance.html',      I.doc,     '🏢 Entity Compliance')
    ) +

    // 6. INSURANCE
    sec('insurance', 'Insurance',
      lnk('insurance-kpi.html',        I.shield,  'Insurance KPI') +
      lnk('insurance-planner.html',    I.shield,  '🛡️ Insurance Planner') +
      lnk('coi-management.html',       I.doc,     'COI Registry') +
      lnk('claims.html',               I.doc,     'Claims')
    ) +

    // 7. FLEET & EQUIPMENT
    sec('fleet', 'Fleet & Equipment',
      lnk('equipment.html',            I.truck,   'Fleet & Equipment') +
      lnk('equipment-weights.html',    I.weight,  '🏋️ Equip Weights') +
      lnk('maintenance.html',          I.wrench,  'Maintenance Log') +
      lnk('pm-schedule.html',          I.cal,     'PM Schedule') +
      lnk('tires.html',                I.tire,    'Tires') +
      lnk('fuel.html',                 I.fuel,    'Fuel') +
      lnk('dvir.html',                 I.dvir,    'DVIR History') +
      lnk('pretrip.html',              I.dvir,    'Pre-Trip Inspection') +
      lnk('scale-tickets.html',        I.scale,   'Scale Tickets') +
      lnk('weight-calculator.html',    I.scale,   'Weight Calculator') +
      lnk('dot-compliance.html',       I.dot,     'DOT Compliance')
    ) +

    // 8. ROUTE INTELLIGENCE
    sec('routewx', 'Route Intelligence',
      lnk('route-compliance.html',     I.map,     '⚖️ Route Compliance') +
      lnk('hazard-map.html',           I.map,     '🚨 Live Road Alerts') +
      lnk('gps-tracker.html',          I.gps,     '📡 GPS Tracker') +
      lnk('permits.html',              I.permit,  'Permits') +
      lnk('pilot-escorts.html',        I.truck,   '🚁 Pilot Escorts') +
      lnk('pilot-compliance.html',     I.doc,     '🚗 Pilot Car Compliance') +
      lnk('driver-services.html',      I.service, 'Driver Services')
    ) +

    // 9. DOCUMENTS
    sec('docs', 'Documents',
      lnk('documents.html',            I.vault,   'Document Vault') +
      lnk('upload.html',               I.upload,  'Upload Docs') +
      lnk('inbox-sync.html',           I.sync,    'Email Import') +
      lnk('doc-inbox.html',            I.inbox,   'Review Queue') +
      lnk('emails.html',               I.email,   'Emails') +
      lnk('doc-privacy.html',          I.file,    '🔒 Doc Privacy')
    ) +

    // 10. TAX & HR
    sec('taxhr', 'Tax & HR',
      lnk('tax-forms.html',            I.tax,     '1099-NEC') +
      lnk('w9.html',                   I.tax,     'W-9 Forms') +
      lnk('member-management.html',    I.members, 'Members') +
      lnk('settlements.html',          I.settle,  'Settlements') +
      lnk('weekly-settlements.html',   I.builder, 'Settlement Builder') +
      lnk('settlement-review.html',    I.review,  'Approval Queue')
    ) +

    // 11. CONTACTS
    sec('contacts', 'Contacts',
      lnk('contacts.html',             I.contact, 'Directory') +
      '<a href="contacts.html?tab=broker" class="sidebar-link">' + I.team + 'Brokers</a>'
    ) +

    // 12. INTELLIGENCE
    sec('intel', 'Intelligence',
      lnk('nexus-ai.html',             I.ai,      'AI Assistant') +
      lnk('search.html',               I.search,  'Search Everything') +
      lnk('eld-settings.html',         I.eld,     'ELD Integration') +
      lnk('drive-settings.html',       I.file,    'Integrations')
    ) +

    // 13. COMMUNICATIONS
    sec('comms', 'Communications',
      lnk('comms.html',                I.email,   'Unified Comms') +
      lnk('nexus-connect.html',        I.connect, 'Nexus Connect')
    ) +

    // 14. ADMIN
    sec('admin', 'Admin',
      lnk('admin-users.html',          I.admin,   'User Accounts') +
      lnk('company-management.html',   I.truck,   '🏢 Company Management') +
      lnk('admin-integrations.html',   I.upload,  '🔌 Integrations & API') +
      lnk('public-profile.html?type=company&id=co_001', I.person, '👤 Public Profiles') +
      lnk('onboarding.html',           I.rocket,  '🚀 Setup Wizard') +
      lnk('data-import.html',          I.upload,  '📥 Data Import') +
      lnk('feedback.html',             I.email,   '📝 Send Feedback')
    );

  const html = `
<nav class="sidebar" id="nexus-sidebar">

  <a href="landing.html" class="sidebar-logo">
    <div class="logo-hex">
      <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="sg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#000"/><stop offset="60%" stop-color="#6b0000"/><stop offset="100%" stop-color="#e91e8c"/></linearGradient></defs>
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="url(#sg)" stroke="#e91e8c" stroke-width="1.5"/>
        <polygon points="18,7 27,12.5 27,23.5 18,29 9,23.5 9,12.5" fill="#e91e8c" opacity="0.15"/>
        <text x="18" y="22" text-anchor="middle" font-family="'Barlow Condensed',sans-serif" font-weight="900" font-size="11" fill="#fff">CN</text>
      </svg>
    </div>
    <div class="logo-text"><span class="brand">CARRIER NEXUS</span><span class="sub">OPS INTELLIGENCE</span></div>
  </a>

  ${companySelectorHtml}

  <div class="sidebar-nav" style="flex:1;overflow-y:auto;">

    <div style="padding:8px 12px 4px;">
      <button id="nexus-search-trigger" onclick="if(window.NexusSearchUI)NexusSearchUI.open()" style="width:100%;background:#f3f4f6;border:1px solid #374151;color:#9ca3af;padding:8px 12px;border-radius:8px;text-align:left;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;font-family:'Barlow',sans-serif;transition:background .15s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#1f2937'">
        <span>🔍 Search everything…</span>
        <span style="font-size:11px;background:#374151;padding:2px 6px;border-radius:4px;color:#6b7280;font-family:'JetBrains Mono',monospace;">⌘K</span>
      </button>
    </div>

    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:6px 12px 2px;">
      <button id="sb-collapse-all" title="Collapse all sections" style="background:none;border:none;color:#9ca3af;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.5px;cursor:pointer;padding:3px 6px;border-radius:3px;text-transform:uppercase;" onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#9ca3af'">Collapse all</button>
      <span style="color:#d1d5db;font-size:9px;">|</span>
      <button id="sb-expand-all" title="Expand all sections" style="background:none;border:none;color:#9ca3af;font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.5px;cursor:pointer;padding:3px 6px;border-radius:3px;text-transform:uppercase;" onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#9ca3af'">Expand all</button>
    </div>

    ${navHtml}
  </div>

  <div class="sidebar-footer" style="border-top:1px solid #e5e7eb;padding:10px 16px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;min-width:0;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:#374151;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-user-label">Jim Burlew · ADMIN</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#9ca3af;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-company-footer">${activeCompany.name}</div>
    </div>
    <button id="nexus-theme-btn" onclick="window.NEXUS_TOGGLE_THEME()" title="Toggle dark / light mode" style="background:none;border:none;cursor:pointer;color:#9ca3af;flex-shrink:0;padding:3px;line-height:0;" onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#9ca3af'">
      <svg id="nexus-theme-icon" viewBox="0 0 16 16" fill="currentColor" width="13" height="13"></svg>
    </button>
    <a href="admin-users.html" title="Admin" style="color:#9ca3af;text-decoration:none;flex-shrink:0;" onmouseover="this.style.color='#374151'" onmouseout="this.style.color='#9ca3af'">
      <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm5 11c0-2.21-2.24-4-5-4S3 9.79 3 12v1h10v-1z"/></svg>
    </a>
  </div>
</nav>
<div id="companySwitcherModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;align-items:center;justify-content:center;">
  <div style="background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:24px;width:360px;max-width:95vw;max-height:80vh;overflow-y:auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;color:var(--text);font-size:16px;">Switch Company</h3>
      <button onclick="closeCompanySwitcher()" style="background:none;border:none;color:var(--mid);cursor:pointer;font-size:20px;">×</button>
    </div>
    <div id="companySwitcherList" style="display:flex;flex-direction:column;gap:8px;"></div>
  </div>
</div>`;

  // Replace existing sidebar or prepend to body
  const existing = document.querySelector('nav.sidebar, .sidebar');
  if (existing) {
    existing.outerHTML = html;
  } else {
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // ── Sidebar CSS ──
  if (!document.getElementById('nexus-sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 'nexus-sidebar-styles';
    style.textContent = `
      nav.sidebar{width:220px;min-height:100vh;background:#ffffff!important;border-right:1px solid #d0d7de!important;display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:100;}
      .sidebar-logo{padding:16px!important;display:flex!important;align-items:center!important;gap:10px!important;text-decoration:none!important;border-bottom:1px solid #e5e7eb!important;}
      .sidebar-logo .logo-hex svg{width:36px!important;height:36px!important;display:block!important;}
      .sidebar-logo .logo-text{display:flex!important;flex-direction:column!important;gap:2px!important;}
      .sidebar-logo .brand{font-family:'Barlow Condensed',sans-serif!important;font-weight:800!important;font-size:15px!important;letter-spacing:2px!important;color:#111827!important;display:block!important;}
      .sidebar-logo .sub{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;color:#6b7280!important;letter-spacing:1px!important;display:block!important;}
      .sidebar-section{padding:0!important;}
      .sb-sec-btn{transition:background .15s;}
      .sb-sec-btn:hover{background:#f3f4f6!important;}
      .sb-sec-btn:hover .sb-chevron{opacity:.7!important;}
      .sb-sec-links{overflow:hidden;}
      .sidebar-link{display:flex!important;align-items:center!important;gap:10px!important;padding:8px 16px!important;text-decoration:none!important;color:#374151!important;font-size:13.5px!important;font-weight:500!important;border-left:3px solid transparent!important;transition:all .15s!important;white-space:nowrap!important;}
      .sidebar-link:hover{background:#f0f4ff!important;border-left-color:#4f46e5!important;color:#111827!important;}
      .sidebar-link.active{background:#eef2ff!important;border-left:3px solid #4f46e5!important;color:#4f46e5!important;font-weight:600!important;}
      .sidebar-link svg{width:14px!important;height:14px!important;flex-shrink:0!important;opacity:.7!important;}
      .sidebar-link.active svg{opacity:1!important;}
      #nexus-sidebar .sidebar-nav{overflow-y:auto;scrollbar-width:thin;scrollbar-color:#d1d5db transparent;}
    `;
    document.head.appendChild(style);
  }

  // ── Collapse/Expand logic ──
  function toggleSection(key) {
    if (key === activeSection) return; // never collapse active
    var s = getCollapseState();
    s[key] = !s[key];
    setCollapseState(s);
    applyCollapseState(key, s[key]);
  }

  function applyCollapseState(key, collapsed) {
    var links = document.querySelector('.sb-sec-links[data-sec="' + key + '"]');
    var chev  = document.querySelector('.sb-chevron[data-sec="' + key + '"]');
    if (links) links.style.maxHeight = collapsed ? '0' : '800px';
    if (chev)  chev.style.transform  = collapsed ? 'rotate(0deg)' : 'rotate(90deg)';
  }

  // Wire section label clicks
  setTimeout(function() {
    document.querySelectorAll('.sb-sec-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        toggleSection(btn.getAttribute('data-sec'));
      });
    });

    // Collapse All
    var colBtn = document.getElementById('sb-collapse-all');
    if (colBtn) colBtn.addEventListener('click', function() {
      var s = getCollapseState();
      SECTIONS.forEach(function(sec) {
        if (sec.key !== activeSection) s[sec.key] = true;
      });
      setCollapseState(s);
      SECTIONS.forEach(function(sec) {
        applyCollapseState(sec.key, sec.key !== activeSection);
      });
    });

    // Expand All
    var expBtn = document.getElementById('sb-expand-all');
    if (expBtn) expBtn.addEventListener('click', function() {
      var s = {};
      setCollapseState(s);
      SECTIONS.forEach(function(sec) { applyCollapseState(sec.key, false); });
    });
  }, 0);

  // ── Theme system ──
  if (!document.getElementById('nexus-theme-styles')) {
    var ts = document.createElement('style');
    ts.id = 'nexus-theme-styles';
    ts.textContent = [
      '[data-nexus-theme="dark"] body{background:#0a0a0a!important;color:#c9d1d9!important}',
      '[data-nexus-theme="dark"] .topbar{background:#111827!important;border-bottom:1px solid #21262d!important}',
      '[data-nexus-theme="dark"] .topbar-title,[data-nexus-theme="dark"] .page-title{color:#e6edf3!important}',
      '[data-nexus-theme="dark"] .content{background:transparent!important}',
      '[data-nexus-theme="dark"] .card,[data-nexus-theme="dark"] .panel,[data-nexus-theme="dark"] .section-card,[data-nexus-theme="dark"] .stat-card{background:#111827!important;border-color:#21262d!important;color:#c9d1d9!important}',
      '[data-nexus-theme="dark"] .modal,[data-nexus-theme="dark"] .modal-box{background:#161b22!important;color:#c9d1d9!important}',
      '[data-nexus-theme="dark"] .modal-head,[data-nexus-theme="dark"] .modal-hdr,[data-nexus-theme="dark"] .modal-footer{background:#161b22!important;border-color:#21262d!important;color:#e6edf3!important}',
      '[data-nexus-theme="dark"] .modal-body{background:#161b22!important;color:#c9d1d9!important}',
      '[data-nexus-theme="dark"] .modal-title,[data-nexus-theme="dark"] .modal-hdr-title{color:#e6edf3!important}',
      '[data-nexus-theme="dark"] .form-input,[data-nexus-theme="dark"] .form-select,[data-nexus-theme="dark"] textarea,[data-nexus-theme="dark"] select,[data-nexus-theme="dark"] input:not([type=range]){background:#0d1117!important;color:#c9d1d9!important;border-color:#30363d!important}',
      '[data-nexus-theme="dark"] .form-label,[data-nexus-theme="dark"] label{color:#8b949e!important}',
      '[data-nexus-theme="dark"] table th{background:#161b22!important;color:#8b949e!important;border-color:#21262d!important}',
      '[data-nexus-theme="dark"] table td{color:#c9d1d9!important;border-color:#21262d!important}',
      '[data-nexus-theme="dark"] tr:hover td{background:#1c2331!important}',
      '[data-nexus-theme="dark"] .btn-outline{color:#c9d1d9!important;border-color:#30363d!important;background:transparent!important}',
      '[data-nexus-theme="dark"] .btn-outline:hover{background:rgba(255,255,255,0.06)!important}',
      '[data-nexus-theme="dark"] h1,[data-nexus-theme="dark"] h2,[data-nexus-theme="dark"] h3{color:#e6edf3!important}',
      '[data-nexus-theme="dark"] .badge-gray,[data-nexus-theme="dark"] .badge-neutral{background:#21262d!important;color:#8b949e!important}',
      '[data-nexus-theme="dark"] hr,[data-nexus-theme="dark"] .divider{border-color:#21262d!important}',
      '[data-nexus-theme="dark"] .filter-bar,[data-nexus-theme="dark"] .toolbar,[data-nexus-theme="dark"] .table-toolbar{background:#111827!important;border-color:#21262d!important}',
      '[data-nexus-theme="dark"] .member-card,[data-nexus-theme="dark"] .driver-card{background:#111827!important;border-color:#21262d!important}',
      '[data-nexus-theme="dark"] .load-row,[data-nexus-theme="dark"] .expense-row{background:#0d1117!important}',
      /* ── LIGHT THEME: Comprehensive overrides ── */
      '[data-nexus-theme="light"] body{background:#f0f2f5!important;color:#111827!important}',
      '[data-nexus-theme="light"] .topbar{background:#fff!important;border-bottom:1px solid #d0d7de!important}',
      '[data-nexus-theme="light"] .topbar-title,[data-nexus-theme="light"] .page-title{color:#111827!important}',
      '[data-nexus-theme="light"] .content{background:transparent!important}',
      /* Cards / panels */
      '[data-nexus-theme="light"] .card,[data-nexus-theme="light"] .panel,[data-nexus-theme="light"] .section-card,[data-nexus-theme="light"] .stat-card,[data-nexus-theme="light"] .kpi-card,[data-nexus-theme="light"] .module-card,[data-nexus-theme="light"] .info-card,[data-nexus-theme="light"] .data-card,[data-nexus-theme="light"] .box,[data-nexus-theme="light"] .card-body{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      /* Modals */
      '[data-nexus-theme="light"] .modal,[data-nexus-theme="light"] .modal-box,[data-nexus-theme="light"] .modal-head,[data-nexus-theme="light"] .modal-hdr,[data-nexus-theme="light"] .modal-footer,[data-nexus-theme="light"] .modal-body,[data-nexus-theme="light"] .modal-content,[data-nexus-theme="light"] .modal-inner,[data-nexus-theme="light"] .dialog,[data-nexus-theme="light"] .sheet,[data-nexus-theme="light"] .drawer{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      '[data-nexus-theme="light"] .modal-title,[data-nexus-theme="light"] .modal-hdr-title{color:#111827!important}',
      /* Forms */
      '[data-nexus-theme="light"] input:not([type=range]):not([type=checkbox]):not([type=radio]),[data-nexus-theme="light"] .form-input,[data-nexus-theme="light"] .form-select,[data-nexus-theme="light"] textarea,[data-nexus-theme="light"] select{background:#fff!important;color:#111827!important;border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] input::placeholder,[data-nexus-theme="light"] textarea::placeholder{color:#9ca3af!important}',
      '[data-nexus-theme="light"] .form-label,[data-nexus-theme="light"] label{color:#374151!important}',
      /* Tables */
      '[data-nexus-theme="light"] table{background:#fff!important}',
      '[data-nexus-theme="light"] table th{background:#f8f9fa!important;color:#374151!important;border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] table td{color:#111827!important;border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] tr:hover td{background:#f0f4f8!important}',
      '[data-nexus-theme="light"] thead{background:#f8f9fa!important}',
      /* Typography */
      '[data-nexus-theme="light"] h1,[data-nexus-theme="light"] h2,[data-nexus-theme="light"] h3,[data-nexus-theme="light"] h4,[data-nexus-theme="light"] h5,[data-nexus-theme="light"] h6{color:#111827!important}',
      '[data-nexus-theme="light"] p,[data-nexus-theme="light"] span:not([class*="badge"]):not([class*="status"]):not([class*="tag"]),[data-nexus-theme="light"] li,[data-nexus-theme="light"] td,[data-nexus-theme="light"] th{color:inherit}',
      /* Buttons */
      '[data-nexus-theme="light"] .btn-outline{color:#374151!important;border-color:#d0d7de!important;background:#fff!important}',
      '[data-nexus-theme="light"] .btn-outline:hover{background:#f0f2f5!important}',
      '[data-nexus-theme="light"] .btn-secondary,[data-nexus-theme="light"] .btn-ghost{background:#f0f2f5!important;color:#374151!important;border-color:#d0d7de!important}',
      /* Toolbars & filter bars */
      '[data-nexus-theme="light"] .filter-bar,[data-nexus-theme="light"] .toolbar,[data-nexus-theme="light"] .table-toolbar,[data-nexus-theme="light"] .action-bar,[data-nexus-theme="light"] .top-bar{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      /* Member / driver cards */
      '[data-nexus-theme="light"] .member-card,[data-nexus-theme="light"] .driver-card,[data-nexus-theme="light"] .load-card,[data-nexus-theme="light"] .permit-card,[data-nexus-theme="light"] .doc-card{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      /* Row backgrounds */
      '[data-nexus-theme="light"] .load-row,[data-nexus-theme="light"] .expense-row,[data-nexus-theme="light"] .data-row{background:#fff!important;border-color:#d0d7de!important}',
      /* Tabs */
      '[data-nexus-theme="light"] .tab-btn,[data-nexus-theme="light"] .tab-button,[data-nexus-theme="light"] .nav-tab{background:#f8f9fa!important;color:#4b5563!important;border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] .tab-btn.active,[data-nexus-theme="light"] .tab-btn[aria-selected="true"],[data-nexus-theme="light"] .nav-tab.active{background:#1d4ed8!important;color:#fff!important}',
      /* Sections & compliance blocks */
      '[data-nexus-theme="light"] .compliance-section,[data-nexus-theme="light"] .section-block,[data-nexus-theme="light"] .info-block,[data-nexus-theme="light"] .detail-block{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      /* KPI stats */
      '[data-nexus-theme="light"] .stat-value,[data-nexus-theme="light"] .kpi-value,[data-nexus-theme="light"] .metric-value{color:#111827!important;font-weight:700}',
      '[data-nexus-theme="light"] .stat-label,[data-nexus-theme="light"] .kpi-label,[data-nexus-theme="light"] .metric-label{color:#4b5563!important}',
      /* Dividers */
      '[data-nexus-theme="light"] hr,[data-nexus-theme="light"] .divider{border-color:#d0d7de!important}',
      /* Badges (keep semantic colors but ensure contrast) */
      '[data-nexus-theme="light"] .badge-gray,[data-nexus-theme="light"] .badge-neutral{background:#e5e7eb!important;color:#374151!important}',
      /* Secondary text */
      '[data-nexus-theme="light"] .text-muted,[data-nexus-theme="light"] .text-secondary,[data-nexus-theme="light"] .sub-text,[data-nexus-theme="light"] .help-text{color:#4b5563!important}',
      /* Scrollbar light theme */
      '[data-nexus-theme="light"] ::-webkit-scrollbar-track{background:#f0f2f5}',
      '[data-nexus-theme="light"] ::-webkit-scrollbar-thumb{background:#c9d1d9;border-radius:4px}',
      '[data-nexus-theme="light"] ::-webkit-scrollbar-thumb:hover{background:#9ca3af}',
      /* Search bar override (inside sidebar stays dark; global search bar on pages) */
      '[data-nexus-theme="light"] .search-bar,[data-nexus-theme="light"] .search-input,[data-nexus-theme="light"] .search-wrapper{background:#fff!important;border-color:#d0d7de!important;color:#111827!important}',
      /* Select option */
      '[data-nexus-theme="light"] select option{background:#fff;color:#111827}',
      /* Links */
      '[data-nexus-theme="light"] a:not(.sidebar-link):not(.btn):not([class*="badge"]){color:#1d4ed8}',
      /* Progress bars container */
      '[data-nexus-theme="light"] .progress-bar-bg,[data-nexus-theme="light"] .progress-track{background:#e5e7eb!important}',
      /* Sidebar stays dark regardless of theme — overrides prevent bleed */
      '[data-nexus-theme="light"] #nexus-sidebar{background:#ffffff!important;border-right-color:#e5e7eb!important}',
      '[data-nexus-theme="light"] #nexus-sidebar .sidebar-section .sb-sec-btn{color:#111827!important;font-weight:800!important}',
      '[data-nexus-theme="light"] #nexus-sidebar .sidebar-link{color:#374151!important}',
      '[data-nexus-theme="light"] #nexus-sidebar .sidebar-link:hover{background:#f0f4ff!important;color:#111827!important}',
      '[data-nexus-theme="light"] #nexus-sidebar .sidebar-link.active{background:#eef2ff!important;color:#4f46e5!important;border-left-color:#4f46e5!important;font-weight:600!important}',
      /* Inline style overrides for hardcoded dark hex values */
      '[data-nexus-theme="light"] [style*="background:#0b0f1a"],[data-nexus-theme="light"] [style*="background: #0b0f1a"]{background:#f8f9fa!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#131929"],[data-nexus-theme="light"] [style*="background: #131929"]{background:#fff!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#1a2235"],[data-nexus-theme="light"] [style*="background: #1a2235"]{background:#f8f9fa!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#111827"],[data-nexus-theme="light"] [style*="background: #111827"]{background:#fff!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#0d1117"],[data-nexus-theme="light"] [style*="background: #0d1117"]{background:#fff!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#161b22"],[data-nexus-theme="light"] [style*="background: #161b22"]{background:#fff!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#0a0a0a"],[data-nexus-theme="light"] [style*="background: #0a0a0a"]{background:#f0f2f5!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#1c2331"],[data-nexus-theme="light"] [style*="background: #1c2331"]{background:#f8f9fa!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#0f172a"],[data-nexus-theme="light"] [style*="background: #0f172a"]{background:#fff!important;color:#111827!important}',
      '[data-nexus-theme="light"] [style*="background:#1e293b"],[data-nexus-theme="light"] [style*="background: #1e293b"]:not(#nexus-sidebar):not(#nexus-sidebar *){background:#f0f2f5!important;color:#111827!important}',
      /* Hardcoded light text on dark backgrounds */
      '[data-nexus-theme="light"] [style*="color:#e2e8f0"],[data-nexus-theme="light"] [style*="color: #e2e8f0"]{color:#111827!important}',
      '[data-nexus-theme="light"] [style*="color:#c9d1d9"],[data-nexus-theme="light"] [style*="color: #c9d1d9"]{color:#111827!important}',
      '[data-nexus-theme="light"] [style*="color:#d1d5db"],[data-nexus-theme="light"] [style*="color: #d1d5db"]{color:#374151!important}',
      '[data-nexus-theme="light"] [style*="color:#9ca3af"],[data-nexus-theme="light"] [style*="color: #9ca3af"]{color:#4b5563!important}',
      '[data-nexus-theme="light"] [style*="color:#6b7280"],[data-nexus-theme="light"] [style*="color: #6b7280"]{color:#4b5563!important}',
      '[data-nexus-theme="light"] [style*="color:#64748b"],[data-nexus-theme="light"] [style*="color: #64748b"]{color:#374151!important}',
      '[data-nexus-theme="light"] [style*="color:#94a3b8"],[data-nexus-theme="light"] [style*="color: #94a3b8"]{color:#374151!important}',
      '[data-nexus-theme="light"] [style*="color:rgba(255,255,255"],[data-nexus-theme="light"] [style*="color: rgba(255,255,255"]{color:#111827!important}',
      /* Border color overrides */
      '[data-nexus-theme="light"] [style*="border-color:#21262d"],[data-nexus-theme="light"] [style*="border-color: #21262d"]{border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] [style*="border-color:#30363d"],[data-nexus-theme="light"] [style*="border-color: #30363d"]{border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] [style*="border:1px solid #21262d"]{border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] [style*="border:1px solid rgba(255,255,255,.07)"],[data-nexus-theme="light"] [style*="border-bottom:1px solid rgba(255,255,255"]{border-color:#d0d7de!important}',
      /* Alert boxes — keep semantic color but ensure dark text */
      '[data-nexus-theme="light"] [style*="background:rgba(239,68,68"]{color:#7f1d1d!important}',
      '[data-nexus-theme="light"] [style*="background:rgba(16,185,129"]{color:#064e3b!important}',
      '[data-nexus-theme="light"] [style*="background:rgba(245,158,11"]{color:#78350f!important}',
      '[data-nexus-theme="light"] [style*="background:rgba(59,130,246"]{color:#1e3a8a!important}',
      '[data-nexus-theme="light"] [style*="background:rgba(234,179,8"]{color:#713f12!important}',
      /* Additional border color overrides for fleet-command and similar */
      '[data-nexus-theme="light"] [style*="border:#1e2d45"],[data-nexus-theme="light"] [style*="border: #1e2d45"],[data-nexus-theme="light"] [style*="border-color:#1e2d45"],[data-nexus-theme="light"] [style*="1px solid #1e2d45"]{border-color:#d0d7de!important}',
      '[data-nexus-theme="light"] [style*="border:1px solid #1e3a5f"],[data-nexus-theme="light"] [style*="1px solid #233554"]{border-color:#d0d7de!important}',
      /* Body background for pages that hardcode dark in their own style sheets */
      '[data-nexus-theme="light"] body{background:#f0f2f5!important;color:#111827!important}',
    ].join('\n');
    document.head.appendChild(ts);
  }

  window.NEXUS_TOGGLE_THEME = function() {
    var cur = document.documentElement.getAttribute('data-nexus-theme') || 'dark';
    var next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-nexus-theme', next);
    localStorage.setItem('nexus_theme', next);
    _updateThemeIcon(next);
  };

  function _updateThemeIcon(theme) {
    var el = document.getElementById('nexus-theme-icon');
    if (!el) return;
    if (theme === 'dark') {
      el.setAttribute('viewBox', '0 0 16 16');
      el.innerHTML = '<circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M11.54 4.46l-1.41 1.41M4.46 11.54l-1.41 1.41" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/>';
    } else {
      el.setAttribute('viewBox', '0 0 16 16');
      el.innerHTML = '<path d="M13.5 10A5.5 5.5 0 016 2.5a.5.5 0 00-.6.6A6 6 0 1013.4 10.6a.5.5 0 00.1-.6z" fill="currentColor"/>';
    }
  }

  setTimeout(function(){ _updateThemeIcon(document.documentElement.getAttribute('data-nexus-theme') || 'dark'); }, 0);

  document.addEventListener('click', function(e) {
    var dd = document.getElementById('nexus-co-dd');
    var btn = document.getElementById('nexus-co-selector');
    if (dd && btn && !btn.contains(e.target)) dd.style.display = 'none';
  });

})();

(function() {
  var SUPER_ADMIN = 'cejsburlew@gmail.com';

  function getSession() {
    try { return JSON.parse(localStorage.getItem('nexus_session') || 'null'); } catch(e) { return null; }
  }

  function getCompanies() {
    try {
      var stored = localStorage.getItem('nexus_companies');
      if (stored) return JSON.parse(stored);
      return typeof NEXUS_COMPANIES !== 'undefined' ? NEXUS_COMPANIES : [{id:'co_001',name:'Carrier Trucking US',slug:'carrier-trucking-us'}];
    } catch(e) { return [{id:'co_001',name:'Carrier Trucking US',slug:'carrier-trucking-us'}]; }
  }

  function getActiveCompany() {
    var id = localStorage.getItem('nexus_active_company') || 'co_001';
    var companies = getCompanies();
    return companies.find(function(c) { return c.id === id; }) || companies[0];
  }

  function isSuperAdmin() {
    var session = getSession();
    if (!session) return false;
    return session.email === SUPER_ADMIN || (session.role === 'admin' && !session.companyId);
  }

  function getAccessibleCompanies() {
    var companies = getCompanies();
    if (isSuperAdmin()) return companies;
    var session = getSession();
    if (!session) return companies.slice(0,1);
    var users = JSON.parse(localStorage.getItem('NEXUS_LOCAL_USERS') || '[]');
    var user = users.find(function(u) { return u.email === session.email; });
    if (!user) return companies.slice(0,1);
    if (user.companyIds && Array.isArray(user.companyIds)) {
      return companies.filter(function(c) {
        return user.companyIds.some(function(ci) {
          return (typeof ci === 'string' ? ci : ci.companyId) === c.id;
        });
      });
    }
    if (user.companyId) return companies.filter(function(c) { return c.id === user.companyId; });
    return companies.slice(0,1);
  }

  window.openCompanySwitcher = function() {
    var accessible = getAccessibleCompanies();
    var active = getActiveCompany();
    var list = document.getElementById('companySwitcherList');
    if (!list) return;
    list.innerHTML = accessible.map(function(c) {
      return '<div onclick="switchToCompany(\'' + c.id + '\')" style="padding:12px 14px;border-radius:8px;border:2px solid ' + (c.id===active.id?'var(--blue)':'var(--border)') + ';cursor:pointer;background:' + (c.id===active.id?'rgba(59,130,246,.1)':'var(--panel2)') + ';transition:.15s">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;">' +
          '<div>' +
            '<div style="font-weight:600;color:var(--text);font-size:14px;">' + c.name + '</div>' +
            '<div style="font-size:11px;color:var(--mid);margin-top:2px;">' + (c.usdot?'DOT# '+c.usdot:'No USDOT on file') + ' · ' + (c.hq||'') + '</div>' +
          '</div>' +
          (c.id===active.id?'<span style="color:var(--blue);font-size:18px;">✓</span>':'') +
        '</div>' +
      '</div>';
    }).join('');
    document.getElementById('companySwitcherModal').style.display = 'flex';
  };

  window.closeCompanySwitcher = function() {
    document.getElementById('companySwitcherModal').style.display = 'none';
  };

  window.switchToCompany = function(id) {
    localStorage.setItem('nexus_active_company', id);
    initializeCompanyIfNew(id);
    closeCompanySwitcher();
    var c = getCompanies().find(function(co) { return co.id === id; });
    var nameEl = document.getElementById('nexus-co-name');
    if (nameEl && c) nameEl.textContent = c.name;
    var dotEl = document.getElementById('nexus-co-dot');
    if (dotEl && c && c.color) dotEl.style.background = c.color;
    var row = document.getElementById('nexus-co-selector');
    if (row) { row.style.background='#eef2ff'; setTimeout(function(){row.style.background='';},600); }
    // Ensure NexusIsolation initializes the new company store, then reload for clean state
    if (window.NexusIsolation) NexusIsolation.initCompany(id);
    setTimeout(function() { window.location.reload(); }, 300);
  };

  // ── Company data isolation: initialize empty stores for new companies ──
  function initializeCompanyIfNew(coId) {
    if (!coId || coId === 'co_001') return; // never reinitialize CT, only new companies
    var rawGet = Storage.prototype._rawGet;
    var rawSet = Storage.prototype._rawSet;
    if (!rawGet || !rawSet) return;
    var initKey = coId + ':nexus_initialized_v1';
    if (rawGet.call(localStorage, initKey)) return;
    // Keys with their empty value type: '[]' for arrays, '{}' for objects, '' for strings/scalars
    var emptyStores = [
      // --- original array keys ---
      'nexus_drivers','nexus_vehicles','nexus_dispatch_loads','nexus_documents',
      'nexus_expenses','nexus_fuel_records','nexus_maintenance_records','nexus_settlements',
      'nexus_permits','nexus_tires','nexus_pretrip_records','nexus_accident_register',
      'nexus_drug_tests','nexus_customers','nexus_brokers','nexus_factoring_invoices',
      'nexus_work_orders','nexus_scale_tickets','nexus_gps_vehicles','nexus_avail_drivers',
      'nexus_equipment_units','nexus_pilot_companies','nexus_pilot_assignments',
      'nexus_dispatch_drivers','nexus_gps_eld_config','nexus_my_usdot','nexus_my_mc',
      'nexus_my_company_name','nexus_pay_settings',
      // --- additional array keys (previously missing) ---
      'nexus_accident_register_confirmed','nexus_active_loads','nexus_assign_log',
      'nexus_assignments','nexus_avail_dispatchers','nexus_bols','nexus_camera_events',
      'nexus_cfr_alert_log','nexus_cfr_last_check','nexus_cfr_rules_disabled','nexus_claims',
      'nexus_coaching','nexus_cois','nexus_comms_skip_auth','nexus_company_members',
      'nexus_contact_requests','nexus_current_user','nexus_custom_expirations',
      'nexus_da_program_confirmed','nexus_da_program_date','nexus_dismissed',
      'nexus_dispatcher_assignments','nexus_documents_v2','nexus_drive_token',
      'nexus_driver_profiles','nexus_eld_confirmed','nexus_equipment','nexus_equipment_db_custom',
      'nexus_flagged','nexus_fleet','nexus_gmail_client_id','nexus_gmail_token',
      'nexus_google_token','nexus_incidents','nexus_intake_draft','nexus_intake_toured',
      'nexus_job_saved','nexus_liked_','nexus_loadboard_saved','nexus_loads','nexus_loads_v2',
      'nexus_marketplace','nexus_marketplace_followup','nexus_marketplace_saved',
      'nexus_mcs150_date','nexus_member_profiles','nexus_messages','nexus_mig_pod_v1',
      'nexus_ms_client_id','nexus_outlook_token','nexus_permits_v1','nexus_pilot_cois',
      'nexus_pretrip_inspections','nexus_review_queue','nexus_rs_inspections',
      'nexus_staged_files','nexus_ucr_year','nexus_users','nexus_wc_comparisons',
      'nexus_wc_custom_eq','nexus_weight_calc_history','nexus_whatsapp_lines',
      'nexus_whatsapp_messages'
    ];
    // Keys that default to object ({}) rather than array
    var emptyObjectStores = [
      'nexus_camera_config','nexus_community_likes','nexus_csa_scores','nexus_data_version',
      'nexus_doc_privacy','nexus_driver_availability','nexus_driver_careers',
      'nexus_gps_hw_config','nexus_sheets_url','nexus_sync_config','nexus_weekly_roles'
    ];
    // Keys that are plain strings/scalars
    var emptyStringStores = [
      'nexus_cfr_autoscan','nexus_clearinghouse_queries','nexus_community_feed',
      'nexus_dot_cdl_','nexus_dot_ifta','nexus_dot_insurance','nexus_expiry_reminder_days',
      'nexus_gmail_account','nexus_gmail_expiry','nexus_highway_company_id',
      'nexus_highway_session','nexus_job_board','nexus_lang','nexus_motus_url',
      'nexus_mypay_seeded_v2','nexus_random_pool','nexus_settlement_period',
      'nexus_sheets_last_pull','nexus_sheets_last_push','nexus_temp_cid','nexus_tire_log',
      'nexus_mcs150_last','nexus_mcs150_next','nexus_my_dot_pin','nexus_my_phone','nexus_my_state'
    ];
    emptyStores.forEach(function(k) {
      var sk = coId + ':' + k;
      if (rawGet.call(localStorage, sk) === null) {
        rawSet.call(localStorage, sk, '[]');
      }
    });
    emptyObjectStores.forEach(function(k) {
      var sk = coId + ':' + k;
      if (rawGet.call(localStorage, sk) === null) {
        rawSet.call(localStorage, sk, '{}');
      }
    });
    emptyStringStores.forEach(function(k) {
      var sk = coId + ':' + k;
      if (rawGet.call(localStorage, sk) === null) {
        rawSet.call(localStorage, sk, '');
      }
    });
    rawSet.call(localStorage, initKey, '1');
  }

  // Initialize new company data isolation on page load
  (function() {
    var rawGet = Storage.prototype._rawGet;
    if (!rawGet) return;
    var curCo = rawGet.call(localStorage, 'nexus_active_company');
    if (curCo && curCo !== 'co_001') {
      initializeCompanyIfNew(curCo);
    }
  })();

    document.addEventListener('DOMContentLoaded', function() {
    var c = getActiveCompany();
    var nameEl = document.getElementById('nexus-co-name');
    if (nameEl && c) nameEl.textContent = c.name;
    var dotEl = document.getElementById('nexus-co-dot');
    if (dotEl && c && c.color) dotEl.style.background = c.color;
    var modal = document.getElementById('companySwitcherModal');
    if (modal) modal.addEventListener('click', function(e) { if(e.target===modal) closeCompanySwitcher(); });
  });
})();

// ═══════════════════════════════════════════════════════
// AI ASSISTANT PANEL — injected on every page via sidebar
// ═══════════════════════════════════════════════════════
(function installNexusAIPanel() {
  if (document.getElementById('nexus-ai-panel')) return;

  var KNOWLEDGE_BASE = [
    { q: /driver|add driver|new driver/i, a: 'To add a driver, go to <a href="drivers.html">Drivers</a> and click "Add Driver". Fill in their CDL, DOT medical card, and contact info.' },
    { q: /load|active load|add load/i, a: 'Manage loads at <a href="active-loads.html">Active Loads</a>. Import rate cons via PDF or enter manually.' },
    { q: /settlement|pay|payroll/i, a: 'Settlements are in <a href="weekly-settlements.html">Weekly Settlements</a>. Weeks run Mon-Sun by pickup date.' },
    { q: /fuel|ifta/i, a: 'Log fuel at <a href="fuel.html">Fuel Log</a>. IFTA reports auto-populate from fuel + loads at <a href="ifta.html">IFTA</a>.' },
    { q: /document|upload|file/i, a: 'Upload documents at <a href="upload.html">Upload Docs</a>. View all docs at <a href="documents.html">Documents</a>.' },
    { q: /tire|tread|cfr/i, a: 'Tire tracking with CFR 393.75 compliance is at <a href="tires.html">Tire Intelligence</a>.' },
    { q: /weather|route|compliance/i, a: 'Check route weather and compliance at <a href="route-compliance.html">Route Compliance</a>.' },
    { q: /police|dot officer|hazard|alert/i, a: 'Report and view live road hazards at <a href="hazard-map.html">Live Road Alerts</a>.' },
    { q: /permit/i, a: 'Manage permits at <a href="permits.html">Permits</a>. State-by-state requirements and restrictions.' },
    { q: /expense/i, a: 'Log expenses at <a href="expenses.html">Expenses</a>. Supports Zelle payments and audit trail.' },
    { q: /invoice|billing/i, a: 'Manage invoices at <a href="invoicing.html">Invoicing</a> with AR aging tracker.' },
    { q: /company|switch company/i, a: 'Click the company name in the top-left sidebar to switch between companies.' },
    { q: /fmcsa|dot number|mc number/i, a: 'Verify FMCSA credentials at <a href="fmcsa-compliance.html">FMCSA Compliance</a>.' },
    { q: /pilot|escort/i, a: 'Pilot escorts at <a href="pilot-escorts.html">Pilot Escorts</a>. State compliance at <a href="pilot-compliance.html">Pilot Car Compliance</a>.' },
    { q: /dispatch/i, a: 'Dispatch operations at <a href="dispatch-pro.html">Dispatch Pro</a> — loads, assignments, and driver status.' },
    { q: /login|password|user/i, a: 'Manage users at <a href="admin-users.html">User Management</a>.' },
    { q: /feedback|bug|issue/i, a: 'Submit feedback at <a href="feedback.html">Send Feedback</a> — goes directly to Jim.' },
  ];

  var panel = document.createElement('div');
  panel.id = 'nexus-ai-panel';
  panel.innerHTML =
    '<div id="nexus-ai-toggle" onclick="window.toggleNexusAI()" title="Nexus Assistant" ' +
    'style="position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:9999;' +
    'background:#2563eb;color:#fff;writing-mode:vertical-lr;padding:12px 8px;' +
    'cursor:pointer;border-radius:8px 0 0 8px;font-size:12px;font-weight:700;' +
    'letter-spacing:1px;box-shadow:-2px 0 12px rgba(0,0,0,0.2);transition:background .2s;">AI</div>' +

    '<div id="nexus-ai-drawer" style="position:fixed;right:-380px;top:0;bottom:0;width:380px;' +
    'background:#fff;z-index:9998;box-shadow:-4px 0 24px rgba(0,0,0,0.15);' +
    'display:flex;flex-direction:column;transition:right .3s ease;border-left:1px solid #e5e7eb;">' +

    '<div style="background:#2563eb;color:#fff;padding:16px;display:flex;justify-content:space-between;align-items:center;">' +
    '<div><div style="font-weight:700;font-size:15px;">Nexus Assistant</div>' +
    '<div style="font-size:11px;opacity:.8;">Ask anything or describe what you see</div></div>' +
    '<button onclick="window.toggleNexusAI()" style="background:rgba(255,255,255,.2);border:none;color:#fff;' +
    'cursor:pointer;padding:6px 10px;border-radius:6px;font-size:14px;">X</button></div>' +

    '<div style="padding:12px;background:#f0f4ff;border-bottom:1px solid #dbeafe;">' +
    '<div style="font-size:11px;color:#3b82f6;font-weight:600;margin-bottom:6px;">QUICK ACTIONS</div>' +
    '<div style="display:flex;flex-wrap:wrap;gap:6px;">' +
    '<button onclick="window.nexusAIQuick(\'How do I add a driver?\')" style="font-size:11px;padding:4px 8px;border:1px solid #93c5fd;border-radius:20px;background:#fff;cursor:pointer;color:#2563eb;">Add Driver</button>' +
    '<button onclick="window.nexusAIQuick(\'Where are settlements?\')" style="font-size:11px;padding:4px 8px;border:1px solid #93c5fd;border-radius:20px;background:#fff;cursor:pointer;color:#2563eb;">Settlements</button>' +
    '<button onclick="window.nexusAIQuick(\'How do I report a police sighting?\')" style="font-size:11px;padding:4px 8px;border:1px solid #93c5fd;border-radius:20px;background:#fff;cursor:pointer;color:#2563eb;">Report Hazard</button>' +
    '<button onclick="window.nexusAIQuick(\'Route compliance check\')" style="font-size:11px;padding:4px 8px;border:1px solid #93c5fd;border-radius:20px;background:#fff;cursor:pointer;color:#2563eb;">Route Check</button>' +
    '<button onclick="window.location.href=\'feedback.html\'" style="font-size:11px;padding:4px 8px;border:1px solid #f59e0b;border-radius:20px;background:#fffbeb;cursor:pointer;color:#b45309;">Send Feedback</button>' +
    '</div></div>' +

    '<div id="nexus-ai-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">' +
    '<div style="background:#f0f4ff;border-radius:12px 12px 12px 0;padding:12px;font-size:13px;color:#1e3a8a;max-width:90%;">' +
    'Hi! I\'m your Nexus Assistant. Ask me anything about the platform, or <a href="feedback.html" style="color:#2563eb;">send feedback to Jim</a>.' +
    '</div></div>' +

    '<div style="padding:12px;border-top:1px solid #e5e7eb;display:flex;gap:8px;">' +
    '<input id="nexus-ai-input" type="text" placeholder="Ask me anything..." ' +
    'style="flex:1;padding:10px 12px;border:1px solid #d1d5db;border-radius:8px;font-size:13px;color:#111827;outline:none;" ' +
    'onkeydown="if(event.key===\'Enter\')window.nexusAISend()">' +
    '<button onclick="window.nexusAISend()" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;font-size:14px;">&gt;</button>' +
    '</div></div>';

  document.body.appendChild(panel);

  window.toggleNexusAI = function() {
    var drawer = document.getElementById('nexus-ai-drawer');
    var toggle = document.getElementById('nexus-ai-toggle');
    var open = drawer.style.right === '0px';
    drawer.style.right = open ? '-380px' : '0px';
    if (toggle) toggle.style.display = open ? '' : 'none';
  };

  window.nexusAIQuick = function(text) {
    var input = document.getElementById('nexus-ai-input');
    if (input) input.value = text;
    window.nexusAISend();
  };

  window.nexusAISend = function() {
    var input = document.getElementById('nexus-ai-input');
    var msg = input ? (input.value || '').trim() : '';
    if (!msg) return;
    input.value = '';
    var msgs = document.getElementById('nexus-ai-messages');
    if (!msgs) return;

    var userDiv = document.createElement('div');
    userDiv.style.cssText = 'background:#2563eb;color:#fff;border-radius:12px 12px 0 12px;padding:10px 12px;font-size:13px;max-width:85%;align-self:flex-end;margin-left:auto;';
    userDiv.textContent = msg;
    msgs.appendChild(userDiv);

    var answer = null;
    for (var i = 0; i < KNOWLEDGE_BASE.length; i++) {
      if (KNOWLEDGE_BASE[i].q.test(msg)) { answer = KNOWLEDGE_BASE[i].a; break; }
    }
    if (!answer) {
      answer = 'I don\'t have a specific answer for that. <a href="feedback.html" style="color:#2563eb;">Send feedback to Jim</a> or visit <a href="nexus-ai.html" style="color:#2563eb;">Nexus AI</a> for deeper questions.';
    }

    setTimeout(function() {
      var botDiv = document.createElement('div');
      botDiv.style.cssText = 'background:#f0f4ff;border-radius:12px 12px 12px 0;padding:12px;font-size:13px;color:#1e3a8a;max-width:90%;';
      botDiv.innerHTML = answer;
      msgs.appendChild(botDiv);
      msgs.scrollTop = msgs.scrollHeight;
    }, 300);
    msgs.scrollTop = msgs.scrollHeight;
  };
})();
