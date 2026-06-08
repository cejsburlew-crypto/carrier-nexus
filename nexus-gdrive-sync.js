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
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#ff4444' : '#4caf50';
    el.style.display = 'block';
    if (!isError) setTimeout(function() { el.style.display = 'none'; }, 6000);
  }

  async function getLastSyncTime() {
    try {
      var sb = getSB();
      if (!sb) return null;
      var result = await sb
        .from('gdrive_sync_log')
        .select('last_synced_at')
        .eq('folder_id', VAULT_ROOT)
        .single();
      return result.data ? result.data.last_synced_at : null;
    } catch (e) {
      return null;
    }
  }

  async function updateLastSyncTime() {
    try {
      var sb = getSB();
      if (!sb) return;
      var now = new Date().toISOString();
      await sb.from('gdrive_sync_log').upsert({
        folder_id: VAULT_ROOT,
        last_synced_at: now,
        updated_at: now
      }, { onConflict: 'folder_id' });
    } catch (e) {
      console.warn('updateLastSyncTime error:', e);
    }
  }

  async function listNewFiles(folderId, lastSyncTime) {
    var query = "'" + folderId + "' in parents and trashed = false";
    if (lastSyncTime) {
      query += " and modifiedTime > '" + lastSyncTime + "'";
    }
    var resp = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime,size,webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 200
    });
    return resp.result.files || [];
  }

  function guessDocType(name) {
    var n = name.toLowerCase();
    if (n.includes('settlement')) return 'settlement';
    if (n.includes('bol') || n.includes('bill of lading')) return 'bol';
    if (n.includes('rate') || n.includes('confirmation')) return 'rate_confirmation';
    if (n.includes('pod') || n.includes('proof of delivery')) return 'pod';
    if (n.includes('invoice')) return 'invoice';
    if (n.includes('permit')) return 'permit';
    if (n.includes('insurance') || n.includes('cert')) return 'insurance';
    if (n.includes('license') || n.includes('cdl')) return 'license';
    if (n.includes('ifta')) return 'ifta';
    if (n.includes('inspection') || n.includes('dot')) return 'inspection';
    return 'other';
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

  async function saveDocument(file, textContent) {
    var sb = getSB();
    if (!sb) {
      console.warn('Supabase not available — skipping save for', file.name);
      return;
    }
    var doc = {
      gdrive_id: file.id,
      name: file.name,
      mime_type: file.mimeType,
      doc_type: guessDocType(file.name),
      folder_id: VAULT_ROOT,
      text_content: textContent || null,
      gdrive_url: file.webViewLink || null,
      file_size: file.size ? parseInt(file.size) : null,
      gdrive_modified_at: file.modifiedTime || null,
      synced_at: new Date().toISOString()
    };
    var result = await sb.from('documents').upsert(doc, { onConflict: 'gdrive_id' });
    if (result.error) console.warn('Save error for', file.name, result.error);
  }

  async function doSync() {
    getConfig();
    if (!VAULT_ROOT) {
      setStatus('No vault folder configured. Set NEXUS_VAULT_ROOT_ID in nexus-config.js.', true);
      return;
    }
    if (!CLIENT_ID) {
      setStatus('Google Client ID not configured. Set NEXUS_GOOGLE_CLIENT_ID in nexus-config.js.', true);
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
      console.error('Sync error:', err);
      setStatus('Sync error: ' + (err.message || String(err)), true);
    }
  }

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
          setStatus('Auth error: ' + resp.error, true);
          return;
        }
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
      initGoogleAuth();
      setStatus('');
    });
  }

  window.runNexusUpdate = function () {
    getConfig();
    var btn = document.getElementById('nexus-update-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
    setStatus('Starting update...');
    if (typeof gapi === 'undefined') {
      // Load Google APIs
      var s1 = document.createElement('script');
      s1.src = 'https://apis.google.com/js/api.js';
      s1.onload = function() {
        var s2 = document.createElement('script');
        s2.src = 'https://accounts.google.com/gsi/client';
        s2.onload = function() {
          loadGapiAndInit();
          // After loading, request auth then sync
          setTimeout(function() {
            if (window.__nexusRequestDriveAuth) {
              window.__nexusRequestDriveAuth();
              // Wait for auth callback which triggers loadGapiAndInit -> then we sync
              // Set a watcher for when gapi.client.drive is ready
              var tries = 0;
              var check = setInterval(function() {
                tries++;
                if (gapi.client && gapi.client.drive) {
                  clearInterval(check);
                  doSync().finally(function() {
                    if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                  });
                } else if (tries > 30) {
                  clearInterval(check);
                  setStatus('Timeout waiting for Google auth.', true);
                  if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                }
              }, 500);
            }
          }, 800);
        };
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    } else if (typeof google === 'undefined' || !google.accounts) {
      var s2 = document.createElement('script');
      s2.src = 'https://accounts.google.com/gsi/client';
      s2.onload = function() {
        loadGapiAndInit();
        setTimeout(function() {
          if (window.__nexusRequestDriveAuth) {
            window.__nexusRequestDriveAuth();
            var tries = 0;
            var check = setInterval(function() {
              tries++;
              if (gapi.client && gapi.client.drive) {
                clearInterval(check);
                doSync().finally(function() {
                  if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
                });
              } else if (tries > 30) {
                clearInterval(check);
                setStatus('Timeout waiting for Google auth.', true);
                if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
              }
            }, 500);
          }
        }, 800);
      };
      document.head.appendChild(s2);
    } else {
      if (window.__nexusRequestDriveAuth) {
        window.__nexusRequestDriveAuth();
        var tries = 0;
        var check = setInterval(function() {
          tries++;
          if (gapi.client && gapi.client.drive) {
            clearInterval(check);
            doSync().finally(function() {
              if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
            });
          } else if (tries > 30) {
            clearInterval(check);
            setStatus('Timeout.', true);
            if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
          }
        }, 500);
      } else {
        loadGapiAndInit();
        setTimeout(function() {
          if (window.__nexusRequestDriveAuth) window.__nexusRequestDriveAuth();
        }, 800);
        var tries2 = 0;
        var check2 = setInterval(function() {
          tries2++;
          if (gapi.client && gapi.client.drive) {
            clearInterval(check2);
            doSync().finally(function() {
              if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
            });
          } else if (tries2 > 30) {
            clearInterval(check2);
            setStatus('Timeout.', true);
            if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
          }
        }, 500);
      }
    }
    setTimeout(function() {
      if (btn && btn.disabled) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
    }, 35000);
  };

  window.nexusGdriveSyncReady = true;
})();
