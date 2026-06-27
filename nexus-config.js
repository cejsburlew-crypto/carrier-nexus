// ============================================================
// CARRIER NEXUS â CONFIG (nexus-config.js)
// ============================================================

window.NEXUS_SUPABASE_URL = 'https://pzjfbjsntgdzbwtqhfqj.supabase.co';
window.NEXUS_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6amZianNudGdkemJ3dHFoZnFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDEyMjEsImV4cCI6MjA5NTU3NzIyMX0.9TRVm-geOXdwuWB828fOrfCKwuKWvlvN4Sv_cLIBXw8'; // disabled;
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
    driveRootId: '1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0',
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
// Passwords are stored as SHA-256 hashes â NEVER plaintext.
// Manage users via Admin > Users in the app.
// ============================================================
window.NEXUS_LOCAL_USERS = (function () {
  // SEED: source-of-truth credentials (hashes pushed here via GitHub API on password change)
  // active:false = profile exists but cannot log in yet
  var SEED = [
    { id:'usr_001', email:'crtruckus@gmail.com',         passwordHash:'f36c6387549f1d51a335c4c82b2731ac3bb8f71f9dafb259c925cc29e2a83218', role:'admin',          name:'Jim Burlew',       active:true,  createdAt:'2026-05-28' },
    { id:'usr_002', email:'lbmoreno92@gmail.com',        passwordHash:'f36c6387549f1d51a335c4c82b2731ac3bb8f71f9dafb259c925cc29e2a83218',                                         role:'approver',       name:'Laura Moreno',     memberId:'LM26165.0', active:true,  createdAt:'2026-06-14' },
    { id:'usr_003', email:'amet@carriertuckingus.com',   passwordHash:'',                                                                                 role:'dispatcher',     name:'Amet Abreu',       memberId:'AA26001.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_004', email:'betty@carriertuckingus.com',  passwordHash:'',                                                                                 role:'dispatcher',     name:'Betty Gutierrez',  memberId:'BG26002.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_005', email:'david@carriertuckingus.com',  passwordHash:'',                                                                                 role:'owner_operator', name:'David Fonseca',    memberId:'DF26003.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_006', email:'guillermo@carriertuckingus.com', passwordHash:'',                                                                              role:'owner_operator', name:'Guillermo Pinera', memberId:'GP26004.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_007', email:'miguel@carriertuckingus.com', passwordHash:'',                                                                                 role:'driver',         name:'Miguel Fonseca',   memberId:'MF26005.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_008', email:'nelson@carriertuckingus.com', passwordHash:'',                                                                                 role:'driver',         name:'Nelson Veliz',     memberId:'NV26006.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_009', email:'yosviel@carriertuckingus.com', passwordHash:'',                                                                                role:'driver',         name:'Yosviel Pinera',   memberId:'YP26007.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_010', email:'avis@carriertuckingus.com',   passwordHash:'',                                                                                 role:'driver',         name:'Avis Modesto',     memberId:'AM26008.0', active:false, createdAt:'2026-06-14' },
    { id:'usr_011', email:'jayler@carriertuckingus.com', passwordHash:'',                                                                                role:'driver',         name:'Jayler Labrada',   memberId:'JL26009.0', active:false, createdAt:'2026-06-20' },
    { id:'usr_hh_001', email:'admin@heavyhaulers.com',           passwordHash:'136dca28b583ddfbcb59986ae70c709fe32a4f93284dc94da12cfc3b9e400d64',                                                                                 role:'admin',          name:'HH Admin',         company:'co_002',     active:true, createdAt:'2026-06-26' }
  ];
  // Merge: SEED is source-of-truth for passwordHash (cross-device);
  // localStorage overrides name/role/active changes made via admin-users.html
  try {
    var stored = JSON.parse(localStorage.getItem('nexus_users') || '[]');
    var map = {};
    SEED.forEach(function(u){ map[u.email.toLowerCase()] = Object.assign({}, u); });
    stored.forEach(function(u) {
      var key = u.email.toLowerCase();
      if (map[key]) {
        var seedHash = map[key].passwordHash;
        map[key] = Object.assign({}, map[key], u);
        // SEED hash wins if stored has empty hash (ensures GitHub-pushed hashes propagate)
        if (!u.passwordHash && seedHash) map[key].passwordHash = seedHash;
      } else {
        map[key] = u;
      }
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
window.NEXUS_DATA_VERSION = '20260615a';
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

// DATA MIGRATION v20260614: Fix "0.14" dispatch descriptions â "Dispatch Fee"
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
      console.log('[Nexus Migration] Patched ' + patched + ' dispatch descriptions from "0.14" â "Dispatch Fee"');
    }
    localStorage.setItem(MIGRATION_KEY, '1');
  } catch(err) { console.warn('[Nexus Migration] dispatch_desc failed:', err); }
})();

// DATA MIGRATION v20260614b: Tag carry_forward expense entries + add carry_forward to settlements
(function patchCarryForwards(){
  try {
    const CF_KEY = 'nexus_migration_carry_forward_v1';
    if(localStorage.getItem(CF_KEY)) return;

    const cfRe = /previous pay negative|negative from previous|negative.*period|previous.*negative/i;

    // Tag expense carry_forward entries
    const exps = JSON.parse(localStorage.getItem('nexus_expenses')||'[]');
    let ePatched = 0;
    const expsFixed = exps.map(e => {
      if(cfRe.test(e.description||'') && !e.is_carry_forward) {
        ePatched++;
        return {...e, is_carry_forward: true};
      }
      return e;
    });
    if(ePatched > 0) localStorage.setItem('nexus_expenses', JSON.stringify(expsFixed));

    // Add carry_forward field to settlements
    const setts = JSON.parse(localStorage.getItem('nexus_settlements')||'[]');
    const cfEntsByDriver = {};
    expsFixed.filter(e=>e.is_carry_forward).forEach(e=>{
      const drv = (e.driver||'').toUpperCase().split(' ')[0];
      if(!cfEntsByDriver[drv]) cfEntsByDriver[drv]=[];
      cfEntsByDriver[drv].push({date:e.date, amount:parseFloat(e.amount)});
    });

    const settsFixed = setts.map(s=>{
      if(s.carry_forward !== undefined) return s; // already set
      const drv = (s.short || (s.driver||'').toUpperCase().split(' ')[0]);
      const cfList = (cfEntsByDriver[drv]||[]).filter(cf=>cf.date>=s.start&&cf.date<=s.end);
      const match = cfList[0];
      return {...s, carry_forward: match ? -(match.amount) : 0};
    });
    localStorage.setItem('nexus_settlements', JSON.stringify(settsFixed));

    localStorage.setItem(CF_KEY, '1');
    console.log('[Nexus Migration] carry_forward: tagged '+ePatched+' expense entries, patched '+settsFixed.length+' settlements');
  } catch(err) { console.warn('[Nexus Migration] carry_forward failed:', err); }
})();

// ============================================================
// MEMBER ID SYSTEM
// Format: {FI}{LI}{YY}{DDD}.{N}
// FI = first initial, LI = last initial, YY = 2-digit year,
// DDD = 3-digit day-of-year (Julian), N = collision counter (.0/.1/.2...)
// Generated at first login. Never changes. Never deleted.
// ============================================================
window.nexusMemberId = function(firstName, lastName, loginDate) {
  var d = loginDate ? new Date(loginDate) : new Date();
  var yy = String(d.getFullYear()).slice(2);
  var start = new Date(d.getFullYear(), 0, 0);
  var diff = d - start;
  var doy = Math.floor(diff / 86400000);
  var base = (firstName[0]||'X').toUpperCase() + (lastName[0]||'X').toUpperCase() + yy + String(doy).padStart(3,'0');
  // Check existing members for collision
  var allMembers = [];
  try { allMembers = JSON.parse(localStorage.getItem('nexus_member_profiles')||'[]'); } catch(e){}
  var collisions = allMembers.filter(function(m){ return m.memberId && m.memberId.startsWith(base+'.'); }).length;
  return base + '.' + collisions;
};

// ============================================================
// SEEDED MEMBER PROFILES (universal person directory)
// One record per human â never deleted. Company memberships are separate.
// ============================================================
window.NEXUS_SEED_MEMBERS = [
  { id:'mem_001', memberId:'JB26148.0', firstName:'Jim', lastName:'Burlew', email:'jim.burlew@jbca-inc.com', phone:'', type:'admin', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_002', memberId:'LM26165.0', firstName:'Laura', lastName:'Moreno', email:'lbmoreno92@gmail.com', phone:'', type:'approver', mc:'', dot:'', createdAt:'2026-06-14' },
  { id:'mem_003', memberId:'AA26148.0', firstName:'Amet', lastName:'Abreu', email:'', phone:'', type:'dispatcher', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_004', memberId:'BG26148.0', firstName:'Betty', lastName:'Gutierrez', email:'', phone:'', type:'dispatcher', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_005', memberId:'DF26148.0', firstName:'David', lastName:'Fonseca', email:'', phone:'', type:'owner_operator', mc:'MC 1688495-C', dot:'US DOT 4326039', createdAt:'2026-05-28' },
  { id:'mem_006', memberId:'GP26148.0', firstName:'Guillermo', lastName:'Pinera', email:'', phone:'', type:'owner_operator', mc:'MC 1688495-C', dot:'US DOT 4326039', createdAt:'2026-05-28' },
  { id:'mem_007', memberId:'MF26148.0', firstName:'Miguel', lastName:'Fonseca', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_008', memberId:'NV26148.0', firstName:'Nelson', lastName:'Veliz', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_009', memberId:'YP26148.0', firstName:'Yosviel', lastName:'Pinera', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_010', memberId:'AM26148.0', firstName:'Avis', lastName:'Modesto', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_011', memberId:'JL26009.0', firstName:'Jayler', lastName:'Labrada', email:'jayler@carriertuckingus.com', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-06-20' }
];

// ============================================================
// SEEDED COMPANY MEMBERSHIPS
// status: active | inactive | terminated | pending_rejoin
// roles: array â admin, dispatcher, driver, owner_operator, preparer, viewer
// ============================================================
window.NEXUS_SEED_COMPANY_MEMBERS = [
  { id:'cm_001', memberId:'JB26148.0', companyId:'carrier-trucking-us', roles:['admin'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:null, notes:'' },
  { id:'cm_002', memberId:'LM26165.0', companyId:'carrier-trucking-us', roles:['approver','preparer'], status:'active', joinedAt:'2026-06-14', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_003', memberId:'AA26148.0', companyId:'carrier-trucking-us', roles:['dispatcher'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_004', memberId:'BG26148.0', companyId:'carrier-trucking-us', roles:['dispatcher'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_005', memberId:'DF26148.0', companyId:'carrier-trucking-us', roles:['owner_operator'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_006', memberId:'GP26148.0', companyId:'carrier-trucking-us', roles:['owner_operator'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_007', memberId:'MF26148.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_008', memberId:'NV26148.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_009', memberId:'YP26148.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_010', memberId:'AM26148.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' },
  { id:'cm_011', memberId:'JL26009.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-06-20', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' }
];

// Boot: write seeds to localStorage if not yet present
(function seedMemberData(){
  try {
    if(!localStorage.getItem('nexus_member_profiles')) {
      localStorage.setItem('nexus_member_profiles', JSON.stringify(window.NEXUS_SEED_MEMBERS));
    }
    if(!localStorage.getItem('nexus_company_members')) {
      localStorage.setItem('nexus_company_members', JSON.stringify(window.NEXUS_SEED_COMPANY_MEMBERS));
    }
    // Seed Ana's login account if not present
    var users = JSON.parse(localStorage.getItem('nexus_users')||'[]');
    var hasLaura = users.some(function(u){ return u.email === 'lbmoreno92@gmail.com'; });
    if(!hasLaura) {
      users.push({
        id:'usr_002', email:'lbmoreno92@gmail.com',
        passwordHash:'', // no password until Laura sets it via invite flow
        role:'approver', name:'Laura Moreno', memberId:'LM26165.0', active:false,
        invitePending:true, createdAt:'2026-06-14'
      });
      localStorage.setItem('nexus_users', JSON.stringify(users));
    }
  } catch(e) { console.warn('[Nexus] Member seed failed:', e); }
})();

// Member helpers â used across the app
window.NexusMembers = {
  all: function() {
    try { return JSON.parse(localStorage.getItem('nexus_member_profiles')||'[]'); } catch(e){ return []; }
  },
  save: function(arr) { localStorage.setItem('nexus_member_profiles', JSON.stringify(arr)); },
  byId: function(mid) { return window.NexusMembers.all().find(function(m){ return m.memberId===mid; }); },
  companyMembers: function(companyId) {
    try {
      var cms = JSON.parse(localStorage.getItem('nexus_company_members')||'[]');
      return cms.filter(function(cm){ return cm.companyId===(companyId||'carrier-trucking-us'); });
    } catch(e){ return []; }
  },
  saveCompanyMembers: function(arr) { localStorage.setItem('nexus_company_members', JSON.stringify(arr)); },
  activeMembersForCompany: function(companyId) {
    var cms = window.NexusMembers.companyMembers(companyId).filter(function(cm){ return cm.status==='active'; });
    return cms.map(function(cm){
      var p = window.NexusMembers.byId(cm.memberId);
      return p ? Object.assign({}, p, { companyMember: cm }) : null;
    }).filter(Boolean);
  }
};

// ============================================================
// PUBLIC COMPANY PROFILES (for public-profile.html)
// ============================================================
const NEXUS_COMPANY_PROFILES = [
  {
    id: 'co_001',
    name: 'Carrier Trucking US',
    dba: 'Carrier Trucking',
    slug: 'carrier-trucking-us',
    usdot: '',
    mc: '',
    duns: '',
    founded: '2024',
    hq: 'Miami, FL',
    phone: '',
    email: 'crtruckus@gmail.com',
    website: '',
    tagline: 'Reliable. Professional. On Time.',
    about: 'Carrier Trucking US operates a modern fleet serving carriers and brokers across the United States.',
    services: ['Dry Van', 'Flatbed', 'OTR', 'Regional'],
    social: {},
    stats: { loads: 0, years_experience: 2, oos_days: 0, awards: 0, inspections_passed: 0 },
    brag: [],
    fleet_size: 6,
    public: true,
    verified_fmcsa: false,
    logo_url: '',
    banner_url: '',
    invite_token: 'ct2026inv',
    created: '2024-01-01'
  },
  {
    id: 'co_002',
    name: 'Heavy Hauling Heavy Haulers LLC',
    dba: 'Heavy Hauling',
    slug: 'heavy-hauling-heavy-haulers',
    usdot: '1150193',
    mc: '529493',
    duns: '045434921',
    founded: '2003',
    hq: 'Cashion, OK 73016',
    phone: '405-885-6040',
    fax: '1-800-858-6163',
    email: 'heavyhauling@execs.com',
    website: 'https://www.heavyhaulingheavyhaulers.com',
    tagline: 'Leading the Way in Heavy Haul',
    about: 'Heavy Hauling has been in business since 2003 with a total of 31 years of trucking experience. Let us put your mind at ease by taking the load off you. Specializing in oversize and superload transportation with an unmatched safety record.',
    services: ['Heavy Haul', 'Oversize / OD Loads', 'Superloads', 'Pre-Trip Planning', 'Pilot Car Services', 'Service Truck', 'Equipment Towing', 'Rental'],
    social: {
      facebook: 'https://www.facebook.com/HeavyHaulingHeavyHaulersLLC/',
      instagram: 'https://www.instagram.com/heavyhaulingheavy/',
      twitter: 'https://twitter.com/HeavyHauling8',
      linkedin: 'https://www.linkedin.com/in/albert-napolitano-7626b0a2/',
      youtube: 'https://www.youtube.com/channel/UCCqAsAgNcnFTfJ7rTb35Ilw'
    },
    stats: {
      loads: 10543,
      years_experience: 31,
      oos_days: 0,
      awards: 26,
      inspections_passed: 4,
      level1_inspections: 3,
      level2_inspections: 1,
      violations: 0
    },
    brag: [
      '10,543 loads completed with zero out-of-service days',
      '31 years of combined trucking experience',
      '26 industry awards won',
      '4 FMCSA roadside inspections â all passed, zero violations (as of Sept 2023)',
      '3 Level 1 and 1 Level 2 inspections â all clean',
      'Specializes in oversize and superloads requiring pre-trip engineering',
      'Oklahoma-based, serving all 48 contiguous states'
    ],
    fleet_size: 6,
    fleet: {
      trucks: ['2016 Peterbilt', '2014 Peterbilt', '2007 Western Star', '2005 Western Star'],
      service: ['Service Truck'],
      trailers: ['See Trailer Fleet Info page']
    },
    partners: ['Premier Truck Group (OKC)'],
    driver_app: 'https://intelliapp.driverapponline.com/c/heavyhaulingheavyhaulers',
    public: true,
    verified_fmcsa: true,
    safer_url: 'https://safer.fmcsa.dot.gov/CompanySnapshot.aspx',
    logo_url: '',
    banner_url: 'https://static.wixstatic.com/media/fe0499_a626f6b75291405894aefccafd37d522f002.jpg',
    invite_token: 'hhhh2026inv',
    created: '2026-06-26'
  }
];

if (typeof window !== 'undefined') {
  window.NEXUS_COMPANY_PROFILES = NEXUS_COMPANY_PROFILES;
  if (!localStorage.getItem('nexus_companies')) {
    localStorage.setItem('nexus_companies', JSON.stringify(NEXUS_COMPANY_PROFILES));
  }
}


// ============================================================
// NEXUS DEMO SEED DATA â Heavy Haul Focus
// Seeds localStorage on first load only. Real data always wins.
// Each key is only written if it doesn't already exist.
// ============================================================
(function NexusSeedDemo() {
  if (typeof window === 'undefined') return;

  // Guard: ONLY seed Carrier Trucking (co_001) data â never contaminate other companies
  var _seedActiveCo = (function(){
    try {
      return Storage.prototype._rawGet ?
        Storage.prototype._rawGet.call(localStorage, 'nexus_active_company') :
        localStorage.getItem('nexus_active_company');
    } catch(e) { return null; }
  })();
  if (_seedActiveCo && _seedActiveCo !== 'co_001') return;

  function seedKey(key, data) {
    // Always write to the raw unscoped key (co_001 legacy) AND the scoped co_001 key
    var rawGet = Storage.prototype._rawGet || localStorage.getItem.bind(localStorage);
    var rawSet = Storage.prototype._rawSet || localStorage.setItem.bind(localStorage);
    // Write to raw unscoped key (for co_001 proxy fallback)
    if (!rawGet.call(localStorage, key)) {
      rawSet.call(localStorage, key, typeof data === 'string' ? data : JSON.stringify(data));
    }
    // Also write to co_001: scoped key so proxy reads it cleanly
    var scopedKey = 'co_001:' + key;
    if (!rawGet.call(localStorage, scopedKey)) {
      rawSet.call(localStorage, scopedKey, typeof data === 'string' ? data : JSON.stringify(data));
    }
  }

  // Company info
  seedKey('nexus_my_usdot', '4521893');
  seedKey('nexus_my_mc', '1678234');
  seedKey('nexus_my_company_name', 'Carrier Trucking US');
  seedKey('nexus_my_dot_pin', '7823');
  seedKey('nexus_mcs150_last', '2025-03-15');
  seedKey('nexus_mcs150_next', '2027-03-15');
  seedKey('nexus_ucr_year', '2026');
  // seedKey('nexus_fmcsa_webkey', 'DEMO_KEY_REPLACE_WITH_REAL'); // Set real key via admin settings

  // Pay settings
  seedKey('nexus_pay_settings', { default_driver_pct: 18, dispatcher_pct_amet: 14, dispatcher_pct_betty: 13, fuel_card: 'EFS', quick_pay_discount: 2 });

  // ELD config
  seedKey('nexus_gps_eld_config', { provider: 'Motive', account_id: 'CTU-MOTIVE-2892', fleet_id: 'FL-CTU-HEAVY', api_key: '', last_sync: '2026-06-26T10:30:00.000Z' });

  // Equipment units
  seedKey('nexus_equipment_units', [
    { id: 'eq_101', unit_number: '101', type: 'power_unit', year: '2019', make: 'Peterbilt', model: '389', vin: '1XPWD40X1ED215307', license_plate: 'TX-CMV-101', state: 'TX', gvwr: 80000, axles: 5, engine: 'PACCAR MX-13 565HP', transmission: '18-Speed Eaton Fuller', fuel_type: 'Diesel', odometer: 287450, last_annual_inspection: '2025-12-01', next_pm_date: '2026-07-15', registration_expiry: '2026-12-31', insurance_policy: 'CTU-2026-HVY-8821', status: 'active', active_load: 'HH-2026-0891', driver: 'Testing Driver Martinez', notes: 'Primary heavy haul tractor. Pusher axle equipped.', lat: 30.0849, lng: -94.1341 },
    { id: 'eq_102', unit_number: '102', type: 'power_unit', year: '2021', make: 'Kenworth', model: 'W990', vin: '2NKHHM6X5MM000456', license_plate: 'TX-CMV-102', state: 'TX', gvwr: 80000, axles: 5, engine: 'PACCAR MX-13 510HP', transmission: '18-Speed Eaton Fuller', fuel_type: 'Diesel', odometer: 198320, last_annual_inspection: '2025-11-15', next_pm_date: '2026-08-01', registration_expiry: '2026-12-31', insurance_policy: 'CTU-2026-HVY-8822', status: 'active', active_load: 'HH-2026-0892', driver: 'Testing Driver Johnson', notes: 'Secondary heavy haul unit. Steerable lift axle.', lat: 27.8006, lng: -97.3964 },
    { id: 'eq_201', unit_number: '201', type: 'trailer', year: '2018', make: 'XL Specialized', model: '48ft RGN', vin: 'XLS18RGN00000201', license_plate: 'TX-TRL-201', state: 'TX', gvwr: 80000, axles: 3, deck_length: 48, deck_width: 102, capacity_tons: 40, last_annual_inspection: '2025-12-01', registration_expiry: '2026-12-31', status: 'active', attached_to: '101', notes: '48ft Removable Gooseneck. Hydraulic detach. Good for excavators and dozers.' },
    { id: 'eq_202', unit_number: '202', type: 'trailer', year: '2020', make: 'Load King', model: '55-Ton Lowboy', vin: 'LK20LB55T00000202', license_plate: 'TX-TRL-202', state: 'TX', gvwr: 110000, axles: 3, deck_length: 53, deck_width: 102, capacity_tons: 55, last_annual_inspection: '2025-10-20', registration_expiry: '2026-12-31', status: 'active', attached_to: '102', notes: '55-ton capacity. Flip axle. Used for wind tower components and transformers.' },
    { id: 'eq_301', unit_number: '301', type: 'trailer', year: '2017', make: 'Fontaine', model: '53ft Flatbed', vin: 'FTN17FB53T00000301', license_plate: 'TX-TRL-301', state: 'TX', gvwr: 48000, axles: 2, deck_length: 53, deck_width: 96, capacity_tons: 24, last_annual_inspection: '2026-01-10', registration_expiry: '2026-12-31', status: 'available', notes: 'Standard flatbed. Coil package. 22 chains, 8 binders.' }
  ]);

  // Dispatch loads
  seedKey('nexus_dispatch_loads', [
    { id: 'HH-2026-0891', load_number: 'HH-2026-0891', status: 'IN_TRANSIT', broker: 'TestingBroker Transport Solutions', broker_mc: '892341', broker_contact: 'Mike Testing', broker_phone: '(713) 555-0182', broker_email: 'dispatch@testingbroker.com', shipper: 'Testing Industrial Equipment Co.', consignee: 'Testing Construction Site OKC', origin: 'Beaumont, TX', origin_address: '4200 Testing Industrial Blvd, Beaumont, TX 77701', destination: 'Oklahoma City, OK', destination_address: '8800 Testing Construction Way, Oklahoma City, OK 73101', pickup_date: '2026-06-25', delivery_date: '2026-06-28', commodity: 'Caterpillar 395 Hydraulic Excavator', commodity_weight: 220000, commodity_weight_unit: 'lbs', total_length: '115ft', total_width: "18'6\"", total_height: "16'2\"", os_ow: true, pilot_required: true, pilot_count: 2, pilot_config: 'Front + Rear', unit: '101', driver: 'Testing Driver Martinez', trailer: '201', rate: 18750, fuel_surcharge: 1250, detention: 0, total_pay: 20000, driver_pay: 3375, driver_pay_pct: 18, miles: 610, rpm: 3.07, bol_number: 'BOL-HH-0891-2026', notes: 'Oversize load. Escort required all states. TX + OK permits attached. Night travel restricted.', permits: ['TX-2026-H-89234', 'OK-2026-4521'] },
    { id: 'HH-2026-0892', load_number: 'HH-2026-0892', status: 'LOADED', broker: 'Testing Freight Partners LLC', broker_mc: '445123', broker_contact: 'Sarah TestFreight', broker_phone: '(361) 555-0247', broker_email: 'ops@testingfreight.com', shipper: 'Testing Wind Energy Corp', consignee: 'Testing Wind Farm - Lubbock', origin: 'Corpus Christi, TX', origin_address: '1200 Testing Port Access Rd, Corpus Christi, TX 78401', destination: 'Lubbock, TX', destination_address: '5500 Testing Wind Farm Rd, Lubbock, TX 79401', pickup_date: '2026-06-26', delivery_date: '2026-06-29', commodity: 'Wind Turbine Blade GE 3.8-130', commodity_weight: 52000, commodity_weight_unit: 'lbs', total_length: '165ft', total_width: "14'0\"", total_height: "15'6\"", os_ow: true, pilot_required: true, pilot_count: 3, pilot_config: 'Front x2 + Rear x1', unit: '102', driver: 'Testing Driver Johnson', trailer: '202', rate: 22400, fuel_surcharge: 1800, detention: 450, total_pay: 24650, driver_pay: 4032, driver_pay_pct: 18, miles: 840, rpm: 2.66, bol_number: 'BOL-HH-0892-2026', notes: 'Extreme length. Blade transport dolly attached. Highway closures required in Nueces County. Move starts at 10pm.', permits: ['TX-2026-H-90102', 'TX-2026-H-90103'] },
    { id: 'HH-2026-0885', load_number: 'HH-2026-0885', status: 'DELIVERED', broker: 'TestingCarrier Direct Corp', broker_mc: '778902', broker_contact: 'James TestDirect', broker_phone: '(972) 555-0318', broker_email: 'loads@testingdirect.com', shipper: 'Testing Mining Equipment Rentals', consignee: 'Testing Aggregate Quarry Inc', origin: 'San Antonio, TX', destination: 'Midland, TX', pickup_date: '2026-06-20', delivery_date: '2026-06-21', commodity: 'Komatsu HD785 Haul Truck Body', commodity_weight: 178000, commodity_weight_unit: 'lbs', total_length: '92ft', total_width: "16'0\"", total_height: "14'8\"", os_ow: true, pilot_required: true, pilot_count: 2, unit: '101', driver: 'Testing Driver Martinez', trailer: '201', rate: 14200, fuel_surcharge: 980, detention: 200, total_pay: 15380, driver_pay: 2768, miles: 490, rpm: 2.90, bol_number: 'BOL-HH-0885-2026', notes: 'Delivered on time. No incidents.' }
  ]);

  // Brokers
  seedKey('nexus_brokers', [
    { id: 'br_001', name: 'TestingBroker Transport Solutions', mc_number: '892341', dot_number: '3421789', contact_name: 'Mike Testing', phone: '(713) 555-0182', email: 'dispatch@testingbroker.com', address: '1400 Testing Brokerage Pkwy, Houston, TX 77002', payment_terms: 'Quick Pay 2% / Net 30', credit_score: 92, avg_rpm: 3.10, loads_completed: 47, rating: 4.8, preferred: true, notes: 'Preferred broker for heavy haul in TX/OK corridor. Always pays on time.' },
    { id: 'br_002', name: 'Testing Freight Partners LLC', mc_number: '445123', dot_number: '2891034', contact_name: 'Sarah TestFreight', phone: '(361) 555-0247', email: 'ops@testingfreight.com', address: '850 Testing Freight Dr, Corpus Christi, TX 78401', payment_terms: 'Net 30', credit_score: 88, avg_rpm: 2.75, loads_completed: 23, rating: 4.5, preferred: false, notes: 'Specializes in wind energy components. Good volume in spring/summer.' },
    { id: 'br_003', name: 'TestingCarrier Direct Corp', mc_number: '778902', dot_number: '4102378', contact_name: 'James TestDirect', phone: '(972) 555-0318', email: 'loads@testingdirect.com', address: '2200 Testing Corporate Blvd, Dallas, TX 75201', payment_terms: 'Quick Pay 1.5% / Net 45', credit_score: 85, avg_rpm: 2.95, loads_completed: 31, rating: 4.2, preferred: false, notes: 'Mining and aggregate industry. Midwest and Texas focus.' }
  ]);

  // Permits
  seedKey('nexus_permits', [
    { id: 'pmt_001', permit_number: 'TX-2026-H-89234', state: 'TX', type: 'OS/OW - Single Trip', issued: '2026-06-23', expires: '2026-06-28', unit: '101', trailer: '201', load: 'HH-2026-0891', commodity: 'Caterpillar 395 Excavator', max_weight: 220000, max_width: "18'6\"", max_height: "16'2\"", max_length: '115ft', route: 'I-10 E to US-69 N to US-271 N to I-40 W', travel_restrictions: 'No travel 30 min before sunset to 30 min after sunrise. No holiday travel.', escort_required: '2 pilot cars', permit_fee: 385, status: 'ACTIVE', doc_url: '' },
    { id: 'pmt_002', permit_number: 'OK-2026-4521', state: 'OK', type: 'OS/OW - Single Trip', issued: '2026-06-23', expires: '2026-06-28', unit: '101', trailer: '201', load: 'HH-2026-0891', commodity: 'Caterpillar 395 Excavator', max_weight: 220000, max_width: "18'6\"", max_height: "16'2\"", max_length: '115ft', route: 'I-40 W to I-35 N to OK-152 W', travel_restrictions: 'Daylight only. Escort required at all times.', escort_required: '2 pilot cars', permit_fee: 290, status: 'ACTIVE', doc_url: '' },
    { id: 'pmt_003', permit_number: 'TX-2026-H-90102', state: 'TX', type: 'OS/OW - Single Trip', issued: '2026-06-25', expires: '2026-06-30', unit: '102', trailer: '202', load: 'HH-2026-0892', commodity: 'Wind Turbine Blade GE 3.8-130', max_weight: 80000, max_width: "14'0\"", max_height: "15'6\"", max_length: '165ft', route: 'US-77 N to US-181 N to I-37 N to US-83 N to US-87 N', travel_restrictions: 'Night move only (10pm-6am). Requires utility company coordination on Hwy 83.', escort_required: '3 pilot cars + 1 crane at origin', permit_fee: 520, status: 'ACTIVE', doc_url: '' },
    { id: 'pmt_004', permit_number: 'TX-2026-H-87891', state: 'TX', type: 'OS/OW - Annual', issued: '2026-01-01', expires: '2026-12-31', unit: '101', trailer: '201', load: '', commodity: 'Construction Equipment - General', max_weight: 200000, max_width: "16'0\"", max_height: "15'0\"", max_length: '110ft', route: 'Statewide Texas', travel_restrictions: 'Daylight only. Escort required for loads over 14ft wide.', escort_required: 'Varies by load dimensions', permit_fee: 1800, status: 'ACTIVE', doc_url: '' }
  ]);

  // Pilot escort companies
  seedKey('nexus_pilot_companies', [
    { id: 'pilot_001', company_name: 'Testing Pilot Escort Services LLC', contact_name: 'Ray TestPilot', phone: '(713) 555-0401', email: 'dispatch@testingpilot.com', address: '300 Testing Escort Way, Houston, TX 77001', states_covered: ['TX', 'OK', 'LA', 'AR', 'NM'], vehicles: 3, rate_per_day: 650, rate_per_mile: 2.50, insurance_carrier: 'Progressive Commercial', insurance_policy: 'PCO-9821-TEST', insurance_expiry: '2027-01-31', coi_on_file: true, rating: 4.9, preferred: true, notes: 'Our go-to escort company. Always on time. Drivers all certified.' },
    { id: 'pilot_002', company_name: 'TestPilot Pro LLC', contact_name: 'Linda TestPro', phone: '(214) 555-0523', email: 'info@testpilotpro.com', address: '1100 Testing Pilot Dr, Dallas, TX 75201', states_covered: ['TX', 'OK', 'KS', 'MO', 'NM', 'CO'], vehicles: 5, rate_per_day: 600, rate_per_mile: 2.25, insurance_carrier: 'Nationwide Commercial', insurance_policy: 'NWC-4421-TPRO', insurance_expiry: '2026-11-30', coi_on_file: true, rating: 4.6, preferred: false, notes: 'Good backup option. Better rates for long-haul runs.' }
  ]);

  // Pilot assignments
  seedKey('nexus_pilot_assignments', [
    { id: 'pa_001', load_id: 'HH-2026-0891', company_id: 'pilot_001', company_name: 'Testing Pilot Escort Services LLC', pilot_driver: 'Carlos TestEscort', pilot_vehicle: '2022 Toyota 4Runner - White - TX PLT-TEST-01', position: 'FRONT', contact_phone: '(713) 555-9001', status: 'ACTIVE', assigned_date: '2026-06-24', coi_verified: true, notes: 'Lead pilot. Has route survey completed.' },
    { id: 'pa_002', load_id: 'HH-2026-0891', company_id: 'pilot_001', company_name: 'Testing Pilot Escort Services LLC', pilot_driver: 'Maria TestEscort2', pilot_vehicle: '2021 Chevy Tahoe - Orange - TX PLT-TEST-02', position: 'REAR', contact_phone: '(713) 555-9002', status: 'ACTIVE', assigned_date: '2026-06-24', coi_verified: true, notes: 'Rear pilot. Experienced with excavator loads.' },
    { id: 'pa_003', load_id: 'HH-2026-0892', company_id: 'pilot_002', company_name: 'TestPilot Pro LLC', pilot_driver: 'Dave TestPro1', pilot_vehicle: '2023 Ford F-150 - Yellow - TX PLT-PRO-01', position: 'FRONT', contact_phone: '(214) 555-8801', status: 'ASSIGNED', assigned_date: '2026-06-25', coi_verified: true, notes: 'Blade load experience required. Confirmed.' },
    { id: 'pa_004', load_id: 'HH-2026-0892', company_id: 'pilot_002', company_name: 'TestPilot Pro LLC', pilot_driver: 'Annie TestPro2', pilot_vehicle: '2022 Dodge Ram 1500 - Yellow - TX PLT-PRO-02', position: 'FRONT_2', contact_phone: '(214) 555-8802', status: 'ASSIGNED', assigned_date: '2026-06-25', coi_verified: true, notes: 'Second front pilot for 165ft blade.' },
    { id: 'pa_005', load_id: 'HH-2026-0892', company_id: 'pilot_001', company_name: 'Testing Pilot Escort Services LLC', pilot_driver: 'Bob TestEscort3', pilot_vehicle: '2020 Chevy Silverado - Orange - TX PLT-TEST-03', position: 'REAR', contact_phone: '(713) 555-9003', status: 'ASSIGNED', assigned_date: '2026-06-25', coi_verified: false, notes: 'COI requested, pending receipt. Follow up before move.' }
  ]);

  // Documents
  seedKey('nexus_documents', [
    { id: 'doc_001', type: 'cdl', category: 'DRIVER', name: 'CDL - Testing Driver Martinez', driver: 'Testing Driver Martinez', unit: '', doc_number: 'TX-CDL-MARTINEZ-001', issue_date: '2022-03-10', expiry_date: '2028-03-10', issuing_state: 'TX', cdl_class: 'Class A', endorsements: ['H - Hazmat', 'N - Tank', 'X - Combo Tank/Hazmat', 'T - Double/Triple'], status: 'VALID', uploaded: '2026-01-05', notes: 'Oversize load certified. 15 years CDL experience.' },
    { id: 'doc_002', type: 'medical', category: 'DRIVER', name: 'Medical Cert - Testing Driver Martinez', driver: 'Testing Driver Martinez', unit: '', doc_number: 'MED-CERT-MARTINEZ-2024', issue_date: '2024-10-15', expiry_date: '2026-10-15', examiner: 'Dr. Testing Medical Examiners Inc.', examiner_npi: '1891234567', restrictions: 'None', status: 'VALID', uploaded: '2024-10-16' },
    { id: 'doc_003', type: 'cdl', category: 'DRIVER', name: 'CDL - Testing Driver Johnson', driver: 'Testing Driver Johnson', unit: '', doc_number: 'TX-CDL-JOHNSON-002', issue_date: '2020-07-22', expiry_date: '2026-07-22', issuing_state: 'TX', cdl_class: 'Class A', endorsements: ['N - Tank', 'T - Double/Triple'], status: 'EXPIRING_SOON', uploaded: '2026-01-05', notes: 'Renewal due July 2026. Remind 60 days out.' },
    { id: 'doc_004', type: 'medical', category: 'DRIVER', name: 'Medical Cert - Testing Driver Johnson', driver: 'Testing Driver Johnson', unit: '', doc_number: 'MED-CERT-JOHNSON-2025', issue_date: '2025-05-20', expiry_date: '2027-05-20', examiner: 'TestMed Occupational Health LLC', examiner_npi: '1234509876', restrictions: 'Must wear corrective lenses', status: 'VALID', uploaded: '2025-05-21' },
    { id: 'doc_005', type: 'annual_inspection', category: 'VEHICLE', name: 'Annual Inspection - Unit 101 Peterbilt', driver: '', unit: '101', doc_number: 'INSP-2025-DEC-101', issue_date: '2025-12-01', expiry_date: '2026-12-01', inspector: 'Testing Truck and Trailer Service', inspector_vin_confirmed: '1XPWD40X1ED215307', defects_found: 'None', status: 'VALID', uploaded: '2025-12-02' },
    { id: 'doc_006', type: 'annual_inspection', category: 'VEHICLE', name: 'Annual Inspection - Unit 102 Kenworth', driver: '', unit: '102', doc_number: 'INSP-2025-NOV-102', issue_date: '2025-11-15', expiry_date: '2026-11-15', inspector: 'Testing Truck and Trailer Service', inspector_vin_confirmed: '2NKHHM6X5MM000456', defects_found: 'Replaced brake pads axle 3. Adjusted 5th wheel.', status: 'VALID', uploaded: '2025-11-16' },
    { id: 'doc_007', type: 'bol', category: 'LOAD', name: 'BOL - HH-2026-0891 - Cat 395 Excavator', driver: 'Testing Driver Martinez', unit: '101', load_id: 'HH-2026-0891', doc_number: 'BOL-HH-0891-2026', issue_date: '2026-06-25', expiry_date: '', shipper: 'Testing Industrial Equipment Co.', consignee: 'Testing Construction Site OKC', commodity: 'Caterpillar 395 Hydraulic Excavator', weight: '220,000 lbs', status: 'ACTIVE', uploaded: '2026-06-25' },
    { id: 'doc_008', type: 'ratecon', category: 'LOAD', name: 'Rate Con - HH-2026-0891 - TestingBroker', driver: 'Testing Driver Martinez', unit: '101', load_id: 'HH-2026-0891', doc_number: 'RC-TBTS-0891-2026', issue_date: '2026-06-23', expiry_date: '', broker: 'TestingBroker Transport Solutions', rate: '$18,750', status: 'ACTIVE', uploaded: '2026-06-23' },
    { id: 'doc_009', type: 'bol', category: 'LOAD', name: 'BOL - HH-2026-0892 - Wind Turbine Blade', driver: 'Testing Driver Johnson', unit: '102', load_id: 'HH-2026-0892', doc_number: 'BOL-HH-0892-2026', issue_date: '2026-06-26', expiry_date: '', shipper: 'Testing Wind Energy Corp', consignee: 'Testing Wind Farm - Lubbock', commodity: 'Wind Turbine Blade GE 3.8-130', weight: '52,000 lbs', status: 'ACTIVE', uploaded: '2026-06-26' },
    { id: 'doc_010', type: 'insurance', category: 'CARRIER', name: 'Insurance Certificate - Carrier Trucking US', driver: '', unit: '', doc_number: 'BMC-91-CTU-2026', issue_date: '2026-01-01', expiry_date: '2027-01-01', carrier: 'Great West Casualty Company', policy_number: 'GWC-HVY-2026-CTU-8821', coverage_amount: '$1,000,000', status: 'VALID', uploaded: '2026-01-03' },
    { id: 'doc_011', type: 'permit', category: 'PERMIT', name: 'OS/OW Permit TX-2026-H-89234 - Unit 101', driver: 'Testing Driver Martinez', unit: '101', load_id: 'HH-2026-0891', doc_number: 'TX-2026-H-89234', issue_date: '2026-06-23', expiry_date: '2026-06-28', state: 'TX', status: 'ACTIVE', uploaded: '2026-06-23' },
    { id: 'doc_012', type: 'permit', category: 'PERMIT', name: 'OS/OW Permit TX-2026-H-90102 - Unit 102', driver: 'Testing Driver Johnson', unit: '102', load_id: 'HH-2026-0892', doc_number: 'TX-2026-H-90102', issue_date: '2026-06-25', expiry_date: '2026-06-30', state: 'TX', status: 'ACTIVE', uploaded: '2026-06-25' },
    { id: 'doc_013', type: 'w9', category: 'CARRIER', name: 'W-9 - Carrier Trucking US', driver: '', unit: '', doc_number: 'W9-CTU-2025', issue_date: '2025-01-10', expiry_date: '', status: 'VALID', uploaded: '2025-01-10' }
  ]);

  // GPS vehicles
  seedKey('nexus_gps_vehicles', [
    { id: 'v101', unit: '101', driver: 'Testing Driver Martinez', lat: 30.0849, lng: -94.1341, speed: 58, heading: 'NW', last_update: '2026-06-26T10:30:00.000Z', status: 'MOVING', eld_provider: 'Motive', eld_id: 'MOT-101-CTU' },
    { id: 'v102', unit: '102', driver: 'Testing Driver Johnson', lat: 27.8006, lng: -97.3964, speed: 0, heading: 'N', last_update: '2026-06-26T10:30:00.000Z', status: 'STOPPED', eld_provider: 'Motive', eld_id: 'MOT-102-CTU' },
    { id: 'v301', unit: '301', driver: '', lat: 29.7604, lng: -95.3698, speed: 0, heading: '', last_update: '2026-06-26T10:30:00.000Z', status: 'YARD', eld_provider: '', eld_id: '' }
  ]);

  // Expenses
  seedKey('nexus_expenses', [
    { id: 'exp_001', date: '2026-06-25', type: 'FUEL', description: 'Pilot Flying J - Beaumont TX - Unit 101', amount: 487.23, unit: '101', driver: 'Testing Driver Martinez', load: 'HH-2026-0891', method: 'EFS Fuel Card', receipt: 'RCPT-EFS-001' },
    { id: 'exp_002', date: '2026-06-25', type: 'PERMIT', description: 'TX OS/OW Permit #TX-2026-H-89234', amount: 385.00, unit: '101', driver: '', load: 'HH-2026-0891', method: 'Company Card', receipt: 'RCPT-TX-PMT-001' },
    { id: 'exp_003', date: '2026-06-25', type: 'PERMIT', description: 'OK OS/OW Permit #OK-2026-4521', amount: 290.00, unit: '101', driver: '', load: 'HH-2026-0891', method: 'Company Card', receipt: 'RCPT-OK-PMT-001' },
    { id: 'exp_004', date: '2026-06-25', type: 'PILOT_CAR', description: 'Testing Pilot Escort Services - 2 Cars - HH-0891', amount: 1300.00, unit: '101', driver: '', load: 'HH-2026-0891', method: 'Zelle', receipt: '' },
    { id: 'exp_005', date: '2026-06-26', type: 'FUEL', description: "Love's Travel Stop - Corpus Christi TX - Unit 102", amount: 412.85, unit: '102', driver: 'Testing Driver Johnson', load: 'HH-2026-0892', method: 'EFS Fuel Card', receipt: 'RCPT-EFS-002' },
    { id: 'exp_006', date: '2026-06-26', type: 'PERMIT', description: 'TX OS/OW Permit #TX-2026-H-90102', amount: 520.00, unit: '102', driver: '', load: 'HH-2026-0892', method: 'Company Card', receipt: 'RCPT-TX-PMT-002' },
    { id: 'exp_007', date: '2026-06-23', type: 'MAINTENANCE', description: 'Oil change + filter service - Unit 101 - Testing Truck Service', amount: 285.00, unit: '101', driver: '', load: '', method: 'Company Card', receipt: 'RCPT-SVC-001' },
    { id: 'exp_008', date: '2026-06-20', type: 'TOLL', description: 'TX-288 Toll + TX-8 Beltway - Unit 101', amount: 48.75, unit: '101', driver: 'Testing Driver Martinez', load: 'HH-2026-0885', method: 'TxTag', receipt: '' }
  ]);

  // Inject testing drivers into NEXUS_LOCAL_USERS if they don't already exist
  var usersRaw = localStorage.getItem('NEXUS_LOCAL_USERS');
  if (usersRaw) {
    try {
      var users = JSON.parse(usersRaw);
      var existingIds = users.map(function(u) { return u.id; });
      var added = false;
      if (existingIds.indexOf('usr_011') === -1) {
        users.push({ id: 'usr_011', email: 'martinez@carriertuckingus.com', name: 'Testing Driver Martinez', role: 'driver', active: false, is_demo: true, phone: '(832) 555-0741', cdl: 'TX-CDL-MARTINEZ-001', cdl_class: 'Class A', endorsements: 'H,N,X,T', hire_date: '2021-03-15', companyIds: ['co_001'] });
        added = true;
      }
      if (existingIds.indexOf('usr_012') === -1) {
        users.push({ id: 'usr_012', email: 'johnson@carriertuckingus.com', name: 'Testing Driver Johnson', role: 'driver', active: false, is_demo: true, phone: '(512) 555-0392', cdl: 'TX-CDL-JOHNSON-002', cdl_class: 'Class A', endorsements: 'N,T', hire_date: '2022-08-01', companyIds: ['co_001'] });
        added = true;
      }
      if (added) {
        localStorage.setItem('NEXUS_LOCAL_USERS', JSON.stringify(users));
      }
    } catch(e) {}
  }

})();
