import { useEffect, useState } from 'react';
import { api } from './api';
import type { Row } from '../../../packages/shared/types';
import { defaultMessageTemplate } from '../../server/src/research/drafting';
type Act = (fn: () => Promise<unknown>, message?: string) => Promise<void>;
const projectNames: Record<string, string> = {
  fixdesk: 'FixDesk',
  autorelay: 'AutoRelay',
  codefabric: 'CodeFabric',
  elektroscan: 'ElektroScan',
};
const personalNames: Record<string, string> = {
  identity: 'Imię i nazwisko',
  education: 'Szkoła',
  availability: 'Dostępność',
  ai: 'Korzystanie z AI',
  portfolio: 'Link do portfolio',
  contract: 'Forma współpracy',
};
export function PersonalMaterials({
  profile,
  act,
  busy,
}: {
  profile: Row;
  act: Act;
  busy: boolean;
}) {
  const [message, setMessage] = useState(profile.message_template as string);
  const [facts, setFacts] = useState<Row[]>(profile.facts);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    setMessage(profile.message_template);
    setFacts(profile.facts);
    setDirty(false);
  }, [profile.version]);
  const editFact = (id: string, content: string) => {
    setFacts(facts.map((f) => (f.id === id ? { ...f, content } : f)));
    setDirty(true);
  };
  const save = () =>
    api(
      'profile',
      {
        name: profile.name,
        goal: profile.goal,
        hours_approx: profile.hours_approx,
        message_template: message,
        version: profile.version,
        facts: facts.map((f) => ({ id: f.id, content: f.content })),
      },
      'PUT',
    );
  return (
    <div className="stack personal-materials">
      <section className="panel research-panel">
        <div className="panel-head">
          <div>
            <h2>Moja wiadomość</h2>
            <p>
              To punkt wyjścia do naturalnego zgłoszenia. Codex dopasuje nawiązanie, projekt i
              pytanie do firmy.
            </p>
          </div>
        </div>
        <label>
          Wiadomość bazowa
          <textarea
            aria-label="Wiadomość bazowa"
            rows={16}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setDirty(true);
            }}
          />
        </label>
        <div className="button-row">
          <button
            className="secondary"
            disabled={busy}
            onClick={() => {
              setMessage(
                defaultMessageTemplate.replace('około 20', `około ${profile.hours_approx}`),
              );
              setDirty(true);
            }}
          >
            Użyj naturalnego schematu zgłoszenia
          </button>
          <button
            className="primary"
            disabled={busy || (!dirty && !!profile.approved_at)}
            onClick={() =>
              void act(async () => {
                if (dirty) await save();
                await api('profile/approve', {});
              }, 'Materiały zatwierdzone. Możesz uruchomić szukanie firm.')
            }
          >
            {profile.approved_at && !dirty
              ? 'Materiały zatwierdzone'
              : 'Zapisz i zatwierdź moje materiały'}
          </button>
        </div>
      </section>
      <section className="panel research-panel">
        <div className="panel-head">
          <div>
            <h2>Moje projekty</h2>
            <p>
              Zwykle jeden pasujący projekt; wyjątkowo dwa przy odrębnych potrzebach. Bez
              dopasowania opis jest pomijany.
            </p>
          </div>
        </div>
        {facts
          .filter((f) => projectNames[f.fact_key])
          .map((f) => (
            <label key={f.id}>
              {projectNames[f.fact_key]}
              <textarea
                aria-label={`Opis projektu ${projectNames[f.fact_key]}`}
                rows={2}
                value={f.content}
                onChange={(e) => editFact(f.id, e.target.value)}
              />
            </label>
          ))}
      </section>
      <section className="panel research-panel">
        <div className="panel-head">
          <div>
            <h2>Moje CV</h2>
            <p>Plik do przyszłych wiadomości. Obecnie aplikacja nie wysyła poczty.</p>
          </div>
        </div>
        <label>
          Dodaj CV (PDF)
          <input
            type="file"
            accept="application/pdf,.pdf"
            aria-label="Dodaj CV PDF"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              void act(async () => {
                if (file.size > 5 * 1024 * 1024) throw new Error('CV może mieć do 5 MB.');
                const reader = new FileReader();
                const base64 = await new Promise<string>((resolve, reject) => {
                  reader.onload = () => resolve(String(reader.result).split(',')[1]);
                  reader.onerror = reject;
                  reader.readAsDataURL(file);
                });
                await api('cv', { fileName: file.name, base64 });
              }, 'CV zapisane.');
            }}
          />
        </label>
        {profile.cvs.map((cv: Row) => (
          <p key={cv.id}>
            <strong>{cv.file_name}</strong> ·{' '}
            <a href={`/api/cv/${cv.id}/preview`} target="_blank" rel="noreferrer">
              Podgląd
            </a>
            {' · '}
            {cv.approved_at ? (
              'zatwierdzone'
            ) : (
              <button
                className="text-button"
                disabled={busy}
                onClick={() =>
                  void act(
                    () => api(`cv/${cv.id}/approve`, {}),
                    'CV zatwierdzone do przygotowania załącznika. Bez wysyłki.',
                  )
                }
              >
                Przejrzałem — zatwierdź CV
              </button>
            )}
          </p>
        ))}
      </section>
      <details className="panel research-panel personal-details">
        <summary>Dane, z których korzysta Codex</summary>
        <p>
          Te informacje i opisy projektów zatwierdzasz przyciskiem powyżej. Około{' '}
          {profile.hours_approx} godzin tygodniowo po lekcjach.
        </p>
        {facts
          .filter((f) => !projectNames[f.fact_key])
          .map((f) => (
            <label key={f.id}>
              {personalNames[f.fact_key] ?? 'Dodatkowa informacja'}
              <textarea
                rows={2}
                disabled={f.fact_key === 'availability'}
                value={f.content}
                onChange={(e) => editFact(f.id, e.target.value)}
              />
            </label>
          ))}
      </details>
    </div>
  );
}
