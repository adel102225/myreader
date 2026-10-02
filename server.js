const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
};

// 1. Popular Catalog Endpoint
app.get('/api/catalog', async (req, res) => {
  try {
    const url = 'https://api.mangadex.org/manga?limit=18&includes[]=cover_art&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive';
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();

    if (!data.data) return res.json([]);

    const catalog = data.data.map(manga => {
      const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Untitled';
      const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverRel ? coverRel.attributes?.fileName : '';
      const coverUrl = fileName ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg` : '';

      return {
        id: manga.id,
        title: title,
        coverUrl: coverUrl
      };
    });

    res.json(catalog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch catalog' });
  }
});

// 2. Search Endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'Solo Leveling';
  try {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=15&contentRating[]=safe&contentRating[]=suggestive&includes[]=cover_art`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();

    if (!data.data) return res.json([]);

    const results = data.data.map(manga => {
      const title = manga.attributes.title.en || Object.values(manga.attributes.title)[0] || 'Untitled';
      const coverRel = manga.relationships.find(rel => rel.type === 'cover_art');
      const fileName = coverRel ? coverRel.attributes?.fileName : '';
      const coverUrl = fileName ? `https://uploads.mangadex.org/covers/${manga.id}/${fileName}.256.jpg` : '';

      return {
        id: manga.id,
        title: title,
        coverUrl: coverUrl
      };
    });

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// 3. Chapter List Endpoint
app.get('/api/chapters/:id', async (req, res) => {
  try {
    const url = `https://api.mangadex.org/manga/${req.params.id}/feed?translatedLanguage[]=en&limit=500&order[chapter]=asc&includeExternalUrl=0&contentRating[]=safe&contentRating[]=suggestive`;
    const response = await fetch(url, { headers: HEADERS });
    const data = await response.json();

    if (!data.data) return res.json([]);

    const chapters = data.data.map(ch => ({
      id: ch.id,
      chapter: ch.attributes.chapter ? `Ch. ${ch.attributes.chapter}` : 'Extra',
      title: ch.attributes.title || `Chapter ${ch.attributes.chapter || ''}`,
      lang: 'EN'
    }));

    res.json(chapters);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// 4. Chapter Pages Endpoint
app.get('/api/pages/:chapterId', async (req, res) => {
  try {
    const response = await fetch(`https://api.mangadex.org/at-home/server/${req.params.chapterId}`, { headers: HEADERS });
    const data = await response.json();

    if (!data.chapter) return res.json([]);

    const baseUrl = data.baseUrl;
    const hash = data.chapter.hash;
    const pageFiles = data.chapter.data || data.chapter.dataSaver || [];

    const pages = pageFiles.map(file => `${baseUrl}/data/${hash}/${file}`);
    res.json(pages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

app.get('/api/genre', async (req, res) => {
  const name = (req.query.name || '').toLowerCase();
  const adult = req.query.adult === '1';
  try {
    const t = await (await fetch('https://api.mangadex.org/manga/tag', { headers: HEADERS })).json();
    const tag = t.data.find(x => (x.attributes.name.en || '').toLowerCase() === name);
    let url = 'https://api.mangadex.org/manga?limit=18&includes[]=cover_art&order[followedCount]=desc';
    url = url.replace('limit=18', 'limit=30&offset=' + (parseInt(req.query.offset) || 0));
    url += adult
      ? '&contentRating[]=erotica&contentRating[]=pornographic'
      : '&contentRating[]=safe&contentRating[]=suggestive';
    if (tag) url += '&includedTags[]=' + tag.id;
    const data = await (await fetch(url, { headers: HEADERS })).json();
    if (!data.data) return res.json([]);
    res.json(data.data.map(m => {
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Untitled';
      const rel = m.relationships.find(r => r.type === 'cover_art');
      const file = rel ? rel.attributes?.fileName : '';
      return { id: m.id, title, coverUrl: file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : '' };
    }));
  } catch (e) {
    res.status(500).json([]);
  }
});

const ALL = '&contentRating[]=safe&contentRating[]=suggestive&contentRating[]=erotica&contentRating[]=pornographic';

app.get('/api/manga/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const m = await (await fetch(`https://api.mangadex.org/manga/${id}`, { headers: HEADERS })).json();
    const t = m.data.attributes.title;
    const title = t.en || Object.values(t)[0] || 'Untitled';
    let all = [], offset = 0, total = 1;
    while (offset < total && offset < 3000) {
      const f = await (await fetch(`https://api.mangadex.org/manga/${id}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&offset=${offset}${ALL}`, { headers: HEADERS })).json();
      if (!f.data) break;
      total = f.total; offset += 500;
      f.data.forEach(c => { if (!c.attributes.externalUrl && c.attributes.pages > 0) all.push(c); });
    }
    const seen = {}, chapters = [];
    all.forEach(c => {
      const n = c.attributes.chapter || c.id;
      if (seen[n]) return;
      seen[n] = 1;
      chapters.push({ id: c.id, title: 'Ch. ' + (c.attributes.chapter || '?') + (c.attributes.title ? ' - ' + c.attributes.title : '') });
    });
    res.json({ title, chapters });
  } catch (e) { res.status(500).json({ title: 'Error', chapters: [] }); }
});

app.get('/api/chapter/:id', async (req, res) => {
  try {
    const r = await (await fetch(`https://api.mangadex.org/at-home/server/${req.params.id}`, { headers: HEADERS })).json();
    res.json({ pages: r.chapter.dataSaver.map(f => `${r.baseUrl}/data-saver/${r.chapter.hash}/${f}`) });
  } catch (e) { res.status(500).json({ pages: [] }); }
});

app.get('/api/lang', async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  const langs = req.query.code === 'zh' ? '&originalLanguage[]=zh&originalLanguage[]=zh-hk' : '&originalLanguage[]=ko';
  try {
    const url = `https://api.mangadex.org/manga?limit=30&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&availableTranslatedLanguage[]=en&contentRating[]=safe&contentRating[]=suggestive${langs}`;
    const data = await (await fetch(url, { headers: HEADERS })).json();
    if (!data.data) return res.json([]);
    res.json(data.data.map(m => {
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Untitled';
      const rel = m.relationships.find(r => r.type === 'cover_art');
      const file = rel ? rel.attributes?.fileName : '';
      return { id: m.id, title, coverUrl: file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : '' };
    }));
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/adultlang', async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  try {
    const url = `https://api.mangadex.org/manga?limit=30&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&availableTranslatedLanguage[]=en&originalLanguage[]=ko&contentRating[]=erotica&contentRating[]=pornographic`;
    const data = await (await fetch(url, { headers: HEADERS })).json();
    if (!data.data) return res.json([]);
    res.json(data.data.map(m => {
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Untitled';
      const rel = m.relationships.find(r => r.type === 'cover_art');
      const file = rel ? rel.attributes?.fileName : '';
      return { id: m.id, title, coverUrl: file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : '' };
    }));
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/adultzh', async (req, res) => {
  const offset = parseInt(req.query.offset) || 0;
  try {
    const url = `https://api.mangadex.org/manga?limit=30&offset=${offset}&includes[]=cover_art&order[followedCount]=desc&availableTranslatedLanguage[]=en&originalLanguage[]=zh&originalLanguage[]=zh-hk&contentRating[]=erotica&contentRating[]=pornographic`;
    const data = await (await fetch(url, { headers: HEADERS })).json();
    if (!data.data) return res.json([]);
    res.json(data.data.map(m => {
      const title = m.attributes.title.en || Object.values(m.attributes.title)[0] || 'Untitled';
      const rel = m.relationships.find(r => r.type === 'cover_art');
      const file = rel ? rel.attributes?.fileName : '';
      return { id: m.id, title, coverUrl: file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : '' };
    }));
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/suggest', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  const ratings = req.query.adult === '1' ? ALL : '&contentRating[]=safe&contentRating[]=suggestive';
  try {
    const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(q)}&limit=10&includes[]=cover_art&order[relevance]=desc&availableTranslatedLanguage[]=en${ratings}`;
    const data = await (await fetch(url, { headers: HEADERS })).json();
    if (!data.data) return res.json([]);
    res.json(data.data.map(m => {
      const a = m.attributes;
      const title = a.title.en || Object.values(a.title)[0] || 'Untitled';
      const rel = m.relationships.find(r => r.type === 'cover_art');
      const file = rel ? rel.attributes?.fileName : '';
      const sub = a.lastChapter ? 'Chapter ' + a.lastChapter : (a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : '');
      return { id: m.id, title, sub, coverUrl: file ? `https://uploads.mangadex.org/covers/${m.id}/${file}.256.jpg` : '' };
    }));
  } catch (e) { res.status(500).json([]); }
});

app.get('/api/info/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const m = await (await fetch(`https://api.mangadex.org/manga/${id}?includes[]=cover_art`, { headers: HEADERS })).json();
    const t = m.data.attributes.title;
    const title = t.en || Object.values(t)[0] || 'Untitled';
    const rel = m.data.relationships.find(r => r.type === 'cover_art');
    const file = rel ? rel.attributes?.fileName : '';
    res.json({ title, coverUrl: file ? `https://uploads.mangadex.org/covers/${id}/${file}.256.jpg` : '' });
  } catch (e) { res.status(500).json({}); }
});

app.get('/img', async (req, res) => {
  try {
    const p = new URL(req.query.u || '');
    if (!/(\.mangadex\.network|\.mangadex\.org)$/.test(p.hostname)) return res.status(403).end();
    const r = await fetch(p.href, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
    if (!r.ok) return res.status(r.status).end();
    res.set('Content-Type', r.headers.get('content-type') || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(await r.arrayBuffer()));
  } catch (e) { res.status(500).end(); }
});
app.get('/proxy', async (req, res) => {
  try {
    const imageUrl = req.query.url;
    if (!imageUrl) {
      return res.status(400).send('Missing image URL');
    }
    
    const response = await fetch(imageUrl, {
      headers: { 
        'Referer': 'https://mangadex.org',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch image from CDN');
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err) {
    console.error('Proxy execution error:', err);
    res.status(500).send('Error proxying image');
  }
});

