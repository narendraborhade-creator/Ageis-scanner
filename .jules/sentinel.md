## 2025-02-28 - SSRF Vulnerability in Inspection Endpoints
**Vulnerability:** The `/api/inspect/website` and `/api/security/vulnerability-scan` endpoints accept an arbitrary `url` query parameter which was unsanitized and passed directly to the `fetch()` function. This enables Server-Side Request Forgery (SSRF) allowing attackers to query the internal IP space and hit internal APIs (like `localhost`, `127.0.0.1` and AWS metadata).
**Learning:** These endpoints inherently need to accept URLs to scan them, meaning SSRF mitigation needs to correctly filter URLs before forwarding them, considering how URL hostnames and IPs can be represented. Node.js backend components interacting directly with remote sites need validation to protect local subnets.
**Prevention:** Implement a URL validation helper that parses incoming URLs and rejects common private, local, loopback and cloud metadata address patterns using regular expressions on the hostname. Future deeper checks can perform actual DNS resolution before validating the IP (DNS Rebinding protection) when making backend-to-backend fetch requests.
## 2024-05-18 - [Hardcoded Secrets Removal]
**Vulnerability:** Several high-privileged credentials, API keys (Firebase, Cloudflare, MongoDB), and the master Administrator login key were hardcoded in `src/services/authStorage.ts` and `src/services/cryptoVaultService.ts`.
**Learning:** Hardcoded credentials even on the client-side pose severe security risks as they get bundled and exposed to all clients. Although `VITE_` variables are also bundled, removing secrets from source control prevents accidental leakage via public repositories or scraping.
**Prevention:** Rely on secure environment configurations (`import.meta.env`) with proper fallback logic. Use redaction tags (e.g., `[REDACTED]`) for demo seed credentials.

## 2026-10-20 - [Fix] Remove DOM XSS from generated browser extension code
**Vulnerability:** Found a DOM-based Cross-Site Scripting (XSS) vulnerability in `src/components/ExtensionExportView.tsx`. The template string used to export `browser.js` contained insecure DOM manipulation via `innerHTML` where an untrusted variable `tab.title` was concatenated directly.
**Learning:** Even generated code in an export or template needs strict DOM-based XSS protections. Vulnerabilities can be shipped to users via exported extensions if string concatenation is used to build DOM elements from potentially unsafe input.
**Prevention:** Instead of generating JS code that uses `innerHTML` with string concatenation, the template must use secure DOM creation methods (like `document.createElement` and `.textContent`) when handling any user input, such as `tab.title`.

## 2024-05-18 - SSRF Protection Enhancements and Bypass Fixes
**Vulnerability:** The `isAllowedUrl` function in `server.ts` used unanchored regexes (like `/^127\./`) to block local IP addresses, causing it to block valid external domains like `127.0.0.1.example.com`. Furthermore, it only checked the parsed hostname, and did not explicitly verify the URL protocol (so an attacker could pass a valid host with an unexpected protocol that `node-fetch` would execute).
**Learning:** Naive hostname matching using `^` without `$` for IP addresses results in over-blocking and fails to catch edge cases if an attacker tries SSRF bypass via subdomain tricks. More importantly, when passing URLs to HTTP fetch functions, if the scheme is not explicitly checked, node's `new URL` parses other schemes perfectly well but bypasses hostname blocklists. Node.js `new URL` also normalizes IPv4-mapped IPv6 loopback addresses.
**Prevention:**
1. Abstract `isAllowedUrl` to a dedicated `src/services/urlSecurityService.ts` for unit testability without spinning up Express.
2. Check `!url.hostname || (url.protocol !== 'http:' && url.protocol !== 'https:')`.
3. Use precise regex patterns with explicit digits and anchor boundaries (`^127\.\d+\.\d+\.\d+$`).
4. Include IPv4-mapped IPv6 loopback address normalized formats (`::ffff:7f00:1`) in the blocklist.
