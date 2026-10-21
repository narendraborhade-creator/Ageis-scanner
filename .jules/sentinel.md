## 2024-05-18 - [Hardcoded Secrets Removal]
**Vulnerability:** Several high-privileged credentials, API keys (Firebase, Cloudflare, MongoDB), and the master Administrator login key were hardcoded in `src/services/authStorage.ts` and `src/services/cryptoVaultService.ts`.
**Learning:** Hardcoded credentials even on the client-side pose severe security risks as they get bundled and exposed to all clients. Although `VITE_` variables are also bundled, removing secrets from source control prevents accidental leakage via public repositories or scraping.
**Prevention:** Rely on secure environment configurations (`import.meta.env`) with proper fallback logic. Use redaction tags (e.g., `[REDACTED]`) for demo seed credentials.

## 2026-10-20 - [Fix] Remove DOM XSS from generated browser extension code
**Vulnerability:** Found a DOM-based Cross-Site Scripting (XSS) vulnerability in `src/components/ExtensionExportView.tsx`. The template string used to export `browser.js` contained insecure DOM manipulation via `innerHTML` where an untrusted variable `tab.title` was concatenated directly.
**Learning:** Even generated code in an export or template needs strict DOM-based XSS protections. Vulnerabilities can be shipped to users via exported extensions if string concatenation is used to build DOM elements from potentially unsafe input.
**Prevention:** Instead of generating JS code that uses `innerHTML` with string concatenation, the template must use secure DOM creation methods (like `document.createElement` and `.textContent`) when handling any user input, such as `tab.title`.
