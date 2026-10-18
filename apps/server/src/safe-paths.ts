import { existsSync, realpathSync } from 'node:fs';
import { resolve, dirname, basename, join, relative, isAbsolute, win32, posix } from 'node:path';
import { DomainError } from './util.js';

export function pathContains(parent: string, target: string) {
  const flavor = /^[a-z]:[\\/]|^\\\\/i.test(parent) ? win32 : posix;
  const base = flavor.resolve(parent),
    value = flavor.resolve(target);
  const rel = flavor.relative(base, value);
  return (
    rel === '' || (!flavor.isAbsolute(rel) && rel !== '..' && !rel.startsWith('..' + flavor.sep))
  );
}
export function canonicalPath(path: string): string {
  let parent = resolve(path);
  const suffix: string[] = [];
  while (!existsSync(parent)) {
    const next = dirname(parent);
    if (next === parent)
      throw new DomainError('PATH_INVALID', 'Nie można ustalić katalogu nadrzędnego.');
    suffix.unshift(basename(parent));
    parent = next;
  }
  return join(realpathSync(parent), ...suffix);
}
export function assertOutsideRepository(path: string, repo = process.cwd()) {
  const target = canonicalPath(path),
    root = canonicalPath(repo);
  if (pathContains(root, target) || pathContains(resolve(repo), resolve(path)))
    throw new DomainError('OUTSIDE_REPOSITORY_REQUIRED', 'Wymagany katalog poza repozytorium.');
  return target;
}
