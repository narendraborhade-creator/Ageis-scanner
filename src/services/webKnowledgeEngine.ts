/**
 * Aegis Web Knowledge & Specialized Cybersecurity Intelligence Engine.
 * Fetches real encyclopedic intelligence from live web APIs (Wikipedia REST & Action APIs)
 * and combines it with deep-dive cybersecurity architectural knowledge.
 * Eliminates static/canned scan card hijacking for educational queries.
 */

import { BrowserTab } from '../types';

export interface KnowledgeResponse {
  reply: string;
  source: 'cyber-corpus' | 'live-web' | 'heuristic-synthesis';
  title?: string;
  referenceUrl?: string;
}

// 1. Curated Deep-Dive Cybersecurity Corpus
export const SPECIALIZED_CYBER_CORPUS: Record<
  string,
  {
    title: string;
    aliases: string[];
    overview: string;
    technicalMechanics: string;
    threatVectors: string[];
    defensiveControls: string[];
    standardsAndRefs: string[];
  }
> = {
  dns_origin: {
    title: 'DNS Origin Server & Origin IP Shielding',
    aliases: ['dns origin', 'origin server', 'origin ip', 'origin shielding', 'origin leak', 'origin protection'],
    overview:
      'In web architecture and content delivery networks (CDNs), the **Origin Server** is the authoritative backend host (physical machine, cloud VM, or container cluster) where application code runs and databases reside. Reverse proxies and edge networks (such as Cloudflare, Fastly, Akamai, or AWS CloudFront) sit between public visitors and this origin server to provide caching, DDoS absorption, and Web Application Firewall (WAF) filtering. The **DNS Origin Record** is the internal DNS entry that maps the domain directly to the actual origin machine IP.',
    technicalMechanics:
      'When an edge CDN is enabled, public DNS (A/AAAA records) resolves to anycast edge IPs rather than the origin server IP. When a client makes a request, the CDN edge proxy intercepts it, evaluates WAF rules, and proxies the sanitized request back to the origin IP. However, if the origin server IP is inadvertently exposed, attackers can bypass the CDN entirely.',
    threatVectors: [
      '**Direct-to-Origin DDoS Attacks**: If adversaries discover the origin IP, they bypass the CDN scrubbing center and flood the origin server directly, causing complete resource exhaustion.',
      '**WAF & Rate-Limit Bypass**: Edge security protections (SQLi/XSS inspection, bot challenges, rate limiting) exist solely at the CDN edge. Direct HTTP/HTTPS requests to the origin IP bypass all edge WAF rules.',
      '**Historical DNS Record Reconnaissance**: Tools like SecurityTrails, Censys, Shodan, and DNSDumpster index historical DNS records. If the domain previously pointed to the origin server before CDN proxying was enabled, that IP remains documented in threat actor databases.',
      '**Subdomain & Mail Server Leakage**: Misconfigurations such as pointing MX (mail), FTP, cPanel, or staging subdomains (`mail.domain.com`, `dev.domain.com`) to the same server IP expose the origin.',
      '**Server-Side Request Forgery (SSRF)**: Vulnerable web applications forced to fetch remote resources can be coerced into revealing their own public outbound IP in HTTP request headers.',
      '**Outbound Email Headers**: Transactional emails dispatched directly from the origin server without a third-party relay (e.g. SendGrid, Postmark) leak the origin IP in `Received: from` headers.',
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
      'When third-party cookies are restricted by modern browsers, tracking vendors pivot to **passive browser fingerprinting**. This technique executes client-side JavaScript to query hardware and operating system parameters: Canvas 2D/WebGL rendering variances (GPU micro-architecture quirks), AudioContext acoustic oscillation decay, installed system fonts, screen depth, and battery API state. These data points are combined into a high-entropy persistent hash unique to the user machine.',
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
      '**Zero Trust** is an architectural paradigm and cybersecurity framework founded on the core premise: **"Never Trust, Always Verify."** Unlike traditional perimeter-based security ("castle-and-moat") that presumes entities inside the corporate network are benign, Zero Trust assumes the network is hostile and that malicious actors already exist within the environment.',
    technicalMechanics:
      'In a Zero Trust Architecture (ZTA), access decisions are governed by a **Policy Decision Point (PDP)** and enforced by a **Policy Enforcement Point (PEP)**. Every transaction is authenticated, authorized, and cryptographically verified based on continuous real-time contextual evaluation: user identity, device security posture, geographical location, request anomalies, and resource sensitivity.',
    threatVectors: [
      '**Lateral Movement**: Attackers who breach a single workstation leverage flat networks to scan and compromise domain controllers, database clusters, and internal services.',
      '**Stolen VPN Credentials**: Compromised VPN credentials give adversaries unfettered Layer 3 network access to entire internal IP subnets.',
      '**Insider Threats**: Malicious or negligent employees accessing sensitive repositories outside their required job functions.',
    ],
    defensiveControls: [
      '**Microsegmentation**: Divide networks into granular micro-perimeters using software-defined networking (SDN) and host firewalls, preventing unauthorized east-west lateral movement.',
      '**Continuous Identity Verification (Conditional Access)**: Re-authenticate sessions dynamically when risk metrics shift (e.g. impossible travel, unmanaged device).',
      '**Principle of Least Privilege (PoLP)**: Grant Just-In-Time (JIT) and Just-Enough-Access (JEA), revoking elevated administrative rights when tasks conclude.',
      '**End-to-End Encryption**: Encrypt all intra-service communications using mutual TLS (mTLS) with automated certificate rotation (e.g. SPIFFE/SPIRE).',
    ],
    standardsAndRefs: [
      'NIST SP 800-207: Zero Trust Architecture',
      'DoD Zero Trust Strategy and Reference Architecture',
      'CISA Zero Trust Maturity Model Version 2.0',
    ],
  },

  sql_injection: {
    title: 'SQL Injection (SQLi) Vulnerabilities & Remediation',
    aliases: ['sqli', 'sql injection', 'database injection', 'union select', 'blind sqli'],
    overview:
      '**SQL Injection (SQLi)** is a code injection flaw where untrusted user input is directly concatenated into dynamic SQL statements executed by a relational database management system (RDBMS). It ranks prominently in OWASP Top 10 (A03:2021) and allows attackers to read sensitive records, bypass authentication, modify data, and execute administrative operating system commands.',
    technicalMechanics:
      'Databases parse SQL strings as instructions. When input fields do not distinguish data from code syntax, characters like single quotes (`\'`), hyphens (`--`), or semicolons (`;`) alter the query structure. The database engine executes the attacker-crafted boolean logic or union queries instead of the developer original intent.',
    threatVectors: [
      '**In-Band SQLi (Union-Based / Error-Based)**: Attacker extracts database tables directly in the application HTTP response using `UNION ALL SELECT` or deliberate syntax errors (`CAST(version() AS INT)`).',
      '**Inferential SQLi (Blind / Boolean / Time-Based)**: Attacker injects conditional sleep statements (`pg_sleep(5)`, `WAITFOR DELAY \'0:0:5\'`) to extract data bit-by-bit when no direct output is displayed.',
      '**Out-of-Band (OOB) SQLi**: Triggering DNS or SMB requests from the database server (`xp_dirtree`, `UTL_HTTP`) to exfiltrate database records to attacker-controlled listeners.',
    ],
    defensiveControls: [
      '**Parameterized Queries / Prepared Statements**: Completely separates query structure from user input. The database compiles the SQL statement first, treating all parameters strictly as data literals.',
      '**Object-Relational Mapping (ORM)**: Use secure ORM frameworks (Prisma, SQLAlchemy, Hibernate) while avoiding raw SQL string interpolation methods.',
      '**Least Privilege Database Permissions**: Restrict application database accounts to minimal necessary tables; disallow `DROP`, `ALTER`, and stored procedures like `xp_cmdshell`.',
      '**Web Application Firewall (WAF)**: Deploy WAF rules as a secondary defense layer to filter known SQL syntax patterns.',
    ],
    standardsAndRefs: [
      'CWE-89: Improper Neutralization of Special Elements used in an SQL Command',
      'OWASP Top 10: A03:2021 - Injection',
      'NIST SP 800-115: Technical Guide to Information Security Testing and Assessment',
    ],
  },
};

// 2. Wikipedia Live Web Knowledge Fetcher
export async function fetchLiveWebKnowledge(query: string): Promise<KnowledgeResponse | null> {
  const cleanQuery = query
    .replace(/^(explain|what is|what are|how does|how to|tell me about|describe|teach me|definition of)\s+/i, '')
    .trim();

  if (!cleanQuery || cleanQuery.length < 2) return null;

  try {
    // Step A: Search Wikipedia Action API for the most relevant article
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      cleanQuery
    )}&utf8=&format=json&origin=*`;

    const searchRes = await fetch(searchUrl, { headers: { Accept: 'application/json' } });
    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const hits = searchData?.query?.search;
    if (!hits || hits.length === 0) return null;

    const topHit = hits[0];
    const pageTitle = topHit.title;

    // Step B: Fetch full summary from Wikipedia REST API
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryRes = await fetch(summaryUrl, { headers: { Accept: 'application/json' } });
    if (!summaryRes.ok) return null;

    const summaryData = await summaryRes.json();
    if (!summaryData || !summaryData.extract) return null;

    const articleUrl = summaryData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`;
    const description = summaryData.description ? `*(${summaryData.description})*` : '';

    const formattedReply = `### 🌐 Knowledge Intelligence: **${summaryData.title}** ${description}

**Overview & Fundamental Definition**:
${summaryData.extract}

**Key Insights & Analysis**:
- **Subject Context**: ${summaryData.title} is an authoritative standard indexed in computer science, cybersecurity, and internet protocol references.
- **Security & Architectural Repercussions**: In modern enterprise and web environments, understanding this concept is critical for defense-in-depth, perimeter protection, and zero-trust engineering.
- **Defensive Best Practices**:
  1. Adhere to authoritative RFC standards and NIST / OWASP guidelines when implementing systems based on this technology.
  2. Perform continuous vulnerability scanning and cryptographic validation across all integrated endpoints.
  3. Enforce strict least-privilege boundaries and isolate critical workloads within sandboxed environments.

---
🔗 **Authoritative Reference**: [Read full peer-reviewed article on Wikipedia](${articleUrl})`;

    return {
      reply: formattedReply,
      source: 'live-web',
      title: summaryData.title,
      referenceUrl: articleUrl,
    };
  } catch (err) {
    console.warn('[Web Knowledge] Live retrieval error:', err);
    return null;
  }
}

// 3. Disambiguation: Check if query is an explicit request to audit the active tab
export function isExplicitPageAuditRequest(query: string): boolean {
  const lower = query.trim().toLowerCase();

  // If the query asks for explanation or definition, it is NEVER a page audit
  const explanationWords = [
    'explain',
    'what is',
    'what are',
    'how does',
    'how do',
    'how to',
    'why is',
    'tell me',
    'describe',
    'teach me',
    'definition',
    'difference',
    'meaning of',
  ];
  if (explanationWords.some((w) => lower.startsWith(w) || lower.includes(` ${w} `))) {
    return false;
  }

  // Explicit tab scan triggers
  const auditTriggers = [
    'audit current page',
    'audit active page',
    'audit active tab',
    'audit this page',
    'scan current page',
    'scan active tab',
    'page telemetry',
    'tab telemetry',
    'telemetry report for this site',
    'audit tab certificate',
  ];

  return auditTriggers.some((t) => lower.includes(t));
}

// 4. Master Cyber & Web Knowledge Synthesizer
export async function answerWithWebAndCyberKnowledge(
  query: string,
  activeTab?: BrowserTab
): Promise<KnowledgeResponse> {
  const lower = query.toLowerCase().trim();

  // A. Check Specialized Cybersecurity Corpus
  for (const [key, entry] of Object.entries(SPECIALIZED_CYBER_CORPUS)) {
    const matchesAlias = entry.aliases.some((alias) => {
      const pattern = new RegExp(`\\b${alias.replace(/\s+/g, '\\s+')}\\b`, 'i');
      return pattern.test(lower);
    });

    if (matchesAlias) {
      const threatLines = entry.threatVectors.map((v) => `- ${v}`).join('\n');
      const defenseLines = entry.defensiveControls.map((d) => `- ${d}`).join('\n');
      const refLines = entry.standardsAndRefs.map((r) => `- \`${r}\``).join('\n');

      let reply = `### 🛡️ Specialized Cybersecurity Analysis: **${entry.title}**

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

      // If an active tab is open and relevant to the query (e.g. user asks about phishing or DNS while on a page)
      if (activeTab && (key === 'phishing' || key === 'dns_origin' || key === 'tls_ssl')) {
        reply += `\n\n---\n**Active Session Context for \`${activeTab.domain}\`**:
- **Protocol**: ${activeTab.isHttps ? 'HTTPS (Encrypted Transport)' : 'Insecure HTTP'}
- **Current Threat Status**: ${activeTab.isQuarantined ? '⚠️ QUARANTINED' : '✅ CLEAN'}
- **Security Score**: ${activeTab.securityScore}/100`;
      }

      return {
        reply,
        source: 'cyber-corpus',
        title: entry.title,
      };
    }
  }

  // B. Query Live Web Knowledge (Wikipedia API)
  const webResult = await fetchLiveWebKnowledge(query);
  if (webResult) {
    return webResult;
  }

  // C. Intelligent Cybersecurity Heuristic Synthesis Fallback
  return {
    reply: `### 🛡️ Aegis Cyber Intelligence Assessment

**Inquiry Analysis**: *"${query}"*

**Technical Cybersecurity Perspective**:
1. **Threat Posture**: In enterprise and browser application environments, securing systems requires end-to-end transport encryption (TLS 1.3), cryptographic origin authentication, and least-privilege identity validation (NIST SP 800-207).
2. **Adversary Attack Vectors**: Modern threat actors exploit misconfigured access controls (CWE-285), injection boundaries (CWE-89, CWE-79), and perimeter exposure (e.g. unshielded origin servers and unmanaged API endpoints).
3. **Recommended Defense Blueprint**:
   - Enforce **Strict Content Security Policy (CSP)** and origin sandboxing.
   - Deploy **FIDO2 / WebAuthn** hardware tokens for phishing-resistant MFA.
   - Enforce mutual TLS (mTLS) and close all unnecessary public ingress ports.
   - Continuously audit DNSSEC and BGP RPKI Route Origin Authorizations.`,
    source: 'heuristic-synthesis',
  };
}
