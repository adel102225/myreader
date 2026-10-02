(function () {
  const genres = ['Manhwa','Manhua','Action','Romance','Fantasy','Comedy','Drama','Horror','Isekai','Sci-Fi','Adult','Adult Manhwa','Adult Manhua'];
  const style = document.createElement('style');
  style.textContent = '.chips{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chip{flex:0 0 auto;background:#252836;color:#e2e8f0;border:1px solid #363b4e;border-radius:16px;padding:6px 12px;font-size:12px}.chip.adult{color:#f87171;border-color:#7f1d1d}.more{grid-column:span 2;background:#a855f7;color:#fff;border:0;border-radius:8px;padding:12px;font-size:14px}';
  document.head.appendChild(style);

  let current = '', offset = 0;

  const row = document.createElement('div');
  row.className = 'chips';
  genres.forEach(g => {
    const b = document.createElement('button');
    b.className = 'chip' + (g.indexOf('Adult') === 0 ? ' adult' : '');
    b.textContent = g;
    b.onclick = () => { offset = 0; current = g; loadGenre(true); };
    row.appendChild(b);
  });
  document.querySelector('header').after(row);

  function endpoint(g, off) {
    if (g === 'Manhwa') return '/api/lang?code=ko&offset=' + off;
    if (g === 'Manhua') return '/api/lang?code=zh&offset=' + off;
    if (g === 'Adult Manhua') return '/api/adultzh?offset=' + off;
    if (g === 'Adult Manhwa') return '/api/adultlang?offset=' + off;
    return '/api/genre?name=' + encodeURIComponent(g) + (g === 'Adult' ? '&adult=1' : '') + '&offset=' + off;
  }

  async function loadGenre(fresh) {
    const g = current;
    if (g.indexOf('Adult') === 0 && localStorage.getItem('adultOk') !== '1') {
      if (!confirm('This section contains adult content. Are you 18 or older?')) return;
      localStorage.setItem('adultOk', '1');
    }
    const grid = document.getElementById('latestGrid');
    if (fresh) {
      grid.innerHTML = '<div style="color:#666;grid-column:span 2;padding:10px">Loading ' + g + '...</div>';
      grid.scrollIntoView({ behavior: 'smooth' });
    }
    try {
      const items = await (await fetch(endpoint(g, offset))).json();
      const old = grid.querySelector('.more');
      if (old) old.remove();
      if (fresh) grid.innerHTML = '';
      if (!items.length && fresh) { grid.innerHTML = '<div style="color:#666;grid-column:span 2;padding:10px">Nothing found.</div>'; return; }
      grid.insertAdjacentHTML('beforeend', items.map(i =>
        '<a href="read.html?id=' + i.id + '" class="latest-card">' +
        '<img src="' + (i.coverUrl || '') + '" class="latest-img">' +
        '<div class="latest-info"><div class="latest-title">' + i.title + '</div>' +
        '<div class="latest-badge">' + g.toUpperCase() + '</div></div></a>'
      ).join(''));
      if (items.length >= 30) {
        const more = document.createElement('button');
        more.className = 'more';
        more.textContent = 'Load more';
        more.onclick = () => { offset += 30; loadGenre(false); };
        grid.appendChild(more);
      }
    } catch (e) {
      grid.innerHTML = '<div style="color:#666;grid-column:span 2;padding:10px">Failed to load.</div>';
    }
  }
})();
