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

  // Loop protection: Recursively unwrap any nested /api/proxy layers
  let unwrapCount = 0;
  while ((rawUrl.includes('/api/proxy') || rawUrl.includes('%2Fapi%2Fproxy')) && unwrapCount < 10) {
    unwrapCount++;
    const idx = rawUrl.indexOf('url=');
    if (idx !== -1) {
      try {
        const after = rawUrl.substring(idx + 4);
        rawUrl = decodeURIComponent(after).trim();
      } catch {
        break;
      }
    } else {
      break;
    }
  }

  if (!rawUrl || rawUrl.startsWith('aegis://') || rawUrl === 'about:blank') {
    return res.status(400).send('Invalid destination URL');
  }

  if (!/^https?:\/\//i.test(rawUrl)) {
    rawUrl = `https://${rawUrl}`;
  }

  // Prevent proxy loopback into localhost/private networks or self-proxy
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host.startsWith('192.168.') ||
      host.startsWith('10.') ||
      host.endsWith('.local') ||
      (host.includes('aegisscans.dev') && parsed.pathname.includes('/api/proxy'))
    ) {
      return res.status(403).send('Access to local network or proxy loopback is blocked');
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

  function unwrapProxyUrl(u) {
    if (!u || typeof u !== 'string') return u || '';
    var current = u.trim();
    var depth = 0;
    while ((current.indexOf('/api/proxy') !== -1 || current.indexOf('%2Fapi%2Fproxy') !== -1) && depth < 10) {
      depth++;
      var idx = current.indexOf('url=');
      if (idx !== -1) {
        try {
          current = decodeURIComponent(current.substring(idx + 4)).trim();
        } catch (e) {
          break;
        }
      } else {
        break;
      }
    }
    return current;
  }

  function resolveUrl(relativeOrAbsolute) {
    try {
      if (!relativeOrAbsolute) return relativeOrAbsolute;
      if (typeof relativeOrAbsolute === 'string' && relativeOrAbsolute.indexOf('/api/proxy') !== -1) {
        return unwrapProxyUrl(relativeOrAbsolute);
      }
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

    var fullUrl = unwrapProxyUrl(resolveUrl(rawHref));
    if (!fullUrl || fullUrl.startsWith('javascript:') || fullUrl.indexOf('/api/proxy') !== -1) return;

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
    var resolvedAction = unwrapProxyUrl(resolveUrl(rawAction));
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
      var fullUrl = unwrapProxyUrl(resolvedAction + (resolvedAction.includes('?') ? '&' : '?') + qs);
      if (fullUrl && fullUrl.indexOf('/api/proxy') === -1) {
        dispatchToAegis({
          type: 'AEGIS_NAVIGATE',
          url: fullUrl,
          inNewTab: Boolean(isNewTab)
        });
      }
    }
  }, true);

  // Universal In-Browser AJAX/Fetch Proxy Hook:
  // Automatically proxies client-side AJAX requests (fetch & XMLHttpRequest) through /api/proxy
  // so that single-page-apps, video feeds, and search results do not fail with CORS errors!
  if (window.fetch) {
    var originalFetch = window.fetch;
    window.fetch = function(resource, init) {
      try {
        var targetUrl = typeof resource === 'string' ? resource : (resource && resource.url ? resource.url : '');
        if (targetUrl && !targetUrl.startsWith('data:') && !targetUrl.startsWith('blob:') && !targetUrl.includes('/api/proxy')) {
          var fullTarget = unwrapProxyUrl(resolveUrl(targetUrl));
          if (!fullTarget.includes('/api/proxy') && !fullTarget.includes('aegisscans.dev/api/proxy')) {
            var proxied = '/api/proxy?url=' + encodeURIComponent(fullTarget);
            if (typeof resource === 'string') {
              return originalFetch(proxied, init);
            } else if (resource && typeof resource === 'object' && resource.url) {
              return originalFetch(new Request(proxied, init || resource));
            }
          }
        }
      } catch (err) {}
      return originalFetch.apply(this, arguments);
    };
  }

  if (window.XMLHttpRequest) {
    var originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      try {
        if (url && typeof url === 'string' && !url.startsWith('data:') && !url.startsWith('blob:') && !url.includes('/api/proxy')) {
          var fullTarget = unwrapProxyUrl(resolveUrl(url));
          if (!fullTarget.includes('/api/proxy') && !fullTarget.includes('aegisscans.dev/api/proxy')) {
            url = '/api/proxy?url=' + encodeURIComponent(fullTarget);
          }
        }
      } catch (err) {}
      return originalXhrOpen.call(this, method, url, async !== false, user, password);
    };
  }

  // Prevent embedded pages from crashing on or hijacking the parent service worker
  if (navigator.serviceWorker) {
    try {
      navigator.serviceWorker.register = function() {
        return Promise.reject(new Error('Service workers disabled in sandbox'));
      };
    } catch (e) {}
  }

  window.open = function(url) {
    if (url) {
      var fullUrl = unwrapProxyUrl(resolveUrl(url));
      if (fullUrl && fullUrl.indexOf('/api/proxy') === -1) {
        dispatchToAegis({
          type: 'AEGIS_NAVIGATE',
          url: fullUrl,
          inNewTab: true
        });
      }
    }
    return null;
  };

  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;
  history.pushState = function(state, unused, url) {
    var res = originalPushState.apply(this, arguments);
    if (url) {
      var fullUrl = unwrapProxyUrl(resolveUrl(url));
      if (fullUrl && fullUrl.indexOf('/api/proxy') === -1 && fullUrl.indexOf('aegisscans.dev') === -1) {
        dispatchToAegis({ type: 'AEGIS_NAVIGATE', url: fullUrl, inNewTab: false, isSilentSync: true });
      }
    }
    return res;
  };
  history.replaceState = function(state, unused, url) {
    var res = originalReplaceState.apply(this, arguments);
    if (url) {
      var fullUrl = unwrapProxyUrl(resolveUrl(url));
      if (fullUrl && fullUrl.indexOf('/api/proxy') === -1 && fullUrl.indexOf('aegisscans.dev') === -1) {
        dispatchToAegis({ type: 'AEGIS_NAVIGATE', url: fullUrl, inNewTab: false, isSilentSync: true });
      }
    }
    return res;
  };
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
