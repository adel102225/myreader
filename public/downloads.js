const DOWNLOAD_DB = 'myreader-downloads';
const DOWNLOAD_DB_VERSION = 1;
const DOWNLOAD_STORE = 'chapters';
const CONTENT_CACHE = 'myreader-content-v1';

function openDownloadDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DOWNLOAD_DB, DOWNLOAD_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(DOWNLOAD_STORE)) {
        db.createObjectStore(DOWNLOAD_STORE, { keyPath: 'chapterId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveDownloadedChapter(data) {
  const db = await openDownloadDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');

    tx.objectStore(DOWNLOAD_STORE).put(data);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function getDownloadedChapter(chapterId) {
  const db = await openDownloadDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
    const request = tx.objectStore(DOWNLOAD_STORE).get(chapterId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function getAllDownloadedChapters() {
  const db = await openDownloadDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
    const request = tx.objectStore(DOWNLOAD_STORE).getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

async function deleteDownloadedChapter(chapterId) {
  const chapter = await getDownloadedChapter(chapterId);

  if (!chapter) return;

  const cache = await caches.open(CONTENT_CACHE);

  for (const url of chapter.pages || []) {
    try {
      await cache.delete(url);
    } catch (_) {}
  }

  const db = await openDownloadDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');

    tx.objectStore(DOWNLOAD_STORE).delete(chapterId);

    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function downloadChapter({
  chapterId,
  mangaId,
  mangaTitle,
  chapterTitle,
  pages,
  onProgress
}) {
  if (!chapterId || !Array.isArray(pages) || !pages.length) {
    throw new Error('No chapter pages available');
  }

  const cache = await caches.open(CONTENT_CACHE);

  const cachedPages = [];

  for (let i = 0; i < pages.length; i++) {
    const url = pages[i];

    try {
      let response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to download page');
      }

      await cache.put(url, response.clone());

      cachedPages.push(url);

      if (onProgress) {
        onProgress(i + 1, pages.length);
      }
    } catch (error) {
      console.error('Download failed:', url, error);
      throw error;
    }
  }

  const data = {
    chapterId,
    mangaId,
    mangaTitle: mangaTitle || '',
    chapterTitle: chapterTitle || '',
    pages: cachedPages,
    pageCount: cachedPages.length,
    downloadedAt: Date.now()
  };

  await saveDownloadedChapter(data);

  return data;
}

window.MyReaderDownloads = {
  downloadChapter,
  getDownloadedChapter,
  getAllDownloadedChapters,
  deleteDownloadedChapter
};
