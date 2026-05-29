// ============================================================
// CARRIER NEXUS — CONFIGURATION  (nexus-config.js)
//
// SUPABASE: https://supabase.com → Project Settings → API
// GOOGLE:   https://console.cloud.google.com → Credentials
// ============================================================

// --- SUPABASE ---
window.NEXUS_SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
window.NEXUS_SUPABASE_KEY = 'YOUR_ANON_KEY';

// --- GOOGLE OAUTH (paste Client ID from Google Cloud Console) ---
window.NEXUS_GOOGLE_CLIENT_ID = '';

// --- GOOGLE DRIVE FOLDERS (add as many as needed) ---
window.NEXUS_DRIVE_FOLDERS = [
  { name: 'Main Vault', id: '1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0', url: 'https://drive.google.com/drive/folders/1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0' }
  // Add more folders:
  // { name: 'Driver Docs', id: 'FOLDER_ID_HERE', url: 'https://drive.google.com/drive/folders/FOLDER_ID_HERE' },
];

// --- GMAIL ACCOUNTS (add as many as needed) ---
window.NEXUS_GMAIL_ACCOUNTS = [
  { name: 'Operations', email: '' }
  // Add more accounts:
  // { name: 'Billing', email: 'billing@yourco.com' },
];

// --- WHATSAPP SOURCES via Make.com (add as many as needed) ---
window.NEXUS_WHATSAPP_SOURCES = [
  { name: 'documentos', makeWebhook: '' }
  // Add more sources:
  // { name: 'Driver Group', makeWebhook: 'https://hook.make.com/YOUR_WEBHOOK' },
];
