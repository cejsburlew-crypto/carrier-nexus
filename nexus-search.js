/**
 * nexus-search.js — Global Search Engine for Carrier Nexus
 * Searches all localStorage collections and returns grouped results.
 * v1.0 — 2026-06-22
 */
(function() {
  'use strict';

  // ── Collection definitions ──────────────────────────────────────────────────
  var COLLECTIONS = [
    {
      key: 'nexus_loads_v2',
      category: 'Loads',
      icon: '🚛',
      url: 'active-loads.html',
      fields: ['loadNumber', 'load_number', 'driver', 'driverName', 'origin', 'destination',
               'pickupDate', 'deliveryDate', 'broker', 'status', 'rate', 'id'],
      titleFn: function(r) {
        return r.loadNumber || r.load_number || r.id || 'Load';
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.driver || r.driverName) parts.push(r.driver || r.driverName);
        if (r.origin && r.destination) parts.push(r.origin + ' → ' + r.destination);
        else if (r.pickupDate) parts.push('Pickup: ' + r.pickupDate);
        return parts.join(' · ') || 'Active Load';
      },
      metaFn: function(r) {
        return r.rate ? '$' + Number(r.rate).toLocaleString() : (r.status || '');
      }
    },
    {
      key: 'nexus_expenses',
      category: 'Expenses',
      icon: '💳',
      url: 'expenses.html',
      fields: ['description', 'vendor', 'category', 'date', 'amount', 'notes', 'driver', 'id'],
      titleFn: function(r) {
        return r.description || r.vendor || r.category || 'Expense';
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.vendor) parts.push(r.vendor);
        if (r.date) parts.push(r.date);
        if (r.driver) parts.push(r.driver);
        return parts.join(' · ') || 'Expense';
      },
      metaFn: function(r) {
        return r.amount ? '$' + Number(r.amount).toLocaleString() : '';
      }
    },
    {
      key: 'nexus_documents',
      category: 'Documents',
      icon: '📄',
      url: 'documents.html',
      fields: ['name', 'filename', 'docType', 'type', 'driver', 'driverName', 'date', 'notes', 'id'],
      titleFn: function(r) {
        return r.name || r.filename || r.docType || r.type || 'Document';
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.driver || r.driverName) parts.push(r.driver || r.driverName);
        if (r.docType || r.type) parts.push(r.docType || r.type);
        if (r.date) parts.push(r.date);
        return parts.join(' · ') || 'Document';
      },
      metaFn: function(r) {
        return r.docType || r.type || '';
      }
    },
    {
      key: 'nexus_invoices',
      category: 'Invoices',
      icon: '🧾',
      url: 'invoicing.html',
      fields: ['invoiceNumber', 'invoice_number', 'customer', 'broker', 'amount', 'date', 'status', 'id'],
      titleFn: function(r) {
        return r.invoiceNumber || r.invoice_number || r.id || 'Invoice';
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.customer || r.broker) parts.push(r.customer || r.broker);
        if (r.date) parts.push(r.date);
        return parts.join(' · ') || 'Invoice';
      },
      metaFn: function(r) {
        if (r.amount) return '$' + Number(r.amount).toLocaleString();
        return r.status || '';
      }
    },
    {
      key: 'nexus_dvir',
      category: 'Inspections',
      icon: '🔎',
      url: 'dvir.html',
      fields: ['driver', 'driverName', 'truck', 'trailer', 'date', 'status', 'defects', 'notes', 'id'],
      titleFn: function(r) {
        return (r.driver || r.driverName || 'Inspection') + (r.date ? ' — ' + r.date : '');
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.truck) parts.push('Truck: ' + r.truck);
        if (r.trailer) parts.push('Trailer: ' + r.trailer);
        return parts.join(' · ') || 'Inspection Report';
      },
      metaFn: function(r) {
        return r.status || '';
      }
    },
    {
      key: 'nexus_ifta',
      category: 'IFTA',
      icon: '⛽',
      url: 'ifta.html',
      fields: ['driver', 'state', 'miles', 'gallons', 'quarter', 'year', 'id'],
      titleFn: function(r) {
        var q = r.quarter ? 'Q' + r.quarter : '';
        var y = r.year || '';
        return 'IFTA' + (q ? ' ' + q : '') + (y ? ' ' + y : '');
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.driver) parts.push(r.driver);
        if (r.state) parts.push(r.state);
        return parts.join(' · ') || 'IFTA Record';
      },
      metaFn: function(r) {
        return r.miles ? r.miles + ' mi' : '';
      }
    },
    {
      key: 'nexus_vendors',
      category: 'Vendors',
      icon: '🏢',
      url: 'expenses.html',
      fields: ['name', 'category', 'contact', 'email', 'phone', 'notes', 'id'],
      titleFn: function(r) {
        return r.name || 'Vendor';
      },
      subtitleFn: function(r) {
        var parts = [];
        if (r.category) parts.push(r.category);
        if (r.contact) parts.push(r.contact);
        return parts.join(' · ') || 'Vendor';
      },
      metaFn: function(r) {
        return r.email || r.phone || '';
      }
    }
  ];

  // Drivers come from NEXUS_LOCAL_USERS filtered by role
  var DRIVERS_COLLECTION = {
    key: 'NEXUS_LOCAL_USERS',
    category: 'Drivers',
    icon: '👤',
    url: 'drivers.html',
    fields: ['name', 'email', 'role', 'id'],
    titleFn: function(r) { return r.name || r.email || 'User'; },
    subtitleFn: function(r) { return r.email || ''; },
    metaFn: function(r) { return r.role || ''; }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function safeJSON(str) {
    try { return JSON.parse(str); } catch(e) { return null; }
  }

  function matchesQuery(obj, query, fields) {
    if (!query) return true;
    var q = query.toLowerCase().trim();
    if (!q) return true;
    for (var i = 0; i < fields.length; i++) {
      var val = obj[fields[i]];
      if (val && typeof val === 'string' && val.toLowerCase().indexOf(q) > -1) return true;
      if (val && typeof val === 'number' && String(val).indexOf(q) > -1) return true;
    }
    // Also search all string values not in fields list for broad coverage
    var keys = Object.keys(obj);
    for (var j = 0; j < keys.length; j++) {
      var v = obj[keys[j]];
      if (typeof v === 'string' && v.toLowerCase().indexOf(q) > -1) return true;
    }
    return false;
  }

  function getCollection(key) {
    var raw = localStorage.getItem(key);
    if (!raw) return [];
    var parsed = safeJSON(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === 'object') return Object.values(parsed);
    return [];
  }

  function getWeeklyDedKeys() {
    var keys = [];
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf('nexus_weekly_ded_') === 0) keys.push(k);
    }
    return keys;
  }

  function searchWeeklyDeds(query) {
    var results = [];
    var keys = getWeeklyDedKeys();
    keys.forEach(function(k) {
      var raw = localStorage.getItem(k);
      var data = safeJSON(raw);
      if (!data) return;
      // key format: nexus_weekly_ded_YYYY-MM-DD_memberId
      var parts = k.replace('nexus_weekly_ded_', '').split('_');
      var weekDate = parts[0] || '';
      var memberId = parts.slice(1).join('_') || '';
      var obj = Object.assign({ weekDate: weekDate, memberId: memberId, _key: k }, data);
      if (matchesQuery(obj, query, ['weekDate', 'memberId', 'description', 'amount', 'type'])) {
        results.push({
          category: 'Expenses',
          icon: '💳',
          title: 'Weekly Deduction — ' + weekDate,
          subtitle: memberId ? 'Member: ' + memberId : 'Deduction',
          meta: data.amount ? '$' + Number(data.amount).toLocaleString() : '',
          url: 'weekly-settlements.html'
        });
      }
    });
    return results;
  }

  // ── Main search function ─────────────────────────────────────────────────────
  function search(query) {
    var MAX_PER_CAT = 5;
    var MAX_TOTAL = 25;
    var grouped = {};
    var totalCount = 0;

    // Search standard collections
    COLLECTIONS.forEach(function(col) {
      var items = getCollection(col.key);
      var matches = [];
      for (var i = 0; i < items.length && matches.length < MAX_PER_CAT; i++) {
        var item = items[i];
        if (item && typeof item === 'object' && matchesQuery(item, query, col.fields)) {
          matches.push({
            category: col.category,
            icon: col.icon,
            title: col.titleFn(item),
            subtitle: col.subtitleFn(item),
            meta: col.metaFn(item),
            url: col.url
          });
        }
      }
      if (matches.length > 0) {
        grouped[col.category] = (grouped[col.category] || []).concat(matches).slice(0, MAX_PER_CAT);
        totalCount += matches.length;
      }
    });

    // Search drivers (from NEXUS_LOCAL_USERS)
    var allUsers = getCollection('NEXUS_LOCAL_USERS');
    var drivers = allUsers.filter(function(u) {
      return u && (u.role === 'driver' || u.role === 'dispatcher') && matchesQuery(u, query, DRIVERS_COLLECTION.fields);
    }).slice(0, MAX_PER_CAT);
    if (drivers.length > 0) {
      grouped['Drivers'] = drivers.map(function(u) {
        return {
          category: 'Drivers',
          icon: u.role === 'dispatcher' ? '📋' : '👤',
          title: DRIVERS_COLLECTION.titleFn(u),
          subtitle: DRIVERS_COLLECTION.subtitleFn(u),
          meta: DRIVERS_COLLECTION.metaFn(u),
          url: u.role === 'dispatcher' ? 'dispatcher-hub.html' : 'drivers.html'
        };
      });
      totalCount += drivers.length;
    }

    // Search weekly deductions
    var weeklyResults = searchWeeklyDeds(query).slice(0, MAX_PER_CAT);
    if (weeklyResults.length > 0) {
      grouped['Expenses'] = (grouped['Expenses'] || []).concat(weeklyResults).slice(0, MAX_PER_CAT);
      totalCount += weeklyResults.length;
    }

    // Flatten to ordered results list, cap at MAX_TOTAL
    var categoryOrder = ['Loads', 'Drivers', 'Documents', 'Expenses', 'Invoices', 'Inspections', 'IFTA', 'Vendors'];
    var results = [];
    categoryOrder.forEach(function(cat) {
      if (grouped[cat]) {
        grouped[cat].forEach(function(r) {
          if (results.length < MAX_TOTAL) results.push(r);
        });
      }
    });
    // Add any categories not in order
    Object.keys(grouped).forEach(function(cat) {
      if (categoryOrder.indexOf(cat) === -1) {
        grouped[cat].forEach(function(r) {
          if (results.length < MAX_TOTAL) results.push(r);
        });
      }
    });

    return { results: results, grouped: grouped, totalCount: Math.min(totalCount, MAX_TOTAL) };
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  window.NexusSearch = { search: search };

})();

// ── Search UI Controller ─────────────────────────────────────────────────────
window.NexusSearchUI = (function() {
  var _debounceTimer = null;
  var _selectedIndex = -1;
  var _currentResults = [];

  var CATEGORY_COLORS = {
    'Loads':       '#3b82f6',
    'Drivers':     '#10b981',
    'Documents':   '#f59e0b',
    'Expenses':    '#ef4444',
    'Invoices':    '#8b5cf6',
    'Inspections': '#06b6d4',
    'IFTA':        '#f97316',
    'Vendors':     '#64748b'
  };

  function open() {
    var overlay = document.getElementById('nexus-search-overlay');
    if (!overlay) { _injectOverlay(); overlay = document.getElementById('nexus-search-overlay'); }
    if (!overlay) return;
    overlay.style.display = 'block';
    _selectedIndex = -1;
    _currentResults = [];
    var input = document.getElementById('nexus-search-input');
    if (input) {
      input.value = '';
      setTimeout(function() { input.focus(); }, 50);
    }
    _renderEmpty();
  }

  function close() {
    var overlay = document.getElementById('nexus-search-overlay');
    if (overlay) overlay.style.display = 'none';
    _selectedIndex = -1;
  }

  function handleInput(query) {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(function() {
      if (!query || !query.trim()) {
        _renderEmpty();
        _currentResults = [];
        return;
      }
      if (!window.NexusSearch) { _renderError('Search engine not loaded.'); return; }
      var res = window.NexusSearch.search(query.trim());
      _currentResults = res.results;
      _selectedIndex = -1;
      _renderResults(res, query.trim());
    }, 120);
  }

  function handleKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); _moveSelection(1); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); _moveSelection(-1); return; }
    if (e.key === 'Enter')     { e.preventDefault(); _openSelected(); return; }
  }

  function _moveSelection(dir) {
    var items = document.querySelectorAll('.nsr-item');
    if (!items.length) return;
    _selectedIndex = Math.max(-1, Math.min(items.length - 1, _selectedIndex + dir));
    items.forEach(function(el, i) {
      if (i === _selectedIndex) {
        el.style.background = 'rgba(233,30,140,0.12)';
        el.style.borderLeftColor = '#e91e8c';
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.style.background = '';
        el.style.borderLeftColor = 'transparent';
      }
    });
  }

  function _openSelected() {
    if (_selectedIndex >= 0 && _currentResults[_selectedIndex]) {
      window.location.href = _currentResults[_selectedIndex].url;
    } else if (_selectedIndex === -1 && _currentResults.length > 0) {
      window.location.href = _currentResults[0].url;
    }
  }

  function _renderEmpty() {
    var el = document.getElementById('nexus-search-results');
    if (!el) return;
    el.innerHTML = '<div style="padding:32px 16px;text-align:center;color:#6b7280;font-size:13px;font-family:\'JetBrains Mono\',monospace;">' +
      '<div style="font-size:28px;margin-bottom:8px;">🔍</div>' +
      'Start typing to search loads, drivers, documents, and more…' +
      '</div>';
  }

  function _renderError(msg) {
    var el = document.getElementById('nexus-search-results');
    if (!el) return;
    el.innerHTML = '<div style="padding:24px 16px;text-align:center;color:#ef4444;font-size:13px;">' + msg + '</div>';
  }

  function _renderResults(res, query) {
    var el = document.getElementById('nexus-search-results');
    if (!el) return;
    if (!res.results.length) {
      el.innerHTML = '<div style="padding:32px 16px;text-align:center;color:#6b7280;font-size:13px;font-family:\'JetBrains Mono\',monospace;">' +
        'No results found for <strong style="color:#9ca3af;">"' + _esc(query) + '"</strong>' +
        '</div>';
      return;
    }

    var html = '';
    var lastCat = null;
    var flatIdx = 0;

    res.results.forEach(function(r) {
      if (r.category !== lastCat) {
        var color = CATEGORY_COLORS[r.category] || '#9ca3af';
        html += '<div style="padding:6px 16px 3px;display:flex;align-items:center;gap:8px;">' +
          '<span style="font-family:\'JetBrains Mono\',monospace;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:' + color + ';">' + _esc(r.category) + '</span>' +
          '<div style="flex:1;height:1px;background:#1f2937;"></div>' +
          '</div>';
        lastCat = r.category;
      }

      html += '<div class="nsr-item" data-idx="' + flatIdx + '" data-url="' + _esc(r.url) + '" ' +
        'style="display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;border-left:3px solid transparent;transition:all .1s;" ' +
        'onmouseenter="this.style.background=\'rgba(233,30,140,0.12)\';this.style.borderLeftColor=\'#e91e8c\';" ' +
        'onmouseleave="if(' + flatIdx + '!==window._nsrSelIdx){this.style.background=\'\';this.style.borderLeftColor=\'transparent\';}" ' +
        'onclick="window.location.href=\'' + _esc(r.url) + '\'">' +
        '<span style="font-size:18px;flex-shrink:0;line-height:1;">' + r.icon + '</span>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:13px;font-weight:600;color:#f9fafb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + _esc(r.title) + '</div>' +
          (r.subtitle ? '<div style="font-size:11px;color:#9ca3af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;">' + _esc(r.subtitle) + '</div>' : '') +
        '</div>' +
        (r.meta ? '<span style="font-size:11px;color:#6b7280;flex-shrink:0;background:#1f2937;padding:2px 7px;border-radius:4px;white-space:nowrap;">' + _esc(r.meta) + '</span>' : '') +
        '</div>';
      flatIdx++;
    });

    html += '<div style="padding:8px 16px;text-align:right;font-size:10px;color:#4b5563;font-family:\'JetBrains Mono\',monospace;">' +
      res.totalCount + ' result' + (res.totalCount !== 1 ? 's' : '') + '</div>';

    el.innerHTML = html;
  }

  function _esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _injectOverlay() {
    if (document.getElementById('nexus-search-overlay')) return;
    var div = document.createElement('div');
    div.id = 'nexus-search-overlay';
    div.style.cssText = 'display:none;position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);';
    div.addEventListener('click', function(e) {
      if (e.target === div) close();
    });
    div.innerHTML =
      '<div style="position:absolute;top:10%;left:50%;transform:translateX(-50%);width:min(600px,90vw);background:#111827;border-radius:12px;box-shadow:0 25px 50px rgba(0,0,0,0.6);overflow:hidden;border:1px solid #1f2937;">' +
        '<div style="padding:14px 16px;border-bottom:1px solid #1f2937;display:flex;align-items:center;gap:10px;">' +
          '<span style="font-size:18px;flex-shrink:0;">🔍</span>' +
          '<input id="nexus-search-input" type="text" placeholder="Search loads, drivers, documents, expenses…" ' +
            'style="flex:1;background:transparent;border:none;outline:none;color:#f9fafb;font-size:15px;font-family:\'Barlow\',sans-serif;" />' +
          '<kbd style="background:#1f2937;border:1px solid #374151;color:#9ca3af;padding:2px 8px;border-radius:4px;font-size:11px;font-family:\'JetBrains Mono\',monospace;flex-shrink:0;">ESC</kbd>' +
        '</div>' +
        '<div id="nexus-search-results" style="max-height:60vh;overflow-y:auto;"></div>' +
        '<div style="padding:7px 16px;border-top:1px solid #1f2937;color:#4b5563;font-size:10px;display:flex;gap:16px;font-family:\'JetBrains Mono\',monospace;">' +
          '<span>↑↓ navigate</span><span>↵ open</span><span>ESC close</span><span style="margin-left:auto;">⌘K to reopen</span>' +
        '</div>' +
      '</div>';
    document.body.appendChild(div);

    var input = div.querySelector('#nexus-search-input');
    if (input) {
      input.addEventListener('input', function() { handleInput(this.value); });
      input.addEventListener('keydown', handleKey);
    }

    _renderEmpty();
  }

  // Inject overlay immediately if DOM ready, else wait
  if (document.body) {
    _injectOverlay();
  } else {
    document.addEventListener('DOMContentLoaded', _injectOverlay);
  }

  // Global Cmd+K / Ctrl+K shortcut
  document.addEventListener('keydown', function(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      var overlay = document.getElementById('nexus-search-overlay');
      if (overlay && overlay.style.display !== 'none') {
        close();
      } else {
        open();
      }
    }
  });

  return { open: open, close: close, handleInput: handleInput, handleKey: handleKey };
})();
