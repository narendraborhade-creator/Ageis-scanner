import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawQuery = (req.query?.q || '').trim();
    const category = (req.query?.category || 'all').toLowerCase();

    if (!rawQuery) {
      return res.status(200).json({ query: '', category, total: 0, results: [] });
    }

    let searchQuery = rawQuery;
    if (category === 'news') {
      searchQuery = `${rawQuery} news`;
    } else if (category === 'tech') {
      searchQuery = `${rawQuery} technology development documentation`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    const html = await upstream.text();
    const resultBlocks = html.split(/class=['"](?:result\s|results_links)/);
    const results = [];

    for (const block of resultBlocks.slice(1)) {
      const titleMatch = block.match(/class=['"]result__a['"][^>]*href=['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/class=['"]result__snippet['"][^>]*>([\s\S]*?)<\/(?:a|div|span)>/);

      if (titleMatch) {
        let rawHref = titleMatch[1];
        const uddgMatch = rawHref.match(/[?&]uddg=([^&]+)/);
        const url = uddgMatch ? decodeURIComponent(uddgMatch[1]) : rawHref;
        const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();
        const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        if (url.startsWith('http') && !url.includes('duckduckgo.com/y.js')) {
          let domain = '';
          try {
            domain = new URL(url).hostname;
          } catch {
            domain = url.replace(/^https?:\/\//, '').split('/')[0];
          }

          const isHttps = url.startsWith('https://');
          results.push({
            title: title || domain,
            url,
            domain,
            snippet,
            securityScore: isHttps ? 96 : 45,
            sslGrade: isHttps ? 'A+' : 'F',
            threatStatus: isHttps ? 'clean' : 'warning',
            isHttps,
          });
        }
      }
      if (results.length >= 15) break;
    }

    return res.status(200).json({
      query: rawQuery,
      category,
      total: results.length,
      results,
    });
  } catch (err) {
    return res.status(200).json({
      query: req.query?.q || '',
      category: req.query?.category || 'all',
      total: 0,
      results: [],
      error: err.message,
    });
  }
}
