/**
 * Validates whether a given URL is safe for server-side outbound requests.
 * Defends against Server-Side Request Forgery (SSRF) by blocking internal,
 * loopback, link-local, and cloud metadata addresses.
 */
export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Require valid hostname and HTTP(S) protocol
    if (!url.hostname || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block common internal/local hostnames and IPs
    const blockedPatterns = [
      /^localhost$/,
      /^127\./,
      /^169\.254\./,
      /^10\./,
      /^192\.168\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^0\.0\.0\.0$/,
      /^\[?::1\]?$/,
      /^\[?::\]?$/,
      /^\[::ffff:(7f[0-9a-f]{2}:[0-9a-f]{1,4}|127\.)/i,
      /.*\.local$/
    ];

    return !blockedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}
