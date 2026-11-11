export function isAllowedUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Explicitly verify that the parsed URL has a truthy hostname and an http: or https: protocol
    if (!url.hostname || (url.protocol !== 'http:' && url.protocol !== 'https:')) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // Block common internal/local hostnames and IPs
    const blockedPatterns = [
      /^localhost$/,
      /^127\.\d+\.\d+\.\d+$/,
      /^169\.254\.\d+\.\d+$/,
      /^10\.\d+\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+$/,
      /^0\.0\.0\.0$/,
      /^\[?::1\]?$/,
      /^\[?::ffff:127\.0\.0\.1\]?$/, // IPv4-mapped IPv6 loopback addresses
      /^\[?::ffff:7f00:1\]?$/, // Normalized IPv4-mapped IPv6 loopback addresses
      /\.local$/
    ];

    return !blockedPatterns.some(pattern => pattern.test(hostname));
  } catch {
    return false;
  }
}
