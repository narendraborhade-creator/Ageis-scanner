## 2024-05-18 - [Hardcoded Secrets Removal]
**Vulnerability:** Several high-privileged credentials, API keys (Firebase, Cloudflare, MongoDB), and the master Administrator login key were hardcoded in `src/services/authStorage.ts` and `src/services/cryptoVaultService.ts`.
**Learning:** Hardcoded credentials even on the client-side pose severe security risks as they get bundled and exposed to all clients. Although `VITE_` variables are also bundled, removing secrets from source control prevents accidental leakage via public repositories or scraping.
**Prevention:** Rely on secure environment configurations (`import.meta.env`) with proper fallback logic. Use redaction tags (e.g., `[REDACTED]`) for demo seed credentials.

## 2023-10-19 - Overly Permissive CORS Headers
**Vulnerability:** Found `allow_origins=["*"]` configured with `allow_credentials=True` in the FastAPI backend's CORS middleware.
**Learning:** This is a critical security misconfiguration (CWE-942) allowing unauthorized third-party origins to access authenticated API endpoints, effectively undermining Cross-Origin Resource Sharing restrictions. FastAPI might even reject this explicitly in newer versions as it violates browser security specifications.
**Prevention:** Always maintain a strict whitelist of trusted client origins for `allow_origins` and avoid using wildcards `*` in production environments, especially when `allow_credentials` is set to `True`.
