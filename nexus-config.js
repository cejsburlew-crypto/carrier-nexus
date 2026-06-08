// ============================================================
// CARRIER NEXUS — CONFIG  (nexus-config.js)
//
// SUPABASE (optional — leave placeholder to use local auth):
// 1. Create a project at https://supabase.com
// 2. Go to Project Settings → API
// 3. Copy Project URL → NEXUS_SUPABASE_URL
// 4. Copy anon/public key → NEXUS_SUPABASE_KEY
// ============================================================

window.NEXUS_SUPABASE_URL = 'https://qcznatakapbknqafiszy.supabase.co';
window.NEXUS_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjem5hdGFrYXBia25xYWZpc3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNzczOTcsImV4cCI6MjA5NTg1MzM5N30.Yb6XURoJbWinc50pSCsFWukZcRPGL9lniOM2h8Ypgbg';

// ============================================================
// LOCAL USER STORE  (used when Supabase is not configured)
// Passwords are stored as SHA-256 hashes — NEVER plaintext.
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
