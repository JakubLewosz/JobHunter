import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DomainError } from './util.js';

export type Runtime = { kind: 'DEVELOPMENT' | 'WORKSTATION'; assertNative: () => void };
export function workstationRuntime(profileDir: string, platform = process.platform): Runtime {
  const base = realpathSync(dirname(profileDir));
  const assertNative = () => {
    if (platform !== 'win32')
      throw new DomainError(
        'WORKSTATION_REQUIRED',
        'Prawdziwa poczta działa tylko w instalacji domowego Windowsa.',
      );
    let marker;
    try {
      marker = JSON.parse(readFileSync(join(base, 'workstation.json'), 'utf8'));
    } catch {}
    if (
      marker?.kind !== 'WORKSTATION' ||
      marker?.base !== base ||
      marker?.historyConfirmed !== true ||
      !existsSync(join(profileDir, 'jobhunter.sqlite'))
    )
      throw new DomainError(
        'WORKSTATION_REQUIRED',
        'Sprawdź istniejącą historię i skonfiguruj lokalną instalację roboczą.',
      );
  };
  assertNative();
  return { kind: 'WORKSTATION', assertNative };
}
export const developmentRuntime: Runtime = {
  kind: 'DEVELOPMENT',
  assertNative: () => {
    throw new DomainError('SEND_DISABLED', 'Tryb developerski — bez prawdziwej wysyłki.');
  },
};
