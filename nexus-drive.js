// ============================================================
//  NEXUS DRIVE  --  Google Drive Vault Integration
//  Requires nexus-config.js loaded before this file
// ============================================================
//
//  Vault structure (Jim Testing folder):
//    <VAULT_ROOT>/
//    +- AMET/   <- dispatcher folder
//    |   +- AVIS/   <- driver folder
//    |   |   +- BILLS OF LADING/
//    |   |   +- RATE CONFIRMATIONS/
//    |   |   +- PERMITS/
//    |   |   +- DOCUMENTS/
//    |   |   \- CORRESPONDENCE/
//    |   \- DAVID/ ...
//    +- BETTY/  <- dispatcher folder
//    |   \- GUILLERMO/ ...
//    \- _COMPANY/
//        +- INSURANCE/
//        +- EQUIPMENT/
//        \- 2026/
//
//  Deduplication rule: on exact name collision keep the OLDEST.
//  A driver under multiple dispatchers appears as shortcuts in
//  the secondary dispatcher folders (single source of truth).
// ============================================================

(function () {
  'use strict';

  /* ?? Constants ???????????????????????????????????????????? */
  var VAULT_ROOT_ID   = '1aqguIB-nNJOkSfFnzc_-m3LZnlSOgBv0';
  var DRIVE_API       = 'https://www.googleapis.com/drive/v3';
  var FOLDER_MIME     = 'application/vnd.google-apps.folder';
  var SHORTCUT_MIME   = 'application/vnd.google-apps.shortcut';
  var SCOPES          = 'https://www.googleapis.com/auth/drive';

  var DRIVER_SUBFOLDERS = [
    'BILLS OF LADING',
    'RATE CONFIRMATIONS',
    'PERMITS',
    'DOCUMENTS',
    'CORRESPONDENCE'
  ];

  var COMPANY_SUBFOLDERS = ['INSURANCE', 'EQUIPMENT', '2026'];

  // Dispatcher -> primary driver assignments
  // A driver listed under multiple dispatchers will be canonical
  // under the FIRST dispatcher in this map, and a shortcut elsewhere.
  var DISPATCHER_MAP = {
    'AMET'  : ['AVIS', 'DAVID', 'MIGUEL', 'NELSON', 'YOSVIEL', 'LAURA'],
    'BETTY' : ['GUILLERMO']
    // Add more dispatchers / reassign drivers here as needed
  };

  /* ?? Auth state ??????????????????????????????????????????? */
  var _token      = null;
  var _expiry     = 0;
  var _client     = null;
  var _pendingCbs = [];

  function _tokenValid () { return !!_token && Date.now() < _expiry - 30000; }

  function _gisLoaded () {
    return !!(window.google && window.google.accounts && window.google.accounts.oauth2);
  }

  function _loadGIS (cb) {
    if (_gisLoaded()) { cb(); return; }
    var s = document.createElement('script');
    s.src     = 'https://accounts.google.com/gsi/client';
    s.async   = true;
    s.onload  = cb;
    s.onerror = function () { console.error('NexusDrive: failed to load GIS'); };
    document.head.appendChild(s);
  }

  function _createClient () {
    var clientId = window.NEXUS_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('NexusDrive: NEXUS_GOOGLE_CLIENT_ID not set in nexus-config.js');
      return;
    }
    _client = google.accounts.oauth2.initTokenClient({
      client_id : clientId,
      scope     : SCOPES,
      callback  : _onToken
    });
  }

  function _onToken (response) {
    if (response.error) {
      console.error('NexusDrive auth error:', response.error);
      _pendingCbs.forEach(function (cb) { cb(null, response.error); });
      _pendingCbs = [];
      return;
    }
    _token  = response.access_token;
    _expiry = Date.now() + (response.expires_in * 1000);
    var cbs = _pendingCbs.slice();
    _pendingCbs = [];
    cbs.forEach(function (cb) { cb(_token); });
  }

  function init (onReady) {
    _loadGIS(function () {
      _createClient();
      if (onReady) onReady();
    });
  }

  function requireAuth (cb, opts) {
    opts = opts || {};
    if (_tokenValid()) { cb(_token); return; }
    _pendingCbs.push(cb);
    if (_pendingCbs.length > 1) return;
    if (!_client) {
      _loadGIS(function () { _createClient(); _requestToken(opts); });
    } else {
      _requestToken(opts);
    }
  }

  function _requestToken (opts) {
    _client.callback = _onToken;
    _client.requestAccessToken({ prompt: opts.prompt || '' });
  }

  /* ?? Drive API low-level ?????????????????????????????????? */
  async function _api (path, opts) {
    opts = opts || {};
    if (!_tokenValid()) throw new Error('NexusDrive: not authenticated');
    var url = path.startsWith('http') ? path : DRIVE_API + path;
    var res = await fetch(url, Object.assign({}, opts, {
      headers: Object.assign({
        'Authorization' : 'Bearer ' + _token,
        'Content-Type'  : 'application/json'
      }, opts.headers || {})
    }));
    if (res.status === 204) return null;
    var json = await res.json();
    if (!res.ok) throw new Error((json.error && json.error.message) || ('Drive API ' + res.status));
    return json;
  }

  async function listFolder (folderId) {
    var q  = encodeURIComponent("'" + folderId + "' in parents and trashed=false");
    var fl = 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink,shortcutDetails)';
    var files = [], pageToken = '';
    do {
      var pt  = pageToken ? ('&pageToken=' + pageToken) : '';
      var res = await _api('/files?q=' + q + '&fields=nextPageToken,' + fl + '&orderBy=name&pageSize=200' + pt);
      files     = files.concat(res.files || []);
      pageToken = res.nextPageToken || '';
    } while (pageToken);
    return files;
  }

  async function findFolder (name, parentId) {
    var safeName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    var q = encodeURIComponent(
      "'" + parentId + "' in parents and name='" + safeName +
      "' and mimeType='" + FOLDER_MIME + "' and trashed=false"
    );
    var res = await _api('/files?q=' + q + '&fields=files(id,name,createdTime)&orderBy=createdTime');
    var hits = res.files || [];
    return hits.length ? hits[0] : null;
  }

  async function ensureFolder (name, parentId) {
    var existing = await findFolder(name, parentId);
    if (existing) return Object.assign({}, existing, { _created: false });
    var folder = await _api('/files', {
      method : 'POST',
      body   : JSON.stringify({ name: name, mimeType: FOLDER_MIME, parents: [parentId] })
    });
    return Object.assign({}, folder, { _created: true });
  }

  /** Create a shortcut to targetId inside parentId */
  async function createShortcut (name, targetId, parentId) {
    return _api('/files', {
      method : 'POST',
      body   : JSON.stringify({
        name        : name,
        mimeType    : SHORTCUT_MIME,
        parents     : [parentId],
        shortcutDetails: { targetId: targetId }
      })
    });
  }

  /* ?? Vault high-level ????????????????????????????????????? */

  /**
   * Provision a single driver under a specific dispatcher folder.
   * Creates: <dispatcherFolderId>/<DRIVER_NAME>/<each subfolder>
   * Returns { root, subfolders }
   */
  async function provisionDriver (driverName, dispatcherFolderId) {
    var name = driverName.trim().toUpperCase();
    var root = await ensureFolder(name, dispatcherFolderId);
    var subfolders = {};
    for (var i = 0; i < DRIVER_SUBFOLDERS.length; i++) {
      subfolders[DRIVER_SUBFOLDERS[i]] = await ensureFolder(DRIVER_SUBFOLDERS[i], root.id);
    }
    return { root: root, subfolders: subfolders };
  }

  /**
   * Provision the full dispatcher->driver tree from DISPATCHER_MAP.
   * Drivers listed under multiple dispatchers get a real folder under
   * the first dispatcher and a shortcut under subsequent ones.
   */
  async function provisionAll () {
    var dispatchers = Object.keys(DISPATCHER_MAP);
    var driverPrimary = {};   // driverName -> { folderId }
    var results = [];

    for (var di = 0; di < dispatchers.length; di++) {
      var dispName   = dispatchers[di];
      var dispFolder = await ensureFolder(dispName, VAULT_ROOT_ID);
      var drivers    = DISPATCHER_MAP[dispName];

      for (var dri = 0; dri < drivers.length; dri++) {
        var driverName = drivers[dri].trim().toUpperCase();
        if (driverPrimary[driverName]) {
          // Already provisioned -- create a shortcut instead
          try {
            await createShortcut(driverName, driverPrimary[driverName], dispFolder.id);
            results.push({ dispatcher: dispName, driver: driverName, type: 'shortcut', ok: true });
          } catch (e) {
            results.push({ dispatcher: dispName, driver: driverName, type: 'shortcut', ok: false, error: e.message });
          }
        } else {
          // First time -- create real folder + subfolders
          try {
            var r = await provisionDriver(driverName, dispFolder.id);
            driverPrimary[driverName] = r.root.id;
            results.push({ dispatcher: dispName, driver: driverName, type: 'folder', ok: true, root: r.root });
          } catch (e) {
            results.push({ dispatcher: dispName, driver: driverName, type: 'folder', ok: false, error: e.message });
          }
        }
      }
    }

    // Provision _COMPANY at vault root
    try {
      var company = await provisionCompany();
      results.push({ dispatcher: '_COMPANY', driver: null, type: 'company', ok: true });
    } catch (e) {
      results.push({ dispatcher: '_COMPANY', driver: null, type: 'company', ok: false, error: e.message });
    }

    return results;
  }

  async function provisionCompany () {
    var company = await ensureFolder('_COMPANY', VAULT_ROOT_ID);
    var subs = {};
    for (var i = 0; i < COMPANY_SUBFOLDERS.length; i++) {
      subs[COMPANY_SUBFOLDERS[i]] = await ensureFolder(COMPANY_SUBFOLDERS[i], company.id);
    }
    return { root: company, subfolders: subs };
  }

  /**
   * Fetch the vault tree (2 levels: dispatcher -> driver folders).
   * Returns array of { id, name, children[] }
   */
  async function getVaultTree () {
    var topLevel = await listFolder(VAULT_ROOT_ID);
    var tree = [];
    for (var i = 0; i < topLevel.length; i++) {
      var item = topLevel[i];
      if (item.mimeType === FOLDER_MIME) {
        var children = await listFolder(item.id);
        tree.push(Object.assign({}, item, { children: children }));
      } else {
        tree.push(Object.assign({}, item, { children: [] }));
      }
    }
    return tree;
  }

  /** Scan a folder for exact-name duplicates; return { keep, remove } pairs. */
  async function checkDuplicates (folderId) {
    var files = await listFolder(folderId);
    var seen  = {};
    var dups  = [];
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!seen[f.name]) {
        seen[f.name] = f;
      } else {
        var a = seen[f.name], b = f;
        var older = new Date(a.createdTime) <= new Date(b.createdTime) ? a : b;
        var newer = (older === a) ? b : a;
        dups.push({ keep: older, remove: newer });
        seen[f.name] = older;
      }
    }
    return dups;
  }

  /* ?? Public surface ??????????????????????????????????????? */
  window.NexusDrive = {
    init        : init,
    requireAuth : requireAuth,
    get isAuthed () { return _tokenValid(); },

    vault: {
      rootId           : VAULT_ROOT_ID,
      listFolder       : listFolder,
      findFolder       : findFolder,
      ensureFolder     : ensureFolder,
      createShortcut   : createShortcut,
      provisionDriver  : provisionDriver,
      provisionAll     : provisionAll,
      provisionCompany : provisionCompany,
      getVaultTree     : getVaultTree,
      checkDuplicates  : checkDuplicates,
      dispatcherMap    : DISPATCHER_MAP
    },

    constants: {
      DRIVER_SUBFOLDERS  : DRIVER_SUBFOLDERS,
      COMPANY_SUBFOLDERS : COMPANY_SUBFOLDERS,
      FOLDER_MIME        : FOLDER_MIME,
      SHORTCUT_MIME      : SHORTCUT_MIME
    }
  };

})();
