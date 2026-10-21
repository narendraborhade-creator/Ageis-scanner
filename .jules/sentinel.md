## 2024-05-18 - [Hardcoded Secrets Removal]
**Vulnerability:** Several high-privileged credentials, API keys (Firebase, Cloudflare, MongoDB), and the master Administrator login key were hardcoded in `src/services/authStorage.ts` and `src/services/cryptoVaultService.ts`.
**Learning:** Hardcoded credentials even on the client-side pose severe security risks as they get bundled and exposed to all clients. Although `VITE_` variables are also bundled, removing secrets from source control prevents accidental leakage via public repositories or scraping.
**Prevention:** Rely on secure environment configurations (`import.meta.env`) with proper fallback logic. Use redaction tags (e.g., `[REDACTED]`) for demo seed credentials.
