import { createHash, randomUUID } from 'node:crypto';
export const id = () => randomUUID();
export const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
export const iso = (date: Date = new Date()) => date.toISOString();
export function day(date: Date = new Date(), timezone = 'Europe/Warsaw') {
  const p = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const val = (t: string) => p.find((x) => x.type === t)!.value;
  return `${val('year')}-${val('month')}-${val('day')}`;
}
export function inWindow(date: Date, start: string, end: string, timezone = 'Europe/Warsaw') {
  const p = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const val = (t: string) => p.find((x) => x.type === t)!.value;
  const time = `${val('hour')}:${val('minute')}`;
  return !['Sat', 'Sun'].includes(val('weekday')) && time >= start && time < end;
}
export const normalizeName = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
export const normalizeEmail = (email: string) => email.trim().toLowerCase();
export function companyDomain(domain?: string | null) {
  if (!domain) return null;
  const result = domain
    .toLowerCase()
    .replace(/^www\./, '')
    .replace(/\.$/, '');
  return [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'greenhouse.io',
    'lever.co',
    'workable.com',
  ].some((d) => result === d || result.endsWith(`.${d}`))
    ? null
    : result;
}
export function csvCell(value: unknown) {
  const s = String(value ?? '');
  const safe = /^[\s]*[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replaceAll('"', '""')}"`;
}
export class DomainError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 409,
  ) {
    super(message);
  }
}
