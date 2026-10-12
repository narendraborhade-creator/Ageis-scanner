# Aegis 3D Safe Browser - Comprehensive Project Documentation

> **Next-Generation Zero-Trust Cyber Sandbox, 3D Threat Telemetry, and Scientific Intelligence Browser**  
> **Lead Architect / Creator**: Narendra Borhade (`narendra.via.mail@gmail.com`)  
> **Contributors**: Aditya Gaikwad (Frontend Developer), Ghanshyam Jadhav (Core Security & Systems)

---

## Table of Contents
1. [Executive Summary & System Overview](#1-executive-summary--system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Backend Server & API Specifications (`server.ts`)](#4-backend-server--api-specifications-serverts)
5. [Frontend Architecture & State Management](#5-frontend-architecture--state-management)
6. [Core Components Deep-Dive](#6-core-components-deep-dive)
7. [Services & Subsystems](#7-services--subsystems)
8. [PWA, Service Worker & Offline Resiliency](#8-pwa-service-worker--offline-resiliency)
9. [Chrome Extension Generation Subsystem](#9-chrome-extension-generation-subsystem)
10. [Setup, Deployment & Environment Configuration](#10-setup-deployment--environment-configuration)
11. [Project Structure Directory Map](#11-project-structure-directory-map)

---

## 1. Executive Summary & System Overview

**Aegis 3D Safe Browser** is a privacy-first, zero-trust web workstation and security analysis environment built with React 19, TypeScript, Tailwind CSS, Three.js, and Node.js/Express. It models web navigation through a multi-layered security prism, protecting users against malicious domains, clickjacking, MIME-confusion attacks, cross-site scripting (XSS), insecure DNS configurations, and unverified third-party scripts.

### Key Capabilities:
- **Zero-Trust Simulated & Sandboxed Web Navigation**: Multi-tab browsing with live threat blocking, ad/tracker filtering, quarantine sandboxes, and simulated phishing interception.
- **Real-Time 3D Cyber Threat Telemetry**: Interactive Three.js particle shield and geospatial 3D visualization representing inbound packets, firewall mitigations, and network nodes.
- **Deep Automated Vulnerability Scanner**: Audits HTTP headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Server leakage) and detects vulnerable client-side libraries (jQuery, Bootstrap, Lodash, legacy AngularJS) against known CVE databases.
- **DNS-over-HTTPS (DoH) & Threat Profiler**: High-speed DoH lookups via Cloudflare and Google DoH proxies, inspecting A, AAAA, MX, TXT, NS, and CAA records alongside SPF, DMARC, and DNSSEC verification.
- **Dual-Site Security Comparator**: Side-by-side comparative vulnerability benchmark evaluating response times, SSL hygiene, and defense posture.
- **D3.js Data Visualizations**: Interactive SVG charts including Threat Heatmaps, Attack Vector Donuts, Severity Velocity timelines, and Realtime Telemetry lines.
- **Gemini Copilot**: Integrated AI cybersecurity intelligence assistant powered by `@google/genai` (supporting `gemini-3.8-flash` and custom models).
- **Client-Side Scientific Search Engine**: Direct CORS-compliant arXiv query engine and scientific literature discovery tool.
- **Cryptographic Password Vault**: Zero-knowledge in-browser password and credential vault utilizing AES-GCM 256-bit encryption with PBKDF2 key derivation.
- **Chrome Extension Generator**: One-click in-browser compilation of a Manifest V3 Chrome Extension package with customizable defense levels and rule manifests.

---

## 2. High-Level Architecture

The project employs a hybrid client-server model: Express serves both custom cybersecurity backend endpoints and Vite's development/production middleware.

```
+----------------------------------------------------------------------------------+
|                            User Browser / PWA Client                             |
+----------------------------------------------------------------------------------+
          |                                                       |
          | UI Actions & State                                    | Three.js / D3.js
          v                                                       v
+-----------------------------+                           +-----------------------+
|  React 19 App Container     |                           |  3D Cyber Scene &     |
|  - Omnibar & Tab Manager    |                           |  Telemetry Charts     |
|  - Session / Scroll Restore |                           |  - Three.js Particles |
|  - Theme & Privacy Service  |                           |  - D3 Threat Heatmap  |
+-----------------------------+                           +-----------------------+
          |
          +------------+------------------+------------------+
          |            |                  |                  |
          v            v                  v                  v
+--------------+ +---------------+ +---------------+ +------------------+
| Crypto Vault | | Visual History| | Local Threat  | | Resource Monitor |
| (AES-GCM /   | | & ReadLater   | | Engine & Rules| | (CPU/RAM Tab     |
| PBKDF2)      | | (IndexedDB/LS)| | (Blocklists)  | | Throttling/Tabs) |
+--------------+ +---------------+ +---------------+ +------------------+
          |
          | HTTP / REST API Calls
          v
+----------------------------------------------------------------------------------+
|                     Express.js Backend & Proxy Gateway (server.ts)                |
+----------------------------------------------------------------------------------+
       |                     |                     |                     |
       v                     v                     v                     v
+---------------+     +---------------+     +---------------+     +----------------+
| Gemini AI SDK |     | Cloudflare /  |     | Deep Webpage  |     | arXiv Proxy    |
| (@google/     |     | Google DoH    |     | Security &    |     | (Atom XML /    |
| genai)        |     | Resolver API  |     | Vulnerability |     | Science Search)|
+---------------+     +---------------+     +---------------+     +----------------+
```

---

## 3. Technology Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) (`react`, `react-dom`)
- **Language**: [TypeScript 7](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **3D Graphics & Physics**: [Three.js](https://threejs.org/) (`three`, `@types/three`)
- **Data Visualization**: [D3.js v7](https://d3js.org/) (`d3`, `@types/d3`)
- **Animation**: [Motion](https://motion.dev/) (formerly Framer Motion)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Archive Generation**: [JSZip](https://stuk.github.io/jszip/) (for Chrome Extension ZIP downloads)
- **PWA Tooling**: `vite-plugin-pwa` with custom Service Worker caching (`public/sw.js`)

### Backend / Server
- **Runtime**: Node.js with `tsx` (TypeScript Execution)
- **Server**: [Express 4](https://expressjs.com/)
- **AI Integration**: Official Google GenAI SDK (`@google/genai` v2.4.0)
- **Environment Handling**: `dotenv`
- **Build / Dev Server**: [Vite 8](https://vitejs.dev/) with `@vitejs/plugin-react`

---

## 4. Backend Server & API Specifications (`server.ts`)

The backend is contained in [`server.ts`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/server.ts), functioning as both an API gateway to avoid client-side CORS issues and as a Vite development host.

### API Endpoints

#### 1. Gemini Cyber AI Intelligence (`POST /api/gemini/chat`)
- **Description**: Proxies conversation prompts to Google's Gemini models using `@google/genai`.
- **Request Body**:
  ```json
  {
    "messages": [{ "role": "user", "content": "Analyze CVE-2024-3094" }],
    "systemInstruction": "Optional custom system instruction",
    "model": "gemini-3.8-flash"
  }
  ```
- **Fallback**: Returns a friendly offline fallback when `GEMINI_API_KEY` is not present in `.env`.

#### 2. DNS-over-HTTPS (DoH) Resolver (`GET /api/dns/scan`)
- **Description**: Resolves DNS records through Cloudflare DoH (`https://cloudflare-dns.com/dns-query`) with automatic fallback to Google DoH (`https://dns.google/resolve`).
- **Query Parameters**:
  - `domain`: Target hostname (e.g. `github.com`).
  - `type`: Record type (`A`, `AAAA`, `MX`, `TXT`, `NS`, `CAA`).
- **Response**: Latency in ms, DNS status code, DNSSEC AD verification flag, Answer and Authority records.

#### 3. Live Website Security Inspector (`GET /api/inspect/website`)
- **Description**: Performs an automated HTTP `HEAD` / `GET` inspection using custom user-agent headers.
- **Computed Metrics**:
  - Response time (ms)
  - Security score (0–100)
  - Analysis of security headers: `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and `Server` banner.

#### 4. Automated Deep Vulnerability Scanner (`GET /api/security/vulnerability-scan`)
- **Description**: Fetches page contents (up to 100 KB) and headers to execute a comprehensive security audit.
- **Audits Performed**:
  - Missing or permissive headers (`unsafe-inline`, missing HSTS, clickjacking risk).
  - Outdated client library detection via regex pattern scanning (jQuery, Bootstrap, Lodash, AngularJS 1.x) correlated against CVE references (e.g. `CVE-2020-11022`, `CVE-2019-8331`).
  - Letter grade calculation (`A+`, `A`, `B`, `C`, `D`, `F`) and remediation actions.

#### 5. Science Literature Proxy (`GET /api/arxiv`)
- **Description**: CORS proxy for the arXiv Atom API (`https://export.arxiv.org/api/query`) supporting scientific searches and biology/cryptography preprint lookups.

#### 6. System Health Check (`GET /api/health`)
- **Description**: Reports uptime status, engine mode, version (`2.5.0`), creator attribution, and core contributors.

#### 7. Service Worker Route (`GET /sw.js`)
- **Description**: Serves `sw.js` with `Service-Worker-Allowed: /` and no-cache headers to ensure consistent offline functionality.

---

## 5. Frontend Architecture & State Management

### Navigation Views (`NavTab`)
The main interface state is driven by `activeTab` in [`src/App.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/App.tsx#L40):
- `'browser'`: Primary multi-tab safe browsing sandbox.
- `'dns-scanner'`: DoH lookup and DNS security profiler.
- `'compare'`: Dual-URL security score and header comparator.
- `'threat-blocker'`: Real-time firewall rule viewer and blocked domain log.
- `'security-analytics'`: D3 threat trends, velocity charts, and attack vector donut.
- `'science'`: Academic and scientific preprint research portal.
- `'gemini-copilot'`: Threat intelligence AI chatbot.
- `'auth'`: User account profile and cryptographic vault interface.
- `'about'`: Engineering specifications, creator credentials, and project mission.
- `'extension'`: Interactive Manifest V3 Chrome Extension builder and export tool.

### Session Persistence & State Restoration
Implemented in [`src/services/sessionStateService.ts`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/services/sessionStateService.ts):
- Persists active tabs, URLs, DNS inputs, and comparative domains.
- Automatically saves and restores window scroll coordinates (`scrollX`, `scrollY`) with a 150ms debounce.
- Displays an interactive toast notification when a previous session is successfully resumed.

---

## 6. Core Components Deep-Dive

All components reside in [`src/components/`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/):

| Component | File | Responsibilities |
| :--- | :--- | :--- |
| **BrowserView** | [`BrowserView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/BrowserView.tsx) | Multi-tab browsing canvas, sandbox iframe simulator, tab grouping, tab pinning, tab suspension, quarantined iframe handling, and live threat counter. |
| **CyberScene3D** | [`CyberScene3D.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/CyberScene3D.tsx) | Three.js hardware-accelerated 3D visualizer showing rotating shield geometry, floating particle defense clouds, and live color-shifting based on threat severity. |
| **CommandPaletteModal** | [`CommandPaletteModal.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/CommandPaletteModal.tsx) | Spotlight-style global quick launcher triggered by `Ctrl+K` / `Cmd+K`. Allows instant navigation, tab switching, cache clearing, and theme toggling. |
| **BackgroundVulnerabilityScanner** | [`BackgroundVulnerabilityScanner.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/BackgroundVulnerabilityScanner.tsx) | Automated background scanning engine checking loaded tabs for security regressions, CVEs, and outdated assets. |
| **DnsScannerView** | [`DnsScannerView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/DnsScannerView.tsx) | Domain intelligence dashboard showing DNS records, DNSSEC status, SPF/DMARC posture, and cache-poisoning risks. |
| **WebsiteComparatorView** | [`WebsiteComparatorView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/WebsiteComparatorView.tsx) | Side-by-side URL security inspector comparing latency, headers, SSL grades, and protection capabilities. |
| **SecurityAnalyticsView** | [`SecurityAnalyticsView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/SecurityAnalyticsView.tsx) | Comprehensive dashboard hosting multiple D3 charts, vulnerability statistics, and threat history graphs. |
| **D3 Charts** | [`ThreatHeatmapD3.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/ThreatHeatmapD3.tsx), [`D3AttackVectorDonut.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/D3AttackVectorDonut.tsx), [`D3RealtimeTrendChart.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/D3RealtimeTrendChart.tsx), [`D3SeverityVelocityChart.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/D3SeverityVelocityChart.tsx) | Interactive SVG charts rendering hour-by-hour threat distributions, attack vectors (phishing, malware, crypto-miners), and real-time velocity. |
| **PasswordVaultManager** | [`PasswordVaultManager.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/PasswordVaultManager.tsx) | Client-side password manager with password strength evaluation, generator, and encrypted credential storage. |
| **ResourceMonitorSidebar** | [`ResourceMonitorSidebar.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/ResourceMonitorSidebar.tsx) | Per-tab CPU/Memory telemetry monitor with automated tab sleep/suspension capabilities to reduce RAM usage. |
| **Omnibar** | [`Omnibar.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/Omnibar.tsx) | URL and search input supporting instant URL normalization, safety status chips, and quick action shortcuts. |
| **ExtensionExportView** | [`ExtensionExportView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/ExtensionExportView.tsx) | Configures and generates Manifest V3 extension packages directly in the browser using JSZip. |

---

## 7. Services & Subsystems

Located in [`src/services/`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/services/):

### 1. `cryptoVaultService.ts`
- **Algorithm**: AES-GCM with 256-bit keys.
- **Key Derivation**: Web Crypto API `PBKDF2` (100,000 iterations, SHA-256) using a 16-byte random salt.
- **Zero-Knowledge**: Master password is never stored; keys are derived on-the-fly and cleared from memory upon lock.

### 2. `threatEngine.ts`
- Evaluates URLs against curated domain blocklists, regular expression rules, and heuristics.
- Detects phishing signatures, crypto-jacking scripts, tracking beacons, and unsafe protocol downgrades.
- Generates threat logs and classifies domains into `clean`, `warning`, or `blocked`.

### 3. `dnsService.ts`
- Interfaces with the `/api/dns/scan` endpoint.
- Validates MX records, SPF (`v=spf1`), DMARC (`v=DMARC1`), CAA policies, and DNSSEC signatures.

### 4. `privacyService.ts` & `themeService.ts`
- **Privacy Service**: Provides incognito sandboxing, ephemeral session storage, and cookie clearing.
- **Theme Service**: Supports multiple themes (Aegis Dark, Cyberpunk Cyan, High Contrast, Midnight Purple) by updating DOM root attributes.

### 5. `resourceMonitorService.ts` & `performanceMetricsService.ts`
- Simulates realistic per-tab memory consumption and CPU thread usage.
- Triggers auto-suspension for tabs idle for more than 15 minutes to recover simulated memory.
- Measures Time-to-First-Byte (TTFB), First Contentful Paint (FCP), and TLS handshake latencies.

---

## 8. PWA, Service Worker & Offline Resiliency

The application functions as a Progressive Web App (PWA) with full offline support:
- **Manifest (`public/manifest.json`)**: Configured with `display: "standalone"`, branding colors (`#030712`), and icons (`192x192`, `512x512`, maskable).
- **Service Worker (`public/sw.js`)**:
  - Implements a Cache-First strategy for static assets (`styles`, `scripts`, `images`, `fonts`).
  - Implements a Network-First strategy with cache fallback for dynamic API responses.
  - Custom offline fallback page for network disconnects.
- **Offline Indicator (`src/components/OfflineIndicator.tsx`)**: Reusable UI component hooked to `useOnlineStatus` to warn users when connectivity is lost.

---

## 9. Chrome Extension Generation Subsystem

The Extension Generator in [`ExtensionExportView.tsx`](file:///c:/Users/Ghostpc/Downloads/aegis-3d-safe-browser/src/components/ExtensionExportView.tsx) enables users to export Aegis as a native browser extension:
1. Generates a valid Manifest V3 `manifest.json`.
2. Packages background service worker scripts (`background.js`) with declarative net request rules (`declarativeNetRequest`).
3. Bundles popup user interface files and SVG/PNG icon assets.
4. Uses **JSZip** to assemble the files into an exportable `.zip` archive ready for unpacking in `chrome://extensions`.

---

## 10. Setup, Deployment & Environment Configuration

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **yarn**

### Installation
```bash
# Clone or navigate to the repository directory
cd aegis-3d-safe-browser

# Install dependencies
npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
```

### Running the Application
```bash
# Run in development mode (starts Express + Vite HMR)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Type-check and lint
npm run lint
```

The app will be accessible at: `http://localhost:3000`

---

## 11. Project Structure Directory Map

```
aegis-3d-safe-browser/
│
├── public/                               # Static PWA assets & icons
│   ├── manifest.json                     # PWA Web Application Manifest
│   ├── sw.js                             # Custom Service Worker implementation
│   ├── icon.svg                          # Vector brand logo
│   └── pwa-*.png                         # PWA icon sizes (192, 512, maskable)
│
├── src/
│   ├── components/                       # React UI Components
│   │   ├── BrowserView.tsx               # Main sandboxed browser canvas
│   │   ├── CyberScene3D.tsx              # Three.js 3D threat shield
│   │   ├── CommandPaletteModal.tsx       # Global Cmd+K / Ctrl+K modal
│   │   ├── DnsScannerView.tsx            # DoH scanner and DNS inspection
│   │   ├── SecurityAnalyticsView.tsx     # Analytics dashboard with D3
│   │   ├── ThreatHeatmapD3.tsx           # D3 Threat Heatmap component
│   │   ├── D3AttackVectorDonut.tsx       # D3 Attack vector breakdown
│   │   ├── D3RealtimeTrendChart.tsx      # D3 Telemetry trends chart
│   │   ├── D3SeverityVelocityChart.tsx   # D3 Threat velocity chart
│   │   ├── PasswordVaultManager.tsx      # Cryptographic credential manager
│   │   ├── ResourceMonitorSidebar.tsx    # Per-tab CPU and memory inspector
│   │   ├── WebsiteComparatorView.tsx     # Dual-site security benchmark
│   │   ├── GeminiCopilotView.tsx         # AI Security assistant view
│   │   ├── ScienceSearchView.tsx         # arXiv literature search view
│   │   ├── ExtensionExportView.tsx       # Manifest V3 extension builder
│   │   ├── Omnibar.tsx                   # Safe address bar & search input
│   │   ├── Navbar.tsx                    # Top navigation bar
│   │   ├── AuthView.tsx                  # User authentication & vault login
│   │   ├── AboutUsView.tsx               # Specifications & team info
│   │   └── ...                           # Additional modal and helper components
│   │
│   ├── hooks/                            # Custom React Hooks
│   │   ├── useOnlineStatus.ts            # Network connectivity listener
│   │   └── usePWAInstall.ts              # PWA install prompt handler
│   │
│   ├── services/                         # Business Logic & Data Stores
│   │   ├── cryptoVaultService.ts         # AES-GCM 256-bit Web Crypto encryption
│   │   ├── threatEngine.ts               # Threat detection heuristics & rules
│   │   ├── dnsService.ts                 # DoH scanner service integration
│   │   ├── vulnerabilityScannerService.ts# Deep vulnerability check service
│   │   ├── sessionStateService.ts        # Session & scroll position persistence
│   │   ├── performanceMetricsService.ts  # Web vitals & latency tracking
│   │   ├── resourceMonitorService.ts     # Tab memory/CPU monitor & sleeping
│   │   ├── authStorage.ts                # Account management & storage
│   │   ├── bookmarkStorage.ts            # Bookmarks storage
│   │   ├── historyStorage.ts             # Browsing history storage
│   │   ├── readLaterStorage.ts           # Read-later article store
│   │   ├── scienceService.ts             # arXiv API query parser
│   │   ├── privacyService.ts             # Incognito mode & cookie management
│   │   └── themeService.ts               # Theme management (Dark, Cyberpunk, etc.)
│   │
│   ├── App.tsx                           # Main application orchestrator & routing
│   ├── main.tsx                          # React DOM entry point
│   ├── types.ts                          # TypeScript interface definitions
│   ├── index.css                         # Global CSS & Tailwind imports
│   └── serviceWorkerRegistration.ts      # Service worker registration helper
│
├── server.ts                             # Express server, DoH proxy, Gemini API, Vite host
├── vite.config.ts                        # Vite configuration with Tailwind & React plugins
├── package.json                          # Project dependencies & scripts
├── tsconfig.json                         # TypeScript compiler configuration
└── README.md                             # Quickstart instructions
```
