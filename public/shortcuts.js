(function () {
  const KEY = 'shortcuts';
  const defaults = [
    { n: 'MangaDex', u: 'https://mangadex.org' },
    { n: 'MANGA Plus', u: 'https://mangaplus.shueisha.co.jp' },
    { n: 'Webtoon', u: 'https://www.webtoons.com' },
    { n: 'Tappytoon', u: 'https://www.tappytoon.com' }
  ];
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (Array.isArray(s)) return s; } catch (e) {} return defaults.slice(); }
  function save(l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} }
  let list = load(), edit = false;

  const st = document.createElement('style');
  st.textContent = '.sc-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.sc{position:relative;text-decoration:none;color:#e2e8f0;text-align:center;min-width:0}.ic{position:relative;width:100%;aspect-ratio:1;border-radius:14px;background:#252836;border:1px solid #363b4e;display:flex;align-items:center;justify-content:center;overflow:hidden}.ic span{font-size:22px;font-weight:700;color:#a855f7}.ic img{position:absolute;width:46%;height:46%;object-fit:contain}.sc .n{font-size:11px;margin-top:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sc .x{position:absolute;top:-6px;right:-4px;z-index:2;background:#ef4444;color:#fff;width:20px;height:20px;border-radius:50%;font-size:14px;line-height:20px;text-align:center}.sc-btns{display:flex;gap:8px}.sc-btn{background:#252836;color:#a855f7;border:1px solid #363b4e;border-radius:14px;padding:4px 12px;font-size:12px}';
  document.head.appendChild(st);

  const sec = document.createElement('div');
  document.querySelector('.container').prepend(sec);

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  function host(u) { try { return new URL(u).hostname; } catch (e) { return ''; } }
  function icon(s) {
    return '<div class="ic"><span>' + esc(s.n.charAt(0).toUpperCase()) + '</span>' +
      '<img src="https://www.google.com/s2/favicons?domain=' + esc(host(s.u)) + '&sz=64" onload="this.previousSibling.style.display=\'none\'" onerror="this.remove()"></div>';
  }

  function render() {
    const tiles = list.map((s, i) => edit
      ? '<div class="sc" data-del="' + i + '"><span class="x">&times;</span>' + icon(s) + '<div class="n">' + esc(s.n) + '</div></div>'
      : '<a class="sc" href="' + esc(s.u) + '" target="_blank" rel="noopener">' + icon(s) + '<div class="n">' + esc(s.n) + '</div></a>'
    ).join('');
    sec.innerHTML =
      '<div class="section-header"><div class="section-title">Shortcuts</div>' +
      '<div class="sc-btns"><button class="sc-btn" id="sc-edit">' + (edit ? 'Done' : 'Edit') + '</button>' +
      '<button class="sc-btn" id="sc-add">+ Add</button></div></div>' +
      '<div class="sc-grid">' + (tiles || '<div style="color:#666;font-size:12px;grid-column:span 4">No shortcuts yet. Tap + Add.</div>') + '</div>';
    sec.querySelector('#sc-edit').onclick = () => { edit = !edit; render(); };
    sec.querySelector('#sc-add').onclick = add;
    sec.querySelectorAll('[data-del]').forEach(el => {
      el.onclick = () => { list.splice(+el.dataset.del, 1); save(list); render(); };
    });
  }

  function add() {
    const name = (prompt('Name of the site (for example: MangaDex)') || '').trim();
    if (!name) return;
    let url = (prompt('Website address (for example: mangadex.org)') || '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      const p = new URL(url);
      if (p.protocol !== 'http:' && p.protocol !== 'https:') throw 0;
      list.push({ n: name, u: p.href });
      save(list);
      render();
    } catch (e) { alert('That address does not look right. Try again.'); }
  }

  render();
})();
