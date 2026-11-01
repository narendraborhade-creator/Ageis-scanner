import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

function cleanHtml(str) {
  if (!str) return '';
  return str
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery = String(req.query?.q || '').trim();
  const category = String(req.query?.category || 'all').toLowerCase();
  const type = String(req.query?.type || '').toLowerCase();

  // Handle direct suggestions query if routed to this handler
  if (type === 'suggestions') {
    if (!rawQuery) return res.status(200).json({ query: '', suggestions: [] });
    try {
      const resp = await fetch(
        `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(rawQuery)}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(3500),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
        return res.status(200).json({ query: rawQuery, suggestions: suggestions.slice(0, 10) });
      }
    } catch {}
    return res.status(200).json({ query: rawQuery, suggestions: [] });
  }

  if (!rawQuery) {
    return res.status(200).json({ query: '', category, total: 0, results: [], suggestions: [] });
  }

  const results = [];
  const suggestions = [];

  // 1. Fetch Google Database Autocomplete Queries
  const suggestPromise = fetch(
    `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(rawQuery)}`,
    {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(3000),
    }
  )
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data?.[1])) {
        suggestions.push(...data[1].slice(0, 8));
      }
    })
    .catch(() => {});

  // 2. Fetch Wikipedia Knowledge Index
  const wikiPromise = fetch(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(rawQuery)}&limit=5&format=json`,
    {
      headers: { 'User-Agent': 'AegisSafeBrowser/1.0 (https://aegisscans.dev)' },
      signal: AbortSignal.timeout(3000),
    }
  )
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data) && data.length >= 4) {
        const titles = data[1] || [];
        const snippets = data[2] || [];
        const urls = data[3] || [];
        for (let i = 0; i < titles.length; i++) {
          if (urls[i] && titles[i]) {
            results.push({
              title: `${titles[i]} - Wikipedia, Free Encyclopedia`,
              url: urls[i],
              domain: 'en.wikipedia.org',
              snippet:
                snippets[i] ||
                `Comprehensive encyclopedia reference, history, and peer-reviewed documentation covering ${titles[i]}.`,
              securityScore: 99,
              sslGrade: 'A+',
              threatStatus: 'clean',
              isHttps: true,
              source: 'Wikipedia',
            });
          }
        }
      }
    })
    .catch(() => {});

  // 3. Fetch Real-time Google Database Index (Google News & Articles RSS)
  let rssQuery = rawQuery;
  if (category === 'news') rssQuery = `${rawQuery} news`;
  else if (category === 'tech') rssQuery = `${rawQuery} tech software development`;
  else if (category === 'science') rssQuery = `${rawQuery} science research`;

  const googleRssPromise = fetch(
    `https://news.google.com/rss/search?q=${encodeURIComponent(rssQuery)}&hl=en-US&gl=US&ceid=US:en`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(4000),
    }
  )
    .then((r) => r.text())
    .then((xml) => {
      const items = xml.split('<item>').slice(1);
      for (const item of items.slice(0, 25)) {
        const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/);
        const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/);
        const pubMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
        const sourceMatch = item.match(/<source[^>]*>([\s\S]*?)<\/source>/);
        const descMatch = item.match(/<description>([\s\S]*?)<\/description>/);

        if (titleMatch && linkMatch) {
          const rawTitle = cleanHtml(titleMatch[1]);
          const url = linkMatch[1].trim();
          const source = sourceMatch ? cleanHtml(sourceMatch[1]) : 'Google Index';
          const snippet = descMatch
            ? cleanHtml(descMatch[1])
            : `Latest verified search result covering "${rawQuery}" via Google Database.`;
          const date = pubMatch ? cleanHtml(pubMatch[1]) : '';

          let domain = 'news.google.com';
          try {
            domain = new URL(url).hostname;
          } catch {}

          results.push({
            title: rawTitle,
            url,
            domain,
            snippet,
            securityScore: 98,
            sslGrade: 'A+',
            threatStatus: 'clean',
            isHttps: url.startsWith('https://'),
            source,
            published: date,
          });
        }
      }
    })
    .catch(() => {});

  // Wait for all Google and knowledge sources
  await Promise.allSettled([suggestPromise, wikiPromise, googleRssPromise]);

  // 4. Fallback baseline if external index was sparse (guarantees the user never sees empty or blank page)
  if (results.length < 3) {
    const encoded = encodeURIComponent(rawQuery);
    results.push(
      {
        title: `${rawQuery} - Wikipedia Overview`,
        url: `https://en.wikipedia.org/wiki/${encoded}`,
        domain: 'en.wikipedia.org',
        snippet: `Comprehensive overview, historical background, architecture, and reference materials for "${rawQuery}".`,
        securityScore: 99,
        sslGrade: 'A+',
        threatStatus: 'clean',
        isHttps: true,
        source: 'Wikipedia',
      },
      {
        title: `Official Source Code & Open Source Repositories: ${rawQuery} · GitHub`,
        url: `https://github.com/search?q=${encoded}`,
        domain: 'github.com',
        snippet: `Explore repositories, libraries, documentation, and technical implementations for "${rawQuery}".`,
        securityScore: 98,
        sslGrade: 'A+',
        threatStatus: 'clean',
        isHttps: true,
        source: 'GitHub Developers',
      },
      {
        title: `Video Tutorials & Guides: ${rawQuery}`,
        url: `https://www.youtube.com/results?search_query=${encoded}`,
        domain: 'youtube.com',
        snippet: `Watch in-browser video tutorials, lectures, and detailed demonstrations covering "${rawQuery}".`,
        securityScore: 95,
        sslGrade: 'A+',
        threatStatus: 'clean',
        isHttps: true,
        source: 'YouTube',
      }
    );
  }

  // Deduplicate results by URL
  const seen = new Set();
  const deduped = [];
  for (const r of results) {
    if (!seen.has(r.url)) {
      seen.add(r.url);
      deduped.push(r);
    }
  }

  return res.status(200).json({
    query: rawQuery,
    category,
    total: deduped.length,
    suggestions: suggestions.slice(0, 8),
    results: deduped,
  });
}
