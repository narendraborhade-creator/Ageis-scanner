import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';

// CRITICAL SECURITY & EMBEDDING GUARD:
// If this window is running inside an iframe, prevent loading the browser UI recursively
// and instead request the parent browser shell to reload the destination cleanly.
if (typeof window !== 'undefined' && window.self !== window.top) {
  try {
    window.parent.postMessage({ type: 'AEGIS_RELOAD_FRAME' }, '*');
  } catch {}
} else {
  // Only register service worker and mount browser shell at the top-level window
  registerServiceWorker();
  createRoot(document.getElementById('root')!).render(<App />);
}
