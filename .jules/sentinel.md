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

## 2025-02-28 - SSRF Vulnerability in Proxy Endpoint
**Vulnerability:** The `/api/proxy` endpoint had custom SSRF checking logic that failed to account for alternate loopback representations (like `127.0.0.2`, `0.0.0.0`, and IPv6 `[::1]`). This could allow attackers to bypass the check and access internal network services.
**Learning:** Implementing manual, ad-hoc security checks for URLs across different endpoints often leads to inconsistencies and bypasses. Centralized validation logic is essential for comprehensive security.
**Prevention:** Replace ad-hoc validation with a central helper function (like `isAllowedUrl`) that thoroughly checks against all known local, private, and loopback patterns, and ensure this function is used consistently across all endpoints that make outbound requests.
