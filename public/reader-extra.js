(function () {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;
  const sel = document.getElementById('chapters');
  const bar = document.querySelector('.bar');
  let info = { title: document.title, cover: '' };
  const get = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  const btn = document.createElement('button');
  btn.style.cssText = 'background:#252836;color:#a855f7;border:1px solid #363b4e;border-radius:6px;padding:6px 10px;font-size:13px';
  bar.appendChild(btn);
  const inLib = () => get('library').some(x => x.id === id);
  const paint = () => { btn.textContent = inLib() ? 'Saved' : 'Save'; };
  btn.onclick = () => {
    let l = get('library');
    if (inLib()) l = l.filter(x => x.id !== id);
    else l.unshift({ id: id, title: info.title, cover: info.cover });
    set('library', l);
    paint();
  };
  paint();

  fetch('/api/info/' + id).then(r => r.json()).then(d => {
    if (!d.title) return;
    info.title = d.title; info.cover = d.coverUrl || '';
    const l = get('library');
    l.forEach(x => { if (x.id === id) { x.title = info.title; x.cover = info.cover; } });
    set('library', l);
  }).catch(() => {});

  setInterval(() => {
    if (!sel.options.length) return;
    const opt = sel.options[sel.selectedIndex];
    const r = get('recent').filter(x => x.id !== id);
    r.unshift({ id: id, title: info.title, cover: info.cover, ch: opt ? opt.text : '', t: Date.now() });
    set('recent', r.slice(0, 30));
  }, 3000);
})();
