/**
 * nexus-sidebar.js â Canonical sidebar for all Carrier Nexus pages.
 * Includes company selector, GmailâDrive sync status, and full nav.
 */
(function() {
  const page = location.pathname.split('/').pop() || 'index.html';

  function active(href) {
    return (href === page || (href.includes('?') && page === href.split('?')[0])) ? ' active' : '';
  }

  // Build company selector dropdown
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
    <div class="sidebar-section">
      <div class="sidebar-section-label">Operations</div>
      <a href="fleet-command.html" class="sidebar-link${active('fleet-command.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 3h12v2H2zm0 4h12v2H2zm0 4h7v2H2z"/></svg>Dashboard</a>
      <a href="active-loads.html" class="sidebar-link${active('active-loads.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V3zm0 6a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H2a1 1 0 01-1-1V9zm4 4h6v2H5z"/></svg>Active Loads</a>
      <a href="settlements.html" class="sidebar-link${active('settlements.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm1 3v1h6V4H5zm0 3v1h6V7H5zm0 3v1h4v-1H5z"/></svg>Settlements</a>
      <a href="settlement-review.html" class="sidebar-link${active('settlement-review.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 2h12v2H2zm0 4h8v2H2zm0 4h12v2H2z"/></svg>Settlement Review</a>
      <a href="drivers.html" class="sidebar-link${active('drivers.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3z"/></svg>Drivers</a>
      <a href="permits.html" class="sidebar-link${active('permits.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10v14H3zm2 3h6v1H5zm0 3h6v1H5zm0 3h4v1H5z"/></svg>Permits</a>
      <a href="pods.html" class="sidebar-link${active('pods.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 2a5 5 0 110 10A5 5 0 018 3zm-.5 2v4.5l3.5 2-.5-.87-3-1.63V5h-1z"/></svg>Missing PODs</a>
      <a href="issues.html" class="sidebar-link${active('issues.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>Issues</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Dispatch</div>
      <a href="dispatcher-hub.html" class="sidebar-link${active('dispatcher-hub.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>Dispatcher Hub</a>
      <a href="commissions.html" class="sidebar-link${active('commissions.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 9.5l-3-3 1-1 2 2 3-3 1 1-4 4z"/></svg>Commissions</a>
      <a href="available-dispatchers.html" class="sidebar-link${active('available-dispatchers.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Available Dispatchers</a>
      <a href="available-drivers.html" class="sidebar-link${active('available-drivers.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/></svg>Available Drivers</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Finance</div>
      <a href="invoicing.html" class="sidebar-link${active('invoicing.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10a1 1 0 011 1v12a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm1 3v1h8V4H4zm0 3v1h8V7H4zm0 3v1h5v-1H4z"/></svg>Invoicing</a>
      <a href="expenses.html" class="sidebar-link${active('expenses.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 4H7v2H5v2h2v2h2V9h2V7H9V5z"/></svg>Expenses</a>
      <a href="financials.html" class="sidebar-link${active('financials.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 12h2v-4H2zm3 0h2V6H5zm3 0h2V4H8zm3 0h2V2h-2z"/></svg>Financials</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Documents</div>
      <a href="documents.html" class="sidebar-link${active('documents.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 1h5l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1zm5 0v4h4"/></svg>Document Vault</a>
      <a href="upload.html" class="sidebar-link${active('upload.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>Upload Docs</a>
      <a href="inbox-sync.html" class="sidebar-link${active('inbox-sync.html')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>Inbox Sync</a>
    <a href="emails.html" class="sidebar-link${active('emails.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="11" rx="1" fill="none" stroke="currentColor"/><path d="M1 4l7 5 7-5"/></svg>Emails</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Contacts</div>
      <a href="contacts.html" class="sidebar-link${active('contacts.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M11 5a3 3 0 11-6 0 3 3 0 016 0zM2 13c0-2.761 2.686-5 6-5s6 2.239 6 5H2z"/></svg>Directory</a>
      <a href="contacts.html?tab=broker" class="sidebar-link"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>Brokers</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Tax &amp; HR</div>
      <a href="tax-forms.html" class="sidebar-link${active('tax-forms.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10v14H3zm2 3h6v1H5zm0 3h6v1H5zm0 3h4v1H5z"/></svg>1099-NEC</a>
      <a href="w9.html" class="sidebar-link${active('w9.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h10v14H3zm2 3h6v1H5zm0 3h6v1H5zm0 3h4v1H5z"/></svg>W-9 Forms</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Maintenance</div>
      <a href="equipment.html" class="sidebar-link${active('equipment.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 3H14l-3 2.5 1 3.5L8 8 4 10l1-3.5L2 4h4.5z"/></svg>Fleet &amp; Equipment</a>
      <a href="maintenance.html" class="sidebar-link${active('maintenance.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 2.5l-1.4 1.4A4 4 0 106.1 9.8L4.7 11.2A6 6 0 1113.5 2.5zm-3 3A2 2 0 108 10a2 2 0 002.5-2.5z"/></svg>Maintenance Log</a>
      <a href="pm-schedule.html" class="sidebar-link${active('pm-schedule.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 2h10v2H3zm0 4h10v2H3zm0 4h6v2H3z"/></svg>PM Schedule</a>
      <a href="tires.html" class="sidebar-link${active('tires.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="8" cy="8" r="2" fill="currentColor"/></svg>Tires</a>
      <a href="fuel.html" class="sidebar-link${active('fuel.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 1h7l3 3v10a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1zm1 6h6V6H4zm0 3h4V9H4z"/></svg>Fuel</a>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-section-label">Admin</div>
      <a href="member-management.html" class="sidebar-link\${active('member-management.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M10 8a3 3 0 100-6 3 3 0 000 6zm-7 6s-1 0-1-1 1-4 8-4 8 3 8 4-1 1-1 1H3zM3 5a2 2 0 110 4 2 2 0 010-4z"/></svg>Members</a>
      <a href="admin-users.html" class="sidebar-link\${active('admin-users.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 110 6A3 3 0 018 1zm5 11c0-2.21-2.24-4-5-4S3 9.79 3 12v1h10v-1z"/></svg>User Accounts</a>
      <div class="sidebar-section-label">Intelligence</div>
      <a href="nexus-ai.html" class="sidebar-link${active('nexus-ai.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a7 7 0 100 14A7 7 0 008 1zm1 4H7v5l4.5 2.7-.7-1.2-3.8-2.3V5z"/></svg>Nexus AI</a>
      <a href="analysis.html" class="sidebar-link${active('analysis.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M2 12h2v-4H2zm3 0h2V6H5zm3 0h2V4H8zm3 0h2V2h-2z"/></svg>Analytics</a>
      <a href="drive-settings.html" class="sidebar-link${active('drive-settings.html')}"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M8 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V7L8 2z"/><polyline points="8 2 8 7 13 7"/></svg>Drive Settings</a>
      <a href="eld-settings.html" class="sidebar-link${active('eld-settings.html')}"><svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a3 3 0 00-3 3c0 1.3.83 2.4 2 2.82V8H5v2h2v1.18A3 3 0 108 14.93V10h2V8H8V6.82A3.001 3.001 0 008 1zm0 12a1 1 0 110-2 1 1 0 010 2zm0-8a1 1 0 110-2 1 1 0 010 2z"/></svg>ELD Integration</a>
    </div>
  </div>

  <div class="sidebar-footer" style="border-top:1px solid rgba(255,255,255,0.07);padding:10px 16px;display:flex;align-items:center;gap:10px;">
    <div style="flex:1;min-width:0;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:rgba(255,255,255,0.55);font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-user-label">Jim Burlew Â· ADMIN</div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:rgba(255,255,255,0.25);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" id="nexus-company-footer">${activeCompany.name}</div>
    </div>
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

  // Apply unified styles if not already present
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
      .sidebar-section{padding:4px 0!important;}
      .sidebar-section-label{padding:12px 16px 4px!important;font-family:'JetBrains Mono',monospace!important;font-size:9px!important;font-weight:700!important;color:rgba(255,255,255,0.3)!important;letter-spacing:1.5px!important;text-transform:uppercase!important;display:block!important;}
      .sidebar-link{display:flex!important;align-items:center!important;gap:10px!important;padding:7px 16px!important;text-decoration:none!important;color:#a0aec0!important;font-size:13px!important;border-left:3px solid transparent!important;transition:all .15s!important;white-space:nowrap!important;}
      .sidebar-link:hover{background:rgba(233,30,140,0.14)!important;border-left-color:#c2185b!important;color:#fff!important;}
      .sidebar-link.active{background:rgba(233,30,140,0.22)!important;border-left:3px solid #e91e8c!important;color:#fff!important;}
      .sidebar-link svg{width:14px!important;height:14px!important;flex-shrink:0!important;opacity:.7!important;}
      .sidebar-link.active svg{opacity:1!important;}
      #nexus-sidebar .sidebar-nav{overflow-y:auto;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}
    `;
    document.head.appendChild(style);
  }

  // Close company dropdown on outside click
  document.addEventListener('click', function(e) {
    var dd = document.getElementById('nexus-co-dd');
    var btn = document.getElementById('nexus-co-selector');
    if (dd && btn && !btn.contains(e.target)) {
      dd.style.display = 'none';
    }
  });
})();
