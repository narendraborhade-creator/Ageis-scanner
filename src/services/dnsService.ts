import { DnsScanResult } from '../types';

export async function scanDomainDNS(rawDomain: string): Promise<DnsScanResult> {
  const domain = rawDomain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .split('/')[0]
    .split('?')[0];

  const recordTypes = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CAA'];
  const startTime = performance.now();

  const fetchRecord = async (type: string) => {
    try {
      // First try our server proxy endpoint
      const res = await fetch(`/api/dns/scan?domain=${encodeURIComponent(domain)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        return {
          type,
          answers: (data.answers || []).map((a: any) => a.data as string),
          dnssec: Boolean(data.dnssec),
        };
      }
    } catch {
      // Fallback directly to Cloudflare DoH in browser
    }

    try {
      const cfRes = await fetch(
        `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=${type}`,
        {
          headers: { Accept: 'application/dns-json' },
        }
      );
      if (cfRes.ok) {
        const data = await cfRes.json();
        return {
          type,
          answers: (data.Answer || []).map((a: any) => a.data as string),
          dnssec: Boolean(data.AD),
        };
      }
    } catch {
      // Fallback to Google DoH
      try {
        const gRes = await fetch(
          `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`
        );
        if (gRes.ok) {
          const data = await gRes.json();
          return {
            type,
            answers: (data.Answer || []).map((a: any) => a.data as string),
            dnssec: Boolean(data.AD),
          };
        }
      } catch {
        // Fall through
      }
    }

    return { type, answers: [], dnssec: false };
  };

  const results = await Promise.all(recordTypes.map(fetchRecord));
  const latencyMs = Math.round(performance.now() - startTime);

  const recordsMap: Record<string, string[]> = {
    A: [],
    AAAA: [],
    MX: [],
    TXT: [],
    NS: [],
    CAA: [],
  };

  let hasDnssec = false;
  results.forEach((r) => {
    recordsMap[r.type] = r.answers;
    if (r.dnssec) hasDnssec = true;
  });

  // Evaluate SPF, DMARC, and DNSSEC
  const txtRecords = recordsMap.TXT || [];
  const hasSpf = txtRecords.some((txt) => txt.toLowerCase().includes('v=spf1'));
  
  // Also check DMARC subdomain _dmarc.domain
  let hasDmarc = false;
  try {
    const dmarcRes = await fetch(
      `https://cloudflare-dns.com/dns-query?name=_dmarc.${encodeURIComponent(domain)}&type=TXT`,
      { headers: { Accept: 'application/dns-json' } }
    );
    if (dmarcRes.ok) {
      const dData = await dmarcRes.json();
      hasDmarc = (dData.Answer || []).some((ans: any) =>
        String(ans.data).toLowerCase().includes('v=dmarc1')
      );
    }
  } catch {
    hasDmarc = txtRecords.some((txt) => txt.toLowerCase().includes('v=dmarc1'));
  }

  // Security Scoring & Vulnerability calculation
  let scorePoints = 0;
  if (recordsMap.A.length > 0) scorePoints += 20;
  if (recordsMap.AAAA.length > 0) scorePoints += 15; // IPv6 readiness
  if (hasSpf) scorePoints += 20;
  if (hasDmarc) scorePoints += 20;
  if (hasDnssec) scorePoints += 15;
  if (recordsMap.CAA.length > 0) scorePoints += 10;

  let grade: 'A+' | 'A' | 'B' | 'C' | 'F' = 'C';
  if (scorePoints >= 90) grade = 'A+';
  else if (scorePoints >= 75) grade = 'A';
  else if (scorePoints >= 55) grade = 'B';
  else if (scorePoints >= 35) grade = 'C';
  else grade = 'F';

  const cacheRisk: 'Low' | 'Moderate' | 'High' = hasDnssec
    ? 'Low'
    : recordsMap.NS.length >= 2
    ? 'Moderate'
    : 'High';

  const summary = hasDnssec
    ? `Domain ${domain} exhibits cryptographically validated DNSSEC records with resilient recursive query resolution (${latencyMs}ms).`
    : hasSpf && hasDmarc
    ? `Domain ${domain} has verified email authentication (SPF & DMARC), but lacks DNSSEC cryptographic origin signing.`
    : `Domain ${domain} is operational (${latencyMs}ms) but missing advanced DNS hardening (DNSSEC/DMARC) against spoofing.`;

  return {
    domain,
    latencyMs,
    dnssec: hasDnssec,
    status: 0,
    records: {
      A: recordsMap.A,
      AAAA: recordsMap.AAAA,
      MX: recordsMap.MX,
      TXT: recordsMap.TXT,
      NS: recordsMap.NS,
      CAA: recordsMap.CAA,
    },
    securityCheck: {
      spfConfigured: hasSpf,
      dmarcConfigured: hasDmarc,
      dnssecValidated: hasDnssec,
      cachePoisoningRisk: cacheRisk,
      overallHealthGrade: grade,
      summary,
    },
  };
}
