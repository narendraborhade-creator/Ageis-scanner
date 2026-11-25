async function main() {
  const list = await fetch('http://127.0.0.1:9222/json').then(r => r.json());
  const page = list.find(p => p.type === 'page' && p.url.includes('Ageis-scanner'));
  if (!page) {
    console.log('No page found');
    return;
  }
  console.log('Connecting to', page.webSocketDebuggerUrl);
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  ws.onopen = () => {
    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
    ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
    ws.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: { expression: '({ title: document.title, rootLen: document.querySelector("#root")?.innerHTML?.length, iframes: Array.from(document.querySelectorAll("iframe")).map(f => f.src) })', returnByValue: true }
    }));
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id === 3) {
      console.log('Page DOM State:', data.result.result.value);
    } else if (data.method === 'Runtime.consoleAPICalled') {
      console.log('[CONSOLE]', data.params.type, data.params.args.map(a => a.value || a.description).join(' '));
    } else if (data.method === 'Runtime.exceptionThrown') {
      console.log('[EXCEPTION]', data.params.exceptionDetails);
    }
  };

  setTimeout(() => {
    ws.close();
    process.exit(0);
  }, 3000);
}

main().catch(console.error);
