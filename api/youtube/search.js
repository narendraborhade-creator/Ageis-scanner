import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const FALLBACK_VIDEOS = [
  {
    id: 'inWWhr5tnEA',
    title: 'Cybersecurity Architecture & Zero-Trust Defense Fundamentals',
    channel: 'Computerphile',
    views: '840K views',
    published: '3 years ago',
    thumbnail: 'https://i.ytimg.com/vi/inWWhr5tnEA/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=inWWhr5tnEA',
  },
  {
    id: 'bPVaOlJ6ln0',
    title: 'How The Internet Works - DNS, TCP/IP & HTTP Deep Dive',
    channel: 'Fireship',
    views: '1.2M views',
    published: '2 years ago',
    thumbnail: 'https://i.ytimg.com/vi/bPVaOlJ6ln0/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=bPVaOlJ6ln0',
  },
  {
    id: '1sXw1pvd5iQ',
    title: 'Chromium Architecture & Browser Sandbox Internals',
    channel: 'Google Chrome Developers',
    views: '350K views',
    published: '1 year ago',
    thumbnail: 'https://i.ytimg.com/vi/1sXw1pvd5iQ/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=1sXw1pvd5iQ',
  },
  {
    id: 'f94fI_4h_4g',
    title: 'Network Security, Firewalls & Intrusion Prevention Systems',
    channel: 'NetworkChuck',
    views: '620K views',
    published: '1 year ago',
    thumbnail: 'https://i.ytimg.com/vi/f94fI_4h_4g/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=f94fI_4h_4g',
  },
];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const query = (req.query?.q || 'cybersecurity and technology').trim();
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const upstream = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const html = await upstream.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);

    const videos = [];

    if (match) {
      try {
        const data = JSON.parse(match[1]);
        const contents =
          data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents || [];

        for (const item of contents) {
          const v = item.videoRenderer;
          if (v && v.videoId) {
            videos.push({
              id: v.videoId,
              title: v.title?.runs?.[0]?.text || 'YouTube Video',
              channel: v.ownerText?.runs?.[0]?.text || 'YouTube Creator',
              views: v.viewCountText?.simpleText || v.shortViewCountText?.simpleText || 'View count unavailable',
              published: v.publishedTimeText?.simpleText || 'Recently',
              thumbnail:
                v.thumbnail?.thumbnails?.[v.thumbnail.thumbnails.length - 1]?.url ||
                `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
            });
          }
          if (videos.length >= 16) break;
        }
      } catch (e) {}
    }

    if (videos.length === 0) {
      return res.status(200).json({ query, videos: FALLBACK_VIDEOS });
    }

    return res.status(200).json({ query, videos });
  } catch (err) {
    return res.status(200).json({
      query: req.query?.q || '',
      videos: FALLBACK_VIDEOS,
    });
  }
}
