// ── CARRIER NEXUS — PERMIT GEO-ALERT ENGINE ─────────────────────────────────
// Watches GPS position, alerts driver when within 10 miles of a permit state border
// Uses Haversine formula against state bounding boxes
// Called from driver-command.html on load

(function() {
  if (typeof window.NexusPermitGeo !== 'undefined') return; // already loaded

  var ACK_KEY     = 'nexus_permit_acks';
  var PERMITS_KEY = 'nexus_permits';
  var LOADS_KEY   = 'nexus_loads_v2';
  var GEO_ALERT_DISTANCE_MILES = 10;

  // State bounding boxes: [minLat, maxLat, minLng, maxLng]
  var STATE_BOUNDS = {
    AL:[30.14,35.01,-88.47,-84.89], AK:[51.21,71.35,-179.2,-129.98], AZ:[31.33,37.00,-114.82,-109.04],
    AR:[33.00,36.50,-94.62,-89.64], CA:[32.53,42.01,-124.41,-114.13], CO:[36.99,41.00,-109.05,-102.04],
    CT:[40.95,42.05,-73.73,-71.79], DE:[38.44,39.84,-75.79,-74.98], FL:[24.39,31.00,-87.63,-79.97],
    GA:[30.36,35.00,-85.61,-80.84], HI:[18.86,22.24,-160.26,-154.80], ID:[41.99,49.00,-117.24,-111.04],
    IL:[36.97,42.51,-91.51,-87.02], IN:[37.77,41.77,-88.10,-84.78], IA:[40.38,43.50,-96.64,-90.14],
    KS:[36.99,40.00,-102.05,-94.59], KY:[36.49,39.15,-89.57,-81.96], LA:[28.93,33.02,-94.04,-88.82],
    ME:[43.06,47.46,-71.08,-66.95], MD:[37.91,39.72,-79.49,-74.99], MA:[41.19,42.89,-73.53,-69.93],
    MI:[41.70,48.31,-90.42,-82.12], MN:[43.50,49.38,-97.24,-89.49], MS:[30.17,35.01,-91.66,-88.10],
    MO:[35.99,40.61,-95.77,-89.10], MT:[44.36,49.00,-116.05,-104.04], NE:[39.99,43.00,-104.05,-95.31],
    NV:[35.00,42.00,-120.01,-114.04], NH:[42.70,45.31,-72.56,-70.70], NJ:[38.93,41.36,-75.56,-73.89],
    NM:[31.33,37.00,-109.05,-103.00], NY:[40.50,45.01,-79.76,-71.86], NC:[33.84,36.59,-84.32,-75.46],
    ND:[45.93,49.00,-104.05,-96.56], OH:[38.40,42.33,-84.82,-80.52], OK:[33.62,37.00,-103.00,-94.43],
    OR:[41.99,46.24,-124.60,-116.46], PA:[39.72,42.27,-80.52,-74.69], RI:[41.15,42.02,-71.91,-71.12],
    SC:[32.05,35.22,-83.36,-78.55], SD:[42.48,45.94,-104.06,-96.44], TN:[34.98,36.68,-90.31,-81.65],
    TX:[25.84,36.50,-106.65,-93.51], UT:[36.99,42.00,-114.05,-109.04], VT:[42.73,45.02,-73.44,-71.50],
    VA:[36.54,39.46,-83.68,-75.24], WA:[45.54,49.00,-124.73,-116.92], WV:[37.20,40.64,-82.64,-77.72],
    WI:[42.49,47.08,-92.89,-86.25], WY:[40.99,45.01,-111.06,-104.05]
  };

  // Haversine distance in miles between two lat/lng points
  function distanceMiles(lat1, lng1, lat2, lng2) {
    var R = 3958.8;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*
            Math.sin(dLng/2)*Math.sin(dLng/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Distance from a point to the NEAREST EDGE of a state bounding box
  function distToStateBorder(lat, lng, stateCode) {
    var b = STATE_BOUNDS[stateCode.toUpperCase()];
    if (!b) return 9999;
    var minLat=b[0], maxLat=b[1], minLng=b[2], maxLng=b[3];
    // Is driver already inside this state's bounding box?
    var inside = (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng);
    if (inside) return 0;
    // Find nearest point on bounding box edge
    var nearLat = Math.max(minLat, Math.min(maxLat, lat));
    var nearLng = Math.max(minLng, Math.min(maxLng, lng));
    return distanceMiles(lat, lng, nearLat, nearLng);
  }

  // Determine current state from GPS (returns 2-letter code or null)
  function getCurrentState(lat, lng) {
    var candidates = [];
    Object.keys(STATE_BOUNDS).forEach(function(code) {
      var b = STATE_BOUNDS[code];
      if (lat >= b[0] && lat <= b[1] && lng >= b[2] && lng <= b[3]) {
        candidates.push(code);
      }
    });
    return candidates.length === 1 ? candidates[0] : (candidates[0] || null);
  }

  // Check if this permit+state combo was already geo-acked this session
  function wasGeoAcked(permitId, stateCode) {
    var key = 'nexus_geo_ack_session_' + permitId + '_' + stateCode;
    return sessionStorage.getItem(key) === '1';
  }
  function markGeoAcked(permitId, stateCode) {
    var key = 'nexus_geo_ack_session_' + permitId + '_' + stateCode;
    sessionStorage.setItem(key, '1');
  }

  // Get driver's active permits
  function getActivePermits(driverId) {
    var permits = [];
    try { permits = JSON.parse(localStorage.getItem(PERMITS_KEY) || '[]'); } catch(e) {}
    var loads = [];
    try { loads = JSON.parse(localStorage.getItem(LOADS_KEY) || '[]'); } catch(e) {}
    var myLoadIds = loads
      .filter(function(l) { return (l.driver||'').toUpperCase() === driverId.toUpperCase() && ['active','transit','pending'].includes(l.status); })
      .map(function(l) { return l.id; });
    return permits.filter(function(p) {
      var linked = p.driver && p.driver.toUpperCase() === driverId.toUpperCase();
      var onMyLoad = p.load_ref && myLoadIds.includes(p.load_ref);
      var notExpired = !p.expiry_date || new Date(p.expiry_date) >= new Date();
      return (linked || onMyLoad) && notExpired;
    });
  }

  // Build restrictions list from permit
  function buildRestrictions(p) {
    if (p.restrictions && p.restrictions.length) return p.restrictions;
    var list = [];
    var tw = p.travel_window || 'anytime';
    if (tw !== 'anytime') {
      var twMap = {daylight:'Daylight travel only — no driving before sunrise or after sunset', sunrise_sunset:'30 min after sunrise to 30 min before sunset', no_weekend:'No weekend travel — Mon–Fri only', no_holiday:'No holiday travel', specific:'Specific hours — check permit notes'};
      list.push({id:'r_time', type:'time', text:'Travel Window: '+( twMap[tw]||tw)});
    }
    var escort = p.escort || 'none';
    if (escort !== 'none') {
      var escMap = {front:'Front pilot car required',rear:'Rear escort required',front_rear:'Front AND rear escorts required',police:'Police escort required',pilot_only:'Pilot car required'};
      list.push({id:'r_escort', type:'escort', text:'Escort Required: '+(escMap[escort]||escort)});
    }
    if (p.route) list.push({id:'r_route', type:'route', text:'Route: '+p.route});
    var dims = [p.height?'H: '+p.height:'', p.width?'W: '+p.width:'', p.length?'L: '+p.length:''].filter(Boolean).join(' · ');
    if (dims) list.push({id:'r_size', type:'size', text:'Oversize: '+dims+' — verify clearances'});
    if (p.weight) list.push({id:'r_weight', type:'weight', text:'Max Gross: '+Number(p.weight).toLocaleString()+' lbs'});
    if (p.notes) list.push({id:'r_notes', type:'other', text:p.notes});
    return list;
  }

  // Show the geo-alert bottom sheet
  function showGeoAlert(permit, stateCode, distMiles) {
    var existing = document.getElementById('nexus-geo-alert');
    if (existing) existing.remove();

    var restrictions = buildRestrictions(permit);
    if (!restrictions.length) { markGeoAcked(permit.id, stateCode); return; }

    var sheet = document.createElement('div');
    sheet.id = 'nexus-geo-alert';
    sheet.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9000;background:#0b0f1a;border-top:2px solid #f97316;border-radius:16px 16px 0 0;padding:20px 20px 32px;max-height:85vh;overflow-y:auto;box-shadow:0 -8px 32px rgba(0,0,0,.6);transition:transform .3s ease;';

    var pNum = permit.permit_number || permit.permitNo || 'Permit';
    var checkboxes = restrictions.map(function(r, i) {
      var icons = {time:'⏰',route:'🗺️',escort:'🚔',speed:'⚡',size:'📐',weight:'⚖️',other:'⚠️'};
      return '<label id="geo-row-'+i+'" style="display:flex;align-items:flex-start;gap:12px;background:#131929;border:2px solid #1e2d45;border-radius:10px;padding:13px 14px;margin-bottom:8px;cursor:pointer;transition:.15s;" onclick="nexusGeoToggle('+i+', this)">' +
        '<div id="geo-cb-'+i+'" style="width:26px;height:26px;border:2px solid #1e2d45;border-radius:6px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:14px;background:#1a2235;margin-top:1px;transition:.2s;"></div>' +
        '<div><div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:2px;">'+(icons[r.type]||'⚠️')+' '+r.text+'</div></div>' +
        '</label>';
    }).join('');

    sheet.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">' +
        '<span style="font-size:24px;">🚨</span>' +
        '<div><div style="font-size:15px;font-weight:900;color:#f97316;">ENTERING '+stateCode+' IN ~'+Math.ceil(distMiles)+' MILES</div>' +
        '<div style="font-size:11px;color:#64748b;">'+pNum+' · Acknowledge all restrictions before crossing</div></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#f59e0b;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:8px;padding:9px 12px;margin-bottom:14px;">'+
        '⚠️ You are '+Math.ceil(distMiles).toFixed(1)+' miles from the '+stateCode+' state border. Check off each restriction to continue.'+
      '</div>' +
      '<div id="geo-restrictions">'+checkboxes+'</div>' +
      '<div style="font-size:10px;color:#64748b;text-align:center;margin:10px 0 8px;">Check all '+restrictions.length+' restriction'+(restrictions.length===1?'':'s')+' to dismiss</div>'+
      '<button id="geo-ack-btn" onclick="nexusGeoSubmit(\''+permit.id+'\',\''+stateCode+'\')" disabled style="width:100%;background:#1a2235;color:#64748b;border:none;border-radius:10px;font-size:15px;font-weight:800;padding:14px;cursor:not-allowed;min-height:52px;transition:.2s;">✓ All Restrictions Acknowledged</button>';

    document.body.appendChild(sheet);

    // Inject toggle/submit helpers into window
    window._geoTotal = restrictions.length;
    window._geoChecked = {};
    window.nexusGeoToggle = function(idx, row) {
      window._geoChecked[idx] = !window._geoChecked[idx];
      var cb = document.getElementById('geo-cb-'+idx);
      if (window._geoChecked[idx]) {
        row.style.borderColor = '#10b981'; row.style.background = 'rgba(16,185,129,.04)';
        cb.textContent = '✓'; cb.style.borderColor = '#10b981'; cb.style.background = '#10b981'; cb.style.color = '#fff';
      } else {
        row.style.borderColor = '#1e2d45'; row.style.background = '#131929';
        cb.textContent = ''; cb.style.borderColor = '#1e2d45'; cb.style.background = '#1a2235'; cb.style.color = '';
      }
      var count = Object.values(window._geoChecked).filter(Boolean).length;
      var btn = document.getElementById('geo-ack-btn');
      if (count >= window._geoTotal) {
        btn.disabled = false; btn.style.background = '#10b981'; btn.style.color = '#fff'; btn.style.cursor = 'pointer';
      } else {
        btn.disabled = true; btn.style.background = '#1a2235'; btn.style.color = '#64748b'; btn.style.cursor = 'not-allowed';
      }
    };
    window.nexusGeoSubmit = function(pId, sCode) {
      // Log ack
      try {
        var acks = JSON.parse(localStorage.getItem(ACK_KEY) || '[]');
        acks.unshift({ id:'GEO-'+Date.now(), type:'geo_alert', permitId:pId, stateCode:sCode, distMiles:distMiles, ackedAt:new Date().toISOString() });
        localStorage.setItem(ACK_KEY, JSON.stringify(acks));
      } catch(e) {}
      markGeoAcked(pId, sCode);
      var el = document.getElementById('nexus-geo-alert');
      if (el) { el.style.transform = 'translateY(110%)'; setTimeout(function(){ el.remove(); }, 350); }
    };
  }

  // Main check function
  function checkPosition(pos) {
    var lat = pos.coords.latitude;
    var lng = pos.coords.longitude;
    var sess = {};
    try { sess = JSON.parse(sessionStorage.getItem('nexus_session') || '{}'); } catch(e) {}
    var driverId = sess.id || sess.driverId || '';
    if (!driverId) return;

    var permits = getActivePermits(driverId);
    if (!permits.length) return;

    permits.forEach(function(permit) {
      var stateCode = (permit.state || '').toUpperCase();
      if (!stateCode || !STATE_BOUNDS[stateCode]) return;
      if (wasGeoAcked(permit.id, stateCode)) return;
      // Don't alert if already IN the state
      var currentState = getCurrentState(lat, lng);
      if (currentState === stateCode) return;
      var dist = distToStateBorder(lat, lng, stateCode);
      if (dist <= GEO_ALERT_DISTANCE_MILES) {
        showGeoAlert(permit, stateCode, dist);
      }
    });
  }

  // Expose and start watching
  window.NexusPermitGeo = {
    start: function() {
      if (!navigator.geolocation) return;
      // Initial check
      navigator.geolocation.getCurrentPosition(checkPosition, null, {enableHighAccuracy:true, timeout:10000});
      // Watch for movement (every ~60s or on significant movement)
      setInterval(function() {
        navigator.geolocation.getCurrentPosition(checkPosition, null, {enableHighAccuracy:false, timeout:8000, maximumAge:30000});
      }, 60000);
    },
    checkNow: function() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(checkPosition, null, {enableHighAccuracy:true, timeout:10000});
    }
  };

})();
