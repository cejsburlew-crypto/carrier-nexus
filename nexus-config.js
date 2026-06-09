// ============================================================
// CARRIER NEXUS — CONFIG (nexus-config.js)
// ============================================================

window.NEXUS_SUPABASE_URL = ''; // disabled — app runs in localStorage mode
window.NEXUS_SUPABASE_KEY = ''; // disabled;
window.NEXUS_GOOGLE_CLIENT_ID = '662145578280-f03nl1nqti0c6v3kojpbkbvognc10coj.apps.googleusercontent.com';

// ============================================================
// MULTI-COMPANY SUPPORT
// Each company has its own Drive vault root + Google Sheet.
// Add additional companies here. The first entry is the default.
// ============================================================
window.NEXUS_COMPANIES = [
  {
    id: 'carrier-trucking-us',
    name: 'Carrier Trucking US, LLC',
    shortName: 'Carrier Trucking',
    driveRootId: '13hRTmF6XVSI627s5Mc1wb_zkEA3I5rXZ',
    sheetsId: '',   // Auto-set after first Sheets sync (see nexus-sheets.js)
    gmailLabel: 'INBOX',
    color: '#e91e8c'
  }
  // Add more companies here:
  // { id: 'company-2', name: 'XYZ Freight LLC', shortName: 'XYZ Freight',
  //   driveRootId: 'YOUR_DRIVE_FOLDER_ID', sheetsId: '', color: '#3b7eff' }
];

window.NEXUS_ACTIVE_COMPANY = function() {
  try {
    var id = localStorage.getItem('nexus_active_company');
    if (id) {
      var match = window.NEXUS_COMPANIES.find(function(c){ return c.id === id; });
      if (match) return match;
    }
    return window.NEXUS_COMPANIES[0];
  } catch(e) {
    return window.NEXUS_COMPANIES[0];
  }
};

window.NEXUS_SET_COMPANY = function(id) {
  localStorage.setItem('nexus_active_company', id);
  // Update Drive root for vault provisioning
  var co = window.NEXUS_COMPANIES.find(function(c){ return c.id === id; });
  if (co) window.NEXUS_VAULT_ROOT_ID = co.driveRootId;
  window.location.reload();
};

// Active vault root = active company's Drive folder
window.NEXUS_VAULT_ROOT_ID = (function() {
  try {
    var id = localStorage.getItem('nexus_active_company');
    var co = id && window.NEXUS_COMPANIES.find(function(c){ return c.id === id; });
    return (co || window.NEXUS_COMPANIES[0]).driveRootId;
  } catch(e) {
    return window.NEXUS_COMPANIES[0].driveRootId;
  }
})();

// ============================================================
// LOCAL USER STORE (used when Supabase is not configured)
// Passwords are stored as SHA-256 hashes — NEVER plaintext.
// Manage users via Admin > Users in the app.
// ============================================================
window.NEXUS_LOCAL_USERS = (function () {
  var SEED = [
    {
      id: 'usr_001',
      email: 'crtruckus@gmail.com',
      passwordHash: '86eaffe8d41c665078e53d2ac4af426a6cfff4ba6121e641d72e86cd8e989264',
      role: 'admin',
      name: 'Admin',
      active: true,
      createdAt: '2026-05-28'
    }
  ];
  try {
    var stored = JSON.parse(localStorage.getItem('nexus_users') || '[]');
    var map = {};
    stored.forEach(function(u){ map[u.email.toLowerCase()] = u; });
    SEED.forEach(function(u){
      if (!map[u.email.toLowerCase()]) map[u.email.toLowerCase()] = u;
    });
    return Object.values(map);
  } catch(e) {
    return SEED;
  }
})();

// ============================================================
// HELPER: SHA-256 hash (async)
// ============================================================
window.nexusSha256 = async function(msg) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
};

// ============================================================
// HELPER: Simple session (localStorage-backed)
// ============================================================
window.NEXUS_SESSION = {
  get: function() {
    try { return JSON.parse(sessionStorage.getItem('nexus_session') || 'null'); } catch(e) { return null; }
  },
  set: function(user) {
    sessionStorage.setItem('nexus_session', JSON.stringify(user));
  },
  clear: function() {
    sessionStorage.removeItem('nexus_session');
  }
};
