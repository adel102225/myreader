(function () {
  const hot = document.getElementById('hotSlider');
  if (!hot) return;
  const anchor = hot.previousElementSibling;
  const st = document.createElement('style');
  st.textContent = '.lib-row{display:flex;gap:12px;overflow-x:auto;scrollbar-width:none;padding-bottom:6px}.lib-row::-webkit-scrollbar{display:none}.lib-item{flex:0 0 100px;text-decoration:none;color:#fff}.lib-item img{width:100px;height:140px;object-fit:cover;border-radius:6px;background:#252836;display:block}.lib-item .t{font-size:11px;font-weight:600;margin-top:5px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}.lib-item .c{font-size:11px;color:#a855f7;margin-top:2px}.rec{display:flex;gap:12px;align-items:center;text-decoration:none;color:#fff;padding:6px 0}.rec img{width:48px;height:66px;object-fit:cover;border-radius:4px;background:#252836;flex-shrink:0}.rec .t{font-size:14px;font-weight:600}.rec .c{font-size:12px;color:#8b93a7;margin-top:3px}.lib-empty{color:#666;font-size:12px;padding:6px 2px}.lib-clear{background:#252836;color:#a855f7;border:1px solid #363b4e;border-radius:14px;padding:4px 12px;font-size:12px}';
  document.head.appendChild(st);

  const wrap = document.createElement('div');
  wrap.id = 'libsec';
  anchor.parentNode.insertBefore(wrap, anchor);

  const get = k => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  function ago(t) {
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  function render() {
    const lib = get('library'), rec = get('recent');
    const last = {};
    rec.forEach(r => { last[r.id] = r.ch; });

    const libHtml = lib.length
      ? '<div class="lib-row">' + lib.map(x =>
          '<a class="lib-item" href="read.html?id=' + esc(x.id) + '"><img src="' + esc(x.cover) + '">' +
          '<div class="t">' + esc(x.title) + '</div><div class="c">' + esc(last[x.id] || 'Not started') + '</div></a>').join('') + '</div>'
      : '<div class="lib-empty">Nothing saved yet. Open a series and tap Save.</div>';

    const recHtml = rec.length
      ? rec.slice(0, 8).map(x =>
          '<a class="rec" href="read.html?id=' + esc(x.id) + '"><img src="' + esc(x.cover) + '">' +
          '<div><div class="t">' + esc(x.title) + '</div><div class="c">' + esc(x.ch) + ' &middot; ' + ago(x.t) + '</div></div></a>').join('')
      : '<div class="lib-empty">Nothing read yet.</div>';

    wrap.innerHTML =
      '<div class="section-header"><div class="section-title">Library</div></div>' + libHtml +
      '<div class="section-header"><div class="section-title">Recently Read</div>' +
      (rec.length ? '<button class="lib-clear" id="lib-clear">Clear</button>' : '') + '</div>' + recHtml;

    const c = document.getElementById('lib-clear');
    if (c) c.onclick = () => { if (confirm('Clear your reading history?')) { try { localStorage.removeItem('recent'); } catch (e) {} render(); } };
  }

  document.querySelectorAll('.nav-item').forEach(a => { if (/bookmarks/i.test(a.textContent)) a.setAttribute('href', '#libsec'); });
  window.addEventListener('pageshow', render);
  render();
})();
