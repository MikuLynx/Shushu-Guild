// Season phases ("Realm Status"): data lives in js/config.js (window.PHASES). Everything is rendered with textContent.
(function () {
  const root = document.getElementById('phases');
  if (!root) return;
  const parse = s => s ? new Date(s.replace(' ', 'T') + (s.length <= 16 ? ':00' : '') + 'Z') : null;
  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  const f = d => (d && !isNaN(d)) ? fmt.format(d) : '';
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const now = new Date();

  (window.PHASES || []).forEach(p => {
    const s = parse(p.start), e = parse(p.end);
    const status = (e && now >= e) ? 'ended' : ((!s || now >= s) ? 'now' : 'soon');
    const label = { ended: 'Ended', now: 'Now', soon: 'Upcoming' }[status];

    const det = el('details', 'phase ' + status);
    if (status === 'now') det.open = true;
    const sum = el('summary');
    sum.appendChild(el('span', 'ph-n', String(p.n)));
    const head = el('span', 'ph-head');
    head.appendChild(el('span', 'ph-name', p.name));
    const when = s && e ? f(s) + '  →  ' + f(e) : (e ? 'Until ' + f(e) + (p.tag ? ' · ' + p.tag : '') : 'From ' + f(s) + (p.tag ? ' · ' + p.tag : ''));
    head.appendChild(el('span', 'ph-when', when));
    sum.appendChild(head);
    sum.appendChild(el('span', 'ph-chip', label));
    det.appendChild(sum);

    const body = el('div', 'ph-body');
    const left = el('div', 'ph-col');
    if (p.start || p.end) {
      const utc = el('p', 'ph-utc', 'UTC: ' + (p.start && p.end ? p.start + '  →  ' + p.end : p.end ? 'ends ' + p.end : 'starts ' + p.start));
      left.appendChild(utc);
    }
    if (p.rules && p.rules.length) {
      left.appendChild(el('h4', null, 'Rules'));
      const ul = el('ul'); p.rules.forEach(r => ul.appendChild(el('li', null, r))); left.appendChild(ul);
    }
    if (p.unlocks && p.unlocks.length) {
      left.appendChild(el('h4', null, 'Unlocks'));
      const ul = el('ul');
      p.unlocks.forEach(u => {
        const li = el('li'); li.appendChild(el('b', null, u.name));
        const t = parse(u.utc);
        const bits = [];
        if (u.desc && u.desc !== 'Opens') bits.push(u.desc);
        if (t) bits.push((u.desc === 'Opens' ? 'Opens ' : (u.on ? 'Live from ' : '')) + f(t));
        if (bits.length) li.appendChild(document.createTextNode(' — ' + bits.join(' · ')));
        ul.appendChild(li);
      });
      left.appendChild(ul);
    }
    body.appendChild(left);

    const right = el('div', 'ph-col');
    right.appendChild(el('h4', null, 'Challenges & rewards'));
    (p.ch || []).forEach(c => {
      const row = el('div', 'ph-ch ' + c.type.toLowerCase());
      row.appendChild(el('span', 'ph-ct', c.type));
      row.appendChild(el('span', 'ph-task', c.task));
      row.appendChild(el('span', 'ph-reward', c.reward));
      right.appendChild(row);
    });
    body.appendChild(right);
    det.appendChild(body);
    root.appendChild(det);
  });
})();
