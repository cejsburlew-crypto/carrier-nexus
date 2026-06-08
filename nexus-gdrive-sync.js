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
        // Full drive scope needed to copy PDF to GDoc for OCR text extraction
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
             if (parsedData && parsedData.load_id) {
                         await upsertLoadFromRateCon(parsedData, file);
             }
   }

   // ---- Loads table upsert from parsed rate con ----

   async function upsertLoadFromRateCon(data, file) {
             var sb = getSB();
             if (!sb) return;
             try {
                         var existing = await sb.from('loads')
                           .select('load_id, status, notes')
                           .eq('load_id', data.load_id)
                           .single();

               var noteAppend = '\n[Rate Con imported: ' + file.name + ' on ' + new Date().toLocaleDateString() + ']';
                         var existingNotes = (existing.data && existing.data.notes) ? existing.data.notes : '';

               var loadRecord = {
                             load_id: data.load_id,
                             notes: existingNotes + noteAppend
               };
                         if (data.broker) loadRecord.broker = data.broker;
                         if (data.origin) loadRecord.origin = data.origin;
                         if (data.destination) loadRecord.destination = data.destination;
                         if (data.rate) loadRecord.rate = data.rate;
                         if (data.pickup_date) loadRecord.pickup_date = data.pickup_date;
                         if (data.delivery_date) loadRecord.delivery_date = data.delivery_date;

               if (existing.data) {
                             await sb.from('loads').update(loadRecord).eq('load_id', data.load_id);
                             console.log('[NexusSync] Updated load', data.load_id, 'from', file.name);
               } else {
                             loadRecord.status = 'Pending';
                             loadRecord.drivers = data.drivers || [];
                             await sb.from('loads').insert(loadRecord);
                             console.log('[NexusSync] Created load', data.load_id, 'from', file.name);
               }
             } catch (e) {
                         console.warn('[NexusSync] upsertLoad error for', data.load_id, e);
             }
   }

   // ---- Document classification ----

   function classifyDocument(n) {
             if (n.includes('rate') || n.includes('rc_') || n.includes('ratecon') ||
                         n.includes('rate_conf') || n.includes('load_conf') || n.includes('load confirmation') ||
                         n.includes('rate confirmation') || n.includes('booking')) return 'rate_confirmation';
             if (n.includes('bol') || n.includes('bill_of_lading') || n.includes('bill of lading')) return 'bol';
             if (n.includes('pod') || n.includes('proof_of_delivery') || n.includes('proof of delivery')) return 'pod';
             if (n.includes('settlement')) return 'settlement';
             if (n.includes('invoice')) return 'invoice';
             if (n.includes('permit') || n.includes('osow') || n.includes('oversize')) return 'permit';
             if (n.includes('insurance') || n.includes('cert') || n.includes('coi')) return 'insurance';
             if (n.includes('license') || n.includes('cdl')) return 'license';
             if (n.includes('ifta')) return 'ifta';
             if (n.includes('dot') || n.includes('inspection')) return 'inspection';
             if (n.includes('expense')) return 'expense';
             if (n.includes('w-9') || n.includes('w9') || n.includes('fw9')) return 'w9';
             if (n.includes('authority') || n.includes('noa') || n.includes('noc')) return 'authority';
             return 'other';
   }

   // ---- Filename-based data extraction ----
   // Handles patterns seen in CarrierNexus Inbox:
   //   2026-05-08_AVIS_-_ATS_LOAD_10483888_BOL.pdf
   //   2026-05-09_GUILLERMO_-_L_A_S_Load_Confirmation_13901234.pdf
   //   00000135-GUILLERMO - G&G LOAD CONFIRMATION 301285.pdf
   //   00000227-CONSTRUCTION_RATE_CONF(1).pdf

   function parseFilename(fileName) {
             var n = fileName.replace(/\.pdf$/i, '').replace(/[\(\)]/g, ' ');
             var data = {};

          // Extract load/order number from filename
          // Pattern: LOAD_12345678 or LOAD 12345678 or _12345678_ (long number)
          var loadNumPatterns = [
                      /(?:LOAD|ORDER|ORD|REF|RC|BOL)[_\s-]+([A-Z0-9]{5,15})/i,
                      /(?:CONFIRMATION|CONF)[_\s]+([0-9]{5,15})/i,
                      /_([0-9]{7,12})(?:_|$|\s)/,
                      /[-\s]([0-9]{7,12})(?:_BOL|_POD|_RC|$)/i
                    ];
             for (var i = 0; i < loadNumPatterns.length; i++) {
                         var m = n.match(loadNumPatterns[i]);
                         if (m) { data.load_id = m[1].toUpperCase(); break; }
             }

          // Extract driver name
          // Pattern: GUILLERMO or DAVID or NELSON (after date prefix or number prefix)
          var driverMatch = n.match(/(?:\d{4}-\d{2}-\d{2}_|^\d{5,8}[-\s])([A-Z][a-z]+)/);
             if (driverMatch) {
                         var possibleDriver = driverMatch[1];
                         // Exclude common non-driver words
               var exclude = ['AVIS', 'ATS', 'G&G', 'LAS', 'DOT', 'SKM', 'INC', 'LLC', 'GLOBAL', 'CARRIER', 'TRUCKING', 'TRANSIT', 'CONSTRUCTION'];
                         if (exclude.indexOf(possibleDriver.toUpperCase()) === -1) {
                                       data.driver_name = possibleDriver;
                         }
             }

          // Extract broker name
          // Pattern: _AVIS_-_ATS_ or - G&G or _L_A_S_
          var brokerMatch = n.match(/(?:_-_|[-\s])([A-Z][A-Z&_\s]{2,20})(?:_LOAD|_RATE|_BOL|_CONF)/i);
             if (brokerMatch) {
                         data.broker = brokerMatch[1].replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
             }

          // Extract date from filename prefix
          var dateMatch = n.match(/^(\d{4}-\d{2}-\d{2})/);
             if (dateMatch) {
                         data.file_date = dateMatch[1];
             }

          return data;
   }

   // ---- PDF Text Extraction via Google Drive OCR ----
   // Copy the PDF to a Google Doc (Drive runs OCR), export as text, delete temp doc.

   async function extractTextFromPDF(file) {
             if (!_accessToken) return '';
             try {
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
                                       console.warn('[NexusSync] PDF OCR copy failed:', file.name, copyResp.status);
                                       return '';
                         }
                         var copyData = await copyResp.json();
                         var docId = copyData.id;

               var exportResp = await fetch(
                             'https://www.googleapis.com/drive/v3/files/' + docId + '/export?mimeType=text%2Fplain',
                     { headers: { 'Authorization': 'Bearer ' + _accessToken } }
                           );
                         var text = exportResp.ok ? await exportResp.text() : '';

               // Delete the temporary OCR doc
               fetch('https://www.googleapis.com/drive/v3/files/' + docId, {
                             method: 'DELETE',
                             headers: { 'Authorization': 'Bearer ' + _accessToken }
               });

               return text.substring(0, 15000);
             } catch (e) {
                         console.warn('[NexusSync] extractTextFromPDF error:', file.name, e);
                         return '';
             }
   }

   async function extractText(file) {
             if (file.mimeType === 'application/vnd.google-apps.document') {
                         try {
                                       var resp = await gapi.client.drive.files.export({
                                                       fileId: file.id,
                                                       mimeType: 'text/plain'
                                       });
                                       return (resp.body || '').substring(0, 15000);
                         } catch (e) { return ''; }
             }
             if (file.mimeType === 'application/pdf') {
                         return await extractTextFromPDF(file);
             }
             return '';
   }

   // ---- Rate Confirmation Parser ----

   function parseRateCon(text, fileName) {
             // First try to get data from filename
          var fnData = parseFilename(fileName);
             var data = Object.assign({}, fnData);

          if (!text || text.length < 30) {
                      return data.load_id ? data : null;
          }

          // -- Load / Order number --
          if (!data.load_id) {
                      var loadPatterns = [
                                    /load\s*(?:number|#|no\.?|num\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
                                    /order\s*(?:number|#|no\.?|num\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
                                    /(?:reference|ref)\s*(?:number|#|no\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
                                    /(?:pro|confirmation|booking)\s*(?:number|#|no\.?)\s*[:\-]?\s*([A-Z0-9\-]{4,20})/i,
                                    /\bRC[-\s]?([A-Z0-9]{4,15})\b/i
                                  ];
                      for (var i = 0; i < loadPatterns.length; i++) {
                                    var m = text.match(loadPatterns[i]);
                                    if (m) { data.load_id = m[1].trim().toUpperCase(); break; }
                      }
          }

          // -- Broker --
          if (!data.broker) {
                      var brokerPatterns = [
                                    /(?:broker|brokerage|arranged by|booked by|bill to)[:\s]+([A-Za-z][A-Za-z0-9\s,\.&'-]{2,40}?)(?:\n|LLC|Inc\b|Corp\b|Co\b|Ltd\b)/i,
                                    /(?:carrier broker|freight broker)[:\s]+([A-Za-z][A-Za-z0-9\s,\.&'-]{2,40})/i
                                  ];
                      for (var j = 0; j < brokerPatterns.length; j++) {
                                    var bm = text.match(brokerPatterns[j]);
                                    if (bm) { data.broker = bm[1].trim(); break; }
                      }
          }

          // -- Rate --
          if (!data.rate) {
                      var ratePatterns = [
                                    /(?:total\s*rate|carrier\s*rate|flat\s*rate|all[- ]in|rate|total|pay)[:\s]+\$?\s*([\d,]+(?:\.\d{2})?)/i,
                                    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:flat|total|usd|all)/i,
                                    /(?:line\s*haul|linehaul)[:\s]+\$?\s*([\d,]+(?:\.\d{2})?)/i
                                  ];
                      for (var k = 0; k < ratePatterns.length; k++) {
                                    var rm = text.match(ratePatterns[k]);
                                    if (rm) {
                                                    var rateVal = parseFloat(rm[1].replace(/,/g, ''));
                                                    if (rateVal > 50 && rateVal < 999999) { data.rate = rateVal; break; }
                                    }
                      }
          }

          // -- Origin --
          if (!data.origin) {
                      var originMatch = text.match(/(?:origin|pickup|pick.?up|shipper|from)[:\s]+([A-Za-z][A-Za-z\s,\.]{3,40}?(?:[A-Z]{2})?)(?:\n|\d{5}|\|)/i);
                      if (originMatch) data.origin = originMatch[1].trim().replace(/\s+/g, ' ');
          }

          // -- Destination --
          if (!data.destination) {
                      var destMatch = text.match(/(?:destination|delivery|deliver.?to|consignee)[:\s]+([A-Za-z][A-Za-z\s,\.]{3,40}?(?:[A-Z]{2})?)(?:\n|\d{5}|\|)/i);
                      if (destMatch) data.destination = destMatch[1].trim().replace(/\s+/g, ' ');
          }

          // -- Pickup Date --
          if (!data.pickup_date) {
                      var pickupMatch = text.match(/(?:pickup\s*date|pick.?up\s*date|ship\s*date|load\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                      if (pickupMatch) data.pickup_date = normalizeDate(pickupMatch[1]);
          }

          // -- Delivery Date --
          if (!data.delivery_date) {
                      var delivMatch = text.match(/(?:delivery\s*date|deliver\s*by|del\s*date|drop\s*date)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
                      if (delivMatch) data.delivery_date = normalizeDate(delivMatch[1]);
          }

          // -- Driver (from text if not from filename) --
          if (!data.drivers || !data.drivers.length) {
                      var driverMatch2 = text.match(/(?:driver|operator|assigned\s*to)[:\s]+([A-Za-z][A-Za-z\s,\.]{3,40}?)(?:\n|cdl|truck|unit|\d)/i);
                      if (driverMatch2) data.drivers = [driverMatch2[1].trim()];
                      else if (data.driver_name) data.drivers = [data.driver_name];
          }

          if (!data.load_id) return null;
             console.log('[NexusSync] Parsed:', fileName, '->', data);
             return data;
   }

   function normalizeDate(dateStr) {
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
                         setStatus('Google Client ID not configured.', true);
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
                             setStatus('Reading ' + (i + 1) + '/' + files.length + ': ' + file.name.substring(0, 40) + '...');

                        var text = await extractText(file);
                             var parsedData = null;
                             var docType = classifyDocument(file.name.toLowerCase());

                        // Parse rate confirmations and BOLs for load linking
                        var isRateCon = docType === 'rate_confirmation' ||
                                                      (text && text.match(/rate\s*confirmation|rate\s*con|load\s*confirmation/i));
                             var isBOL = docType === 'bol';

                        if (isRateCon) {
                                        parsedData = parseRateCon(text, file.name);
                                        if (parsedData && parsedData.load_id) {
                                                          rateConCount++;
                                                          var sb = getSB();
                                                          if (sb) {
                                                                              var chk = await sb.from('loads').select('load_id').eq('load_id', parsedData.load_id).single();
                                                                              if (!chk.data) newLoadsCount++;
                                                          }
                                        }
                        } else if (isBOL) {
                                        // For BOLs, extract load ID from filename to link the document
                               var fnInfo = parseFilename(file.name);
                                        if (fnInfo.load_id) parsedData = fnInfo;
                        }

                        await saveDocument(file, text, parsedData);
                             count++;
               }

               await updateLastSyncTime(count);

               var summary = 'Done! Imported ' + count + ' file(s).';
                      if (rateConCount > 0) summary += ' ' + rateConCount + ' rate con(s) parsed.';
                      if (newLoadsCount > 0) summary += ' ' + newLoadsCount + ' new load(s) created!';
                      setStatus(summary);

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
