// Season 3 roster — reads the registrations from the Google Sheet (via the Apps Script web app).
// Only public fields are shown: in-game name, role, SS2 server. Contact / player ID are never sent to the page.
(function () {
  const ROLES = [
    { key: 'Shieldman', cls: 'r-shield' },
    { key: 'Archer',    cls: 'r-archer' },
    { key: 'Cavalry',   cls: 'r-cav' }
  ];
  const SERVERS = ['SS2-001', 'SS2-002', 'SS2-003', 'SS2-004', 'SS2-005', 'SS2-006', 'SS2-007'];
  const SHOW_NAMES = window.ROSTER_SHOW_NAMES !== false;   // set window.ROSTER_SHOW_NAMES = false in config.js to hide names
  const $ = id => document.getElementById(id);
  if (!$('r-cards')) return;

  const state = { members: [], role: 'all', server: 'all', q: '', updated: null, loaded: false };

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function normServer(v) {
    v = String(v || '').trim().toUpperCase();
    const m = v.match(/^(?:SS2[-\s]?)?(\d{1,3})$/);
    return m ? 'SS2-' + m[1].padStart(3, '0') : v;
  }
  function normRole(v) {
    const r = ROLES.find(x => x.key.toLowerCase() === String(v || '').trim().toLowerCase());
    return r ? r.key : '';
  }
  const roleCls = k => (ROLES.find(r => r.key === k) || {}).cls || 'r-none';
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // ---- loading (fetch first; fall back to JSONP if the browser blocks the cross-site request) ----
  function withParam(url, k, v) { return url + (url.includes('?') ? '&' : '?') + k + '=' + encodeURIComponent(v); }
  function jsonp(url) {
    return new Promise((resolve, reject) => {
      const cb = '__roster_' + Date.now();
      const s = document.createElement('script');
      const t = setTimeout(() => { done(); reject(new Error('timeout')); }, 15000);
      function done() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = d => { done(); resolve(d); };
      s.onerror = () => { done(); reject(new Error('load')); };
      s.src = withParam(url, 'callback', cb);
      document.head.appendChild(s);
    });
  }
  function load(url) {
    const u = withParam(url, '_', Date.now());
    return fetch(u, { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .catch(() => jsonp(u));
  }

  function refresh() {
    const url = window.SHEET_URL;
    if (!url) { setStatus('Roster not connected yet — set SHEET_URL in js/config.js.', true); return Promise.resolve(); }
    return load(url).then(data => {
      if (!data || !Array.isArray(data.members)) throw new Error('bad data');
      state.members = data.members.map(m => ({
        ign: String(m.ign || '').trim().slice(0, 40),
        role: normRole(m.role),
        server: normServer(m.server)
      })).filter(m => m.ign);
      state.updated = data.updated ? new Date(data.updated) : new Date();
      state.loaded = true;
      setStatus('', false);
      render();
    }).catch(() => {
      if (!state.loaded) setStatus('Could not load the roster. Please try again later.', true);
    });
  }
  function setStatus(msg, err) {
    const s = $('r-status'); s.textContent = msg; s.className = 'r-status' + (err ? ' err' : '');
    if (err && !state.loaded) $('r-updated').textContent = 'not available';
  }

  // ---- rendering ----
  function count(list, fn) { const o = {}; list.forEach(m => { const k = fn(m); o[k] = (o[k] || 0) + 1; }); return o; }

  function render() {
    const all = state.members, total = all.length;
    const byRole = count(all, m => m.role || '');
    const byServer = count(all, m => m.server);

    $('r-updated').textContent = 'updated ' + (isNaN(state.updated) ? '–' : fmt.format(state.updated));
    $('r-total-n').textContent = total;
    const pills = $('r-total-pills'); pills.replaceChildren();
    ROLES.forEach(r => pills.appendChild(el('span', 'r-pill ' + r.cls, r.key + ' ' + (byRole[r.key] || 0))));
    if (byRole['']) pills.appendChild(el('span', 'r-pill r-none', 'Unassigned ' + byRole['']));

    // role cards, ranked by count
    const cards = $('r-cards'); cards.replaceChildren();
    ROLES.slice().sort((a, b) => (byRole[b.key] || 0) - (byRole[a.key] || 0)).forEach((r, i) => {
      const n = byRole[r.key] || 0, pct = total ? Math.round(n * 100 / total) : 0;
      const c = el('button', 'r-card ' + r.cls + (state.role === r.key ? ' on' : ''));
      c.type = 'button'; c.setAttribute('aria-pressed', String(state.role === r.key));
      c.addEventListener('click', () => { state.role = state.role === r.key ? 'all' : r.key; render(); });
      const top = el('div', 'r-card-top');
      top.append(el('span', 'r-rank', String(i + 1)), el('span', 'r-card-name', r.key));
      const bar = el('div', 'r-bar'), fill = el('span'); fill.style.width = pct + '%'; bar.appendChild(fill);
      c.append(top, el('div', 'r-card-n', String(n)), bar, el('div', 'r-card-sub', pct + '% of roster'));
      cards.appendChild(c);
    });

    // server chips
    const sv = $('r-servers'); sv.replaceChildren();
    const mkChip = (label, key, n) => {
      const b = el('button', 'r-chip' + (state.server === key ? ' on' : ''));
      b.type = 'button'; b.setAttribute('aria-pressed', String(state.server === key));
      b.append(el('span', null, label), el('b', null, String(n)));
      b.addEventListener('click', () => { state.server = state.server === key && key !== 'all' ? 'all' : key; render(); });
      sv.appendChild(b);
    };
    mkChip('All', 'all', total);
    SERVERS.forEach(s => mkChip(s, s, byServer[s] || 0));
    Object.keys(byServer).filter(s => !SERVERS.includes(s)).sort().forEach(s => mkChip(s || 'Other', s, byServer[s]));

    // tabs
    const tabs = $('r-tabs'); tabs.replaceChildren();
    [{ key: 'all', label: 'Overview', n: total }].concat(ROLES.map(r => ({ key: r.key, label: r.key, n: byRole[r.key] || 0, cls: r.cls })))
      .forEach(t => {
        const b = el('button', 'r-tab ' + (t.cls || '') + (state.role === t.key ? ' on' : ''), t.label + ' · ' + t.n);
        b.type = 'button'; b.setAttribute('aria-pressed', String(state.role === t.key));
        b.addEventListener('click', () => { state.role = t.key; render(); });
        tabs.appendChild(b);
      });

    renderList();
  }

  function renderList() {
    const list = $('r-list'); list.replaceChildren();
    if (!SHOW_NAMES) { list.appendChild(el('p', 'r-empty', 'Member names are hidden. Totals are shown above.')); return; }
    const q = state.q.toLowerCase();
    const rows = state.members.filter(m =>
      (state.role === 'all' || m.role === state.role) &&
      (state.server === 'all' || m.server === state.server) &&
      (!q || m.ign.toLowerCase().includes(q))
    ).sort((a, b) => a.ign.localeCompare(b.ign));
    if (!rows.length) { list.appendChild(el('p', 'r-empty', state.loaded ? 'No members match.' : '')); return; }
    rows.forEach(m => {
      const row = el('div', 'r-member ' + roleCls(m.role));
      row.append(el('span', 'r-dot'), el('span', 'r-name', m.ign), el('span', 'r-role', m.role || '—'), el('span', 'r-srv', m.server || '—'));
      list.appendChild(row);
    });
  }

  $('r-search').addEventListener('input', e => { state.q = e.target.value.trim(); renderList(); });
  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 60000);
})();
