import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';

// CRITICAL SECURITY & EMBEDDING GUARD:
// If this window is running inside an iframe (e.g. from an accidental fallback or proxy loop),
// NEVER mount the browser shell inside itself!
if (typeof window !== 'undefined' && window.self !== window.top) {
  console.warn('[Aegis] Nested browser execution halted: running inside iframe.');
  document.body.innerHTML = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1115; color: #94a3b8; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 24px; text-align: center; box-sizing: border-box;">
      <div style="max-width: 480px; width: 100%; background: #181b20; border: 1px solid #2d3139; border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        <div style="font-size: 40px; margin-bottom: 16px;">🌐</div>
        <h2 style="color: #f1f5f9; margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Secure Web Sandbox</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px 0;">
          This web destination requires a direct browser window session or native Chromium container.
        </p>
        <button id="aegis-open-external-btn" style="background: #2563eb; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s;">
          Open in New Window ↗
        </button>
      </div>
    </div>
  `;
  document.getElementById('aegis-open-external-btn')?.addEventListener('click', () => {
    try {
      window.parent.postMessage({ type: 'AEGIS_OPEN_EXTERNAL' }, '*');
    } catch {}
  });
} else {
  // Only register service worker and mount browser shell at the top-level window
  registerServiceWorker();
  createRoot(document.getElementById('root')!).render(<App />);
}
