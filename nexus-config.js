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

// --- AUTO-SEEDED DATA (v20260614) ---
window.NEXUS_DATA_VERSION = '20260614c';
window.NEXUS_SEED_LOADS = [
{"id":"L10001","loadNum":"1929469-01","broker":"TAB","driver":"David Fonseca","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-05","deliveryDate":"2026-01-05","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-01"},
{"id":"L10002","loadNum":"1929467-01","broker":"TAB","driver":"Miguel Fonseca","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-05","deliveryDate":"2026-01-05","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-01"},
{"id":"L10003","loadNum":"1929465-01","broker":"TAB","driver":"Guillermo Pinera","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-05","deliveryDate":"2026-01-05","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-01"},
{"id":"L10004","loadNum":"9349549","broker":"Trinity","driver":"Nelson Veliz","rate":5100,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-05","deliveryDate":"2026-01-05","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-01"},
{"id":"L10005","loadNum":"3073502","broker":"King of Freight","driver":"Miguel Fonseca","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-08","deliveryDate":"2026-01-08","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10006","loadNum":"1929467-01","broker":"Jones","driver":"Miguel Fonseca","rate":3000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-12","deliveryDate":"2026-01-12","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10007","loadNum":"118150","broker":"Partner","driver":"Guillermo Pinera","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-08","deliveryDate":"2026-01-08","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10008","loadNum":"981448","broker":"Nationwide","driver":"Guillermo Pinera","rate":4000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-10","deliveryDate":"2026-01-10","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10009","loadNum":"15072","broker":"Piramid","driver":"Nelson Veliz","rate":4500,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-12","deliveryDate":"2026-01-12","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10010","loadNum":"115535259","broker":"WT Logistics","driver":"David Fonseca","rate":7000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-12","deliveryDate":"2026-01-12","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-02"},
{"id":"L10011","loadNum":"118455","broker":"Partner","driver":"Nelson Veliz","rate":3300,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-17","deliveryDate":"2026-01-17","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-03"},
{"id":"L10012","loadNum":"L-10409","broker":"Express Way","driver":"Miguel Fonseca","rate":5500,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-17","deliveryDate":"2026-01-17","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-03"},
{"id":"L10013","loadNum":"127030019","broker":"Listo Svc","driver":"Yosviel Pinera","rate":8000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-18","deliveryDate":"2026-01-18","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-03"},
{"id":"L10014","loadNum":"103246","broker":"RLI","driver":"David Fonseca","rate":3600,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-18","deliveryDate":"2026-01-18","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-03"},
{"id":"L10015","loadNum":"L10483","broker":"Expressway Logistics","driver":"David Fonseca","rate":3500,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-20","deliveryDate":"2026-01-20","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10016","loadNum":"L10399","broker":"Expressway Logistics","driver":"David Fonseca","rate":2500,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-20","deliveryDate":"2026-01-20","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10017","loadNum":"32840","broker":"STT Logistics Group","driver":"David Fonseca","rate":1600,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-21","deliveryDate":"2026-01-21","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10018","loadNum":"L10399","broker":"Expressway Logistics","driver":"Nelson Veliz","rate":6000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-20","deliveryDate":"2026-01-20","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10019","loadNum":"120630","broker":"Coast to Coast Log.","driver":"Avis Modesto","rate":4300,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-14","deliveryDate":"2026-01-14","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10020","loadNum":"332500","broker":"SET Logistics","driver":"Guillermo Pinera","rate":4500,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-22","deliveryDate":"2026-01-22","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10021","loadNum":"130209","broker":"LRS Logistics","driver":"Yosviel Pinera","rate":1200,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-22","deliveryDate":"2026-01-22","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10022","loadNum":"C1","broker":"Own Customer","driver":"Guillermo Pinera","rate":4000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-22","deliveryDate":"2026-01-22","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"},
{"id":"L10023","loadNum":"130148","broker":"LRS Logistics","driver":"Yosviel Pinera","rate":2000,"originCity":"","originState":"","destCity":"","destState":"","pickupDate":"2026-01-21","deliveryDate":"2026-01-21","status":"delivered","pod":"none","notes":"","permits":"","settlement_id":"AMT-2026-04"}
];
window.NEXUS_SEED_SETTLEMENTS = [{"id":"AMT-2026-04","driver":"Amet Abreu","short":"AMET","role":"dispatcher","dispatcher_rate":0.05,"service_adj":0,"start":"2026-01-20","end":"2026-01-26","loads":9,"total_adds":29600,"overhead":0,"permits":0,"expenses":0,"net_pay":1480,"status":"draft"},{"id":"AMT-2026-03","driver":"Amet Abreu","short":"AMET","role":"dispatcher","dispatcher_rate":0.05,"service_adj":0,"start":"2026-01-13","end":"2026-01-19","loads":4,"total_adds":20400,"overhead":0,"permits":0,"expenses":0,"net_pay":1020,"status":"draft"},{"id":"AMT-2026-02","driver":"Amet Abreu","short":"AMET","role":"dispatcher","dispatcher_rate":0.05,"service_adj":0,"start":"2026-01-06","end":"2026-01-12","loads":6,"total_adds":32500,"overhead":0,"permits":0,"expenses":0,"net_pay":1625,"status":"draft"},{"id":"AMT-2026-01","driver":"Amet Abreu","short":"AMET","role":"dispatcher","dispatcher_rate":0.05,"service_adj":126.5,"start":"2025-12-30","end":"2026-01-05","loads":4,"total_adds":26100,"overhead":0,"permits":0,"expenses":126.5,"net_pay":1305,"status":"draft"},{"id":"AVI-2026-01","driver":"Avis Modesto","short":"AVIS","role":"driver","start":"2026-01-20","end":"2026-01-26","loads":1,"total_adds":4300,"overhead":0,"permits":0,"expenses":0,"net_pay":4300,"status":"draft"},{"id":"DAV-2026-04","driver":"David Fonseca","short":"DAVID","role":"driver","start":"2026-01-20","end":"2026-01-26","loads":3,"total_adds":7600,"overhead":9972.3,"permits":0,"expenses":4304.37,"net_pay":-6676.67,"status":"draft"},{"id":"DAV-2026-03","driver":"David Fonseca","short":"DAVID","role":"driver","start":"2026-01-13","end":"2026-01-19","loads":1,"total_adds":3600,"overhead":6959.93,"permits":0,"expenses":3265.04,"net_pay":-6624.97,"status":"draft"},{"id":"DAV-2026-02","driver":"David Fonseca","short":"DAVID","role":"driver","start":"2026-01-06","end":"2026-01-12","loads":1,"total_adds":7000,"overhead":9876.67,"permits":0,"expenses":1879.26,"net_pay":-4755.93,"status":"draft"},{"id":"DAV-2026-01","driver":"David Fonseca","short":"DAVID","role":"driver","start":"2025-12-30","end":"2026-01-05","loads":1,"total_adds":7000,"overhead":10111.04,"permits":0,"expenses":4342.3,"net_pay":-7453.34,"status":"draft"},{"id":"GUI-2026-03","driver":"Guillermo Pinera","short":"GUILLERMO","role":"driver","start":"2026-01-20","end":"2026-01-26","loads":1,"total_adds":4500,"overhead":0,"permits":0,"expenses":0,"net_pay":4500,"status":"draft"},{"id":"GUI-2026-02","driver":"Guillermo Pinera","short":"GUILLERMO","role":"driver","start":"2026-01-06","end":"2026-01-12","loads":2,"total_adds":11000,"overhead":8093.02,"permits":0,"expenses":3252.23,"net_pay":-345.25,"status":"draft"},{"id":"GUI-2026-01","driver":"Guillermo Pinera","short":"GUILLERMO","role":"driver","start":"2025-12-30","end":"2026-01-05","loads":1,"total_adds":7000,"overhead":8599.0,"permits":0,"expenses":2564.02,"net_pay":-4163.02,"status":"draft"},{"id":"MIG-2026-03","driver":"Miguel Fonseca","short":"MIGUEL","role":"driver","start":"2026-01-13","end":"2026-01-19","loads":1,"total_adds":5500,"overhead":0,"permits":0,"expenses":0,"net_pay":5500,"status":"draft"},{"id":"MIG-2026-02","driver":"Miguel Fonseca","short":"MIGUEL","role":"driver","start":"2026-01-06","end":"2026-01-12","loads":2,"total_adds":10000,"overhead":0,"permits":0,"expenses":0,"net_pay":10000,"status":"draft"},{"id":"MIG-2026-01","driver":"Miguel Fonseca","short":"MIGUEL","role":"driver","start":"2025-12-30","end":"2026-01-05","loads":1,"total_adds":7000,"overhead":0,"permits":0,"expenses":0,"net_pay":7000,"status":"draft"},{"id":"NEL-2026-04","driver":"Nelson Veliz","short":"NELSON","role":"driver","start":"2026-01-20","end":"2026-01-26","loads":1,"total_adds":6000,"overhead":0,"permits":0,"expenses":0,"net_pay":6000,"status":"draft"},{"id":"NEL-2026-03","driver":"Nelson Veliz","short":"NELSON","role":"driver","start":"2026-01-13","end":"2026-01-19","loads":1,"total_adds":3300,"overhead":0,"permits":0,"expenses":0,"net_pay":3300,"status":"draft"},{"id":"NEL-2026-02","driver":"Nelson Veliz","short":"NELSON","role":"driver","start":"2026-01-06","end":"2026-01-12","loads":1,"total_adds":4500,"overhead":0,"permits":0,"expenses":0,"net_pay":4500,"status":"draft"},{"id":"NEL-2026-01","driver":"Nelson Veliz","short":"NELSON","role":"driver","start":"2025-12-30","end":"2026-01-05","loads":1,"total_adds":5100,"overhead":0,"permits":0,"expenses":0,"net_pay":5100,"status":"draft"},{"id":"YOS-2026-02","driver":"Yosviel Pinera","short":"YOSVIEL","role":"driver","start":"2026-01-20","end":"2026-01-26","loads":2,"total_adds":3200,"overhead":0,"permits":0,"expenses":0,"net_pay":3200,"status":"draft"},{"id":"YOS-2026-01","driver":"Yosviel Pinera","short":"YOSVIEL","role":"driver","start":"2026-01-13","end":"2026-01-19","loads":1,"total_adds":8000,"overhead":0,"permits":0,"expenses":0,"net_pay":8000,"status":"draft"}];

// DATA MIGRATION v20260614: Fix "0.14" dispatch descriptions → "Dispatch Fee"
(function patchExpenseDescriptions(){
  try {
    const MIGRATION_KEY = 'nexus_migration_dispatch_desc_v1';
    if(localStorage.getItem(MIGRATION_KEY)) return; // already ran
    const raw = JSON.parse(localStorage.getItem('nexus_expenses')||'[]');
    let patched = 0;
    const fixed = raw.map(e => {
      if((e.description||'').trim() === '0.14' || (e.description||'').trim() === '0.1') {
        patched++;
        return {...e, description: 'Dispatch Fee'};
      }
      return e;
    });
    if(patched > 0) {
      localStorage.setItem('nexus_expenses', JSON.stringify(fixed));
      console.log('[Nexus Migration] Patched ' + patched + ' dispatch descriptions from "0.14" → "Dispatch Fee"');
    }
    localStorage.setItem(MIGRATION_KEY, '1');
  } catch(err) { console.warn('[Nexus Migration] dispatch_desc failed:', err); }
})();
