document.getElementById('yr').textContent = new Date().getFullYear();

// Schedule
const tbody = document.getElementById('schedule-body');
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

// Registration
const form = document.getElementById('reg-form');
const status = document.getElementById('reg-status');
form.addEventListener('submit', async e => {
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
  try {
    // Apps Script web apps don't send CORS headers for reading, so use no-cors:
    // the data is delivered, but the response can't be read (success = no network error).
    await fetch(window.SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      body: new URLSearchParams(new FormData(form))
    });
    form.reset(); status.textContent = 'Registration sent! We will contact you soon.'; status.classList.add('ok');
  } catch {
    status.textContent = 'Could not send. Please try again or contact an officer.'; status.classList.add('err');
  }
  btn.disabled = false;
});
