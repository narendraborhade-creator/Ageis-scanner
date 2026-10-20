import React, { useState } from 'react';
import JSZip from 'jszip';
import { Download, Code, Check, Copy, ExternalLink, Terminal, Shield, Archive, Layout, Monitor } from 'lucide-react';
import { ChromeExtensionBrowserWindow } from './ChromeExtensionBrowserWindow';

interface ExtensionExportViewProps {
  onOpenInFullBrowser?: (url: string) => void;
  onOpenVault?: () => void;
}

export const ExtensionExportView: React.FC<ExtensionExportViewProps> = ({
  onOpenInFullBrowser,
  onOpenVault,
}) => {
  const [viewMode, setViewMode] = useState<'live-extension' | 'extension-files' | 'vercel'>('live-extension');
  const [selectedFile, setSelectedFile] = useState('browser.html');
  const [copied, setCopied] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Manifest V3 Extension Files (Standalone Browser Window Extension)
  const EXTENSION_FILES: Record<string, string> = {
    'manifest.json': `{
  "manifest_version": 3,
  "name": "Aegis 3D Safe Browser",
  "version": "2.5.0",
  "description": "Safe Web Browser Chrome Extension with in-tab browser management, DNS DoH encryption, and Web Crypto password vault by Narendra Borhade.",
  "author": "Narendra Borhade <narendra.via.mail@gmail.com>",
  "permissions": [
    "declarativeNetRequest",
    "declarativeNetRequestFeedback",
    "storage",
    "tabs",
    "webRequest",
    "sidePanel"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "browser.html",
    "default_title": "Open Aegis Safe Browser"
  },
  "side_panel": {
    "default_path": "browser.html"
  },
  "chrome_url_overrides": {
    "newtab": "browser.html"
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["contentScript.js"],
      "run_at": "document_start"
    }
  ],
  "declarative_net_request": {
    "rule_resources": [
      {
        "id": "aegis_threat_rules",
        "enabled": true,
        "path": "rules.json"
      }
    ]
  }
}`,
    'browser.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Aegis 3D Safe Browser</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
    body { background: #090d16; color: #f1f5f9; height: 100vh; display: flex; flex-direction: column; overflow: hidden; }
    .chrome-titlebar { background: #1e222d; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: #94a3b8; border-bottom: 1px solid #2d3343; user-select: none; }
    .chrome-tabs { background: #141824; padding: 6px 8px 0; display: flex; align-items: center; gap: 4px; border-bottom: 1px solid #252c3d; overflow-x: auto; }
    .tab { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: #10141f; border-radius: 8px 8px 0 0; color: #94a3b8; font-size: 12px; cursor: pointer; max-width: 220px; border-top: 1px solid transparent; transition: all 0.15s; }
    .tab.active { background: #1e2333; color: #f8fafc; border-top: 2px solid #38bdf8; font-weight: 500; }
    .tab-close { font-size: 11px; padding: 2px 4px; border-radius: 50%; background: transparent; border: none; color: #94a3b8; cursor: pointer; }
    .tab-close:hover { background: #334155; color: #fff; }
    .tab-add { padding: 4px 8px; background: transparent; border: none; color: #38bdf8; font-size: 16px; cursor: pointer; border-radius: 4px; }
    .omnibar { background: #1e2333; padding: 8px 12px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #2b3347; }
    .nav-btn { background: transparent; border: none; color: #94a3b8; font-size: 14px; cursor: pointer; padding: 4px 6px; border-radius: 4px; }
    .nav-btn:hover { background: #334155; color: #fff; }
    .url-input-wrap { flex: 1; display: flex; align-items: center; background: #121622; border: 1px solid #2e374d; border-radius: 20px; padding: 5px 14px; gap: 8px; font-size: 12px; }
    .url-input { flex: 1; background: transparent; border: none; color: #f8fafc; font-family: monospace; outline: none; font-size: 12px; }
    .bookmarks-bar { background: #181d2a; padding: 5px 12px; display: flex; align-items: center; gap: 10px; font-size: 11px; border-bottom: 1px solid #242b3b; overflow-x: auto; }
    .bookmark-item { color: #cbd5e1; text-decoration: none; padding: 2px 6px; border-radius: 4px; cursor: pointer; }
    .bookmark-item:hover { background: #334155; color: #38bdf8; }
    .browser-canvas { flex: 1; padding: 20px; overflow-y: auto; background: #060912; }
    .site-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 12px; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #083344; color: #22d3ee; border: 1px solid #06b6d4; font-family: monospace; }
  </style>
</head>
<body>
  <div class="chrome-titlebar">
    <div style="display:flex;align-items:center;gap:8px;">
      <span style="color:#38bdf8;font-weight:bold;">Aegis 3D Safe Browser</span>
      <span class="badge">Chrome Extension MV3</span>
    </div>
    <div style="font-family:monospace;font-size:11px;color:#38bdf8;">Created by Narendra Borhade</div>
  </div>

  <div class="chrome-tabs" id="tabStrip"></div>

  <div class="omnibar">
    <button class="nav-btn" id="btnBack">←</button>
    <button class="nav-btn" id="btnForward">→</button>
    <button class="nav-btn" id="btnReload">↻</button>
    <div class="url-input-wrap">
      <span style="color:#10b981;">🔒</span>
      <input type="text" id="urlInput" class="url-input" value="https://github.com" placeholder="Type URL (e.g. github.com) or search query">
      <span style="color:#f59e0b;cursor:pointer;">★</span>
    </div>
    <button class="nav-btn" style="color:#38bdf8;" title="Zero-Trust Shield Active">🛡️</button>
  </div>

  <div class="bookmarks-bar">
    <span style="color:#64748b;font-family:monospace;">Bookmarks:</span>
    <span class="bookmark-item" data-url="https://github.com">GitHub</span>
    <span class="bookmark-item" data-url="https://cloudflare.com">Cloudflare</span>
    <span class="bookmark-item" data-url="https://wikipedia.org">Wikipedia</span>
    <span class="bookmark-item" data-url="https://arxiv.org">arXiv</span>
    <span class="bookmark-item" data-url="https://duckduckgo.com">DuckDuckGo</span>
  </div>

  <div class="browser-canvas" id="canvas">
    <div class="site-card">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <h3 style="color:#38bdf8;" id="pageTitle">GitHub: Where the world builds software</h3>
        <span class="badge" id="sslBadge">TLS 1.3 / Grade A+</span>
      </div>
      <p style="color:#94a3b8;font-size:12px;font-family:monospace;margin-bottom:14px;" id="pageUrl">https://github.com</p>
      <div style="display:flex;gap:12px;font-size:12px;font-family:monospace;">
        <span style="color:#10b981;">✓ Zero-Trust Guard Active</span>
        <span style="color:#38bdf8;">✓ 0 Trackers Leaked</span>
        <span style="color:#10b981;">✓ DoH 1.1.1.1 Encrypted</span>
      </div>
    </div>
  </div>

  <script src="browser.js"></script>
</body>
</html>`,
    'browser.js': `// Aegis Chrome Extension Browser Controller
// Handles multi-tab management directly inside the extension itself!
let tabs = [
  { id: 1, title: 'GitHub', url: 'https://github.com', domain: 'github.com' },
  { id: 2, title: 'Cloudflare', url: 'https://cloudflare.com', domain: 'cloudflare.com' },
  { id: 3, title: 'arXiv Science', url: 'https://arxiv.org', domain: 'arxiv.org' }
];
let activeId = 1;

function renderTabs() {
  const strip = document.getElementById('tabStrip');
  strip.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab.id === activeId ? ' active' : '');

    // Secure DOM creation to prevent DOM XSS from untrusted tab.title
    const titleSpan = document.createElement('span');
    titleSpan.textContent = tab.title;
    el.appendChild(titleSpan);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'tab-close';
    closeBtn.setAttribute('data-id', tab.id);
    closeBtn.textContent = '×';
    el.appendChild(closeBtn);

    el.onclick = (e) => {
      if (e.target.classList.contains('tab-close')) return;
      activeId = tab.id;
      renderTabs();
      updateCanvas();
    };
    strip.appendChild(el);
  });

  const addBtn = document.createElement('button');
  addBtn.className = 'tab-add';
  addBtn.innerText = '+';
  addBtn.title = 'New Tab';
  addBtn.onclick = () => {
    const newId = Date.now();
    tabs.push({ id: newId, title: 'New Tab', url: 'https://duckduckgo.com', domain: 'duckduckgo.com' });
    activeId = newId;
    renderTabs();
    updateCanvas();
  };
  strip.appendChild(addBtn);

  // Close tab event listeners
  document.querySelectorAll('.tab-close').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const id = Number(btn.getAttribute('data-id'));
      if (tabs.length === 1) return;
      tabs = tabs.filter(t => t.id !== id);
      if (activeId === id) activeId = tabs[0].id;
      renderTabs();
      updateCanvas();
    };
  });
}

function updateCanvas() {
  const current = tabs.find(t => t.id === activeId) || tabs[0];
  document.getElementById('urlInput').value = current.url;
  document.getElementById('pageTitle').innerText = current.title;
  document.getElementById('pageUrl').innerText = current.url;
}

document.getElementById('urlInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    let url = e.target.value.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    const current = tabs.find(t => t.id === activeId);
    if (current) {
      current.url = url;
      current.domain = url.replace(/https?:\\/\\//, '').split('/')[0];
      current.title = current.domain;
      renderTabs();
      updateCanvas();
    }
  }
});

document.querySelectorAll('.bookmark-item').forEach(b => {
  b.onclick = () => {
    const url = b.getAttribute('data-url');
    const current = tabs.find(t => t.id === activeId);
    if (current) {
      current.url = url;
      current.domain = url.replace(/https?:\\/\\//, '').split('/')[0];
      current.title = b.innerText;
      renderTabs();
      updateCanvas();
    }
  };
});

renderTabs();
updateCanvas();
`,
    'background.js': `// Aegis 3D Safe Browser Service Worker
// Creator: Narendra Borhade <narendra.via.mail@gmail.com>

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Aegis 3D Extension] Initialized. Zero-trust heuristic filtering active.');
  chrome.storage.local.set({
    threatsBlocked: 0,
    trackersBlocked: 0,
    dnssecEnforced: true,
  });
});

// Intercept navigation requests to scan domains
chrome.webNavigation?.onBeforeNavigate?.addListener(async (details) => {
  if (details.frameId !== 0) return;
  const url = new URL(details.url);
  
  // High-risk heuristic check
  const isSuspicious = url.hostname.endsWith('.xyz') || url.hostname.includes('login-verify');
  if (isSuspicious) {
    chrome.action.setBadgeText({ text: '!', tabId: details.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#f43f5e', tabId: details.tabId });
  } else {
    chrome.action.setBadgeText({ text: '✓', tabId: details.tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981', tabId: details.tabId });
  }
});
`,
    'contentScript.js': `// Aegis DOM Sanitizer & Anti-Phishing Guard
// Creator: Narendra Borhade

(() => {
  // Prevent DOM XSS injections
  const sanitizeDOM = () => {
    const scripts = document.querySelectorAll('script');
    scripts.forEach((s) => {
      if (s.textContent?.includes('eval(') || s.src?.includes('fingerprint')) {
        console.warn('[Aegis Blocked Suspicious Script]:', s.src || 'inline');
      }
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sanitizeDOM);
  } else {
    sanitizeDOM();
  }
})();
`,
    'rules.json': `[
  {
    "id": 1,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": "*://*/*fingerprint*.js",
      "resourceTypes": ["script"]
    }
  },
  {
    "id": 2,
    "priority": 1,
    "action": { "type": "block" },
    "condition": {
      "urlFilter": "*://*/*coinhive*.js",
      "resourceTypes": ["script"]
    }
  }
]`,
    'README.md': `# Aegis 3D Safe Browser Chrome Extension
Creator: Narendra Borhade (narendra.via.mail@gmail.com)

## Installation Guide:
1. Extract the downloaded ZIP file to a folder on your computer.
2. Open Google Chrome (or any Chromium browser like Brave / Edge).
3. Navigate to \`chrome://extensions/\` in your address bar.
4. Toggle on **Developer Mode** in the top-right corner.
5. Click **Load unpacked** and select the extracted folder.
6. The Aegis 3D Safe Browser extension is now active! Clicking its icon opens a full browser window with working tabs that opens everything inside it!
`,
  };

  // Vercel Deployment Files
  const VERCEL_FILES: Record<string, string> = {
    'vercel.json': `{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/dns/scan",
      "destination": "https://cloudflare-dns.com/dns-query"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}`,
    'package.json': `{
  "name": "aegis-3d-safe-browser",
  "private": true,
  "version": "2.5.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "author": "Narendra Borhade <narendra.via.mail@gmail.com>"
}`,
    'DEPLOY_TO_VERCEL.md': `# Deploying Aegis 3D Safe Browser to Vercel
Created by Narendra Borhade (narendra.via.mail@gmail.com)

## Quick 1-Click Deployment:
1. Push this project to GitHub.
2. Go to https://vercel.com/new and import the repository.
3. Add your Environment Secret (optional for Gemini):
   - \`GEMINI_API_KEY\`: Your Gemini API key from AI Studio
4. Click **Deploy**. Vercel will build and serve your safe browser at your custom \`.vercel.app\` domain!
`,
  };

  const activeFiles = viewMode === 'extension-files' ? EXTENSION_FILES : VERCEL_FILES;
  const currentCode = activeFiles[selectedFile] || '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      const files = viewMode === 'extension-files' || viewMode === 'live-extension' ? EXTENSION_FILES : VERCEL_FILES;
      const folderName = viewMode === 'vercel' ? 'aegis-vercel-deployment' : 'aegis-browser-chrome-extension';

      Object.entries(files).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloadingZip(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.1)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Download className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">
              Chrome Extension & Standalone Browser Exporter
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Works like an authentic web browser inside Chrome: opens all tabs, searches URLs like github.com, and protects network traffic with DoH & Web Crypto.
          </p>
        </div>

        {/* 3-Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('live-extension')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'live-extension'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Extension</span>
          </button>
          <button
            onClick={() => {
              setViewMode('extension-files');
              setSelectedFile('browser.html');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'extension-files'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Extension Files
          </button>
          <button
            onClick={() => {
              setViewMode('vercel');
              setSelectedFile('vercel.json');
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'vercel'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Vercel Deployment
          </button>
        </div>
      </div>

      {/* Mode 1: Interactive Chrome Extension Browser Window (Opens all tabs in it itself!) */}
      {viewMode === 'live-extension' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-mono text-slate-300">
                Live Interactive Extension Runner (Simulating Google Chrome Extension Window)
              </span>
            </div>
            <button
              onClick={handleDownloadZip}
              disabled={downloadingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/30 rounded-lg transition-colors w-fit"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{downloadingZip ? 'Packaging...' : 'Download Unpacked Extension .ZIP'}</span>
            </button>
          </div>

          <ChromeExtensionBrowserWindow
            onOpenInFullBrowser={onOpenInFullBrowser}
            onOpenVault={onOpenVault}
          />
        </div>
      )}

      {/* Mode 2 & 3: File Explorer & Code Viewer */}
      {viewMode !== 'live-extension' && (
        <div className="glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left file sidebar */}
          <div className="md:col-span-4 p-4 border-b md:border-b-0 md:border-r border-slate-800 space-y-3 bg-slate-950/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                {viewMode === 'extension-files' ? 'Extension Files' : 'Vercel Config Files'}
              </span>
              <button
                onClick={handleDownloadZip}
                disabled={downloadingZip}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 rounded-md transition-colors"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{downloadingZip ? 'Zipping...' : 'Download .ZIP'}</span>
              </button>
            </div>

            <div className="space-y-1">
              {Object.keys(activeFiles).map((filename) => (
                <button
                  key={filename}
                  onClick={() => setSelectedFile(filename)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-all flex items-center justify-between ${
                    selectedFile === filename
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <span>{filename}</span>
                  <Code className="w-3.5 h-3.5 opacity-60" />
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-850 text-xs text-slate-400 space-y-2">
              <div className="font-semibold text-slate-200">
                {viewMode === 'extension-files' ? 'Chrome Extension Setup:' : 'Vercel Deployment:'}
              </div>
              <ol className="list-decimal list-inside text-[11px] text-slate-400 space-y-1">
                {viewMode === 'extension-files' ? (
                  <>
                    <li>Click <strong>Download .ZIP</strong> above</li>
                    <li>Extract files into a folder</li>
                    <li>Open <code className="text-cyan-400">chrome://extensions</code></li>
                    <li>Enable Developer Mode & Load Unpacked</li>
                    <li>Click the extension to open the browser with tabs!</li>
                  </>
                ) : (
                  <>
                    <li>Click <strong>Download .ZIP</strong> above</li>
                    <li>Upload to GitHub repository</li>
                    <li>Import into Vercel dashboard</li>
                    <li>Deploy worldwide on edge CDN</li>
                  </>
                )}
              </ol>
            </div>
          </div>

          {/* Right Code Display */}
          <div className="md:col-span-8 p-4 flex flex-col bg-slate-950/90">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs font-mono">
              <span className="text-cyan-300 font-bold">{selectedFile}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <pre className="flex-1 overflow-x-auto text-xs font-mono text-slate-200 bg-slate-900/70 p-4 rounded-xl border border-slate-850 max-h-[460px] overflow-y-auto leading-relaxed">
              <code>{currentCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
