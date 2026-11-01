export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const q = String(req.query?.q || '').trim();
  if (!q) {
    return res.status(200).json({ query: '', suggestions: [] });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const upstream = await fetch(
      `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (upstream.ok) {
      const data = await upstream.json();
      const suggestions = Array.isArray(data?.[1]) ? data[1] : [];
      return res.status(200).json({ query: q, suggestions: suggestions.slice(0, 10) });
    }
  } catch (err) {}

  return res.status(200).json({ query: q, suggestions: [] });
}
