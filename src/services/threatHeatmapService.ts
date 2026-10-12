import { DailyThreatData, AISecuritySummary } from '../types';

const HEATMAP_STORAGE_KEY = 'aegis_threat_heatmap_30d';

// Deterministic seed helper to generate realistic historical 30-day data
function generateDefault30Days(): DailyThreatData[] {
  const days: DailyThreatData[] = [];
  const now = new Date();
  
  // Day names array
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Seeded distribution for realistic security telemetry
  const patternWeights = [
    12, 18, 25, 14, 9, 34, 42, 19, 15, 8,
    28, 49, 21, 16, 11, 38, 62, 29, 24, 18,
    14, 31, 53, 27, 22, 17, 39, 45, 31, 26
  ];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);

    const dateStr = d.toISOString().split('T')[0];
    const displayDate = `${monthNames[d.getMonth()]} ${d.getDate()}`;
    const dayOfWeek = dayNames[d.getDay()];
    const dayIndex = d.getDay();

    const weightIndex = 29 - i;
    const baseCount = patternWeights[weightIndex] || 20;

    // Distribute into threat categories
    const phishing = Math.max(1, Math.round(baseCount * 0.32));
    const xss = Math.max(1, Math.round(baseCount * 0.22));
    const malware = Math.max(0, Math.round(baseCount * 0.12));
    const tracker = Math.max(2, Math.round(baseCount * 0.26));
    const insecure_http = Math.max(0, baseCount - (phishing + xss + malware + tracker));
    const totalBlocked = phishing + xss + malware + tracker + insecure_http;

    let peakSeverity: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (totalBlocked > 45 || phishing > 15) peakSeverity = 'critical';
    else if (totalBlocked > 25) peakSeverity = 'high';
    else if (totalBlocked > 12) peakSeverity = 'medium';

    days.push({
      date: dateStr,
      displayDate,
      dayOfWeek,
      dayIndex,
      totalBlocked,
      breakdown: {
        phishing,
        xss,
        malware,
        tracker,
        insecure_http: Math.max(0, insecure_http),
      },
      intensity: Math.min(1, totalBlocked / 70),
      peakSeverity,
    });
  }

  return days;
}

export function getStoredHeatmapData(): DailyThreatData[] {
  try {
    const raw = localStorage.getItem(HEATMAP_STORAGE_KEY);
    if (!raw) {
      const initial = generateDefault30Days();
      localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 30) {
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading heatmap data:', err);
  }
  const fallback = generateDefault30Days();
  localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

export function recordLiveThreatBlocked(threatType: string = 'phishing'): DailyThreatData[] {
  const current = getStoredHeatmapData();
  if (current.length === 0) return current;

  // Update today's entry (last item)
  const todayEntry = current[current.length - 1];
  todayEntry.totalBlocked += 1;

  if (threatType.includes('phish') || threatType.includes('typosquat')) {
    todayEntry.breakdown.phishing += 1;
  } else if (threatType.includes('xss') || threatType.includes('script')) {
    todayEntry.breakdown.xss += 1;
  } else if (threatType.includes('miner') || threatType.includes('malware')) {
    todayEntry.breakdown.malware += 1;
  } else if (threatType.includes('track') || threatType.includes('fingerprint')) {
    todayEntry.breakdown.tracker += 1;
  } else {
    todayEntry.breakdown.insecure_http += 1;
  }

  todayEntry.intensity = Math.min(1, todayEntry.totalBlocked / 70);
  if (todayEntry.totalBlocked > 45) todayEntry.peakSeverity = 'critical';
  else if (todayEntry.totalBlocked > 25) todayEntry.peakSeverity = 'high';
  else if (todayEntry.totalBlocked > 12) todayEntry.peakSeverity = 'medium';

  localStorage.setItem(HEATMAP_STORAGE_KEY, JSON.stringify(current));
  return [...current];
}

export async function fetchAiSecuritySummary(
  data: DailyThreatData[]
): Promise<AISecuritySummary> {
  const totalBlocked = data.reduce((sum, d) => sum + d.totalBlocked, 0);
  const totalPhishing = data.reduce((sum, d) => sum + d.breakdown.phishing, 0);
  const totalXss = data.reduce((sum, d) => sum + d.breakdown.xss, 0);
  const totalMalware = data.reduce((sum, d) => sum + d.breakdown.malware, 0);
  const totalTrackers = data.reduce((sum, d) => sum + d.breakdown.tracker, 0);

  // Find peak day
  const peakDay = [...data].sort((a, b) => b.totalBlocked - a.totalBlocked)[0];

  const prompt = `Analyze this 30-day cybersecurity telemetry for Aegis 3D Safe Browser:
- Total Blocked Requests: ${totalBlocked}
- Phishing Harvesters Blocked: ${totalPhishing}
- DOM/URL XSS Injections Neutralized: ${totalXss}
- In-Browser Cryptominers/Malware Throttled: ${totalMalware}
- Cross-Site Fingerprinting Trackers Blocked: ${totalTrackers}
- Peak Attack Surge: ${peakDay ? `${peakDay.displayDate} (${peakDay.totalBlocked} attacks)` : 'None'}
- Monitored Protocol Enforcement: 100% Zero-Trust virtual sandbox

Return a concise JSON object with these keys:
{
  "headline": string (max 10 words, bold threat overview),
  "threatLevel": "Elevated" | "Guarded" | "Critical" | "Severe",
  "primaryVector": string (the predominant threat vector identified),
  "insights": array of 3 distinct bullet strings (specific patterns, surges, heuristic anomalies),
  "recommendations": array of 3 distinct bullet strings (actionable hardening tips for user defense)
}`;

  try {
    const res = await fetch('/api/gemini/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: prompt }],
        systemInstruction:
          'You are Aegis Cyber Defense Intelligence Engine. Provide authoritative, concise, and technically rigorous threat analysis in valid JSON format only.',
        model: 'models/gemini-3.8-flash',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      const rawText = json.reply || '';
      // Try extract JSON from markdown fences or text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          headline: parsed.headline || 'Active Zero-Trust Containment Across 30-Day Ingress',
          threatLevel: parsed.threatLevel || 'Elevated',
          totalBlocked30d: totalBlocked,
          primaryVector: parsed.primaryVector || 'Deceptive Credential Harvesting & XSS Vectors',
          insights: Array.isArray(parsed.insights) ? parsed.insights : [
            `Phishing accounted for ${Math.round((totalPhishing / totalBlocked) * 100)}% of malicious payloads, primarily targeting fake auth portals.`,
            `DOM XSS injections spiked notably on ${peakDay?.displayDate}, where reflected script probes peaked.`,
            `Cross-site canvas fingerprinting scripts were continuously neutralized without browser identity leakage.`
          ],
          recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [
            'Keep Automatic HTTPS Upgrade enabled to prevent SSL stripping on plaintext gateways.',
            'Maintain Virtual Sandbox isolation for punycode domains and untrusted TLDs (.xyz, .top).',
            'Deploy Content-Security-Policy (CSP) headers with strict nonce verification on all web services.'
          ],
          generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: 'gemini-3.8-flash',
        };
      }
    }
  } catch (err) {
    console.warn('AI Summary generation fallback engaged:', err);
  }

  // High-fidelity fallback summary
  return {
    headline: `Aegis Zero-Trust Shield Disarmed ${totalBlocked} Malicious Attacks in 30 Days`,
    threatLevel: totalBlocked > 600 ? 'Critical' : 'Elevated',
    totalBlocked30d: totalBlocked,
    primaryVector: 'Credential Harvester Typosquatting & DOM Script Injections',
    insights: [
      `Phishing attempts comprised ${Math.round((totalPhishing / Math.max(1, totalBlocked)) * 100)}% of quarantined payloads, concentrating around synthetic payment gateways.`,
      `Peak malicious surge occurred on ${peakDay?.displayDate} with ${peakDay?.totalBlocked} blocked payloads intercepted in virtual containers.`,
      `Telemetry trackers and audio-canvas fingerprinting scripts accounted for ${totalTrackers} suppressed tracking attempts.`,
    ],
    recommendations: [
      'Maintain strict Anti-Phishing Sandbox heuristics for all newly registered and punycode domains.',
      'Enforce automatic HTTPS upgrades to eliminate plaintext interception vectors.',
      'Audit external script dependencies and restrict framing with X-Frame-Options: DENY.',
    ],
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    modelUsed: 'Aegis Heuristic Core (Fallback)',
  };
}
