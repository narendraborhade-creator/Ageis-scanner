## 2023-10-19 - Overly Permissive CORS Headers
**Vulnerability:** Found `allow_origins=["*"]` configured with `allow_credentials=True` in the FastAPI backend's CORS middleware.
**Learning:** This is a critical security misconfiguration (CWE-942) allowing unauthorized third-party origins to access authenticated API endpoints, effectively undermining Cross-Origin Resource Sharing restrictions. FastAPI might even reject this explicitly in newer versions as it violates browser security specifications.
**Prevention:** Always maintain a strict whitelist of trusted client origins for `allow_origins` and avoid using wildcards `*` in production environments, especially when `allow_credentials` is set to `True`.
