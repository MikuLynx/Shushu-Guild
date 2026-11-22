const yr=document.getElementById('yr'); if(yr) yr.textContent = new Date().getFullYear();

// Schedule
const tbody = document.getElementById('schedule-body');
if (tbody) {
const fmt = new Intl.DateTimeFormat(undefined, {dateStyle:'medium', timeStyle:'short'});
(window.SCHEDULE || []).forEach(r => {
  const d = new Date(r.utc.replace(' ', 'T') + ':00Z');
  const tr = document.createElement('tr');
  if (d < new Date()) tr.className = 'past';
  [r.event, r.utc + ' UTC', isNaN(d) ? '-' : fmt.format(d), r.notes || ''].forEach(t => {
    const td = document.createElement('td'); td.textContent = t; tr.appendChild(td);
  });
  tbody.appendChild(tr);
});
}

// Registration
const ADMIN_DISCORD = window.ADMIN_DISCORD || 'mikulynx';
const form = document.getElementById('reg-form');
const status = document.getElementById('reg-status');

// GET helper for the Google script (fetch first, JSONP fallback if the browser blocks the cross-site read)
function sheetGet(params) {
  const q = new URLSearchParams(params); q.set('_', Date.now());
  const url = window.SHEET_URL + (window.SHEET_URL.includes('?') ? '&' : '?') + q;
  return fetch(url, { cache: 'no-store' }).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .catch(() => new Promise((resolve, reject) => {
      const cb = '__reg_' + Date.now(), s = document.createElement('script');
      const t = setTimeout(() => { done(); reject(new Error('timeout')); }, 15000);
      function done() { clearTimeout(t); delete window[cb]; s.remove(); }
      window[cb] = d => { done(); resolve(d); };
      s.onerror = () => { done(); reject(new Error('load')); };
      s.src = url + '&callback=' + cb; document.head.appendChild(s);
    }));
}
// true only when the script clearly answers "exists": true (old script versions simply don't answer)
async function alreadyRegistered(server, playerId) {
  try { const d = await sheetGet({ action: 'check', server, player_id: playerId }); return !!d && d.exists === true; }
  catch { return false; }
}

if (form) form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => {
    const bad = !f.value.trim(); f.classList.toggle('bad', bad); if (bad) ok = false;
  });
  status.className = '';
  if (!ok) { status.textContent = 'Please fill in all required fields.'; status.classList.add('err'); return; }
  if (!window.SHEET_URL) {
    status.textContent = 'Form not connected yet — set SHEET_URL in js/config.js.'; status.classList.add('err'); return;
  }
  const btn = form.querySelector('button'); btn.disabled = true;
  status.textContent = 'Checking…';
  if (await alreadyRegistered(form.elements.server.value, form.elements.player_id.value.trim())) {
    status.textContent = 'This player is already registered. If there is any mistake, please contact the administrator on Discord: ' + ADMIN_DISCORD + '.';
    status.className = 'err'; btn.disabled = false; return;
  }
  try {
    // Apps Script web apps don't send CORS headers for reading, so use no-cors:
    // the data is delivered, but the response can't be read (success = no network error).
    await fetch(window.SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      body: new URLSearchParams(new FormData(form))
    });
    form.reset(); status.textContent = 'Registration sent! We will contact you soon. If there is any mistake, contact the administrator on Discord: ' + ADMIN_DISCORD + '.'; status.className = 'ok';
  } catch {
    status.textContent = 'Could not send. Please try again or contact the administrator on Discord: ' + ADMIN_DISCORD + '.'; status.className = 'err';
  }
  btn.disabled = false;
});

// News: official Facebook page timeline (updates automatically, no redeploy needed)
const feed = document.getElementById('fb-feed');
if (feed) {
  const w = Math.max(180, Math.min(500, feed.clientWidth - 24));
  const src = 'https://www.facebook.com/plugins/page.php?href=' + encodeURIComponent(feed.dataset.page) +
    '&tabs=timeline&width=' + w + '&height=700&small_header=true&adapt_container_width=false&hide_cover=false&show_facepile=false';
  const f = document.createElement('iframe');
  f.src = src; f.width = w; f.height = 700; f.loading = 'lazy'; f.title = 'Conquest of Nine Kingdoms on Facebook';
  f.allow = 'encrypted-media';
  feed.appendChild(f);
}

// News cards with Details button
const list = document.getElementById('news-list');
if (list) {
  const render = items => items.forEach((n, i) => {
    const card = document.createElement('article'); card.className = 'news-card';
    const t = document.createElement('time'); t.textContent = n.date || '';
    const h = document.createElement('h3'); h.textContent = n.title || '';
    const p = document.createElement('p'); p.textContent = n.summary || '';
    const btn = document.createElement('button'); btn.className = 'more'; btn.textContent = 'Details ▾';
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'news-body-' + i);
    const body = document.createElement('div'); body.className = 'news-body'; body.id = 'news-body-' + i; body.hidden = true;
    (n.body || '').split(/\n\n+/).forEach(par => { const q = document.createElement('p'); q.textContent = par; body.appendChild(q); });
    if (n.link && /^https:\/\//.test(n.link)) {
      const a = document.createElement('a'); a.href = n.link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Read on Facebook ↗';
      body.appendChild(a);
    }
    btn.addEventListener('click', () => {
      const open = body.hidden; body.hidden = !open;
      btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Hide ▴' : 'Details ▾';
    });
    card.append(t, h, p, btn, body); list.appendChild(card);
  });
  // manual posts (js/news.js) + automatic posts (js/news-auto.json, updated by GitHub Action)
  fetch('js/news-auto.json').then(r => r.ok ? r.json() : []).catch(() => []).then(auto => {
    const manual = window.NEWS || [];
    const seen = new Set(manual.map(n => n.link).filter(Boolean));
    render(manual.concat((Array.isArray(auto) ? auto : []).filter(n => !n.link || !seen.has(n.link)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')));
  });
}
