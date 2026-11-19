# Aegis 3D Safe Browser v2.0.0 (Chromium Desktop & electron-vite)

Aegis 3D Safe Browser v2.0.0 is a ground-up architectural rebuild powered by **`electron-vite` with TypeScript**, delivering authentic Chromium engine fidelity, native multi-tab management, built-in network ad-blocking, Firebase cloud sync, and an integrated Python cybersecurity bot.

---

### Key Highlights & Features

#### 1. Native Chromium WebContentsView Architecture
- Replaced legacy `<iframe>` and `<webview>` tags with Electron's modern **`WebContentsView`** API.
- Native top-level navigation eliminates frame-busting (X-Frame-Options/CSP) and Google "Browser not secure" blocks.
- Real-time viewport bounds synchronization via responsive `ResizeObserver` and `window.aegis.tabs.updateBounds()`.
- Full tab lifecycle controls: creation, switching, history navigation (`goBack`/`goForward`), reload, zoom, and native Chromium context menus.

#### 2. Built-in Network Ad & Tracker Blocker
- Network-level request cancellation engine implemented in Electron Main via `session.defaultSession.webRequest.onBeforeRequest`.
- Filters known advertising networks, telemetry, analytics trackers, and cryptomining hosts (80+ root domains + regex pattern matching).
- Live real-time blocked counter and shield toggle exposed in the Navbar and Omnibar via IPC (`aegis-adblocker-stats`).

#### 3. Firebase Auth & Firestore Real-Time Sync
- Modular Firebase v11/v12 Web SDK integration for persistent user sessions (Email/Password & Anonymous auth).
- Bi-directional cloud synchronization for:
  - User Bookmarks (`users/{uid}/bookmarks`)
  - Visited Browsing History (`users/{uid}/history`)
  - Browser Settings & Preferences (`users/{uid}/settings`)
- 100% environment variable isolation (`VITE_FIREBASE_*`) with zero hardcoded API credentials.

#### 4. Python Cybersecurity AI Bot Supervisor
- Main-process child process supervisor for `python_backend/main.py` (FastAPI).
- Spawns uvicorn on port 5005, monitors health endpoint (`/health`), and pipes engine status to the UI.
- Graceful shutdown: Clean process-tree termination on Windows (`taskkill /T /F`) and POSIX process-group signal routing.
- Native IPC proxying for `/chat`, `/analyze`, and `/terms` with automatic fallback to local heuristic evaluation.

#### 5. CodeRabbit Security Audit & Hardening
- Restored native Chromium security (`webSecurity: true`, `sandbox: true`, `allowRunningInsecureContent: false`).
- Removed global certificate bypass (`ignore-certificate-errors`), ensuring full TLS/SSL validation.
- Sender origin verification on all IPC channels (`event.sender === mainWindow.webContents`).
- Stripped Node.js runtime version leakage from the Preload bridge.

#### 6. Mobile Build Safety (Capacitor Android)
- Isolated desktop build configuration from Capacitor mobile project.
- Verified Android APK assets synchronization (`vite build` -> `android/app/src/main/assets/public` in 45ms).

---

### Verification
- `npx tsc -p tsconfig.node.json --noEmit` &rarr; 0 errors
- `npx tsc -p tsconfig.web.json --noEmit` &rarr; 0 errors
- `npx electron-vite build` &rarr; 0 errors (Built in <1s)
- Vitest suite &rarr; 24 tests passing
