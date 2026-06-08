// ============================================================
// CARRIER NEXUS — GOOGLE DRIVE SYNC ENGINE (nexus-gdrive-sync.js)
// ============================================================
// Reads files from Google Drive (CarrierNexus Inbox folder)
// since last sync, extracts text from PDFs via Drive OCR,
// parses Rate Confirmations, and updates loads in Supabase.
// PDFs stay in Google Drive — only data is imported.
// ============================================================

(function () {
      'use strict';

   var VAULT_ROOT = '';
      var CLIENT_ID = '';
      // Need drive scope (not readonly) so we can copy PDF→GDoc for OCR text extraction
   var SCOPES = 'https://www.googleapis.com/auth/drive';
      var DISCOVERY = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
      var _sb = null;
      var _accessToken = null;

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

   async function updateLastSyncTime(fileCount) {
           var sb = getSB();
           if (!sb) return;
           try {
                     await sb.from('nexus_sync_log').insert({
                                 synced_at: new Date().toISOString(),
                                 files_imported: fileCount || 0
                     });
           } catch (e) { /* ignore */ }
   }

   async function saveDocument(file, textContent, parsedData) {
           var sb = getSB();
           if (!sb) return;
           var docType = classifyDocument(file.name.toLowerCase());
           var doc = {
                     drive_file_id: file.id,
                     file_name: file.name,
                     mime_type: file.mimeType,
                     drive_modified_time: file.modifiedTime,
                     doc_type: docType,
                     text_content: textContent ? textContent.substring(0, 10000) : '',
                     imported_at: new Date().toISOString()
           };
           try {
                     await sb.from('nexus_documents').upsert(doc, { onConflict: 'drive_file_id' });
           } catch (e) {
                     console.warn('Save document error for', file.name, e);
           }

        // If we parsed rate con data, update the loads table
        if (parsedData && parsedData.load_id) {
                  await upsertLoadFromRateCon(parsedData, file);
        }
   }

   // ---- Loads table upsert from parsed rate con ----

   async function upsertLoadFromRateCon(data, file) {
           var sb = getSB();
           if (!sb) return;
           try {
                     // Check if load already exists
             var existing = await sb.from('loads')
                       .select('load_id, status')
                       .eq('load_id', data.load_id)
                       .single();

             var loadRecord = {
                         load_id: data.load_id,
                         broker: data.broker || '',
                         origin: data.origin || '',
                         destination: data.destination || '',
                         rate: data.rate || null,
                         pickup_date: data.pickup_date || null,
                         delivery_date: data.delivery_date || null,
                         notes: (existing.data ? existing.data.notes || '' : '') +
                                            '\n[Rate Con imported from Drive: ' + file.name + ' on ' + new Date().toLocaleDateString() + ']'
             };

             if (existing.data) {
                         // Update existing load - don't overwrite status/drivers
                       await sb.from('loads').update(loadRecord).eq('load_id', data.load_id);
                         console.log('Updated load', data.load_id, 'from rate con', file.name);
             } else {
                         // Insert new load from rate con
                       loadRecord.status = 'Pending';
                         loadRecord.drivers = data.drivers || [];
                         await sb.from('loads').insert(loadRecord);
                         console.log('Created new load', data.load_id, 'from rate con', file.name);
             }
           } catch (e) {
                     console.warn('upsertLoadFromRateCon error for load', data.load_id, e);
           }
   }

   // ---- Document classification ----

   function classifyDocument(n) {
           if (n.includes('rate') || n.includes('rc_') || n.includes('ratecon') || n.includes('rate con') || n.includes('confirmation')) return 'rate_confirmation';
           if (n.includes('bol') || n.includes('bill of lading') || n.includes('bill_of_lading')) return 'bol';
           if (n.includes('pod') || n.includes('proof of delivery') || n.includes('proof_of_delivery')) return 'pod';
           if (n.includes('settlement')) return 'settlement';
           if (n.includes('invoice')) return 'invoice';
           if (n.includes('permit')) return 'permit';
           if (n.includes('insurance') || n.includes('cert')) return 'insurance';
           if (n.includes('license') || n.includes('cdl')) return 'license';
           if (n.includes('ifta')) return 'ifta';
           if (n.includes('dot') || n.includes('inspection')) return 'inspection';
           return 'other';
   }

   // ---- PDF Text Extraction via Google Drive OCR ----
   // Strategy: copy the PDF to a new Google Doc (Drive converts it using OCR),
   // then export the doc as plain text, then delete the temp doc.

   async function extractTextFromPDF(file) {
           if (!_accessToken) return '';
           try {
                     // Step 1: Copy the PDF to a Google Doc using OCR
             var copyResp = await fetch(
                         'https://www.googleapis.com/drive/v3/files/' + file.id + '/copy',
                 {
                               method: 'POST',
                               headers: {
                                               'Authorization': 'Bearer ' + _accessToken,
                                               'Content-Type': 'application/json'
                               },
                               body: JSON.stringify({
                                               name: '__nexus_ocr_tmp_' + file.id,
                                               mimeType: 'application/vnd.google-apps.document'
                               })
                 }
                       );
                     if (!copyResp.ok) {
                                 console.warn('PDF copy for OCR failed:', file.name, copyResp.status);
                                 return '';
                     }
                     var copyData = await copyResp.json();
                     var docId = copyData.id;

             // Step 2: Export the Google Doc as plain text
             var exportResp = await fetch(
                         'https://www.googleapis.com/drive/v3/files/' + docId + '/export?mimeType=text/plain',
                 { headers: { 'Authorization': 'Bearer ' + _accessToken } }
                       );
                     var text = exportResp.ok ? await exportResp.text() : '';

             // Step 3: Delete the temporary doc
             await fetch(
                         'https://www.googleapis.com/drive/v3/files/' + docId,
                 {
                               method: 'DELETE',
                               headers: { 'Authorization': 'Bearer ' + _accessToken }
                 }
                       );

             return text.substring(0, 12000);
           } catch (e) {
                     console.warn('extractTextFromPDF error:', file.name, e);
                     return '';
           }
   }

   async function extractText(file) {
           if (file.mimeType === 'application/vnd.google-apps.document') {
                     // Native Google Doc — export directly
             try {
                         var resp = await gapi.client.drive.files.export({
                                       fileId: file.id,
                                       mimeType: 'text/plain'
                         });
                         return (resp.body || '').substring(0, 12000);
             } catch (e) {
                         return '';
             }
           }
           if (file.mimeType === 'application/pdf') {
                     return await extractTextFromPDF(file);
           }
           // For other types (images, etc.) return empty
        return '';
   }

   // ---- Rate Confirmation Parser ----
   // Extracts structured data from the text of a rate confirmation PDF

   function parseRateCon(text, fileName) {
           if (!text || text.length < 50) return null;

        var data = {};

        // -- Load / Order number --
        // Common patterns: "Load #12345", "Order #RC-98765", "Load Number: 12345",
        // "Reference #: L1234", "Pro #", "Order No:", etc.
        var loadPatterns = [
                  /load\s*(?:number|#|no\.?|num\.?)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
                  /order\s*(?:number|#|no\.?|num\.?)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
                  /(?:reference|ref)\s*(?:number|#|no\.?)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
                  /(?:pro|confirmation)\s*(?:number|#|no\.?)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
                  /(?:shipment|booking)\s*(?:number|#|no\.?)\s*[:\-]?\s*([A-Z0-9\-]{3,20})/i,
                  /\bRC[-\s]?([A-Z0-9]{4,15})\b/i,
                  /\bL[-\s]?([0-9]{4,10})\b/
                ];
           for (var i = 0; i < loadPatterns.length; i++) {
                     var m = text.match(loadPatterns[i]);
                     if (m) { data.load_id = m[1].trim().toUpperCase(); break; }
           }

        // Try filename for load number if not found in text
        if (!data.load_id) {
                  var fnMatch = fileName.match(/(?:RC|LOAD|ORD|REF|L)[_\-\s]?([A-Z0-9]{4,15})/i);
                  if (fnMatch) data.load_id = fnMatch[1].toUpperCase();
        }

        // -- Broker / Shipper name --
        var brokerPatterns = [
                  /(?:broker|brokerage|shipper|carrier|bill to|bill\s*to)[:\s]+([A-Za-z][A-Za-z0-9\s,\.&'-]{3,50}?)(?:\n|LLC|Inc|Corp|Co\b|Ltd)/i,
                  /(?:brokerage name|broker name)[:\s]+([A-Za-z][A-Za-z0-9\s,\.&'-]{3,40})/i,
                  /(?:booked by|arranged by)[:\s]+([A-Za-z][A-Za-z0-9\s,\.&'-]{3,40})/i
                ];
           for (var j = 0; j < brokerPatterns.length; j++) {
                     var bm = text.match(brokerPatterns[j]);
                     if (bm) { data.broker = bm[1].trim(); break; }
           }

        // -- Rate / Amount --
        var ratePatterns = [
                  /(?:total\s*rate|carrier\s*rate|load\s*rate|flat\s*rate|rate|amount|total|pay)[:\s]+\$?\s*([\d,]+(?:\.\d{2})?)/i,
                  /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:flat|total|usd)/i,
                  /(?:line\s*haul|linehaul)[:\s]+\$?\s*([\d,]+(?:\.\d{2})?)/i
                ];
           for (var k = 0; k < ratePatterns.length; k++) {
                     var rm = text.match(ratePatterns[k]);
                     if (rm) {
                                 var rateVal = parseFloat(rm[1].replace(/,/g, ''));
                                 if (rateVal > 50 && rateVal < 999999) { data.rate = rateVal; break; }
                     }
           }

        // -- Origin (pickup location) --
        var originPatterns = [
                  /(?:origin|pickup|pick.?up|shipper|from|origin\s*city)[:\s]+([A-Za-z][A-Za-z\s,\.]+?(?:[A-Z]{2})?)(?:\n|zip|\d{5}|\|)/i,
                  /(?:pickup\s*address|pick\s*up\s*at)[:\s]+([A-Za-z][A-Za-z0-9\s,\.#]+?)(?:\n|\d{5})/i
                ];
           for (var o = 0; o < originPatterns.length; o++) {
                     var om = text.match(originPatterns[o]);
                     if (om) { data.origin = om[1].trim().replace(/\s+/g, ' '); break; }
           }

        // -- Destination (delivery location) --
        var destPatterns = [
                  /(?:destination|delivery|deliver.?to|consignee|to)[:\s]+([A-Za-z][A-Za-z\s,\.]+?(?:[A-Z]{2})?)(?:\n|zip|\d{5}|\|)/i,
                  /(?:delivery\s*address|deliver\s*to)[:\s]+([A-Za-z][A-Za-z0-9\s,\.#]+?)(?:\n|\d{5})/i
                ];
           for (var d = 0; d < destPatterns.length; d++) {
                     var dm = text.match(destPatterns[d]);
                     if (dm) { data.destination = dm[1].trim().replace(/\s+/g, ' '); break; }
           }

        // -- Pickup Date --
        var pickupDatePatterns = [
                  /(?:pickup\s*date|pick.?up\s*date|ship\s*date|origin\s*date|load\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
                  /(?:pickup|pick.?up)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
                  /(?:ship(?:ping)?\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
                ];
           for (var p = 0; p < pickupDatePatterns.length; p++) {
                     var pm = text.match(pickupDatePatterns[p]);
                     if (pm) { data.pickup_date = normalizeDate(pm[1]); break; }
           }

        // -- Delivery Date --
        var delivDatePatterns = [
                  /(?:delivery\s*date|deliver\s*by|del\s*date|drop\s*date|due\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i,
                  /(?:delivery|deliver)\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
                ];
           for (var v = 0; v < delivDatePatterns.length; v++) {
                     var vm = text.match(delivDatePatterns[v]);
                     if (vm) { data.delivery_date = normalizeDate(vm[1]); break; }
           }

        // -- Driver name (if listed on rate con) --
        var driverPatterns = [
                  /(?:driver|operator)[:\s]+([A-Za-z][A-Za-z\s,\.]{3,40}?)(?:\n|cdl|truck|unit|\d)/i,
                  /(?:assigned\s*to)[:\s]+([A-Za-z][A-Za-z\s,\.]{3,40}?)(?:\n)/i
                ];
           for (var dr = 0; dr < driverPatterns.length; dr++) {
                     var drm = text.match(driverPatterns[dr]);
                     if (drm) { data.drivers = [drm[1].trim()]; break; }
           }

        // Only return parsed data if we got at minimum a load ID
        if (!data.load_id) return null;

        console.log('[NexusSync] Parsed rate con:', data);
           return data;
   }

   function normalizeDate(dateStr) {
           // Convert M/D/YY or M-D-YY to YYYY-MM-DD
        if (!dateStr) return null;
           var parts = dateStr.split(/[\/\-]/);
           if (parts.length !== 3) return null;
           var m = parts[0].padStart(2, '0');
           var d = parts[1].padStart(2, '0');
           var y = parts[2];
           if (y.length === 2) y = '20' + y;
           return y + '-' + m + '-' + d;
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
                     pageSize: 200,
                     orderBy: 'modifiedTime desc'
           });
           return resp.result.files || [];
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
                     : '(full sync — all files)';
           setStatus('Scanning Drive ' + sinceTxt + '...');

        try {
                  var files = await listNewFiles(VAULT_ROOT, lastSync);
                  if (!files.length) {
                              setStatus('No new files ' + sinceTxt + '. All up to date!');
                              await updateLastSyncTime(0);
                              return;
                  }

             setStatus('Found ' + files.length + ' file(s). Reading & parsing...');
                  var count = 0;
                  var rateConCount = 0;
                  var newLoadsCount = 0;

             for (var i = 0; i < files.length; i++) {
                         var file = files[i];
                         setStatus('Reading ' + (i + 1) + '/' + files.length + ': ' + file.name + '...');

                    var text = await extractText(file);
                         var parsedData = null;
                         var docType = classifyDocument(file.name.toLowerCase());

                    // Parse rate confirmations
                    if (docType === 'rate_confirmation' || text.match(/rate\s*confirmation|rate\s*con/i)) {
                                  parsedData = parseRateCon(text, file.name);
                                  if (parsedData) {
                                                  rateConCount++;
                                                  // Check if this is a new load
                                    var sb = getSB();
                                                  if (sb && parsedData.load_id) {
                                                                    var chk = await sb.from('loads').select('load_id').eq('load_id', parsedData.load_id).single();
                                                                    if (!chk.data) newLoadsCount++;
                                                  }
                                  }
                    }

                    await saveDocument(file, text, parsedData);
                         count++;
             }

             await updateLastSyncTime(count);

             var summary = 'Done! Imported ' + count + ' file(s).';
                  if (rateConCount > 0) summary += ' ' + rateConCount + ' rate con(s) parsed.';
                  if (newLoadsCount > 0) summary += ' ' + newLoadsCount + ' new load(s) created!';
                  setStatus(summary);

             // Refresh UI if loads page is open
             if (typeof window.loadLoads === 'function') window.loadLoads();
                  if (typeof window.loadDocuments === 'function') window.loadDocuments();
                  if (typeof window.refreshDashboard === 'function') window.refreshDashboard();

        } catch (err) {
                  var msg = '';
                  if (err && err.result && err.result.error && err.result.error.message) {
                              msg = err.result.error.message;
                  } else if (err && err.message) {
                              msg = err.message;
                  } else {
                              msg = JSON.stringify(err);
                  }
                  setStatus('Sync error: ' + msg, true);
                  console.error('[NexusSync] Error:', err);
        }
   }

   // ---- Google API initialization ----

   function loadGapiAndInit(token) {
           _accessToken = token;
           gapi.load('client', function () {
                     gapi.client.setToken({ access_token: token });
                     gapi.client.load(DISCOVERY).then(function () {
                                 doSync();
                     }).catch(function (e) {
                                 var msg = (e && e.result && e.result.error && e.result.error.message) ? e.result.error.message : (e.message || JSON.stringify(e));
                                 setStatus('Drive API load failed: ' + msg, true);
                     });
           });
   }

   // ---- Public entry point ----

   window.runNexusUpdate = function () {
           var btn = document.getElementById('nexus-update-btn');
           if (btn) btn.disabled = true;
           setStatus('Requesting Google authorization...');
           getConfig();

           if (!CLIENT_ID) {
                     setStatus('Google Client ID not set in nexus-config.js', true);
                     if (btn) btn.disabled = false;
                     return;
           }

           // Load Google Identity Services script if needed
           function startAuth() {
                     setStatus('Sign in with Google when the popup appears...');
                     var client = google.accounts.oauth2.initTokenClient({
                                 client_id: CLIENT_ID,
                                 scope: SCOPES,
                                 callback: function (tokenResp) {
                                               if (tokenResp.error) {
                                                               setStatus('Google auth failed: ' + tokenResp.error, true);
                                                               if (btn) btn.disabled = false;
                                                               return;
                                               }
                                               setStatus('Authorized. Loading Drive API...');
                                               if (typeof gapi === 'undefined') {
                                                               var gapiScript = document.createElement('script');
                                                               gapiScript.src = 'https://apis.google.com/js/api.js';
                                                               gapiScript.onload = function () { loadGapiAndInit(tokenResp.access_token); };
                                                               gapiScript.onerror = function () {
                                                                                 setStatus('Failed to load Google API client', true);
                                                                                 if (btn) btn.disabled = false;
                                                               };
                                                               document.head.appendChild(gapiScript);
                                               } else {
                                                               loadGapiAndInit(tokenResp.access_token);
                                               }
                                               if (btn) btn.disabled = false;
                                 }
                     });
                     client.requestAccessToken({ prompt: 'consent' });
           }

           if (typeof google === 'undefined' || !google.accounts) {
                     var gisScript = document.createElement('script');
                     gisScript.src = 'https://accounts.google.com/gsi/client';
                     gisScript.onload = startAuth;
                     gisScript.onerror = function () {
                                 setStatus('Failed to load Google Identity Services', true);
                                 if (btn) btn.disabled = false;
                     };
                     document.head.appendChild(gisScript);
           } else {
                     startAuth();
           }
   };

})();
