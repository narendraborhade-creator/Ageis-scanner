export type NavTab = 
  | 'browser' 
  | 'dns-scanner' 
  | 'compare' 
  | 'threat-blocker' 
  | 'security-analytics'
  | 'science' 
  | 'gemini-copilot' 
  | 'auth' 
  | 'about' 
  | 'extension';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  domain: string;
  isHttps: boolean;
  threatStatus: 'clean' | 'warning' | 'blocked';
  trackersBlocked: number;
  bugsSanitized: number;
  latencyMs: number;
  securityScore: number;
  sslGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  isQuarantined: boolean;
  isPinned?: boolean;
  isSuspended?: boolean;
  groupId?: string;
  groupTitle?: string;
  groupColor?: TabGroupColor;
  cpuPercent?: number;
  memoryMb?: number;
  lastActiveAt?: number;
  pageMetrics?: PageLoadMetrics;
  snapshotThumbnail?: string;
  historyStack?: string[];
  historyIndex?: number;
  createdAt: number;
}

export type TabGroupColor = 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';

export interface TabGroup {
  id: string;
  name: string;
  color: TabGroupColor;
  collapsed?: boolean;
  createdAt?: number;
}

export interface TabResourceMetrics {
  tabId: string;
  title: string;
  url: string;
  domain: string;
  cpuPercent: number;
  memoryMb: number;
  isSuspended: boolean;
  status: 'normal' | 'heavy' | 'critical' | 'suspended';
  threads: number;
  networkKbps: number;
  energyImpact: 'Low' | 'Moderate' | 'High';
}

export interface SystemResourceSummary {
  totalCpuPercent: number;
  totalMemoryMb: number;
  totalTabsCount: number;
  activeTabsCount: number;
  suspendedTabsCount: number;
  estimatedMemorySavedMb: number;
  systemHealth: 'optimal' | 'moderate' | 'high_load';
}

export interface PageLoadMetrics {
  url: string;
  domain: string;
  ttfbMs: number;
  fcpMs: number;
  dnsLookupMs: number;
  tlsHandshakeMs: number;
  domLoadMs: number;
  totalLoadMs: number;
  rating: 'fast' | 'moderate' | 'slow' | 'compromised-latency';
  isCompromisedLatency: boolean;
  statusHeadline: string;
  threatAssessment: string;
  anomalyIndicators: string[];
  measuredAt: number;
}

export interface BrowserHistoryItem {
  id: string;
  url: string;
  title: string;
  domain: string;
  timestamp: string;
  date: string;
  isHttps: boolean;
  threatStatus: 'clean' | 'warning' | 'blocked';
  securityScore: number;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  addedAt: string;
  category?: string;
}

export interface ReadLaterItem {
  id: string;
  title: string;
  url: string;
  domain: string;
  excerpt?: string;
  savedAt: string;
  timestamp: number;
  readTimeMinutes: number;
  isRead: boolean;
  category: 'Security' | 'Research' | 'Technology' | 'General';
  threatStatus: 'clean' | 'warning' | 'blocked';
  tags?: string[];
}

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DnsScanResult {
  domain: string;
  latencyMs: number;
  dnssec: boolean;
  status: number;
  records: {
    A: string[];
    AAAA: string[];
    MX: string[];
    TXT: string[];
    NS: string[];
    CAA: string[];
  };
  securityCheck: {
    spfConfigured: boolean;
    dmarcConfigured: boolean;
    dnssecValidated: boolean;
    cachePoisoningRisk: 'Low' | 'Moderate' | 'High';
    overallHealthGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
    summary: string;
  };
}

export interface WebsiteAudit {
  url: string;
  domain: string;
  finalUrl: string;
  status: number;
  responseTimeMs: number;
  securityScore: number;
  sslGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  isHttps: boolean;
  trackersCount: number;
  headers: {
    hsts: string | null;
    csp: string | null;
    xFrameOptions: string | null;
    xContentTypeOptions: string | null;
    referrerPolicy: string | null;
    permissionsPolicy: string | null;
    server: string;
  };
  vulnerabilities: string[];
}

export interface ThreatItem {
  id: string;
  url: string;
  type: 'phishing' | 'malware' | 'xss' | 'clickjacking' | 'tracker' | 'typosquatting' | 'insecure_http';
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: string;
  blocked: boolean;
  description: string;
  mitigation: string;
}

export interface SciencePaper {
  id: string;
  title: string;
  authors: string[];
  source: string;
  pubDate: string;
  doi?: string;
  pmid?: string;
  abstract: string;
  database: 'PubMed' | 'Europe PMC' | 'OpenAlex' | 'arXiv' | 'PubChem';
  link: string;
  openAccess?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model: string;
  persona?: string;
  matchedTerms?: string[];
  threatAnalysis?: {
    score: number;
    severity: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    verdict: string;
    entropy: number;
    threats_count: number;
    threats: Array<{ vector: string; description: string; weight: number; cwe: string }>;
    deobfuscated_layers?: Array<{ type: string; content: string }>;
  };
}

export interface UserAccount {
  uid: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  registeredAt: string;
  databaseProvider: 'local' | 'firebase' | 'mongodb' | 'cloudflare';
  bookmarkedUrls: string[];
  searchHistory: string[];
  threatsBlockedCount: number;
}

export interface DatabaseConfig {
  activeEngine: 'local' | 'firebase' | 'mongodb' | 'cloudflare';
  mongoConfig: {
    uri: string;
    databaseName: string;
    isConnected: boolean;
  };
  firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    firestoreDatabaseId: string;
    isConnected: boolean;
  };
  cloudflareConfig: {
    accountId: string;
    d1DatabaseId: string;
    d1DatabaseName: string;
    apiToken: string;
    kvNamespaceId: string;
    turnstileSiteKey: string;
    isConnected: boolean;
    edgePoP?: string;
    rayId?: string;
  };
}

export interface CloudflareVerificationResult {
  verified: boolean;
  timestamp: string;
  rayId: string;
  edgePoP: string;
  turnstileToken: string;
  ipAddress: string;
  tlsVersion: string;
  threatScore: number;
}

export interface AppSessionState {
  activeNavTab: NavTab;
  scrollPosition: { x: number; y: number };
  browser: {
    tabs: BrowserTab[];
    activeTabId: string;
    omnibarInput: string;
    activeSidebar: 'none' | 'history' | 'bookmarks' | 'tabs' | 'ai' | 'read-later' | 'resource-monitor';
    tabGroups?: TabGroup[];
    recentlyClosedTabs?: BrowserTab[];
  };
  dnsTargetDomain?: string;
  compareSiteA?: string;
  compareSiteB?: string;
  scienceQuery?: string;
  lastSavedAt: number;
}

export interface DailyThreatData {
  date: string; // YYYY-MM-DD
  displayDate: string; // e.g. Oct 11
  dayOfWeek: string; // Mon, Tue, etc.
  dayIndex: number;
  totalBlocked: number;
  breakdown: {
    phishing: number;
    xss: number;
    malware: number;
    tracker: number;
    insecure_http: number;
  };
  intensity: number; // 0 to 1
  peakSeverity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AISecuritySummary {
  headline: string;
  threatLevel: 'Elevated' | 'Guarded' | 'Critical' | 'Severe';
  totalBlocked30d: number;
  primaryVector: string;
  insights: string[];
  recommendations: string[];
  generatedAt: string;
  modelUsed?: string;
}

export interface DetectedVulnerability {
  id: string;
  category: 'library' | 'header' | 'protocol' | 'cookie';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  cveOrRef?: string;
  detectedTarget: string;
  remediation: string;
}

export interface OutdatedLibraryReport {
  name: string;
  detectedVersion: string;
  latestSafeVersion: string;
  vulnerabilityCount: number;
  isEndOfWeekOrObsolete: boolean;
  cves: string[];
}

export interface HeaderAuditItem {
  header: string;
  status: 'passed' | 'warning' | 'missing' | 'insecure';
  currentValue: string | null;
  recommendedValue: string;
  description: string;
}

export interface VulnerabilityScanReport {
  url: string;
  domain: string;
  timestamp: string;
  securityScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  isHttps: boolean;
  vulnerabilities: DetectedVulnerability[];
  outdatedLibraries: OutdatedLibraryReport[];
  headerAudits: HeaderAuditItem[];
  stats: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    passedChecksCount: number;
  };
  summaryVerdict: string;
}

export interface VaultCredential {
  id: string;
  title: string;
  url: string;
  domain: string;
  username: string;
  password: string;
  category: 'Logins' | 'Developer' | 'Cloud' | 'Finance' | 'Identity';
  notes?: string;
  strength: 'weak' | 'fair' | 'strong' | 'military';
  createdAt: string;
  updatedAt: string;
}

export interface EncryptedVaultRecord {
  id: string;
  iv: string; // Base64 AES-GCM IV
  ciphertext: string; // Base64 encrypted JSON
  domain: string;
  category: string;
  updatedAt: string;
}

export interface EncryptedVaultPackage {
  version: number;
  salt: string; // Base64 PBKDF2 salt
  verifierIv: string;
  verifierCiphertext: string;
  records: EncryptedVaultRecord[];
  createdAt: string;
  updatedAt: string;
  autoLockMinutes: number;
}

export interface AttackVectorTelemetry {
  key: string;
  name: string;
  count: number;
  percentage: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  color: string;
  gradient: [string, string];
  aegisSubsystem: string;
  description: string;
  mitigationMethod: string;
  activeRatePerMin: number;
}

export interface RealtimeTrendPoint {
  timestamp: number;
  timeLabel: string;
  total: number;
  phishing: number;
  xss: number;
  malware: number;
  tracker: number;
  insecureHttp: number;
  dnsSpoof: number;
}

export interface LiveAttackEvent {
  id: string;
  timestamp: string;
  timestampMs: number;
  vector: 'phishing' | 'xss' | 'malware' | 'tracker' | 'insecure_http' | 'dns_spoof';
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: string;
  payloadSnippet: string;
  mitigation: string;
  heuristicRule: string;
  quarantined: boolean;
  latencyMs: number;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: any;
    }
  }
}

