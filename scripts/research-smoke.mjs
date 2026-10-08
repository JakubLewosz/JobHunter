// Explicit, small online smoke run. Never approves a profile or any message.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { base } from './paths.mjs';
const launch = JSON.parse(readFileSync(join(base, 'research-only', 'launch.json'), 'utf8'));
const endpoint = `http://127.0.0.1:${launch.port}`;
const health = await (await fetch(endpoint + '/api/health')).json();
if (health.mode !== 'RESEARCH_ONLY') throw new Error('Uruchom backend RESEARCH_ONLY.');
const token = new URLSearchParams(new URL(launch.url).hash.slice(1)).get('access');
const session = await fetch(endpoint + '/api/session', {
  method: 'POST',
  headers: { Origin: endpoint, 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
if (!session.ok) throw new Error('Nie udało się utworzyć lokalnej sesji.');
const cookie = session.headers.get('set-cookie').split(';')[0],
  csrf = (await session.json()).csrf;
async function api(path, body) {
  const response = await fetch(endpoint + '/api/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Cookie: cookie,
      Origin: endpoint,
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? 'Błąd smoke testu.');
  return result;
}
let capabilities = await api('capabilities');
if (!capabilities.items.find((c) => c.name === 'Codex runtime')?.tested) {
  console.log('Test strukturalny CLI na fikcyjnych danych…');
  await api('integrations/codex/probe', {});
}
if (!capabilities.items.find((c) => c.name === 'Rzeczywiste wyszukiwanie')?.tested) {
  console.log('Test rzeczywistego web search bez profilu…');
  await api('integrations/search/probe', {});
}
if (!(await api('profile')).approved_at) {
  console.log(
    'WAITING_FOR_PROFILE: w panelu RESEARCH_ONLY otwórz Profil i CV, przejrzyj propozycje i kliknij Zatwierdź profil. Nie uruchomiono cyklu kandydatów.',
  );
  process.exitCode = 2;
} else {
  await api('research/search', {});
  const deadline = Date.now() + 25 * 60000;
  while (Date.now() < deadline) {
    const d = await api('dashboard');
    const run = d.runs[0];
    console.log(
      `Etap: ${run?.stage ?? 'brak'}; status: ${run?.status ?? 'brak'}; wysyłki: ${d.stats.sent}; szkice dziś: ${d.stats.drafts}.`,
    );
    if (run && ['COMPLETED', 'PAUSED', 'CANCELLED'].includes(run.status)) {
      if (run.status !== 'COMPLETED') process.exitCode = 3;
      console.log(
        run.status === 'COMPLETED'
          ? 'Wyniki zapisane w panelu: Firmy i oferty / Wiadomości / Raporty.'
          : 'Cykl niepełny. Sprawdź zapisany błąd i etap w panelu.',
      );
      break;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }
}
