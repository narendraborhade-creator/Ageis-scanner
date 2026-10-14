"""
Specialized Cybersecurity Natural Language & Reasoning Engine.
Synthesizes knowledge base facts, attack signatures, mitigation frameworks,
and context-aware security intelligence.
"""

from typing import List, Dict, Any, Optional
import re
from .knowledge_base import CYBER_TERMS, find_matching_terms, get_all_terms_summary
from .payload_analyzer import inspect_cyber_payload

PERSONAS = {
    "cyber-sentinel": {
        "title": "Aegis Cyber Sentinel",
        "stance": "Executive Defense & Threat Intelligence Specialist",
        "tone": "Vigilant, authoritative, and focused on proactive perimeter hardening and threat mitigation."
    },
    "dns-auditor": {
        "title": "DNS & Privacy Auditor",
        "stance": "Network Protocol & Cryptographic Integrity Specialist",
        "tone": "Specialized in DNSSEC, DoH, BGP, TLS 1.3, CSP, and transport-layer defense."
    },
    "bug-remediator": {
        "title": "Vulnerability & Bug Remediation Specialist",
        "stance": "Application Security (AppSec) & Code Auditor",
        "tone": "Focused on CWE root causes, secure code patterns, and OWASP Top 10 remediation."
    },
    "red-team": {
        "title": "Red Team & Exploit Analyst",
        "stance": "Offensive Security & TTP Dissector",
        "tone": "Explains offensive mechanics, adversary tradecraft, bypass vectors, and how defenders can anticipate attacks."
    }
}

COMMON_CYBER_QUESTIONS = [
    {
        "patterns": [r"top\s+(web\s+)?vulnerabilit(ies|y)", r"owasp\s+top\s+10"],
        "topic": "owasp_top_10",
        "answer": """### OWASP Top 10 Web Application Security Risks

1. **A01:2021 – Broken Access Control**: Failures in enforcing permissions (e.g., IDOR, path traversal, unauthorized privilege escalation).
2. **A02:2021 – Cryptographic Failures**: Exposure of sensitive data due to weak or missing encryption (e.g. unencrypted transit, hardcoded keys, legacy MD5/SHA-1).
3. **A03:2021 – Injection**: SQL, NoSQL, OS Command, and LDAP injection flaws where untrusted input executes arbitrary commands.
4. **A04:2021 – Insecure Design**: Flaws in architectural threat modeling before code is even written.
5. **A05:2021 – Security Misconfiguration**: Default passwords, unneeded open ports, overly permissive CORS headers, and verbose stack trace error pages.
6. **A06:2021 – Vulnerable and Outdated Components**: Unpatched third-party packages, libraries, or frameworks (e.g., Log4Shell).
7. **A07:2021 – Identification and Authentication Failures**: Weak session management, lack of brute force protection, or absence of MFA.
8. **A08:2021 – Software and Data Integrity Failures**: Insecure CI/CD pipelines, untrusted auto-updates, or unverified deserialization.
9. **A09:2021 – Security Logging and Monitoring Failures**: Inadequate auditing allowing attackers extended dwell time undetected.
10. **A10:2021 – Server-Side Request Forgery (SSRF)**: Web application fetching remote resources without validating destination IP addresses."""
    },
    {
        "patterns": [r"how\s+to\s+secure\s+a\s+website", r"web(site)?\s+hardening\s+checklist", r"secure\s+my\s+website"],
        "topic": "web_hardening",
        "answer": """### Essential Website & Web App Hardening Blueprint

1. **Enforce HTTPS & Modern TLS Only**:
   - Mandate TLS 1.3 (or TLS 1.2 minimum). Disable SSLv3, TLS 1.0, and 1.1.
   - Deploy **HSTS**: `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.

2. **Deploy Defensive HTTP Security Headers**:
   - `Content-Security-Policy (CSP)`: Disallow unauthorized script sources and inline evaluation.
   - `X-Frame-Options: DENY` (or CSP `frame-ancestors 'none'`) to stop Clickjacking.
   - `X-Content-Type-Options: nosniff` to eliminate MIME-type sniffing exploits.
   - `Referrer-Policy: strict-origin-when-cross-origin`.

3. **Secure Cookie Configuration**:
   - Always flag sensitive session cookies with `Secure; HttpOnly; SameSite=Strict`.

4. **Zero-Trust Input Sanitization & Parameterization**:
   - Use Parameterized Queries (ORMs / Prepared Statements) for all database transactions.
   - Context-aware encode all dynamic user data before rendering into the DOM.

5. **API & Endpoint Armor**:
   - Enforce rate limiting (e.g., token bucket via Redis / Nginx).
   - Require modern authentication: OAuth2 with PKCE and hardware-backed MFA (FIDO2/WebAuthn)."""
    },
    {
        "patterns": [r"what\s+is\s+zero\s+trust", r"zero\s+trust\s+architecture", r"explain\s+zero\s+trust"],
        "topic": "zero_trust",
        "answer": """### Zero Trust Architecture (ZTA) - NIST SP 800-207

Zero Trust is a strategic cybersecurity framework based on the axiom: **"Never Trust, Always Verify."** It assumes that threats exist both outside and inside the traditional network perimeter.

#### The Three Core Pillars:
1. **Verify Explicitly**: Authenticate and authorize every access request based on all available data points (identity, location, device health, data classification, and behavioral anomalies).
2. **Use Least Privilege Access**: Limit user access with Just-In-Time (JIT) and Just-Enough-Access (JEA) models, risk-based adaptive policies, and data protection.
3. **Assume Breach**: Minimize the blast radius by segmenting networks into micro-perimeters, encrypting all end-to-end communication, and employing automated threat detection.

#### Implementation Tactics:
- Identity as the primary perimeter (MFA + conditional access).
- Micro-segmentation of application workloads (Software-Defined Perimeters).
- Continuous posture assessment before granting resource access."""
    }
]

def generate_cyber_response(
    messages: List[Dict[str, str]],
    persona_id: str = "cyber-sentinel",
    system_instruction: Optional[str] = None
) -> Dict[str, Any]:
    """Analyze the user's latest message and generate an expert cybersecurity response."""
    last_user_msg = ""
    for msg in reversed(messages):
        if msg.get("role") == "user":
            last_user_msg = msg.get("content", "").strip()
            break

    if not last_user_msg:
        return {
            "reply": "Please submit a cybersecurity inquiry, suspicious payload, or concept to analyze.",
            "model": "aegis-cyber-engine-v1",
            "matched_terms": [],
            "threat_analysis": None
        }

    # 1. Check if the user is asking to analyze code or a payload
    has_payload_tokens = any(
        token in last_user_msg.lower()
        for token in ["<script", "select", "union", "../", "eval(", "alert(", "cmd", "exec", "powershell", "whoami", "curl", "base64", "http://", "https://"]
    ) or len(last_user_msg) > 60 and any(c in last_user_msg for c in ["'", '"', ';', '|', '<', '>', '{', '}'])

    payload_analysis = None
    if has_payload_tokens:
        payload_analysis = inspect_cyber_payload(last_user_msg)

    # 2. Check for matching cybersecurity terms
    matched_terms = find_matching_terms(last_user_msg)

    # 3. Check for matching common questions
    matched_canned = None
    for item in COMMON_CYBER_QUESTIONS:
        for pattern in item["patterns"]:
            if re.search(pattern, last_user_msg, re.IGNORECASE):
                matched_canned = item["answer"]
                break
        if matched_canned:
            break

    persona = PERSONAS.get(persona_id, PERSONAS["cyber-sentinel"])

    # 4. Construct comprehensive response
    response_sections = []

    # If payload had critical or high threats detected:
    if payload_analysis and payload_analysis["score"] >= 30:
        response_sections.append(
            f"### 🛡️ Aegis Cyber Engine: Threat Analysis Report\n"
            f"- **Threat Severity**: `{payload_analysis['severity']}` (Risk Score: **{payload_analysis['score']}/100**)\n"
            f"- **Shannon Entropy**: `{payload_analysis['entropy']} bits/sym`\n"
            f"- **Verdict**: {payload_analysis['verdict']}\n"
        )
        if payload_analysis["threats"]:
            response_sections.append("**Detected Attack Signatures:**")
            for t in payload_analysis["threats"]:
                response_sections.append(f"- **{t['vector']}** (`{t['cwe']}`): {t['description']}")
            response_sections.append("")

    # If matching common canned questions:
    if matched_canned:
        response_sections.append(matched_canned)

    # If matching specific indexed terms:
    elif matched_terms:
        for term in matched_terms[:3]:  # Top 3 terms
            lines = [f"### 🔍 {term['title']}"]
            if "acronym" in term:
                lines.append(f"**Acronym / Standard**: `{term['acronym']}` | Category: *{term['category']}*")
            if "cwe" in term:
                lines.append(f"**Classification**: `{term['cwe']}`" + (f" ({term.get('owasp')})" if 'owasp' in term else ""))
            if "rfc" in term:
                lines.append(f"**Internet Standard**: `{term['rfc']}`")
            
            lines.append(f"\n**Core Definition**:\n{term['definition']}\n")

            if "mechanics" in term:
                lines.append(f"**Technical Mechanics**:\n{term['mechanics']}\n")

            if "prevention" in term:
                lines.append("**Defensive Hardening & Prevention Measures**:")
                for prev in term["prevention"]:
                    lines.append(f"- {prev}")
                lines.append("")

            if "defense" in term:
                lines.append("**Defensive Measures**:")
                for d in term["defense"]:
                    lines.append(f"- {d}")
                lines.append("")

            if "mitre_technique" in term:
                lines.append(f"**MITRE ATT&CK Mapping**: `{term['mitre_technique']}`")

            if "example_payload" in term:
                lines.append(f"\n*Illustrative Signature*: `{term['example_payload']}`")

            response_sections.append("\n".join(lines))

    # If general cybersecurity query not directly matching term:
    if not matched_canned and not matched_terms:
        # Provide general security assessment based on keywords
        response_sections.append(
            f"### 🛡️ {persona['title']} Assessment\n\n"
            f"You asked: *\"{last_user_msg}\"*\n\n"
            f"As the **{persona['stance']}**, here is the cybersecurity analysis and actionable guidance:\n\n"
            f"1. **Threat Context**: In enterprise and browser environments, this interaction involves perimeter defense, transport-level integrity, and least-privilege identity validation.\n"
            f"2. **Adversary Perspective**: Attackers frequently leverage social engineering, misconfigured authorization controls (CWE-285), and automated reconnaissance to pinpoint vulnerable endpoints.\n"
            f"3. **Defensive Best Practices**:\n"
            f"   - Enforce cryptographic validation (DNSSEC, TLS 1.3 with AEAD ciphers).\n"
            f"   - Deploy strict Content Security Policies (CSP) and origin verification.\n"
            f"   - Monitor telemetry logs via SIEM/EDR for anomalous baseline deviations.\n"
            f"   - Implement multi-factor authentication (MFA) utilizing FIDO2 / WebAuthn tokens."
        )

    # Append recommendations and suggested exploration
    all_known_keys = [t["title"] for t in CYBER_TERMS.values()][:6]
    suggestions = ", ".join([f"`{k}`" for k in all_known_keys])
    response_sections.append(
        f"\n---\n*💡 Aegis Local Cyber Engine indexed with {len(CYBER_TERMS)} cybersecurity domains. Try asking about:* {suggestions}, or paste a code snippet to analyze."
    )

    full_reply = "\n\n".join(response_sections)

    return {
        "reply": full_reply,
        "model": "aegis-cyber-python-engine-v1",
        "persona": persona["title"],
        "matched_terms": [t.get("title") for t in matched_terms],
        "threat_analysis": payload_analysis
    }
