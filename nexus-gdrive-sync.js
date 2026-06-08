// ============================================================
// CARRIER NEXUS — GOOGLE DRIVE SYNC ENGINE (nexus-gdrive-sync.js)
// ============================================================
// Reads files from Google Drive (CarrierNexus Inbox folder)
// since last sync, extracts text metadata, and saves to Supabase.
// PDFs stay in Google Drive — only metadata/text is imported.
// ============================================================

(function () {
  'use strict';

  // Config
  const VAULT_ROOT   = window.NEXUS_VAULT_ROOT_ID   || '';
  const CLIENT_ID    = window.NEXUS_GOOGLE_CLIENT_ID || '';
  const SCOPES       = 'https://www.googleapis.com/auth/drive.readonly';
  const DISCOVERY    = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

  function setStatus(msg, isError) {
    const el = document.getElementById('nexus-sync-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#ff4444' : '#4caf50';
    el.style.display = 'block';
    if (!isError) setTimeout(function() { el.style.display = 'none'; }, 5000);
  }

  async function getLastSyncTime() {
    try {
      const sb = window.nexusSupabase;
      if (!sb) return null;
      const result = await sb
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
      const sb = window.nexusSupabase;
      if (!sb) return;
      const now = new Date().toISOString();
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
    let query = "'" + folderId + "' in parents and trashed = false";
    if (lastSyncTime) {
      query += " and modifiedTime > '" + lastSyncTime + "'";
    }
    const resp = await gapi.client.drive.files.list({
      q: query,
      fields: 'files(id,name,mimeType,modifiedTime,createdTime,size,webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 200
    });
    return resp.result.files || [];
  }

  function guessDocType(name) {
    const n = name.toLowerCase();
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
        const resp = await gapi.client.drive.files.export({
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
    const sb = window.nexusSupabase;
    if (!sb) return;
    const doc = {
      gdrive_id:    file.id,
      name:         file.name,
      mime_type:    file.mimeType,
      doc_type:     guessDocType(file.name),
      folder_id:    VAULT_ROOT,
      text_content: textContent || null,
      gdrive_url:   file.webViewLink || null,
      file_size:    file.size ? parseInt(file.size) : null,
      gdrive_modified_at: file.modifiedTime || null,
      synced_at:    new Date().toISOString()
    };
    const result = await sb.from('documents').upsert(doc, { onConflict: 'gdrive_id' });
    if (result.error) console.warn('Save error for', file.name, result.error);
  }

  async function doSync() {
    setStatus('Connecting to Google Drive...');
    const lastSync = await getLastSyncTime();
    const sinceTxt = lastSync
      ? 'since ' + new Date(lastSync).toLocaleDateString()
      : '(full sync)';
    setStatus('Scanning Drive ' + sinceTxt + '...');
    try {
      const files = await listNewFiles(VAULT_ROOT, lastSync);
      if (!files.length) {
        setStatus('No new files ' + sinceTxt + '. All up to date!');
        await updateLastSyncTime();
        return;
      }
      setStatus('Found ' + files.length + ' file(s). Importing...');
      let count = 0;
      for (const file of files) {
        const text = await extractText(file);
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

  function initGoogleAuth() {
    if (!CLIENT_ID) {
      setStatus('Google Client ID not configured. Please set NEXUS_GOOGLE_CLIENT_ID.', true);
      return;
    }
    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async function(tokenResponse) {
        if (tokenResponse.error) {
          setStatus('Auth error: ' + tokenResponse.error, true);
          return;
        }
        gapi.client.setToken(tokenResponse);
        await doSync();
      }
    });
    window.__nexusRequestDriveAuth = function () {
      tokenClient.requestAccessToken({ prompt: '' });
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
    const btn = document.getElementById('nexus-update-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Syncing...'; }
    setStatus('Starting update...');
    if (typeof gapi === 'undefined') {
      const s1 = document.createElement('script');
      s1.src = 'https://apis.google.com/js/api.js';
      s1.onload = function() {
        const s2 = document.createElement('script');
        s2.src = 'https://accounts.google.com/gsi/client';
        s2.onload = loadGapiAndInit;
        document.head.appendChild(s2);
      };
      document.head.appendChild(s1);
    } else if (typeof google === 'undefined' || !google.accounts) {
      const s2 = document.createElement('script');
      s2.src = 'https://accounts.google.com/gsi/client';
      s2.onload = loadGapiAndInit;
      document.head.appendChild(s2);
    } else {
      if (window.__nexusRequestDriveAuth) {
        window.__nexusRequestDriveAuth();
      } else {
        loadGapiAndInit();
      }
    }
    setTimeout(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Update Nexus'; }
    }, 30000);
  };

  window.nexusGdriveSyncReady = true;

})();
