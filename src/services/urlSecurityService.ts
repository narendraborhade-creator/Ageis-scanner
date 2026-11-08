// 🛡️ Sentinel: URL validation helper to prevent Server-Side Request Forgery (SSRF)
// Restricts outbound fetch/proxy requests to public internet hosts only.

export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Require standard http / https protocol and non-empty hostname
    if (!url.hostname || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block internal/local hostnames, private subnets (RFC 1918), link-local metadata (169.254.x.x),
    // loopbacks (127.x.x.x, ::1, IPv4-mapped IPv6 [::ffff:127.0.0.1] -> [::ffff:7f00:1])
    const blockedPatterns = [
      /^localhost$/,
      /^127\.\d+\.\d+\.\d+$/,
      /^169\.254\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^\[?::1\]?$/,
      /^\[?::ffff:(127\.\d+\.\d+\.\d+|7f[0-9a-f]{2}:[0-9a-f]{1,4})\]?$/i,
      /.*\.local$/
    ];

    return !blockedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}
