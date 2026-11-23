// Registration switch (js/config.js: window.REGISTRATION_OPEN = false) -> nav button says "Registration Full"
if (window.REGISTRATION_OPEN === false) {
  document.querySelectorAll('nav a.cta').forEach(a => { a.textContent = 'Registration Full'; a.setAttribute('href', 'regis_full.html'); });
}
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
async function alreadyRegistered(ign) {
  try { const d = await sheetGet({ action: 'check', ign }); return !!d && d.exists === true; }
  catch { return false; }
}

// Country: letters only (any alphabet), plus space . ' -   — other characters are removed as you type
const NOT_LETTER = /[^\p{L}\p{M}\s.'’-]/gu;
document.querySelectorAll('input[data-letters]').forEach(i => i.addEventListener('input', () => {
  const v = i.value.replace(NOT_LETTER, ''); if (v !== i.value) i.value = v;
}));

if (form) form.addEventListener('submit', async e => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach(f => {
    const bad = !f.value.trim(); f.classList.toggle('bad', bad); if (bad) ok = false;
  });
  status.className = '';
  if (!ok) { status.textContent = 'Please fill in all required fields.'; status.classList.add('err'); return; }
  const country = form.elements.country.value.trim();
  if (country.length < 2 || NOT_LETTER.test(country)) {
    NOT_LETTER.lastIndex = 0; form.elements.country.classList.add('bad');
    status.textContent = 'Please enter a valid country name (letters only).'; status.classList.add('err'); return;
  }
  NOT_LETTER.lastIndex = 0;
  if (!window.SHEET_URL) {
    status.textContent = 'Form not connected yet — set SHEET_URL in js/config.js.'; status.classList.add('err'); return;
  }
  const btn = form.querySelector('button'); btn.disabled = true;
  status.textContent = 'Checking…';
  if (await alreadyRegistered(form.elements.ign.value.trim())) {
    status.textContent = 'This in-game name is already registered. If there is any mistake, please contact the administrator on Discord: ' + ADMIN_DISCORD + '.';
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

// News cards — posts come from js/news-auto.json (kept up to date by the GitHub Action)
const list = document.getElementById('news-list');
if (list) {
  const safeImg = s => typeof s === 'string' && /^assets\/news\/[\w.-]+\.(?:jpe?g|png|webp|gif)$/i.test(s);
  // The page builds the player URL itself, from an allow-list, so feed data can never inject another site.
  const videoSrc = v => {
    if (!v) return '';
    if (v.type === 'youtube' && /^[\w-]{11}$/.test(v.id || ''))
      return 'https://www.youtube-nocookie.com/embed/' + v.id + '?rel=0';
    if (v.type === 'facebook' && /^https:\/\/www\.facebook\.com\//.test(v.href || ''))
      return 'https://www.facebook.com/plugins/video.php?show_text=false&href=' + encodeURIComponent(v.href);
    return '';
  };
  const render = items => items.forEach((n, i) => {
    const card = document.createElement('article'); card.className = 'news-card';
    if (safeImg(n.image)) {
      card.classList.add('has-img');
      const img = document.createElement('img');
      img.className = 'news-img'; img.src = n.image; img.alt = ''; img.loading = 'lazy';
      card.appendChild(img);
    }
    const main = document.createElement('div'); main.className = 'news-main';
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
    const vsrc = videoSrc(n.video); let videoAdded = false;
    btn.addEventListener('click', () => {
      const open = body.hidden; body.hidden = !open;
      if (open && vsrc && !videoAdded) {            // load the player only when someone asks for it
        videoAdded = true;
        const box = document.createElement('div');
        box.className = 'news-video' + (/\/reels?\//.test((n.video && n.video.href) || '') ? ' portrait' : '');
        const f = document.createElement('iframe');
        f.src = vsrc; f.title = 'Video: ' + (n.title || ''); f.loading = 'lazy'; f.allowFullscreen = true;
        f.allow = 'autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share';
        f.referrerPolicy = 'strict-origin-when-cross-origin';
        box.appendChild(f); body.prepend(box);
      }
      btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Hide ▴' : 'Details ▾';
    });
    main.append(t, h, p, btn, body); card.appendChild(main); list.appendChild(card);
  });
  // manual posts (window.NEWS, optional) + automatic posts
  fetch('js/news-auto.json').then(r => r.ok ? r.json() : []).catch(() => []).then(auto => {
    const manual = window.NEWS || [];
    const seen = new Set(manual.map(n => n.link).filter(Boolean));
    render(manual.concat((Array.isArray(auto) ? auto : []).filter(n => !n.link || !seen.has(n.link)))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '')));
  });
}
