export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
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
      /^\[::ffff:7f00:1\]$/,
      /.*\.local$/
    ];

    return !blockedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}
