import type { Decision, Row, TriState, ReplyCategory } from '../../../packages/shared/types.js';
import type { Store } from './db.js';
import { hash, id, iso } from './util.js';
import { z } from 'zod';

export interface ResearchProvider {
  probe(): Promise<Row>;
  discover(): Promise<ResearchResult[]>;
}
export interface CodexRunner {
  probe(): Promise<Row>;
  draft(input: Row): Promise<unknown>;
}
export interface MailProvider {
  sendFrozenMessage(input: FrozenMessage): Promise<SendResult>;
  lookupSendResult(messageId: string): Promise<SendResult | null>;
}
export interface FrozenMessage {
  messageId: string;
  recipient: string;
  mime: Buffer;
  mimeHash: string;
  scenario: string;
}
export interface SendResult {
  id: string;
  threadId: string;
  confirmed: boolean;
}
export interface ResearchResult {
  key: string;
  name: string;
  domain: string;
  title: string;
  type: 'ACTIVE' | 'OPEN' | 'ARCHIVED';
  remote: TriState;
  partTime: TriState;
  paid: TriState;
  junior: TriState;
  hours: TriState;
  contactPurpose: 'RECRUITMENT' | 'GENERAL';
  source: string;
  fragment: string;
  email: string;
}
const make = (
  key: string,
  name: string,
  title: string,
  patch: Partial<ResearchResult> = {},
): ResearchResult => ({
  key,
  name,
  domain: `${key}.example.invalid`,
  title,
  type: 'ACTIVE',
  remote: 'yes',
  partTime: 'yes',
  paid: 'yes',
  junior: 'yes',
  hours: 'yes',
  contactPurpose: 'RECRUITMENT',
  source: `https://${key}.example.invalid/kariera`,
  email: `rekrutacja@${key}.example.invalid`,
  fragment:
    'SYMULACJA: płatna praca dla juniora, w pełni zdalnie, 15–20 godzin tygodniowo po lekcjach. Kandydatury przyjmujemy na podany adres.',
  ...patch,
});
export const fixtures: ResearchResult[] = [
  make('aurora', 'Aurora Code', 'Junior Laravel Developer'),
  make('flowbyte', 'Flowbyte Studio', 'Automatyzacje i integracje', {
    type: 'OPEN',
    hours: 'unknown',
    fragment:
      'SYMULACJA: przyjmujemy otwarte kandydatury do płatnej, zdalnej współpracy przy integracjach. Godziny ustalimy indywidualnie.',
  }),
  make('pixel', 'Pixel Forge', 'Junior Frontend Developer', {
    partTime: 'unknown',
    hours: 'unknown',
    fragment: 'SYMULACJA: praca zdalna dla juniora. Wymiar i godziny nie są podane.',
  }),
  make('meridian', 'Meridian Systems', 'Senior Full Stack Developer', {
    junior: 'no',
    partTime: 'no',
    remote: 'no',
    fragment: 'SYMULACJA: wymagane 5 lat doświadczenia komercyjnego, pełny etat w biurze.',
  }),
  make('campus', 'Campus Dev', 'Praktyki programistyczne', {
    paid: 'no',
    fragment: 'SYMULACJA: bezpłatne praktyki.',
  }),
  make('north', 'Northstack', 'Web Developer', {
    remote: 'conflicting',
    fragment: 'SYMULACJA: nagłówek mówi remote, treść wymaga trzech dni w biurze.',
  }),
  make('vector', 'Vector Labs', 'Junior Web & Automation'),
  make('lumen', 'Lumen Digital', 'Junior PHP Developer'),
  make('orbit', 'Orbit Integrations', 'Asystent integracji API'),
  make('old', 'Archive Works', 'Archiwalny Junior Developer', {
    type: 'ARCHIVED',
    fragment: 'SYMULACJA: ogłoszenie w archiwum, rekrutacja zakończona.',
  }),
  make('general', 'Plain Software', 'Kontakt ogólny', {
    contactPurpose: 'GENERAL',
    fragment: 'SYMULACJA: adres biura bez zaproszenia do przesyłania kandydatur.',
  }),
  make('aurora', 'Aurora Code sp. z o.o.', 'Junior Laravel Developer — powtórzenie'),
];
export function qualify(r: ResearchResult): { decision: Decision; reasons: string[] } {
  const reasons: string[] = [];
  const conditions: [string, TriState][] = [
    ['Praca zdalna', r.remote],
    ['Niepełny etat', r.partTime],
    ['Odpłatność', r.paid],
    ['Poziom junior', r.junior],
    ['Godziny po lekcjach', r.hours],
  ];
  for (const [label, val] of conditions)
    if (val !== 'yes')
      reasons.push(
        `${label}: ${val === 'no' ? 'warunek niespełniony' : val === 'conflicting' ? 'sprzeczne źródła' : 'brak potwierdzenia'}`,
      );
  if (conditions.some(([, v]) => v === 'no')) return { decision: 'REJECTED', reasons };
  if (r.type === 'ARCHIVED')
    return {
      decision: 'NEEDS_REVIEW',
      reasons: [...reasons, 'Ogłoszenie archiwalne; brak aktywnej rekrutacji.'],
    };
  if (r.contactPurpose === 'GENERAL')
    return {
      decision: 'NEEDS_REVIEW',
      reasons: [...reasons, 'Kontakt ogólny bez zaproszenia do aplikowania.'],
    };
  if (conditions.some(([, v]) => v === 'conflicting')) return { decision: 'NEEDS_REVIEW', reasons };
  if (r.type === 'OPEN')
    return {
      decision: 'READY_OPEN_INQUIRY',
      reasons: ['Firma jawnie przyjmuje spontaniczne kandydatury.', ...reasons],
    };
  if (conditions.some(([, v]) => v === 'unknown')) return { decision: 'NEEDS_REVIEW', reasons };
  return {
    decision: 'READY_APPLICATION',
    reasons: [
      'Potwierdzona odpłatność, zdalność, niepełny etat i godziny.',
      'Kontakt rekrutacyjny wskazany w źródle.',
    ],
  };
}
export const modelDraftSchema = z
  .object({
    subject: z
      .string()
      .min(1)
      .max(200)
      .refine((s) => !/[\r\n]/.test(s)),
    body: z.string().min(30).max(5000),
    factIds: z.array(z.string()).min(1).max(20),
    evidenceIds: z.array(z.string()).min(1).max(10),
  })
  .strict();
export class MockResearchProvider implements ResearchProvider {
  async probe() {
    return { available: true, configured: true, tested: true, mode: 'DEMO' };
  }
  async discover() {
    return fixtures;
  }
}
export class MockCodexRunner implements CodexRunner {
  async probe() {
    return { available: true, configured: true, tested: true, mode: 'DEMO', model: 'mock-local' };
  }
  async draft(input: Row) {
    return {
      subject: `Kandydatura — ${input.title} — ${input.profile.name}`,
      body: `Dzień dobry,\n\n${input.open ? 'Na Państwa stronie znalazłem zaproszenie do przesyłania otwartych kandydatur.' : `Na Państwa stronie znalazłem ogłoszenie dotyczące stanowiska ${input.title}.`} Chciałbym zapytać o możliwość płatnej, regularnej współpracy przy tworzeniu aplikacji lub automatyzacji.\n\nNazywam się ${input.profile.name} i uczę się w ostatniej klasie Technikum Programistycznego INFOTECH w Białymstoku. Szukam pracy całkowicie zdalnej, około ${input.profile.hours_min}–${input.profile.hours_max} godzin tygodniowo, przede wszystkim po lekcjach.\n\nW projektach portfolio korzystam z programowania wspomaganego AI, szczególnie Codexa. FixDesk to lokalne demo obsługi usterek w PHP/Laravel, a AutoRelay to projekt automatyzacji opartych na webhookach. Traktuję je jako przykłady rozwijanych projektów, które mogą stanowić punkt wyjścia do rozmowy o zadaniach w Państwa zespole.\n\n${input.open ? 'Czy rozważają Państwo taką współpracę i czy możliwe są godziny popołudniowe?' : 'Czy możliwa byłaby współpraca w podanym wymiarze i godzinach popołudniowych?'} Chętnie przedstawię projekty i omówię zakres pracy.\n\nPortfolio: https://github.com/JakubLewosz\n\nPozdrawiam\n${input.profile.name}`,
      factIds: input.factIds,
      evidenceIds: [input.evidenceId],
    };
  }
}
export class MockMailProvider implements MailProvider {
  constructor(private store: Store) {}
  async sendFrozenMessage(input: FrozenMessage): Promise<SendResult> {
    if (!input.recipient.endsWith('.example.invalid')) throw new Error('DEMO_RECIPIENT_REQUIRED');
    if (input.scenario === 'FAIL_BEFORE_SEND') throw new Error('FAILED_NOT_SENT');
    const providerId = `mock-${id()}`;
    this.store.exec(
      'INSERT INTO mock_deliveries VALUES (?,?,?,?,?,?)',
      input.messageId,
      providerId,
      input.recipient,
      input.mimeHash,
      input.scenario,
      iso(),
    );
    if (input.scenario === 'TIMEOUT_AFTER_SEND') throw new Error('SEND_UNKNOWN');
    return {
      id: providerId,
      threadId: `thread-${hash(input.recipient).slice(0, 16)}`,
      confirmed: input.scenario !== 'PROVIDER_ONLY',
    };
  }
  async lookupSendResult(messageId: string) {
    const r = this.store.one('SELECT * FROM mock_deliveries WHERE message_id=?', messageId);
    return r
      ? { id: r.provider_id, threadId: `thread-${hash(r.recipient).slice(0, 16)}`, confirmed: true }
      : null;
  }
}
export const mockReply = (
  name: string,
  scenario = 'NORMAL',
): { category: ReplyCategory; body: string } => {
  if (scenario === 'BOUNCE_REPLY')
    return {
      category: 'BOUNCE',
      body: 'SYMULACJA: trwały zwrot. Podany adres nie istnieje. Nie ponawiaj kontaktu.',
    };
  if (name.includes('Aurora'))
    return {
      category: 'INTERESTED',
      body: 'SYMULACJA: Dziękujemy za wiadomość. Projekty są interesujące. Chętnie porozmawiamy o współpracy w podanym wymiarze.',
    };
  if (name.includes('Flowbyte'))
    return {
      category: 'QUESTION',
      body: 'SYMULACJA: Czy możesz podać dostępność w konkretne dni tygodnia?',
    };
  if (name.includes('Vector'))
    return {
      category: 'AUTORESPONDER',
      body: 'SYMULACJA: Automatyczne potwierdzenie. Otrzymaliśmy zgłoszenie.',
    };
  if (name.includes('Lumen'))
    return {
      category: 'REJECTED',
      body: 'SYMULACJA: Dziękujemy, ale obecnie nie możemy zaoferować współpracy.',
    };
  return {
    category: 'ON_HOLD',
    body: 'SYMULACJA: Rekrutacja jest obecnie wstrzymana. Prosimy nie przesyłać kolejnych zgłoszeń.',
  };
};

export class DisabledMailProvider implements MailProvider {
  async sendFrozenMessage(_input: FrozenMessage): Promise<SendResult> {
    throw new Error('SEND_DISABLED');
  }
  async lookupSendResult(_id: string): Promise<SendResult | null> {
    throw new Error('SEND_DISABLED');
  }
}
