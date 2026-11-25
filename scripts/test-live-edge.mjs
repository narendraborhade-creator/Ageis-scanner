import { spawn } from 'child_process';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const p = spawn(edgePath, [
  '--headless=new',
  '--no-first-run',
  '--no-default-browser-check',
  '--remote-debugging-port=9223',
  '--user-data-dir=' + process.env.TEMP + '\\edge-profile-' + Date.now(),
  'https://narendraborhade-creator.github.io/Ageis-scanner/'
]);

await new Promise(r => setTimeout(r, 4000));

try {
  const list = await fetch('http://127.0.0.1:9223/json').then(r => r.json());
  const page = list.find(p => p.type === 'page' && p.url.includes('Ageis-scanner'));

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => {
    ws.onopen = () => {
      ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));

      // Type "github.com" into the top address bar input and submit form
      setTimeout(() => {
        console.log('Typing github.com into address bar...');
        ws.send(JSON.stringify({
          id: 3,
          method: 'Runtime.evaluate',
          params: {
            expression: `(() => {
              const input = document.querySelector('input[type=\"text\"]');
              if (input) {
                // Set native value
                const proto = window.HTMLInputElement.prototype;
                const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
                setter.call(input, 'github.com');
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Submit parent form or trigger Enter key
                const form = input.closest('form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                  return 'Form submitted with github.com';
                }
                return 'Input set but no form';
              }
              return 'No input found';
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
        console.log('Input eval result:', d.result?.result?.value);
      } else if (d.id === 4) {
        import('fs').then(fs => {
          fs.writeFileSync('scripts/screenshot-omnibar-test.png', Buffer.from(d.result.data, 'base64'));
          console.log('Saved scripts/screenshot-omnibar-test.png');
        });
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
