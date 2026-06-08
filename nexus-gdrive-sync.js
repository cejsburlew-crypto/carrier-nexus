// ============================================================
// CARRIER NEXUS — GOOGLE DRIVE SYNC ENGINE (nexus-gdrive-sync.js)
// ============================================================
// Reads files from Google Drive (CarrierNexus Inbox folder)
// since last sync, extracts text metadata, and saves to Supabase.
// PDFs stay in Google Drive — only metadata/text is imported.
// ============================================================

(function () {
    'use strict';

   var VAULT_ROOT = '';
    var CLIENT_ID = '';
    var SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
    var DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    var _sb = null;

   function getConfig() {
         VAULT_ROOT = window.NEXUS_VAULT_ROOT_ID || '';
         CLIENT_ID = window.NEXUS_GOOGLE_CLIENT_ID || '';
   }

   function getSB() {
         if (_sb) return _sb;
         var url = window.NEXUS_SUPABASE_URL;
         var key = window.NEXUS_SUPABASE_KEY;
         if (!url || !key) return null;
         if (typeof supabase === 'undefined') return null;
         _sb = supabase.createClient(url, key);
         return _sb;
   }

   function setStatus(msg, isError) {
         var el = document.getElementById('nexus-sync-status');
         if (!el) {
                 el = document.createElement('span');
                 el.id = 'nexus-sync-status';
                 el.style.cssText = 'margin-left:12px;font-size:12px;font-weight:600;';
                 var btn = document.getElementById('nexus-update-btn');
                 if (btn && btn.parentNode) btn.parentNode.insertBefore(el, btn.nextSibling);
         }
         el.textContent = msg;
         el.style.color = isError ? '#ff4d4d' : '#00e5a0';
   }

   // ---- Supabase helpers ----

   async function getLastSyncTime() {
         var sb = getSB();
         if (!sb) return null;
         try {
                 var resp = await sb.from('nexus_sync_log')
                   .select('synced_at')
                   .order('synced_at', { ascending: false })
                   .limit(1)
                   .single();
                 return resp.data ? resp.data.synced_at : null;
         } catch (e) {
                 return null;
         }
   }

   async function updateLastSyncTime() {
         var sb = getSB();
         if (!sb) return;
         try {
                 await sb.from('nexus_sync_log').insert({ synced_at: new Date().toISOString() });
         } catch (e) { /* ignore */ }
   }

   async function saveDocument(file, textContent) {
         var sb = getSB();
         if (!sb) {
                 console.warn('Supabase not available — skipping save for', file.name);
                 return;
         }
         var docType = classifyDocument(file.name.toLowerCase());
         var doc = {
                 drive_file_id: file.id,
                 file_name: file.name,
                 mime_type: file.mimeType,
                 drive_modified_time: file.modifiedTime,
                 doc_type: docType,
                 text_content: textContent,
                 imported_at: new Date().toISOString()
         };
         try {
                 await sb.from('nexus_documents').upsert(doc, { onConflict: 'drive_file_id' });
         } catch (e) {
                 console.warn('Save error for', file.name, e);
         }
   }

   // ---- Document classification ----

   function classifyDocument(n) {
         if (n.includes('settlement') || n.includes('bol') || n.includes('bill of lading')) return 'bol';
         if (n.includes('rate') || n.includes('confirmation')) return 'rate_confirmation';
         if (n.includes('pod') || n.includes('proof of delivery')) return 'pod';
         if (n.includes('invoice')) return 'invoice';
         if (n.includes('permit')) return 'permit';
         if (n.includes('insurance') || n.includes('cert')) return 'insurance';
         if (n.includes('license') || n.includes('cdl')) return 'license';
         if (n.includes('ifta')) return 'ifta';
         if (n.includes('dot') || n.includes('inspection')) return 'inspection';
         return 'other';
   }

   // ---- Google Drive helpers ----

   async function listNewFiles(folderId, sinceTime) {
         var q = '"' + folderId + '" in parents and trashed = false';
         if (sinceTime) {
                 q += ' and modifiedTime > "' + sinceTime + '"';
         }
         var resp = await gapi.client.drive.files.list({
                 q: q,
                 fields: 'files(id,name,mimeType,modifiedTime)',
                 pageSize: 100,
                 orderBy: 'modifiedTime desc'
         });
         return resp.result.files || [];
   }

   async function extractText(file) {
         if (file.mimeType === 'application/vnd.google-apps.document') {
                 try {
                           var resp = await gapi.client.drive.files.export({
                                       fileId: file.id,
                                       mimeType: 'text/plain'
                           });
                           return (resp.body || '').substring(0, 8000);
                 } catch (e) {
                           return '';
                 }
         }
         return '';
   }

   // ---- Main sync logic ----

   async function doSync() {
         getConfig();
         if (!VAULT_ROOT) {
                 setStatus('No vault folder configured. Set NEXUS_VAULT_ROOT_ID in nexus-config.js', true);
                 return;
         }
         if (!CLIENT_ID) {
                 setStatus('Google Client ID not configured. Set NEXUS_GOOGLE_CLIENT_ID in nexus-config.js', true);
                 return;
         }
         setStatus('Connecting to Google Drive...');
         var lastSync = await getLastSyncTime();
         var sinceTxt = lastSync
           ? 'since ' + new Date(lastSync).toLocaleString()
                 : '(full sync)';
         setStatus('Scanning Drive ' + sinceTxt + '...');
         try {
                 var files = await listNewFiles(VAULT_ROOT, lastSync);
                 if (!files.length) {
                           setStatus('No new files ' + sinceTxt + '. All up to date!');
                           await updateLastSyncTime();
                           return;
                 }
                 setStatus('Found ' + files.length + ' file(s). Importing...');
                 var count = 0;
                 for (var i = 0; i < files.length; i++) {
                           var file = files[i];
                           var text = await extractText(file);
                           await saveDocument(file, text);
                           count++;
                           setStatus('Importing ' + count + '/' + files.length + ': ' + file.name);
                 }
                 await updateLastSyncTime();
                 setStatus('Done! Imported ' + count + ' file(s) into Carrier Nexus.');
                 if (typeof window.loadDocuments === 'function') window.loadDocuments();
         } catch (err) {
                 // Extract meaningful error message from Google API error responses
           var msg = '';
                 if (err && err.result && err.result.error && err.result.error.message) {
                           msg = err.result.error.message;
                 } else if (err && err.message) {
                           msg = err.message;
                 } else if (err && err.error) {
                           msg = typeof err.error === 'string' ? err.error : JSON.stringify(err.error);
                 } else {
                           try { msg = JSON.stringify(err); } catch(e) { msg = String(err); }
                 }
                 console.error('Sync error:', err);
                 setStatus('Sync error: ' + msg, true);
         }
   }

   // ---- Google Auth (GIS Token Client) ----

   var _tokenClient = null;

   function initGoogleAuth() {
         if (!CLIENT_ID) {
                 setStatus('Google Client ID not configured.', true);
                 return;
         }
         _tokenClient = google.accounts.oauth2.initTokenClient({
                 client_id: CLIENT_ID,
                 scope: SCOPES,
                 callback: function(resp) {
                           if (resp.error) {
                                       var errMsg = resp.error_description || resp.error;
                                       setStatus('Google auth error: ' + errMsg + '. Make sure you sign in with crtruckus@gmail.com', true);
                                       return;
                           }
                           // Token obtained — now load gapi and sync
                   loadGapiAndInit();
                 }
         });
         window.__nexusRequestDriveAuth = function() {
                 _tokenClient.requestAccessToken({ prompt: '' });
         };
   }

   function loadGapiAndInit() {
         gapi.load('client', async function() {
                 await gapi.client.init({});
                 await gapi.client.load(DISCOVERY);
                 setStatus('');
                 // Now we have gapi.client.drive ready — run sync
                         doSync().finally(function() {
                                   var btn = document.getElementById('nexus-update-btn');
                                   if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                         });
         });
   }

   // ---- Button entry point ----

   window.runNexusUpdate = function () {
         getConfig();
         var btn = document.getElementById('nexus-update-btn');
         if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
         setStatus('Starting update...');

         if (typeof gapi === 'undefined') {
                 // Load Google API client library
           var s1 = document.createElement('script');
                 s1.src = 'https://apis.google.com/js/api.js';
                 s1.onload = function() {
                           // Load Google Identity Services
                           if (typeof google === 'undefined' || !google.accounts) {
                                       var s2 = document.createElement('script');
                                       s2.src = 'https://accounts.google.com/gsi/client';
                                       s2.onload = function() {
                                                     setStatus('Sign in with Google when the popup appears...');
                                                     initGoogleAuth();
                                                     setTimeout(function() {
                                                                     if (window.__nexusRequestDriveAuth) window.__nexusRequestDriveAuth();
                                                     }, 800);
                                       };
                                       document.head.appendChild(s2);
                           } else {
                                       setStatus('Sign in with Google when the popup appears...');
                                       initGoogleAuth();
                                       setTimeout(function() {
                                                     if (window.__nexusRequestDriveAuth) window.__nexusRequestDriveAuth();
                                       }, 800);
                           }
                 };
                 document.head.appendChild(s1);
                 // Safety timeout
           setTimeout(function() {
                     if (btn && btn.disabled) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
           }, 35000);
         } else if (typeof google === 'undefined' || !google.accounts) {
                 // gapi loaded but GIS not yet — load GIS
           var s2 = document.createElement('script');
                 s2.src = 'https://accounts.google.com/gsi/client';
                 s2.onload = function() {
                           setStatus('Sign in with Google when the popup appears...');
                           initGoogleAuth();
                           setTimeout(function() {
                                       if (window.__nexusRequestDriveAuth) window.__nexusRequestDriveAuth();
                                       var tries2 = 0;
                                       var check2 = setInterval(function() {
                                                     tries2++;
                                                     if (gapi.client && gapi.client.drive) {
                                                                     clearInterval(check2);
                                                                     // Auth callback handles doSync
                                                     } else if (tries2 > 30) {
                                                                     clearInterval(check2);
                                                                     setStatus('Timeout.', true);
                                                                     if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                                                     }
                                       }, 500);
                           }, 800);
                 };
                 document.head.appendChild(s2);
                 setTimeout(function() {
                           if (btn && btn.disabled) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                 }, 35000);
         } else {
                 // Both gapi and GIS loaded — re-init auth and request token
           setStatus('Sign in with Google when the popup appears...');
                 initGoogleAuth();
                 setTimeout(function() {
                           if (window.__nexusRequestDriveAuth) window.__nexusRequestDriveAuth();
                 }, 300);
                 setTimeout(function() {
                           if (btn && btn.disabled) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                 }, 35000);
         }
   };

})();
