const urlParams = new URLSearchParams(window.location.search);
const mangaId = urlParams.get('manga');

async function loadChapterList() {
  if (!mangaId) return;

  try {
    const res = await fetch(`/api/chapters/${mangaId}`);
    const chapters = await res.json();
    
    const container = document.getElementById('chapter-list');
    if (!chapters || chapters.length === 0) {
      container.innerHTML = '<p>No chapters found.</p>';
      return;
    }

    container.innerHTML = chapters.map(ch => `
      <div class="chapter-item" onclick="openChapter('${ch.id}')">
        Chapter ${ch.chapter || ''} - ${ch.title || 'Untitled'}
      </div>
    `).join('');
  } catch (err) {
    console.error('Error loading chapters:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadChapterList);

