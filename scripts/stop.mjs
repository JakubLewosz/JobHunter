import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { dir } from './paths.mjs';
try {
  const launch = JSON.parse(readFileSync(join(dir, 'launch.json'), 'utf8'));
  const url = new URL(launch.url);
  const origin = url.origin;
  const token = new URLSearchParams(url.hash.slice(1)).get('access');
  const response = await fetch(`${origin}/api/session`, {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error('Nie udało się potwierdzić lokalnej sesji.');
  const { csrf } = await response.json();
  const cookie = response.headers.getSetCookie()[0].split(';')[0];
  const stopped = await fetch(`${origin}/api/shutdown`, {
    method: 'POST',
    headers: {
      Origin: origin,
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrf,
      Cookie: cookie,
    },
    body: '{}',
  });
  if (!stopped.ok) throw new Error('Nie udało się zatrzymać backendu.');
  console.log('Zatrzymano backend JobHunter.');
} catch (error) {
  console.error('JobHunter:', error.message);
  process.exitCode = 1;
}
