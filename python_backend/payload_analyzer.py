"""
Payload & Cyber Threat Analyzer Engine for Aegis Safe Browser.
Provides Shannon entropy calculation, encoding/obfuscation deconstruction (Base64, Hex, URL),
and heuristic signature detection for SQLi, XSS, RCE, Path Traversal, and credential leakage.
"""

import re
import math
import base64
import urllib.parse
from typing import Dict, Any, List

def calculate_shannon_entropy(data: str) -> float:
    """Calculate Shannon entropy of a string (bits per symbol, 0.0 to 8.0)."""
    if not data:
        return 0.0
    entropy = 0.0
    length = len(data)
    frequencies = {}
    for char in data:
        frequencies[char] = frequencies.get(char, 0) + 1
    for count in frequencies.values():
        p_x = count / length
        entropy -= p_x * math.log2(p_x)
    return round(entropy, 3)

def attempt_deobfuscation(raw: str) -> Dict[str, Any]:
    """Attempt decoding URL-encoding, Base64, and Hex representations."""
    decoded_layers = []
    current = raw.strip()
    
    # 1. URL Decode if contains %
    if '%' in current:
        try:
            url_decoded = urllib.parse.unquote(current)
            if url_decoded != current:
                decoded_layers.append({"type": "URL-Decoded", "content": url_decoded})
                current = url_decoded
        except Exception:
            pass

    # 2. Base64 Detection & Decode (min 8 chars, alphanumeric + /+=)
    b64_pattern = re.compile(r'^[A-Za-z0-9+/]{8,}={0,2}$')
    if b64_pattern.match(current.replace('\n', '').replace(' ', '')):
        try:
            b64_bytes = base64.b64decode(current.encode('ascii'), validate=True)
            # Try to decode to utf-8 text
            b64_text = b64_bytes.decode('utf-8', errors='ignore')
            if len(b64_text) > 0 and any(c.isprintable() for c in b64_text):
                decoded_layers.append({"type": "Base64-Decoded", "content": b64_text})
                current = b64_text
        except Exception:
            pass

    # 3. Hex String Detection (e.g., 0x... or continuous hex bytes)
    hex_clean = re.sub(r'^(0x|\\x)', '', current).replace(' ', '').replace('\\x', '')
    if len(hex_clean) >= 6 and len(hex_clean) % 2 == 0 and all(c in '0123456789abcdefABCDEF' for c in hex_clean):
        try:
            hex_bytes = bytes.fromhex(hex_clean)
            hex_text = hex_bytes.decode('utf-8', errors='ignore')
            if len(hex_text) > 0 and any(c.isprintable() for c in hex_text):
                decoded_layers.append({"type": "Hex-Decoded", "content": hex_text})
                current = hex_text
        except Exception:
            pass

    return {
        "final_normalized": current,
        "layers": decoded_layers
    }

def inspect_cyber_payload(payload: str) -> Dict[str, Any]:
    """Exhaustively inspect an input payload for cyber threats and exploit signatures."""
    if not payload:
        return {
            "score": 0,
            "severity": "CLEAN",
            "threats_found": [],
            "entropy": 0.0,
            "verdict": "Empty payload provided."
        }

    threats = []
    score = 0

    entropy = calculate_shannon_entropy(payload)
    deobfuscation = attempt_deobfuscation(payload)
    scan_target = f"{payload} {deobfuscation['final_normalized']}".lower()

    # --- 1. SQL Injection Signatures ---
    sqli_patterns = [
        (r'(\bunion\b.*\bselect\b)', "SQLi: Union-Based Extraction", 40, "CWE-89"),
        (r'(\bor\b\s+[\'\"]?1[\'\"]?\s*=\s*[\'\"]?1)', "SQLi: Tautology Authentication Bypass (' OR 1=1)", 35, "CWE-89"),
        (r'(\bwaitfor\b\s+\bdelay\b|\bsleep\s*\(\s*\d+\s*\)|\bbenchmark\s*\()', "SQLi: Time-based Blind Extraction", 35, "CWE-89"),
        (r'(\bexec\b|\bexecute\b)\s*\(?\s*xp_cmdshell', "SQLi: xp_cmdshell Remote Shell Trigger", 45, "CWE-89"),
        (r'(--|#|\/\*).*?$', "SQLi: Query Comment Truncation", 15, "CWE-89")
    ]
    for pattern, desc, pts, cwe in sqli_patterns:
        if re.search(pattern, scan_target, re.IGNORECASE | re.MULTILINE):
            threats.append({"vector": "SQL Injection", "description": desc, "weight": pts, "cwe": cwe})
            score += pts

    # --- 2. Cross-Site Scripting (XSS) Signatures ---
    xss_patterns = [
        (r'<\s*script\b[^>]*>', "XSS: Explicit HTML <script> injection tag", 35, "CWE-79"),
        (r'javascript\s*:', "XSS: Inline javascript: pseudo-protocol handler", 30, "CWE-79"),
        (r'on(error|load|click|mouseover|focus|blur|submit)\s*=', "XSS: Dynamic DOM event-handler execution", 30, "CWE-79"),
        (r'document\.(cookie|location|domain)', "XSS: Sensitive DOM property access or exfiltration", 25, "CWE-79"),
        (r'(\balert\s*\(|\beval\s*\(|\bprompt\s*\(|\bconfirm\s*\()', "XSS: Interactive JavaScript execution sink", 20, "CWE-79")
    ]
    for pattern, desc, pts, cwe in xss_patterns:
        if re.search(pattern, scan_target, re.IGNORECASE):
            threats.append({"vector": "Cross-Site Scripting (XSS)", "description": desc, "weight": pts, "cwe": cwe})
            score += pts

    # --- 3. Command Injection & Shell Spawning ---
    rce_patterns = [
        (r'(\bbash\s+-i|\bsh\s+-i|/dev/tcp/\d+\.\d+\.\d+\.\d+/\d+)', "RCE: Reverse TCP Shell Socket", 50, "CWE-78"),
        (r'(powershell(\.exe)?\s+(-e|-enc|-encodedcommand))', "RCE: Obfuscated Base64 PowerShell execution", 45, "CWE-78"),
        (r'(\bcurl\b|\bwget\b)\s+.*\|\s*(bash|sh)', "RCE: Remote download-and-execute pipeline (curl | sh)", 45, "CWE-78"),
        (r'(nc(\.exe)?\s+-e\s+(cmd|/bin/sh|/bin/bash))', "RCE: Netcat listener shell attachment", 45, "CWE-78"),
        (r'(\||;|&&)\s*(whoami|cat\s+/etc/passwd|id\b|ipconfig|uname\s+-a)', "RCE: Command separator chaining with system recon", 35, "CWE-78")
    ]
    for pattern, desc, pts, cwe in rce_patterns:
        if re.search(pattern, scan_target, re.IGNORECASE):
            threats.append({"vector": "Remote Code Execution (RCE)", "description": desc, "weight": pts, "cwe": cwe})
            score += pts

    # --- 4. Path Traversal & Local File Inclusion ---
    lfi_patterns = [
        (r'(\.\./|\.\.\\|%2e%2e%2f|%2e%2e/)', "Path Traversal: Relative Directory Traversal Sequence (../)", 30, "CWE-22"),
        (r'(/etc/passwd|/etc/shadow|c:\\windows\\system32|win\.ini)', "LFI: Sensitive OS System File Path", 35, "CWE-22")
    ]
    for pattern, desc, pts, cwe in lfi_patterns:
        if re.search(pattern, scan_target, re.IGNORECASE):
            threats.append({"vector": "Path Traversal / LFI", "description": desc, "weight": pts, "cwe": cwe})
            score += pts

    # --- 5. Secrets & Private Key Exposures ---
    if re.search(r'-----BEGIN\s+(RSA|EC|DSA|OPENSSH|PRIVATE)\s+KEY-----', payload, re.IGNORECASE):
        threats.append({"vector": "Secret Exposure", "description": "Unencrypted Private Key Block detected", "weight": 40, "cwe": "CWE-312"})
        score += 40
    if re.search(r'AKIA[0-9A-Z]{16}', payload):
        threats.append({"vector": "Secret Exposure", "description": "AWS Access Key ID token pattern", "weight": 35, "cwe": "CWE-798"})
        score += 35

    # --- 6. Entropy Anomaly ---
    if entropy > 5.4 and len(payload) > 40:
        threats.append({
            "vector": "Obfuscation / High Entropy",
            "description": f"Elevated Shannon entropy ({entropy} bits/sym) indicates packed shellcode, encrypted blob, or heavy obfuscation.",
            "weight": 20,
            "cwe": "CWE-116"
        })
        score += 20

    # Normalize score
    final_score = min(100, score)
    if final_score == 0:
        severity = "CLEAN"
        verdict = "No known hostile cyber threat patterns or exploit signatures detected."
    elif final_score < 30:
        severity = "LOW"
        verdict = "Low-risk syntax or benign scripting constructs observed."
    elif final_score < 60:
        severity = "MEDIUM"
        verdict = "Suspicious tokens or potential exploitation heuristics identified."
    elif final_score < 85:
        severity = "HIGH"
        verdict = "High-confidence attack signatures detected. Immediate quarantine and input sanitization required."
    else:
        severity = "CRITICAL"
        verdict = "CRITICAL: Malicious payload confirmed (RCE, SQLi, or active reverse shell exploit). Block immediately."

    return {
        "score": final_score,
        "severity": severity,
        "verdict": verdict,
        "entropy": entropy,
        "threats_count": len(threats),
        "threats": threats,
        "deobfuscated_layers": deobfuscation["layers"]
    }
