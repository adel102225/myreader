(function () {
  const input = document.getElementById('searchInput');
  const header = document.querySelector('header');

  const style = document.createElement('style');
  style.textContent = '#sugg{display:none;position:absolute;top:100%;left:10px;right:10px;margin-top:6px;background:#141826;border:1px solid #363b4e;border-radius:12px;max-height:70vh;overflow-y:auto;box-shadow:0 10px 30px rgba(0,0,0,.6)}.srow{display:flex;gap:12px;align-items:center;padding:10px 12px;text-decoration:none;color:#fff}.srow img{width:46px;height:64px;object-fit:cover;border-radius:6px;background:#252836;flex-shrink:0}.srow .t{font-size:15px;font-weight:600;line-height:1.25}.srow .s{font-size:12px;color:#8b93a7;margin-top:3px}.sinfo{padding:14px;text-align:center;color:#8b93a7;font-size:13px}.sadult{display:block;width:100%;border:0;border-top:1px solid #2d313e;background:none;color:#f87171;padding:12px;font-size:13px}';
  document.head.appendChild(style);

  const box = document.createElement('div');
  box.id = 'sugg';
  header.appendChild(box);

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const adultOn = () => localStorage.getItem('adultOk') === '1';
  let timer, seq = 0;

  function adultBtn(q) {
    return adultOn() ? '' : '<button class="sadult" id="sadultbtn">Include 18+ results</button>';
  }
  function bindAdult(q) {
    const b = document.getElementById('sadultbtn');
    if (!b) return;
    b.onclick = () => {
      if (!confirm('This will include adult content. Are you 18 or older?')) return;
      localStorage.setItem('adultOk', '1');
      run(q);
    };
  }

  async function run(q) {
    if (q.length < 2) { box.style.display = 'none'; return; }
    box.style.display = 'block';
    box.innerHTML = '<div class="sinfo">Searching...</div>';
    const my = ++seq;
    try {
      const items = await (await fetch('/api/suggest?q=' + encodeURIComponent(q) + (adultOn() ? '&adult=1' : ''))).json();
      if (my !== seq) return;
      if (!items.length) {
        box.innerHTML = '<div class="sinfo">No results found.</div>' + adultBtn(q);
      } else {
        box.innerHTML = items.map(i =>
          '<a class="srow" href="read.html?id=' + i.id + '">' +
          '<img src="' + (i.coverUrl || '') + '">' +
          '<div><div class="t">' + esc(i.title) + '</div><div class="s">' + esc(i.sub || '') + '</div></div></a>'
        ).join('') + adultBtn(q);
      }
      bindAdult(q);
    } catch (e) {
      if (my === seq) box.innerHTML = '<div class="sinfo">Search failed.</div>';
    }
  }

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => run(input.value.trim()), 350);
  });
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2 && box.innerHTML) box.style.display = 'block';
  });
  document.addEventListener('click', e => {
    if (!header.contains(e.target)) box.style.display = 'none';
  });

  window.handleSearch = function (e) {
    if (e.key === 'Enter') { clearTimeout(timer); run(input.value.trim()); }
  };
  window.doSearch = function () { clearTimeout(timer); run(input.value.trim()); };
})();
