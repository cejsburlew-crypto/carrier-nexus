/**
 * nexus-sidebar.js — Carrier Nexus canonical sidebar.
 * v3: collapsible sections, Collapse All / Expand All, state persisted in localStorage,
 *     active section always auto-expanded. Driver Services, Scale Tickets, Load Board,
 *     Nexus Connect, Search Everything added. nexus-core.js + nexus-search.js injection.
 */
(function() {
  const page = location.pathname.split('/').pop() || 'index.html';

  /* ── Theme: apply BEFORE layout to prevent flash ── */
  (function(){
    var t = localStorage.getItem('nexus_theme') || 'dark';
    document.documentElement.setAttribute('data-nexus-theme', t);
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
  var SECTIONS = [
    { key:'ops',     label:'Operations',     pages:['fleet-command.html','active-loads.html','settlements.html','weekly-settlements.html','settlement-review.html','drivers.html','permits.html','pods.html','issues.html'] },
    { key:'dispatch',label:'Dispatch',       pages:['dispatcher-hub.html','load-board.html','commissions.html','available-dispatchers.html','available-drivers.html'] },
    { key:'driver',  label:'Driver',         pages:['driver-command.html','driver-availability.html','equipment-marketplace.html','my-pay.html','social-recruiting.html','driver-intake.html'] },
    { key:'finance', label:'Finance',        pages:['invoicing.html','whatsapp-import.html','expenses.html','financials.html','ifta.html'] },
    { key:'docs',    label:'Documents',      pages:['documents.html','upload.html','inbox-sync.html','emails.html','doc-inbox.html'] },
    { key:'contacts',label:'Contacts',       pages:['contacts.html'] },
    { key:'taxhr',   label:'Tax & HR',       pages:['tax-forms.html','w9.html'] },
    { key:'maint',   label:'Maintenance',    pages:['equipment.html','maintenance.html','pm-schedule.html','dot-compliance.html','tires.html','fuel.html','dvir.html','driver-services.html','scale-tickets.html','weight-calculator.html'] },
    { key:'admin',   label:'Admin',          pages:['member-management.html','admin-users.html'] },
    { key:'intel',   label:'Intelligence',   pages:['nexus-ai.html','analysis.html','drive-settings.html','eld-settings.html','search.html'] },
    { key:'comms',   label:'Communications', pages:['nexus-connect.html'] },
  ];

  // Determine which section the current page lives in
  var activeSection = '';
  SECTIONS.forEach(function(s) {
    if (s.pages.indexOf(page) > -1) activeSection = s.key;
  });

  // Build collapse state — auto-expand active section, collapse others that user has collapsed
  var colState = getCollapseState();
  // Active section is never collapsed
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

  var companySelectorHtml = companies.length > 1
    ? ('<div id="nexus-co-selector" style="position:relative;">' +
        '<button onclick="document.getElementById(\'nexus-co-dd\').style.display=document.getElementById(\'nexus-co-dd\').style.display===\'block\'?\'none\':\'block\'" ' +
        'style="width:100%;display:flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(255,255,255,.04);border:none;border-bottom:1px solid rgba(255,255,255,.07);cursor:pointer;text-align:left;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:' + companyColor + ';flex-shrink:0;"></span>' +
          '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;color:#fff;letter-spacing:.04em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + activeCompany.name + '</span>' +
          '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>' +
        '</button>' +
        '<div id="nexus-co-dd" style="display:none;position:absolute;left:0;right:0;background:#111827;border:1px solid rgba(255,255,255,.1);border-top:none;z-index:200;padding:4px;">' +
          companyOptions +
          '<div style="padding:6px 14px;border-top:1px solid rgba(255,255,255,.06);margin-top:4px;">' +
            '<button onclick="alert(\'To add a company: edit NEXUS_COMPANIES in nexus-config.js\')" style="width:100%;background:transparent;border:1px dashed rgba(255,255,255,.15);color:#6b7280;padding:6px 10px;font-size:11px;border-radius:4px;cursor:pointer;font-family:\'Barlow\',sans-serif;">+ Add Company</button>' +
          '</div>' +
        '</div>' +
      '</div>')
    : ('<div style="padding:8px 16px 6px;background:rgba(255,255,255,.04);border-bottom:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:8px;">' +
        '<span style="width:7px;height:7px;border-radius:50%;background:' + companyColor + ';flex-shrink:0;"></span>' +
        '<span style="font-family:\'Barlow Condensed\',sans-serif;font-size:12px;font-weight:700;color:#c9d1d9;letter-spacing:.04em;">' + activeCompany.name + '</span>' +
      '</div>');

  // ── Build section HTML ──
  function chevron(key) {
    var rot = isSectionCollapsed(key) ? '0deg' : '90deg';
    return '<svg class="sb-chevron" data-sec="' + key + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" style="width:10px;height:10px;flex-shrink:0;transition:transform .2s;transform:rotate(' + rot + ');opacity:.45;"><polyline points="6 4 10 8 6 12"/></svg>';
  }

  function sectionLabel(key, label) {
    return '<button class="sb-sec-btn" data-sec="' + key + '" ' +
      'style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 16px 4px;background:none;border:none;cursor:pointer;text-align:left;">' +
      '<span style="font-family:\'JetBrains Mono\',monospace;font-size:11px;font-weight:700;color:rgba(255,255,255,0.55);letter-spacing:1.5px;text-transform:uppercase;">' + label + '</span>' +
      chevron(key) +
      '</button>';
  }

  function sectionLinks(key, linksHtml) {
    var hidden = isSectionCollapsed(key);
    return '<div class="sb-sec-links" data-sec="' + key + '" style="overflow:hidden;max-height:' + (hidden ? '0' : '600px') + ';transition:max-height .22s ease' + (hidden ? '' : '-in-out') + ';">' + linksHtml + '</div>';
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
  };

  var navHtml =
    sec('ops', 'Operations',
      lnk('fleet-command.html',        I.grid,    'Operations Dashboard') +
      lnk('active-loads.html',         I.loads,   'Active Loads') +
      lnk('settlements.html',          I.settle,  'Settlements') +
      lnk('weekly-settlements.html',   I.builder, 'Settlement Builder') +
      lnk('settlement-review.html',    I.review,  'Approval Queue') +
      lnk('drivers.html',              I.driver,  'Drivers') +
      lnk('permits.html',              I.permit,  'Permits') +
      lnk('pods.html',                 I.clock,   'Missing PODs') +
      lnk('issues.html',               I.issue,   'Issues')
    ) +
    sec('dispatch', 'Dispatch',
      lnk('dispatcher-hub.html',       I.monitor, 'Dispatch Board') +
      lnk('load-board.html',           I.map,     'Load Board') +
      lnk('commissions.html',          I.comm,    'Commissions') +
      lnk('available-dispatchers.html',I.team,    'Dispatcher Roster') +
      lnk('available-drivers.html',    I.person,  'Driver Pool')
    ) +
    sec('driver', 'Driver',
      lnk('my-pay.html',               I.wallet,  'My Pay') +
      lnk('driver-command.html',       I.signal,  'Driver Command') +
      lnk('driver-intake.html',         I.upload,  'Driver Intake') +
      lnk('driver-availability.html',  I.signal,  'Availability Network') +
      lnk('equipment-marketplace.html', I.market,  'Equipment Marketplace') +
      lnk('social-recruiting.html',     I.people,  'Community &amp; Jobs')
    ) +
    sec('finance', 'Finance',
      lnk('invoicing.html',            I.invoice, 'Invoicing') +
      lnk('whatsapp-import.html',      I.chat,    'WhatsApp Import') +
      lnk('expenses.html',             I.expense, 'Expenses') +
      lnk('financials.html',           I.bar,     'Financials') +
      lnk('ifta.html',                 I.ifta,    'IFTA Reporting')
    ) +
    sec('docs', 'Documents',
      lnk('documents.html',            I.vault,   'Document Vault') +
      lnk('upload.html',               I.upload,  'Upload Docs') +
      lnk('inbox-sync.html',           I.sync,    'Email Import') +
      lnk('doc-inbox.html',            I.inbox,   'Review Queue') +
      lnk('emails.html',               I.email,   'Emails')
    ) +
    sec('contacts', 'Contacts',
      lnk('contacts.html',             I.contact, 'Directory') +
      '<a href="contacts.html?tab=broker" class="sidebar-link">' + I.team + 'Brokers</a>'
    ) +
    sec('taxhr', 'Tax & HR',
      lnk('tax-forms.html',            I.tax,     '1099-NEC') +
      lnk('w9.html',                   I.tax,     'W-9 Forms')
    ) +
    sec('maint', 'Maintenance',
      lnk('equipment.html',            I.truck,   'Fleet & Equipment') +
      lnk('maintenance.html',          I.wrench,  'Maintenance Log') +
      lnk('pm-schedule.html',          I.cal,     'PM Schedule') +
      lnk('dvir.html',                 I.dvir,    'Inspection Reports') +
      lnk('dot-compliance.html',       I.dot,     'DOT Compliance') +
      lnk('tires.html',                I.tire,    'Tires') +
      lnk('fuel.html',                 I.fuel,    'Fuel') +
      lnk('driver-services.html',      I.service, 'Driver Services') +
      lnk('scale-tickets.html',        I.scale,   'Scale Tickets') +
      lnk('weight-calculator.html',   I.scale,   'Weight Calculator')
    ) +
    sec('admin', 'Admin',
      lnk('member-management.html',    I.members, 'Members') +
      lnk('admin-users.html',          I.admin,   'User Accounts')
    ) +
    sec('intel', 'Intelligence',
      lnk('nexus-ai.html',             I.ai,      'AI Assistant') +
      lnk('analysis.html',             I.bar,     'Analytics') +
      lnk('drive-settings.html',       I.file,    'Integrations') +
      lnk('eld-settings.html',         I.eld,     'ELD Integration') +
      lnk('search.html',               I.search,  'Search Everything')
    ) +
    sec('comms', 'Communications',
      lnk('nexus-connect.html',        I.connect, 'Nexus Connect')
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
      <button id="nexus-search-trigger" onclick="if(window.NexusSearchUI)NexusSearchUI.open()" style="width:100%;background:#1f2937;border:1px solid #374151;color:#9ca3af;padding:8px 12px;border-radius:8px;text-align:left;cursor:pointer;font-size:13px;display:flex;justify-content:space-between;align-items:center;font-family:'Barlow',sans-serif;transition:background .15s;" onmouseover="this.style.background='#374151'" onmouseout="this.style.background='#1f2937'">
        <span>🔍 Search everything…</span>
        <span style="font-size:11px;background:#374151;padding:2px 6px;border-radius:4px;color:#6b7280;font-family:'JetBrains Mono',monospace;">⌘K</span>
      </button>
    </div>

    <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;padding:6px 12px 2px;">
      <button id="sb-collapse-all" title="Collapse all sections" style="background:none;border:none;color:rgba(255,255,255,.3);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.5px;cursor:pointer;padding:3px 6px;border-radius:3px;text-transform:uppercase;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.3)'">Collapse all</button>
      <span style="color:rgba(255,255,255,.15);font-size:9px;">|</span>
      <button id="sb-expand-all" title="Expand all sections" style="background:none;border:none;color:rgba(255,255,255,.3);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:.5px;cursor:pointer;padding:3px 6px;border-radius:3px;text-transform:uppercase;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.3)'">Expand all</button>
    </div>

    ${navHtml}
  </div>

  <div class="sidebar-footer" style="border-top:1px solid rgba(255,255,255,0.07);padding:10px 16px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;min-width:0;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.55);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-user-label">Jim Burlew · ADMIN</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-company-footer">${activeCompany.name}</div>
    </div>
    <button id="nexus-theme-btn" onclick="window.NEXUS_TOGGLE_THEME()" title="Toggle dark / light mode" style="background:none;border:none;cursor:pointer;color:rgba(255,255,255,.3);flex-shrink:0;padding:3px;line-height:0;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.3)'">
      <svg id="nexus-theme-icon" viewBox="0 0 16 16" fill="currentColor" width="13" height="13"></svg>
    </button>
    <a href="admin-users.html" title="Admin" style="color:rgba(255,255,255,.3);text-decoration:none;flex-shrink:0;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,.3)'">
      <svg viewBox="0 0 16 16" fill="currentColor" width="13" height="13"><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm5 11c0-2.21-2.24-4-5-4S3 9.79 3 12v1h10v-1z"/></svg>
    </a>
  </div>
</nav>`;

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
      nav.sidebar{width:220px;min-height:100vh;background:#000!important;border-right:1px solid #1a1a1a!important;display:flex;flex-direction:column;position:fixed;top:0;left:0;z-index:100;}
      .sidebar-logo{padding:16px!important;display:flex!important;align-items:center!important;gap:10px!important;text-decoration:none!important;border-bottom:1px solid rgba(255,255,255,0.07)!important;}
      .sidebar-logo .logo-hex svg{width:36px!important;height:36px!important;display:block!important;}
      .sidebar-logo .logo-text{display:flex!important;flex-direction:column!important;gap:2px!important;}
      .sidebar-logo .brand{font-family:'Barlow Condensed',sans-serif!important;font-weight:800!important;font-size:15px!important;letter-spacing:2px!important;color:#fff!important;display:block!important;}
      .sidebar-logo .sub{font-family:'JetBrains Mono',monospace!important;font-size:9px!important;color:rgba(255,255,255,0.45)!important;letter-spacing:1px!important;display:block!important;}
      .sidebar-section{padding:0!important;}
      .sb-sec-btn{transition:background .15s;}
      .sb-sec-btn:hover{background:rgba(255,255,255,.03)!important;}
      .sb-sec-btn:hover .sb-chevron{opacity:.7!important;}
      .sb-sec-links{overflow:hidden;}
      .sidebar-link{display:flex!important;align-items:center!important;gap:10px!important;padding:7px 16px!important;text-decoration:none!important;color:#a0aec0!important;font-size:13px!important;border-left:3px solid transparent!important;transition:all .15s!important;white-space:nowrap!important;}
      .sidebar-link:hover{background:rgba(233,30,140,0.14)!important;border-left-color:#c2185b!important;color:#fff!important;}
      .sidebar-link.active{background:rgba(233,30,140,0.22)!important;border-left:3px solid #e91e8c!important;color:#fff!important;}
      .sidebar-link svg{width:14px!important;height:14px!important;flex-shrink:0!important;opacity:.7!important;}
      .sidebar-link.active svg{opacity:1!important;}
      #nexus-sidebar .sidebar-nav{overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}
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
    if (links) links.style.maxHeight = collapsed ? '0' : '600px';
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
      '[data-nexus-theme="light"] body{background:#f1f5f9!important;color:#0f172a!important}',
      '[data-nexus-theme="light"] .topbar{background:#fff!important;border-bottom:1px solid #e2e8f0!important}',
      '[data-nexus-theme="light"] .topbar-title,[data-nexus-theme="light"] .page-title{color:#0f172a!important}',
      '[data-nexus-theme="light"] .content{background:transparent!important}',
      '[data-nexus-theme="light"] .card,[data-nexus-theme="light"] .panel,[data-nexus-theme="light"] .section-card,[data-nexus-theme="light"] .stat-card{background:#fff!important;border-color:#e2e8f0!important;color:#0f172a!important}',
      '[data-nexus-theme="light"] .modal,[data-nexus-theme="light"] .modal-box,[data-nexus-theme="light"] .modal-head,[data-nexus-theme="light"] .modal-hdr,[data-nexus-theme="light"] .modal-footer,[data-nexus-theme="light"] .modal-body{background:#fff!important;border-color:#e2e8f0!important;color:#0f172a!important}',
      '[data-nexus-theme="light"] .form-input,[data-nexus-theme="light"] .form-select,[data-nexus-theme="light"] textarea,[data-nexus-theme="light"] select,[data-nexus-theme="light"] input:not([type=range]){background:#fff!important;color:#0f172a!important;border-color:#e2e8f0!important}',
      '[data-nexus-theme="light"] .form-label,[data-nexus-theme="light"] label{color:#334155!important}',
      '[data-nexus-theme="light"] table th{background:#f8fafc!important;color:#64748b!important;border-color:#e2e8f0!important}',
      '[data-nexus-theme="light"] table td{color:#0f172a!important;border-color:#e2e8f0!important}',
      '[data-nexus-theme="light"] tr:hover td{background:#f0f4f8!important}',
      '[data-nexus-theme="light"] h1,[data-nexus-theme="light"] h2,[data-nexus-theme="light"] h3{color:#0f172a!important}',
      '[data-nexus-theme="light"] .member-card,[data-nexus-theme="light"] .driver-card{background:#fff!important;border-color:#e2e8f0!important}',
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
