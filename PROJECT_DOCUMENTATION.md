# Aegis 3D Safe Browser: Comprehensive Project Documentation & Architectural Blueprint

> **A Next-Generation Zero-Trust Cyber Sandbox, 3D Threat Telemetry System, and Scientific Intelligence Browser**  
> **Repository**: `aegis-3d-safe-browser` | **Version**: `2.5.0` | **Engine**: Zero-Trust DNS & Command Palette Sandbox

---

## Executive Summary

The modern web is inundated with cross-site scripting (XSS), stealth telemetry tracking, DNS hijacking, SSL downgrade attacks, and unpatched client-side dependencies. **Aegis 3D Safe Browser** is a privacy-first web workstation designed from the ground up to counter these risks.

Combining client-side zero-trust heuristics, Web Crypto AES-256 encryption, hardware-accelerated 3D WebGL visualizations via Three.js, interactive D3.js telemetry graphs, DNS-over-HTTPS (DoH) inspection, and Google Gemini AI threat intelligence, Aegis 3D transforms browsing from passive consumption into an active, hardened, and transparent cyber defense operation.

---

## 1. Project Creators & Engineering Team

Aegis 3D Safe Browser was engineered by a specialized team dedicated to zero-trust web architectures, modern reactive UI engineering, and offensive/defensive cybersecurity heuristics.

### Leadership & Core Contributors

```
+----------------------------------------------------------------------------------------------------+
|                                    AEGIS CORE ENGINEERING TEAM                                     |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|  [ Narendra Borhade ]               [ Aditya Gaikwad ]                [ Ghanshyam Jadhav ]         |
|  Creator & Lead Security Architect  Frontend Developer                Core Security & Systems      |
|  narendra.via.mail@gmail.com        gaikwadaditya0309@gmail.com       ghanshamjadhav8210@gmail.com |
|                                                                                                    |
|  - Zero-Trust Sandbox Concept       - Global Ctrl+K Command Palette   - Vulnerability Scanner      |
|  - DoH & DNSSEC Resolution          - Multi-Tab & Viewport UX         - 30-Day D3 Heatmap Engine   |
|  - Cloudflare & Threat Engines      - AES-256 Vault Interface         - Tracker & XSS Defense      |
+----------------------------------------------------------------------------------------------------+
```

### Detailed Contributor Profiles

#### 1. Narendra Borhade — *Creator & Lead Cybersecurity Architect*
- **Contact**: `narendra.via.mail@gmail.com`
- **Role & Focus**: Overall architectural vision, system security boundaries, DoH resolver pipeline, and sandbox isolation.
- **Key Contributions**:
  - Engineered the Zero-Trust Threat Sandbox and domain risk classification algorithms.
  - Implemented the dual-provider DNS-over-HTTPS (DoH) engine with fallback resolution (Cloudflare + Google).
  - Architected the server-side API proxy gateway (`server.ts`) preventing client-side CORS issues.
  - Directed the integration of the Gemini AI Copilot (`@google/genai`) for real-time CVE reasoning.

#### 2. Aditya Gaikwad — *Frontend Developer & UI/UX Systems Specialist*
- **Contact**: `gaikwadaditya0309@gmail.com`
- **Role & Focus**: React 19 UI component architecture, glassmorphic styling, state restoration, and keyboard ergonomics.
- **Key Contributions**:
  - Developed the **Global `Ctrl+K` / `Cmd+K` Command Palette** with instant search, tab navigation, and cache purge actions.
  - Built the multi-tab management system (tab grouping, color coding, pin states, and tab suspension mechanics).
  - Designed the user-facing cryptographic Password Vault interface and session persistence algorithms with debounced scroll restoration.
  - Crafted the mobile-first responsive viewport layouts and cybernetic UI aesthetics.

#### 3. Ghanshyam Jadhav — *Core Security & Systems Contributor*
- **Contact**: `ghanshamjadhav8210@gmail.com`
- **Role & Focus**: Threat detection engines, vulnerability heuristics, telemetry visualizer pipelines, and client data protection.
- **Key Contributions**:
  - Implemented the **Automated Background Vulnerability Scanner** detecting legacy libraries (jQuery, Bootstrap, Lodash, AngularJS 1.x) and missing security headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).
  - Engineered the 30-day interactive D3.js Threat Heatmap and Attack Vector Donut visualizers.
  - Developed anti-fingerprinting rules, tracker sanitizers, and cookie/session clearing protocols.
  - Co-designed the Manifest V3 Chrome Extension export generator.

---

## 2. What is the Project About?

### The Core Problem
Conventional web browsers execute third-party JavaScript with broad client access, silently exposing users to:
1. **Ad Trackers & Fingerprinting**: Pervasive cross-site beacons building persistent identity profiles.
2. **Invisible Vulnerabilities**: Outdated CDN libraries embedded in web applications carrying known CVEs.
3. **Malicious Protocol Downgrades & Clickjacking**: Missing HTTP headers like HSTS, CSP, and X-Frame-Options.
4. **Cache Poisoning & Malicious DNS**: Spoofed DNS resolutions routing traffic to credential harvest portals.
5. **Memory Bloat**: Multiple unmanaged browser tabs consuming system RAM and CPU resources unchecked.

### The Aegis 3D Solution
Aegis 3D Safe Browser acts as a **protective cyber-workstation**:
- **Simulates and Sandboxes**: Pages run within isolated sandboxes where traffic is scrutinized against threat heuristics before and during rendering.
- **Visualizes in Real Time**: Uses hardware-accelerated 3D graphics to visualize network safety states and shield integrity.
- **Audits Continuously**: Evaluates loaded hosts for CVE vulnerabilities, missing defense headers, and insecure DNS records.
- **Preserves Privacy**: Offers zero-knowledge local encryption for credentials and session state that never leaves the local machine.

---

## 3. Best & Standout Features

### 1. Hardware-Accelerated 3D Cyber Shield (`CyberScene3D.tsx`)
- Powered by **Three.js** with high-density particle clouds and rotating wireframe shields.
- Dynamic color shifts based on domain threat level:
  - **Emerald / Cyan**: Safe, verified, encrypted endpoints.
  - **Amber**: Missing defense headers or questionable tracking scripts.
  - **Crimson**: Active threats, blocked domains, or critical CVE vectors.
- Provides immediate visual spatial awareness of web safety.

### 2. Live DNS-over-HTTPS (DoH) Inspector (`DnsScannerView.tsx`)
- Performs high-speed cryptographic DNS queries over Cloudflare and Google DoH endpoints.
- Analyzes `A`, `AAAA`, `MX`, `TXT`, `NS`, and `CAA` record sets.
- Verifies **DNSSEC Authenticated Data (AD)** flags, SPF (`v=spf1`), and DMARC (`v=DMARC1`) records to detect email spoofing and DNS cache-poisoning risks.

### 3. Automated Deep Vulnerability Scanner (`BackgroundVulnerabilityScanner.tsx`)
- Fetches target web assets and analyzes the first 100 KB of HTML/JS payload plus HTTP headers.
- **Header Security Audits**: Evaluates `Strict-Transport-Security`, `Content-Security-Policy`, `X-Frame-Options` (anti-clickjacking), `X-Content-Type-Options: nosniff`, and `Referrer-Policy`.
- **Client Library CVE Detection**: Scans scripts against regex rules to identify vulnerable dependencies (e.g., jQuery `<3.5.0` with `CVE-2020-11022`, Bootstrap `<4.0` with `CVE-2019-8331`, Lodash `<4.17.21` with `CVE-2020-8203`, and legacy AngularJS 1.x).
- Outputs letter grades (`A+` down to `F`) with actionable remediation steps.

### 4. Interactive D3.js Cyber Analytics (`SecurityAnalyticsView.tsx`)
- **D3 Threat Heatmap**: 30-day temporal visualization of blocked threats, phishing intercepts, and malicious payloads.
- **Attack Vector Donut**: Proportional breakdown of intercepted vectors (Phishing, Malware, Crypto-mining, Ad-trackers).
- **Severity Velocity Chart**: Rate of detected high vs. low severity events across active sessions.
- **Realtime Trend Line**: Live-polling latency and packet mitigation rate metrics.

### 5. Multi-Tab Resource Management & Auto-Suspension (`ResourceMonitorSidebar.tsx`)
- Tracks per-tab simulated CPU percentage and RAM footprint.
- **Tab Sleeping / Auto-Suspension**: Automatically suspends tabs idle for over 15 minutes, preserving system resources and displaying an inactive badge.
- Tab grouping with custom labels and chromatic identifiers (`cyan`, `purple`, `emerald`, `amber`, `rose`, `blue`).

### 6. Zero-Knowledge Cryptographic Password Vault (`PasswordVaultManager.tsx`)
- Employs **AES-GCM 256-bit encryption** using the native browser Web Crypto API (`crypto.subtle`).
- Derives keys using **PBKDF2** with 100,000 SHA-256 iterations and a 16-byte cryptographically secure random salt.
- The master password is never stored on disk or transmitted over the network. Cryptographic keys are purged from memory immediately upon locking the vault.

### 7. Global Command Palette (`CommandPaletteModal.tsx`)
- Triggered anywhere via `Ctrl+K` or `Cmd+K`.
- Fast keyboard-driven workflow for tab switching, domain inspection, cache clearing, theme switching, and quick navigation.

### 8. Gemini AI Cyber Copilot (`GeminiCopilotView.tsx`)
- Direct integration with Google GenAI SDK (`@google/genai`) utilizing `gemini-3.8-flash`.
- Provides contextual analysis of CVE advisories, Exploit-DB entries, source-code audits, and incident response playbooks.

### 9. Scientific Research Discovery Portal (`ScienceSearchView.tsx`)
- Integrates with the official arXiv query API via a dedicated backend proxy.
- Enables cryptographic researchers, security engineers, and scientists to find and review preprints on post-quantum cryptography, zero-knowledge proofs, and machine learning security.

### 10. In-Browser Chrome Extension Generator (`ExtensionExportView.tsx`)
- Compiles an unpackaged or zipped Manifest V3 Chrome Extension directly in the browser using **JSZip**.
- Configures custom ad-blocking rules (`declarativeNetRequest`), CSP directives, background service workers, and popup menus.

---

## 4. How the Project Works (Technical Architecture & Workflow)

### System Flow Diagram

```
+------------------------------------------------------------------------------------+
|                                    USER CLIENT                                     |
|                                                                                    |
|  [ Omnibar ] ---> [ Global Ctrl+K Palette ] ---> [ Multi-Tab Workspace Manager ]    |
+------------------------------------------------------------------------------------+
          |                                               |
          | User Navigation / Inspection                  | Visual Rendering
          v                                               v
+-------------------------------+               +------------------------------------+
| Local Heuristic Threat Engine |               | Three.js 3D Particle Cloud Shield  |
| - Domain Blocklist Filtering  |               | D3.js Realtime Telemetry Graphs    |
| - Anti-Phishing RegEx Rules   |               | Interactive Theme & Vault Controls |
+-------------------------------+               +------------------------------------+
          |
          | Secure REST Fetch Calls
          v
+------------------------------------------------------------------------------------+
|                     EXPRESS 4 PROXY & VITE GATEWAY (server.ts)                     |
+------------------------------------------------------------------------------------+
       |                     |                     |                     |
       v                     v                     v                     v
+---------------+     +---------------+     +---------------+     +------------------+
| DoH Resolver  |     | Deep Security |     | Gemini AI API |     | arXiv Science    |
| Cloudflare &  |     | & CVE Scanner |     | Google GenAI  |     | Literature Proxy |
| Google DoH    |     | (Headers/JS)  |     | (3.8-Flash)   |     | (Atom XML Caching|
+---------------+     +---------------+     +---------------+     +------------------+
```

### End-to-End Navigation Lifecycle:
1. **Input & Normalization**: The user types a URL or search query into the `Omnibar` or `Command Palette`. The string is normalized into an absolute HTTPS target.
2. **Pre-Flight Heuristic Check**: `threatEngine.ts` checks the target domain against known malicious patterns, crypto-miners, and phishing signatures.
3. **DoH & Security Header Resolution**: 
   - The backend (`server.ts`) queries Cloudflare/Google DoH endpoints to verify DNS records, SPF/DMARC status, and DNSSEC authenticity.
   - Concurrently, `/api/security/vulnerability-scan` performs a scan of headers and embedded scripts.
4. **Scoring & 3D Visualization**:
   - The system aggregates the security score (0–100) and assigns an SSL grade (`A+` to `F`).
   - The Three.js 3D Cyber Scene rotates into position, shifting its color scheme to reflect the calculated threat posture.
5. **Isolation Rendering**:
   - If clean: The site is rendered in the sandboxed workspace.
   - If suspicious: The user is prompted with an interstitial quarantine warning detailing the discovered CVEs or missing headers.
6. **State Persistence**:
   - `sessionStateService.ts` automatically saves active tabs, omnibar content, and the current scroll position using debounced handlers, ensuring seamless resumption across sessions.

---

## 5. Technology Stack Summary

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript 7 |
| **Styling & Design** | Tailwind CSS v4, Lucide Icons, Glassmorphic CSS |
| **3D Rendering** | Three.js (WebGL Hardware-Accelerated Particle Engine) |
| **Data Visualization** | D3.js v7 (Scalable Vector Graphics, Heatmaps, Donuts, Trendlines) |
| **State & Animations** | Motion (Framer Motion), Custom React Hooks, LocalStorage / IndexedDB |
| **Cryptography** | Web Crypto API (AES-GCM 256-bit, PBKDF2 with 100k SHA-256 iterations) |
| **Backend Gateway** | Node.js, Express 4, `tsx` TypeScript Execution |
| **AI Intelligence** | Google GenAI SDK (`@google/genai`), Gemini 3.8 Flash |
| **Packaging & Offline** | Vite 8, PWA (Custom Service Worker Cache-First strategy), JSZip |

---

## 6. Project Future Scope & Roadmap

The development team has planned a multi-phase evolutionary roadmap to transition Aegis 3D from a web-based sandbox into an ecosystem of zero-trust tools:

```
+----------------------------------------------------------------------------------+
|                             AEGIS EVOLUTION ROADMAP                              |
+----------------------------------------------------------------------------------+
|                                                                                  |
|  [ Phase 1: Near-Term ]   ->   [ Phase 2: Medium-Term ] -> [ Phase 3: Long-Term ] |
|  - Electron / Tauri App        - Post-Quantum Crypto       - Decentralized Onion |
|  - Real Chromium Sandbox       - WebAssembly Heuristics      Routing Network     |
|  - Cloudflare Turnstile API    - Collaborative Telemetry   - Zero-Knowledge Web  |
|                                                              Identity Protocol   |
+----------------------------------------------------------------------------------+
```

### Phase 1: Native Desktop Wrapper & Real Sandboxing (Near-Term)
- **Tauri / Electron Packaging**: Package Aegis 3D into a standalone desktop application with native OS-level process isolation.
- **Embedded Chromium / CEF Engine**: Replace iframe simulation with a Chromium Embedded Framework engine that provides direct network interception, cookie jar isolation, and request-level blocking.
- **Live Cloudflare Turnstile Hook**: Full integration of challenge-response verification for automated bot mitigation before high-risk page access.

### Phase 2: Quantum-Resistant Cryptography & WebAssembly (Medium-Term)
- **Post-Quantum Cryptography (PQC)**: Upgrade the Password Vault and internal token exchange to support NIST-standardized post-quantum algorithms (ML-KEM / Kyber and ML-DSA / Dilithium).
- **WebAssembly (Wasm) Packet Filtering**: Port Rust-based network filtering engines (such as AdGuard or Brave Adblock core) to Wasm for microsecond-level ad and tracker blocking directly in the client.
- **Decentralized Threat Intelligence Sharing**: Opt-in peer-to-peer threat telemetry enabling nodes to share newly discovered phishing domains without central server dependencies.

### Phase 3: Zero-Knowledge Decentralized Web Navigation (Long-Term)
- **Built-in Onion / Mixnet Routing**: Native integration with Tor or Nym mixnet protocols to conceal client IP addresses from network eavesdroppers.
- **AI-Powered DOM Exploit Defense**: On-device neural models that detect DOM-based zero-day exploits, invisible pixel tracking, and synthetic canvas fingerprinting in real time.
- **Decentralized Identity (DID) Vault**: Allow passwordless web authentication using decentralized identifiers and verifiable credentials, reducing reliance on centralized identity providers.

---

## 7. Running & Verifying the Project

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Quickstart Guide
```bash
# 1. Install dependencies (using legacy peer deps for modern Vite/Tailwind 4 peer compatibility)
npm install --legacy-peer-deps

# 2. Configure environment variables in .env
# PORT=3000
# GEMINI_API_KEY=your_gemini_api_key_here

# 3. Launch Development Server
npm run dev

# 4. Access the Browser
# Navigate to: http://localhost:3000
```

### Verification & Health Check
Verify the backend server and team attribution via the health endpoint:
```bash
curl http://localhost:3000/api/health
```

**Expected JSON Response:**
```json
{
  "status": "ok",
  "system": "Aegis 3D Safe Browser Node Server",
  "version": "2.5.0",
  "creator": "Narendra Borhade",
  "creatorEmail": "narendra.via.mail@gmail.com",
  "contributors": [
    {
      "name": "Aditya Gaikwad",
      "role": "Frontend Developer",
      "email": "gaikwadaditya0309@gmail.com"
    },
    {
      "name": "Ghanshyam Jadhav",
      "role": "Core Security & Systems Contributor",
      "email": "ghanshamjadhav8210@gmail.com"
    }
  ],
  "engine": "Zero-Trust DNS & Command Palette Sandbox"
}
```

---

## 8. Summary

**Aegis 3D Safe Browser** brings together high-assurance security engineering and modern web technologies. Conceived and led by **Narendra Borhade**, built with frontend design from **Aditya Gaikwad**, and hardened by threat systems contributor **Ghanshyam Jadhav**, Aegis 3D offers an intuitive, secure, and visually transparent experience for safe web navigation.
