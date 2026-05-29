// ============================================================
// CARRIER NEXUS ??? CONFIG  (nexus-config.js)
//
// SUPABASE (optional ??? leave placeholder to use local auth):
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings ??? API
// 3. Copy Project URL ??? NEXUS_SUPABASE_URL
// 4. Copy anon/public key ??? NEXUS_SUPABASE_KEY
// ============================================================

window.NEXUS_SUPABASE_URL = '';
window.NEXUS_SUPABASE_KEY = '';

// ============================================================
// LOCAL USER STORE  (used when Supabase is not configured)
// Passwords are stored as SHA-256 hashes ??? NEVER plaintext.
// Manage users via Admin > Users in the app.
// ============================================================
window.NEXUS_LOCAL_USERS = (function () {
  var SEED = [
    {
      id:           'usr_001',
      email:        'crtruckus@gmail.com',
      passwordHash: 'a1d53f92e807716715a0cb4458299c8e25175f5c5c9644af3ef640538a830069',
      role:         'admin',
      name:         'Admin',
      active:       true,
      createdAt:    '2026-05-28'
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
// GOOGLE DRIVE VAULT CONFIG
// ============================================================
window.NEXUS_VAULT_ROOT_ID = '1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0';

// ============================================================
// GOOGLE OAUTH CLIENT ID
// ============================================================
window.NEXUS_GOOGLE_CLIENT_ID = '';

// ============================================================
// GMAIL / WHATSAPP SYNC ACCOUNTS
// ============================================================
window.NEXUS_GMAIL_ACCOUNTS = [
  { email: 'crtruckus@gmail.com', label: 'CRT Truck US' }
];


// ============================================================
// LOCAL FLEET DATA
// ============================================================
window.NEXUS_LOCAL_FLEET = [
  { id: 'unit-75',   unit: '75',   year: 2020, make: 'INTERNATIONAL', model: 'LS532',   vin: '3HSLGAPR6LN263275', eld: 'Connected',     eldSource: '2BRO' },
  { id: 'unit-1022', unit: '1022', year: 2019, make: 'INTERNATIONAL', model: 'LT625',   vin: '3HSDZAPR9KN470465', eld: 'Connected',     eldSource: '2BRO' },
  { id: 'unit-24',   unit: '24',   year: 2007, make: 'PETERBILT',     model: '379',     vin: '1XP5DB9XT7D665562', eld: 'Not Connected', eldSource: '2BRO' },
  { id: 'unit-007',  unit: '007',  year: 2019, make: 'PETERBILT',     model: '579',     vin: '1XPBD49X6KD480527', eld: 'Not Connected', eldSource: 'Top Tracking System ELD' },
  { id: 'unit-035',  unit: '035',  year: 2013, make: 'PETERBILT',     model: '386',     vin: '1XPHDP9X5DD194697', eld: 'Not Connected', eldSource: 'COI' },
  { id: 'unit-ex',   unit: '—', year: 1993, make: 'PETERBILT', model: '379', vin: '1XP5DB9X0PN334269', eld: 'ELD Exempt', eldSource: 'COI' }
];
