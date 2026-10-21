import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';

export async function createLocalFixturePage() {
  const html = readFileSync(new URL('../tests/fixtures/gmail-compose.html', import.meta.url));
  const server = createServer((req, res) => {
    if (req.method !== 'GET' || !req.url?.startsWith('/fixture')) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; form-action 'none'; base-uri 'none'",
    });
    res.end(html);
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return {
    origin,
    url: origin + '/fixture?no-id',
    close: () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  };
}
