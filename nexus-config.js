// ============================================================
// CARRIER NEXUS â CONFIG (nexus-config.js)
//
// SUPABASE (optional â leave placeholder to use local auth):
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings â API
// 3. Copy Project URL â NEXUS_SUPABASE_URL
// 4. Copy anon/public key â NEXUS_SUPABASE_KEY
// ============================================================

window.NEXUS_SUPABASE_URL = 'https://qcznatakapbknqafiszy.supabase.co';
window.NEXUS_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjem5hdGFrYXBia25xYWZpc3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzczOTcsImV4cCI6MjA5NTg1MzM5N30.Yb6XURoJbWinc50pSCsFWukZcRPGL9lniOM2h8Ypgbg';
window.NEXUS_GOOGLE_CLIENT_ID = '662145578280-f03nl1nqti0c6v3kojpbkbvognc10coj.apps.googleusercontent.com';
window.NEXUS_VAULT_ROOT_ID = '1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0';

// ============================================================
// LOCAL USER STORE (used when Supabase is not configured)
// Passwords are stored as SHA-256 hashes â NEVER plaintext.
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
