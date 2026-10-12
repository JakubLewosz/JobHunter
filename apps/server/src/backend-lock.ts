import {
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DomainError } from './util.js';

export function acquireProfileLock(dir: string) {
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  const root = realpathSync(dir),
    path = join(root, 'profile.lock'),
    instance = randomUUID();
  const acquisition = join(root, 'profile-acquire.lock');
  try {
    mkdirSync(acquisition, { mode: 0o700 });
  } catch {
    throw new DomainError(
      'PROFILE_LOCKED',
      'Trwa otwieranie profilu lub pozostała przerwana blokada otwarcia. Sprawdź poprzedni proces.',
    );
  }
  try {
    if (existsSync(path)) {
      let owner;
      try {
        owner = JSON.parse(readFileSync(join(path, 'owner.json'), 'utf8'));
      } catch {
        throw new DomainError(
          'PROFILE_LOCKED',
          'Blokada profilu wymaga sprawdzenia; drugi backend nie jest uruchamiany.',
        );
      }
      try {
        process.kill(owner.pid, 0);
      } catch (e: any) {
        if (e.code === 'ESRCH') {
          const stale = path + '.stale-' + instance;
          renameSync(path, stale);
          rmSync(stale, { recursive: true });
        } else
          throw new DomainError(
            'PROFILE_LOCKED',
            'Nie można potwierdzić zakończenia poprzedniego backendu.',
          );
      }
    }
    try {
      mkdirSync(path, { mode: 0o700 });
    } catch {
      throw new DomainError(
        'PROFILE_LOCKED',
        'Ten lokalny profil jest już używany przez backend, również na innym porcie.',
      );
    }
    writeFileSync(join(path, 'owner.json'), JSON.stringify({ pid: process.pid, instance }), {
      mode: 0o600,
    });
  } finally {
    rmSync(acquisition, { recursive: true });
  }
  const assert = () => {
    try {
      const owner = JSON.parse(readFileSync(join(path, 'owner.json'), 'utf8'));
      if (realpathSync(dir) === root && owner.instance === instance && owner.pid === process.pid)
        return;
    } catch {}
    throw new DomainError(
      'PROFILE_LOCK_LOST',
      'Utracono lokalną blokadę historii. Zatrzymaj backend i sprawdź profil.',
    );
  };
  return {
    assert,
    release: () => {
      assert();
      rmSync(path, { recursive: true });
    },
  };
}
