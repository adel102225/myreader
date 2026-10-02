async function loadHomeScreen() {
  try {
    const response = await fetch('/api/catalog');
    const catalog = await response.json();

    const grid = document.getElementById('manga-grid');
    if (!catalog || catalog.length === 0) {
      grid.innerHTML = '<p>No manga found in catalog.</p>';
      return;
    }

    grid.innerHTML = catalog.map(item => `
      <div class="manga-card" onclick="selectManga('${item.id}')">
        <div class="cover-wrapper">
          <img src="${item.coverUrl || 'https://via.placeholder.com/150x225?text=No+Cover'}" alt="${item.title}" loading="lazy" />
          <span class="chapter-badge">Ch. ${item.latestChapter || '1'}</span>
        </div>
        <div class="card-info">
          <h3>${item.title}</h3>
          <p class="author">${item.author || 'Unknown'}</p>
        </div>
      </div>
    `).join('');

    // Populate Hero Banner with top item
    const topItem = catalog[0];
    document.getElementById('hero-title').innerText = topItem.title;
    document.getElementById('hero-desc').innerText = topItem.description || 'Explore latest chapters and continue reading.';
    document.getElementById('hero-read-btn').onclick = () => selectManga(topItem.id);

  } catch (err) {
    console.error('Failed to load catalog:', err);
  }
}

function selectManga(id) {
  // Navigate to reader or chapter selection route
  window.location.href = `/reader.html?manga=${id}`;
}

document.addEventListener('DOMContentLoaded', loadHomeScreen);

