import dns from 'node:dns';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

export default async function handler(req, res) {
  // Enable CORS for all incoming client requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let rawUrl = (req.query?.url || req.body?.url || '').trim();
  if (!rawUrl || rawUrl.startsWith('aegis://') || rawUrl === 'about:blank') {
    return res.status(400).send('Invalid destination URL');
  }

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  // Prevent proxy loopback into localhost/private networks
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local')
    ) {
      return res.status(403).send('Access to local network destinations is blocked');
    }
  } catch {
    return res.status(400).send('Malformed URL destination');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const incomingUA = req.headers['user-agent'] || '';
  const cleanUA =
    incomingUA && !incomingUA.includes('AegisSafeBrowser')
      ? incomingUA
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

  const clientHeaders = {
    'User-Agent': cleanUA,
    'Accept': req.headers['accept'] || 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
  };

  const method = (req.method || 'GET').toUpperCase();
  const fetchOptions = {
    method: method === 'GET' || method === 'HEAD' ? method : method,
    headers: clientHeaders,
    redirect: 'follow',
    signal: controller.signal,
  };

  if (method === 'POST' && req.body && Object.keys(req.body).length > 0) {
    const contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded';
    clientHeaders['Content-Type'] = contentType;
    if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) {
      fetchOptions.body = req.body;
    } else if (contentType.includes('application/json')) {
      fetchOptions.body = JSON.stringify(req.body);
    } else {
      fetchOptions.body = new URLSearchParams(req.body).toString();
    }
  }

  try {
    let upstreamRes;
    try {
      upstreamRes = await fetch(rawUrl, fetchOptions);
    } catch {
      if (rawUrl.startsWith('https://')) {
        upstreamRes = await fetch(rawUrl.replace('https://', 'http://'), fetchOptions);
      } else {
        throw new Error('Connection could not be established');
      }
    } finally {
      clearTimeout(timeoutId);
    }

    const finalUrl = upstreamRes.url || rawUrl;
    const contentType = upstreamRes.headers.get('content-type') || 'text/html';

    // Strip frame-blocking and CSP headers
    res.removeHeader?.('X-Frame-Options');
    res.removeHeader?.('x-frame-options');
    res.removeHeader?.('Content-Security-Policy');
    res.removeHeader?.('content-security-policy');
    res.removeHeader?.('Content-Security-Policy-Report-Only');
    res.removeHeader?.('Cross-Origin-Embedder-Policy');
    res.removeHeader?.('Cross-Origin-Opener-Policy');
    res.removeHeader?.('Cross-Origin-Resource-Policy');
    res.removeHeader?.('Content-Encoding');

    if (contentType.includes('text/html') || contentType.includes('application/xhtml+xml')) {
      let html = await upstreamRes.text();

      // Strip CSP and X-Frame-Options meta tags
      html = html.replace(/<meta[^>]+http-equiv=["']?(?:content-security-policy|x-frame-options)["']?[^>]*>/gi, '');

      const baseTag = `<base href="${finalUrl}">`;

      // Aegis Navigation Interceptor
      const interceptorScript = `
<script>
(function() {
  var currentBase = ${JSON.stringify(finalUrl)};
  var realTop = window.top;
  var realParent = window.parent;

  function dispatchToAegis(data) {
    try {
      if (realParent && realParent !== window) {
        realParent.postMessage(data, '*');
      } else if (realTop && realTop !== window) {
        realTop.postMessage(data, '*');
      }
    } catch (e) {}
  }

  try {
    Object.defineProperty(window, 'top', {
      get: function() { return window; },
      set: function() {}
    });
    Object.defineProperty(window, 'frameElement', {
      get: function() { return null; },
      set: function() {}
    });
  } catch (e) {}

  function resolveUrl(relativeOrAbsolute) {
    try {
      return new URL(relativeOrAbsolute, currentBase).href;
    } catch (e) {
      return relativeOrAbsolute;
    }
  }

  if (document.title) {
    dispatchToAegis({ type: 'AEGIS_PAGE_TITLE', title: document.title });
  }

  var titleEl = document.querySelector('title');
  if (titleEl) {
    var titleObserver = new MutationObserver(function() {
      dispatchToAegis({ type: 'AEGIS_PAGE_TITLE', title: document.title });
    });
    titleObserver.observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  var lastNavTime = 0;
  function handleLinkClick(e) {
    var a = e.target.closest('a');
    if (!a) return;

    var rawHref = a.getAttribute('href');
    if (!rawHref || rawHref === '#' || rawHref.startsWith('javascript:')) return;

    if (rawHref.startsWith('#')) return;

    var fullUrl = resolveUrl(rawHref);
    if (!fullUrl || fullUrl.startsWith('javascript:')) return;

    var isNewTab = e.button === 1 || e.ctrlKey || e.metaKey;

    var now = Date.now();
    if (now - lastNavTime < 250) {
      e.preventDefault();
      return;
    }
    lastNavTime = now;

    e.preventDefault();
    e.stopPropagation();

    dispatchToAegis({
      type: 'AEGIS_NAVIGATE',
      url: fullUrl,
      inNewTab: Boolean(isNewTab)
    });
  }

  document.addEventListener('click', handleLinkClick, true);
  document.addEventListener('auxclick', handleLinkClick, true);

  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || !form.action) return;

    var rawAction = form.getAttribute('action') || form.action;
    var resolvedAction = resolveUrl(rawAction);
    var method = (form.method || 'GET').toUpperCase();
    var isNewTab = form.target === '_blank';

    if (method === 'GET') {
      e.preventDefault();
      e.stopPropagation();

      var formData = new FormData(form);
      var queryParts = [];
      formData.forEach(function(val, key) {
        if (typeof val === 'string') {
          queryParts.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
        }
      });
      var qs = queryParts.join('&');
      var fullUrl = resolvedAction + (resolvedAction.includes('?') ? '&' : '?') + qs;

      dispatchToAegis({
        type: 'AEGIS_NAVIGATE',
        url: fullUrl,
        inNewTab: Boolean(isNewTab)
      });
    }
  }, true);

  window.open = function(url) {
    if (url) {
      var fullUrl = resolveUrl(url);
      dispatchToAegis({
        type: 'AEGIS_NAVIGATE',
        url: fullUrl,
        inNewTab: true
      });
    }
    return null;
  };

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  history.pushState = function(state, unused, url) {
    var res = originalPushState.apply(this, arguments);
    if (url) {
      var fullUrl = resolveUrl(url);
      dispatchToAegis({ type: 'AEGIS_NAVIGATE', url: fullUrl, inNewTab: false, isSilentSync: true });
    }
    return res;
  };
  history.replaceState = function(state, unused, url) {
    var res = originalReplaceState.apply(this, arguments);
    if (url) {
      var fullUrl = resolveUrl(url);
      dispatchToAegis({ type: 'AEGIS_NAVIGATE', url: fullUrl, inNewTab: false, isSilentSync: true });
    }
    return res;
  };
})();
</script>
`;

      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${baseTag}\n${interceptorScript}`);
      } else {
        html = `${baseTag}\n${interceptorScript}\n${html}`;
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(html);
    } else {
      res.setHeader('Content-Type', contentType);
      const arrayBuffer = await upstreamRes.arrayBuffer();
      return res.status(200).send(Buffer.from(arrayBuffer));
    }
  } catch (err) {
    clearTimeout(timeoutId);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #030712; color: #94a3b8; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 16px; box-sizing: border-box; text-align: center; }
            .card { max-width: 480px; width: 100%; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
            h2 { color: #38bdf8; font-size: 18px; margin: 0 0 12px; }
            p { font-size: 13px; line-height: 1.6; color: #cbd5e1; margin: 8px 0; }
            code { background: #1e293b; color: #f59e0b; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
            .btn { display: inline-block; background: #06b6d4; color: #020617; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; margin: 8px 4px; text-decoration: none; }
            .btn:hover { background: #22d3ee; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Aegis In-Browser Sandbox</h2>
            <p>Target site <code>${rawUrl || 'unknown'}</code> took longer than expected to respond.</p>
            <button class="btn" onclick="window.parent.postMessage({ type: 'AEGIS_NAVIGATE', url: 'https://duckduckgo.com/?q=${encodeURIComponent(rawUrl)}' }, '*')">Search with DuckDuckGo</button>
          </div>
        </body>
      </html>
    `);
  }
}
