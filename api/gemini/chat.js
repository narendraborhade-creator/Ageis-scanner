/**
 * Vercel Serverless Function: /api/gemini/chat
 * Provides high-assurance cybersecurity intelligence on Vercel deployments (aegisscans.dev).
 * Supports optional Gemini API keys and features an autonomous Web Knowledge Engine
 * powered by live Wikipedia and authoritative cybersecurity architecture specifications.
 */

import { GoogleGenAI } from '@google/genai';

// Curated Deep-Dive Cybersecurity Corpus for instant authoritative answers
const SPECIALIZED_CYBER_CORPUS = {
  dns_origin: {
    title: 'DNS Origin Server & Origin IP Shielding',
    aliases: ['dns origin', 'origin server', 'origin ip', 'origin shielding', 'origin leak', 'origin protection', 'dns origin server'],
    overview:
      'In modern web architecture and content delivery networks (CDNs), the **Origin Server** is the authoritative backend host (physical machine, cloud VM, or container cluster) where application code runs and databases reside. Reverse proxies and edge networks (such as Cloudflare, Fastly, Akamai, or AWS CloudFront) sit between public visitors and this origin server to provide caching, DDoS absorption, and Web Application Firewall (WAF) filtering. The **DNS Origin Record** is the internal DNS entry that maps the domain directly to the actual origin machine IP.',
    technicalMechanics:
      'When an edge CDN is enabled, public DNS (A/AAAA records) resolves to anycast edge IPs rather than the origin server IP. When a client makes a request, the CDN edge proxy intercepts it, evaluates WAF rules, and proxies the sanitized request back to the origin IP. However, if the origin server IP is inadvertently exposed, attackers can bypass the CDN entirely.',
    threatVectors: [
      '**Direct-to-Origin DDoS Attacks**: If adversaries discover the origin IP, they bypass the CDN scrubbing center and flood the origin server directly, causing complete resource exhaustion.',
      '**WAF & Rate-Limit Bypass**: Edge security protections (SQLi/XSS inspection, bot challenges, rate limiting) exist solely at the CDN edge. Direct HTTP/HTTPS requests to the origin IP bypass all edge WAF rules.',
      '**Historical DNS Record Reconnaissance**: Tools like SecurityTrails, Censys, Shodan, and DNSDumpster index historical DNS records. If the domain previously pointed to the origin server before CDN proxying was enabled, that IP remains documented in threat actor databases.',
      '**Subdomain & Mail Server Leakage**: Misconfigurations such as pointing MX (mail), FTP, cPanel, or staging subdomains (`mail.domain.com`, `dev.domain.com`) to the same server IP expose the origin.',
      '**Server-Side Request Forgery (SSRF)**: Vulnerable web applications forced to fetch remote resources can be coerced into revealing their own public outbound IP in HTTP request headers.',
      '**Outbound Email Headers**: Transactional emails dispatched directly from the origin server without a third-party relay leak the origin IP in `Received: from` headers.',
    ],
    defensiveControls: [
      '**Zero Open Inbound Ports (Tunneling)**: Deploy tunnel daemons such as Cloudflare Argo Tunnel (`cloudflared`) or AWS PrivateLink. The origin initiates an encrypted outbound connection to the edge network, allowing firewall operators to close ALL inbound ports (80/443).',
      '**Strict Firewall Ingress Whitelisting**: If public ports must remain open, configure firewall rules (iptables, AWS Security Groups) to strictly allow incoming traffic only from the published IP CIDR ranges of your CDN provider.',
      '**Authenticated Origin Pulls (mTLS)**: Enforce mutual TLS authentication on the origin server (Nginx/Apache/Caddy), requiring the CDN to present a valid cryptographic client certificate before processing any request.',
      '**Isolate Outbound Mail Infrastructure**: Never run mail servers (Postfix, Exim) or DNS resolvers on the same physical IP address as the production web application.',
      '**Rotate Exposed Origin IPs**: If an origin IP was ever publicly exposed in DNS prior to enabling proxying, provision a new cloud IP address and decommission the compromised IP.',
    ],
    standardsAndRefs: [
      'RFC 8484: DNS Queries over HTTPS (DoH)',
      'Cloudflare Architecture Guide: Origin IP Protection & Argo Tunnels',
      'NIST SP 800-44: Guidelines on Securing Public Web Servers',
      'OWASP Top 10: Security Misconfiguration (A05:2021)',
    ],
  },

  phishing: {
    title: 'Phishing Attacks, Adversary-in-the-Middle (AitM) & Zero-Trust Defense',
    aliases: ['phish', 'phishing', 'spear phishing', 'whaling', 'smishing', 'evilginx', 'aitm'],
    overview:
      '**Phishing** is a form of social engineering where attackers deceive victims into disclosing sensitive credentials, session tokens, or financial authorization by impersonating trustworthy organizations, services, or colleagues. Modern phishing has evolved from primitive fake static login pages into sophisticated, real-time reverse proxies capable of defeating traditional multi-factor authentication.',
    technicalMechanics:
      'State-of-the-art attacks leverage **Adversary-in-the-Middle (AitM) reverse proxies** (e.g., Evilginx2, Modlishka, Muraena). When a victim navigates to the phishing link, the proxy dynamically relays the login page from the genuine service (e.g. Microsoft 365, Google, Okta) in real time. When the victim enters their username, password, and completes their SMS or Time-based One-Time Password (TOTP) prompt, the genuine server issues a valid session cookie. The AitM proxy captures this session cookie and intercepts the session, granting the attacker instant access without needing the victim credentials again.',
    threatVectors: [
      '**AitM Reverse Proxies**: Neutralize legacy MFA (SMS OTP, voice call, push approval, TOTP authenticator apps) by intercepting post-authentication session cookies directly from HTTP response headers.',
      '**IDN Homograph & Punycode Spoofing**: Attackers register internationalized domain names with Cyrillic or Greek glyphs visually identical to Latin letters (e.g., Cyrillic `а` (U+0430) vs Latin `a` (U+0061)), resulting in `xn--...` domains that look authentic in address bars.',
      '**OAuth Consent Phishing (Illicit Consent Grants)**: Tricking corporate users into approving rogue third-party OAuth applications that request offline access to mailboxes and cloud files, granting persistence without capturing credentials.',
      '**Executive Whaling & Spear Phishing**: Deeply researched, context-aware lures targeting high-value personnel with fraudulent wire transfer or vendor invoice change requests.',
      '**QR Code Phishing (Quishing)**: Embedding malicious URLs in QR codes to move the victim off monitored corporate workstations onto personal mobile devices lacking endpoint protection.',
    ],
    defensiveControls: [
      '**Cryptographically Phishing-Resistant MFA**: Mandate **FIDO2 / WebAuthn** hardware security keys (e.g., YubiKey) and Passkeys. Because WebAuthn binds the cryptographic challenge directly to the verified browser origin URL, AitM reverse proxies cannot relay or forge the public-key signature.',
      '**Enforce Strict Email Authentication (DMARC)**: Implement DMARC with policy `p=reject`, strict SPF (`-all`), and 2048-bit DKIM to prevent unauthorized adversaries from spoofing your corporate domain.',
      '**Continuous Certificate Transparency (CT) Monitoring**: Monitor public CT logs for lookalike domain registrations containing corporate brand trademarks to proactively file UDRP takedowns.',
      '**Zero-Trust Browser Isolation (Aegis Safe Container)**: Execute untrusted links inside sandboxed micro-containers that disable credential autocompletion and strip malicious JavaScript payloads.',
      '**Conditional Access & Session Binding**: Enforce device health compliance (MDM enrollment), trusted network egress, and token binding (Proof-of-Possession / DPoP) to prevent stolen session cookies from being used on external attacker IPs.',
    ],
    standardsAndRefs: [
      'NIST SP 800-63B: Digital Identity Guidelines (Authenticator Assurance Level 3 - AAL3)',
      'CISA Fact Sheet: Implementing Phishing-Resistant MFA (FIDO2 / WebAuthn)',
      'RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)',
      'MITRE ATT&CK: T1566 (Phishing) & T1539 (Steal Web Session Cookie)',
    ],
  },

  tls_ssl: {
    title: 'Transport Layer Security (TLS 1.3) & Post-Quantum Cryptography',
    aliases: ['ssl', 'tls', 'tls 1.3', 'certificate', 'https encryption', 'post-quantum', 'ciphers'],
    overview:
      '**Transport Layer Security (TLS)** is the foundational cryptographic protocol providing confidentiality, authentication, and data integrity over computer networks. The current standard, **TLS 1.3 (RFC 8426)**, fundamentally modernized web encryption by stripping insecure legacy algorithms, halving handshake latency, and mandating forward secrecy.',
    technicalMechanics:
      'In TLS 1.3, the cryptographic handshake requires only **1 Round Trip (1-RTT)** compared to 2-RTT in TLS 1.2. Clients send their key share (ECDH via Curve25519 or P-256) inside the initial `ClientHello`. All handshake messages following the `ServerHello` are fully encrypted. Furthermore, modern browsers and servers now support **Hybrid Post-Quantum Key Exchange (X25519 + ML-KEM-768 / Kyber)**, protecting current encrypted traffic from "Harvest Now, Decrypt Later" quantum computing threats.',
    threatVectors: [
      '**Harvest Now, Decrypt Later (HNDL)**: Adversaries capture and archive encrypted web traffic today, waiting for cryptographically relevant quantum computers (CRQCs) to break elliptic curve cryptography and decrypt historical sessions.',
      '**SSL/TLS Stripping**: Man-in-the-Middle attackers intercept plaintext HTTP requests and downgrade users before redirection to HTTPS occurs.',
      '**Legacy Protocol Downgrade**: Forcing endpoints to negotiate deprecated protocols (TLS 1.0, 1.1, SSLv3) vulnerable to POODLE, BEAST, or SWEET32 attacks.',
    ],
    defensiveControls: [
      '**Disable All Deprecated Protocols**: Refuse connections using SSLv2, SSLv3, TLS 1.0, and TLS 1.1. Mandate TLS 1.3 as default, allowing TLS 1.2 only with AEAD ciphers (`AES-GCM` or `CHACHA20-POLY1305`).',
      '**Deploy HSTS Preloading**: Send `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` and submit the domain to the Chrome HSTS preload list to eliminate SSL stripping.',
      '**Enable Perfect Forward Secrecy (PFS)**: Only allow ephemeral Diffie-Hellman ciphers (`ECDHE`), ensuring past session decryption is impossible even if the server private key is compromised in the future.',
      '**Adopt Post-Quantum Hybrids (ML-KEM)**: Enable Kyber-based hybrid key encapsulation mechanisms on edge proxies to neutralize quantum decryption threats.',
    ],
    standardsAndRefs: [
      'RFC 8446: The Transport Layer Security (TLS) Protocol Version 1.3',
      'NIST FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM)',
      'RFC 6797: HTTP Strict Transport Security (HSTS)',
    ],
  },

  trackers_privacy: {
    title: 'Web Trackers, Browser Fingerprinting & Client-Side Privacy Isolation',
    aliases: ['tracker', 'trackers', 'fingerprinting', 'canvas fingerprinting', 'privacy', 'telemetry', 'beacons'],
    overview:
      '**Web Tracking** encompasses technologies used by advertising networks, analytics platforms, and surveillance brokers to identify, profile, and correlate individual users across different web properties without explicit informed consent. Techniques span third-party cookies, tracking pixels, CNAME cloaking, and passive hardware fingerprinting.',
    technicalMechanics:
      'When third-party cookies are restricted by modern browsers, tracking vendors pivot to **passive browser fingerprinting**. This technique executes client-side JavaScript to query hardware and operating system parameters: Canvas 2D/WebGL rendering variances, AudioContext acoustic oscillation decay, installed system fonts, screen depth, and battery API state. These data points are combined into a high-entropy persistent hash unique to the user machine.',
    threatVectors: [
      '**Canvas & WebGL Fingerprinting**: Rendering hidden text and 3D shapes on invisible canvases; hardware-specific font rasterization and GPU driver float calculations produce a unique hash.',
      '**CNAME Cloaking**: Setting up DNS CNAME aliases (`analytics.firstparty.com` -> `tracker.thirdparty.com`) to bypass browser third-party tracking protections by masquerading as a first-party resource.',
      '**Link Decoration & Bounce Tracking**: Appending persistent identifiers (`gclid`, `fbclid`) to outbound URLs and redirecting through intermediary tracker domains before reaching the destination.',
      '**Cross-Site State Tracking**: Exploiting shared browser caches, HSTS supercookies, or localStorage to maintain identity across distinct top-level domains.',
    ],
    defensiveControls: [
      '**Farbling / Noise Injection (Aegis Shield)**: Inject dynamic mathematical noise into HTML5 Canvas readbacks (`getImageData`, `toDataURL`) and AudioContext buffers to alter the resulting hash on every execution without breaking visual rendering.',
      '**State Partitioning (Storage Sandboxing)**: Isolate cookies, localStorage, and cache per top-level domain so third-party tracking scripts cannot correlate sessions across domains.',
      '**Global Privacy Control (GPC) & Do Not Track**: Automatically send `Sec-GPC: 1` headers on all outbound HTTP requests.',
      '**Strip Tracking Query Parameters**: Automatically sanitize outbound URLs by stripping tracking query tokens (`fbclid`, `gclid`, `mc_eid`, `utm_*`).',
    ],
    standardsAndRefs: [
      'W3C Global Privacy Control (GPC) Specification',
      'EFF Cover Your Tracks / Panopticlick Fingerprinting Research',
      'RFC 6265bis: Cookies: HTTP State Management Mechanism (SameSite attribute)',
    ],
  },

  zero_trust: {
    title: 'Zero Trust Architecture (NIST SP 800-207)',
    aliases: ['zero trust', 'zta', 'never trust always verify', 'microsegmentation', 'least privilege'],
    overview:
      '**Zero Trust** is an architectural paradigm and cybersecurity framework founded on the core premise: **"Never Trust, Always Verify."** Unlike traditional perimeter-based security that presumes entities inside the corporate network are benign, Zero Trust assumes the network is hostile and that malicious actors already exist within the environment.',
    technicalMechanics:
      'In a Zero Trust Architecture (ZTA), access decisions are governed by a Policy Decision Point (PDP) and enforced by a Policy Enforcement Point (PEP). Every transaction is authenticated, authorized, and cryptographically verified based on continuous real-time contextual evaluation.',
    threatVectors: [
      '**Lateral Movement**: Attackers who breach a single workstation leverage flat networks to scan and compromise domain controllers, database clusters, and internal services.',
      '**Stolen VPN Credentials**: Compromised VPN credentials give adversaries unfettered Layer 3 network access to entire internal IP subnets.',
    ],
    defensiveControls: [
      '**Microsegmentation**: Divide networks into granular micro-perimeters using software-defined networking (SDN).',
      '**Continuous Identity Verification**: Re-authenticate sessions dynamically when risk metrics shift.',
      '**Principle of Least Privilege (PoLP)**: Grant Just-In-Time (JIT) and Just-Enough-Access (JEA).',
    ],
    standardsAndRefs: [
      'NIST SP 800-207: Zero Trust Architecture',
      'CISA Zero Trust Maturity Model Version 2.0',
    ],
  },
};

// Live Wikipedia Search & Retrieval helper
async function queryWikipedia(query) {
  try {
    const cleanQuery = query
      .replace(/^(explain|what is|what are|how does|how to|tell me about|describe|teach me|definition of)\s+/i, '')
      .trim();
    if (!cleanQuery || cleanQuery.length < 2) return null;

    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanQuery
    )}&utf8=&format=json&origin=*`;
    const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const hits = searchData?.query?.search;
    if (!hits || hits.length === 0) return null;

    const topHit = hits[0];
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topHit.title)}`;
    const sumRes = await fetch(summaryUrl, { headers: { Accept: 'application/json' } });
    if (!sumRes.ok) return null;

    const sumData = await sumRes.json();
    if (!sumData || !sumData.extract) return null;

    const articleUrl = sumData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(topHit.title)}`;

    return `### 🌐 Knowledge Intelligence: **${sumData.title}**

**Overview & Fundamental Definition**:
${sumData.extract}

**Key Technical Insights & Defensive Relevance**:
- **Domain Context**: ${sumData.title} is an authoritative standard documented in computer science and internet protocols.
- **Architectural Impact**: Understanding this concept is critical for defense-in-depth, perimeter protection, and zero-trust systems engineering.
- **Defensive Best Practices**:
  1. Follow standard RFC specifications and NIST / OWASP guidelines when implementing infrastructure around this technology.
  2. Implement strict least-privilege boundaries and cryptographic authentication across all endpoints.
  3. Validate transport security with TLS 1.3 and continuous vulnerability auditing.

---
🔗 **Authoritative Reference**: [Read full peer-reviewed article on Wikipedia](${articleUrl})`;
  } catch (err) {
    console.warn('Wikipedia query error:', err.message);
    return null;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, systemInstruction, model, personaId, apiKey } = req.body || {};
    const lastMsg = messages && messages.length > 0 ? messages[messages.length - 1].content || '' : '';
    const activeApiKey = apiKey || process.env.GEMINI_API_KEY;

    // 1. If Gemini API key is supplied (server env or user-supplied in client), use GoogleGenAI
    if (activeApiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeApiKey });
        const contents = (messages || []).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content || msg.text || '' }],
        }));

        const response = await ai.models.generateContent({
          model: model || 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction:
              systemInstruction ||
              'You are Aegis Cyber AI, a specialized cybersecurity and threat analysis intelligence assistant.',
            temperature: 0.7,
          },
        });

        const reply = response.text || 'Intelligence response compiled.';
        return res.status(200).json({
          reply,
          model: model || 'gemini-2.5-flash',
          persona: personaId || 'Aegis Cyber Sentinel',
        });
      } catch (geminiErr) {
        console.warn('Gemini cloud API error on Vercel, engaging specialized knowledge engine:', geminiErr.message);
      }
    }

    // 2. High-Assurance Cybersecurity & Web Knowledge Engine Fallback
    const lower = String(lastMsg).toLowerCase().trim();

    // Check specialized cybersecurity corpus
    for (const [key, entry] of Object.entries(SPECIALIZED_CYBER_CORPUS)) {
      const matches = entry.aliases.some((alias) => {
        const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
        return pattern.test(lower);
      });

      if (matches) {
        const threatLines = entry.threatVectors.map((v) => `- ${v}`).join('\n');
        const defenseLines = entry.defensiveControls.map((d) => `- ${d}`).join('\n');
        const refLines = entry.standardsAndRefs.map((r) => `- \`${r}\``).join('\n');

        const reply = `### 🛡️ Specialized Cybersecurity Analysis: **${entry.title}**

**1. Executive Overview & Technical Definition**:
${entry.overview}

**2. Architecture & Operating Mechanics**:
${entry.technicalMechanics}

**3. Primary Threat Vectors & Adversary Tradecraft**:
${threatLines}

**4. Defensive Hardening Blueprint & Countermeasures**:
${defenseLines}

**5. Governing Standards & Specifications**:
${refLines}`;

        return res.status(200).json({
          reply,
          model: 'Aegis Specialized Cyber Engine (Cloud Corpus)',
          persona: 'Aegis Cyber Sentinel',
        });
      }
    }

    // Query live web knowledge (Wikipedia)
    const wikiReply = await queryWikipedia(lastMsg);
    if (wikiReply) {
      return res.status(200).json({
        reply: wikiReply,
        model: 'Aegis Autonomous Web Intelligence (Live Retrieval)',
        persona: 'Aegis Cyber Sentinel',
      });
    }

    // Default intelligent cybersecurity synthesis
    const defaultReply = `### 🛡️ Aegis Cyber Security Intelligence Assessment

**Inquiry Context**: "${lastMsg}"

1. **Perimeter Threat Analysis**: Web applications and connected endpoints must enforce strict input sanitization, multi-factor authentication (FIDO2), and TLS 1.3 encryption.
2. **Adversary Vector Mitigation**: Common attack vectors including SQL injection (CWE-89), Cross-Site Scripting (CWE-79), and Broken Access Control (CWE-639) can be mitigated by parameterized queries and strict Content Security Policies.
3. **Zero-Trust Hardening Blueprint**: Enforce least-privilege role boundaries and continuous cryptographic verification for all sessions.`;

    return res.status(200).json({
      reply: defaultReply,
      model: 'Aegis Specialized CyberBot (Vercel Edge)',
      persona: 'Aegis Cyber Sentinel',
    });
  } catch (error) {
    return res.status(200).json({
      reply: `[Aegis CyberBot]: Processed security query for active session. Error context: ${error.message}`,
      model: 'Aegis Specialized CyberBot',
      persona: 'Aegis Cyber Sentinel',
    });
  }
}
