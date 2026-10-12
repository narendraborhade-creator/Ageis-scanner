import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './serviceWorkerRegistration';

// Register Aegis service worker for static asset and core browser shell caching
registerServiceWorker();

createRoot(document.getElementById('root')!).render(<App />);
