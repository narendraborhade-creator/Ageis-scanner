import { spawn } from 'child_process';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const p = spawn(edgePath, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=9226',
  '--user-data-dir=' + process.env.TEMP + '\\edge-profile-goog-' + Date.now(),
  'https://narendraborhade-creator.github.io/Ageis-scanner/'
]);

await new Promise(r => setTimeout(r, 4000));

try {
  const list = await fetch('http://127.0.0.1:9226/json').then(r => r.json());
  const page = list.find(p => p.type === 'page' && p.url.includes('Ageis-scanner'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      setTimeout(() => {
        console.log('Navigating to Google in Aegis...');
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const buttons = Array.from(document.querySelectorAll('button, a'));
              const gBtn = buttons.find(b => b.textContent && b.textContent.includes('Google'));
              if (gBtn) {
                gBtn.click();
                return 'Clicked Google bookmark';
              }
              return 'Google button not found';
            })()`,
            returnByValue: true
          }
        }));
      }, 1500);

      setTimeout(() => {
        ws.send(JSON.stringify({
          id: 4,
          method: 'Page.captureScreenshot',
          params: { format: 'png' }
        }));
      }, 6000);
    };

    ws.onmessage = (msg) => {
      const d = JSON.parse(msg.data);
      if (d.id === 3) {
        console.log('Eval result:', d.result?.result?.value);
      } else if (d.id === 4) {
        fs.writeFileSync('scripts/screenshot-live-google.png', Buffer.from(d.result.data, 'base64'));
        console.log('Saved scripts/screenshot-live-google.png');
        resolve();
      }
    };
  });
  ws.close();
} catch (e) {
  console.error(e);
} finally {
  p.kill();
}
