// ============================================================
// CARRIER NEXUS — CONFIG (nexus-config.js)
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
    { id:'usr_011', email:'jayler@carriertuckingus.com', passwordHash:'',                                                                                role:'driver',         name:'Jayler Labrada',   memberId:'JL26009.0', active:false, createdAt:'2026-06-20' }
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
// One record per human — never deleted. Company memberships are separate.
// ============================================================
window.NEXUS_SEED_MEMBERS = [
  { id:'mem_001', memberId:'JB26148.0', firstName:'Jim', lastName:'Burlew', email:'jim.burlew@jbca-inc.com', phone:'', type:'admin', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_002', memberId:'LM26165.0', firstName:'Laura', lastName:'Moreno', email:'lbmoreno92@gmail.com', phone:'', type:'approver', mc:'', dot:'', createdAt:'2026-06-14' },
  { id:'mem_003', memberId:'AA26148.0', firstName:'Amet', lastName:'Abreu', email:'', phone:'', type:'dispatcher', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_004', memberId:'BG26148.0', firstName:'Betty', lastName:'Gutierrez', email:'', phone:'', type:'dispatcher', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_005', memberId:'DF26148.0', firstName:'David', lastName:'Fonseca', email:'', phone:'', type:'owner_operator', mc:'MC 1688495-C', dot:'US DOT 4326039', createdAt:'2026-05-28' },
  { id:'mem_006', memberId:'GP26148.0', firstName:'Guillermo', lastName:'Pinera', email:'', phone:'', type:'owner_operator', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_007', memberId:'MF26148.0', firstName:'Miguel', lastName:'Fonseca', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_008', memberId:'NV26148.0', firstName:'Nelson', lastName:'Veliz', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_009', memberId:'YP26148.0', firstName:'Yosviel', lastName:'Pinera', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' },
  { id:'mem_010', memberId:'AM26148.0', firstName:'Avis', lastName:'Modesto', email:'', phone:'', type:'driver', mc:'', dot:'', createdAt:'2026-05-28' }
];

// ============================================================
// SEEDED COMPANY MEMBERSHIPS
// status: active | inactive | terminated | pending_rejoin
// roles: array — admin, dispatcher, driver, owner_operator, preparer, viewer
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
  { id:'cm_010', memberId:'AM26148.0', companyId:'carrier-trucking-us', roles:['driver'], status:'active', joinedAt:'2026-05-28', deactivatedAt:null, terminatedAt:null, approvedBy:'JB26148.0', notes:'' }
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

// Member helpers — used across the app
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
