export function reviewRedactor(names: string[], publicEmails: Set<string>) {
  const counts: Record<string, number> = {};
  const mark = (category: string, replacement: string) => {
    counts[category] = (counts[category] ?? 0) + 1;
    return replacement;
  };
  const identities = [
    ...new Set(names.flatMap((n) => [n, ...n.split(/\s+/)]).filter((n) => n.trim().length >= 3)),
  ].sort((a, b) => b.length - a.length);
  const escape = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function text(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value !== 'string') return mark('INVALID_TEXT', '[INVALID_TEXT]');
    let out = value
      .replace(
        /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AIza[A-Za-z0-9_-]{35}|sk-[A-Za-z0-9_-]{20,})\b/g,
        () => mark('SECRET', '[SECRET]'),
      )
      .replace(
        /\b(?:access_token|refresh_token|client_secret|api_key|password|cookie|authorization)\s*[=:]\s*["']?[^\s"',;<>]+/gi,
        () => mark('SECRET_PARAMETER', '[SECRET_PARAMETER]'),
      )
      .replace(/https?:\/\/[^\s<>"')\]]+/gi, (v) => {
        try {
          const u = new URL(v);
          if (u.username || u.password) return mark('URL_AUTH', '[PRIVATE_URL]');
          if (u.search || u.hash) {
            u.search = '';
            u.hash = '';
            mark('URL_PARAMETERS', '');
          }
          return u.href;
        } catch {
          return mark('URL_INVALID', '[INVALID_URL]');
        }
      })
      .replace(/["'][A-Za-z]:[\\/][^\r\n"'<>]+["']/g, () => mark('LOCAL_PATH', '[LOCAL_PATH]'))
      .replace(/(?<![\p{L}\p{N}])[A-Za-z]:[\\/][^\s"'<>]+/gu, () =>
        mark('LOCAL_PATH', '[LOCAL_PATH]'),
      )
      .replace(/(?<![\p{L}\p{N}:\/])\/(?:Users|home|private|tmp)\/[^\s"'<>]+/gu, () =>
        mark('LOCAL_PATH', '[LOCAL_PATH]'),
      )
      .replace(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (v) =>
        publicEmails.has(v.toLowerCase()) ? v : mark('PRIVATE_EMAIL', '[PRIVATE_EMAIL]'),
      )
      .replace(/(?:\+48[ \t-]*)?(?<![\p{L}\d])\d{3}[ -]?\d{3}[ -]?\d{3}(?![\p{L}\d])/gu, () =>
        mark('PHONE', '[PHONE]'),
      );
    for (const name of identities)
      out = out.replace(
        new RegExp('(?<![\\p{L}\\p{N}])' + escape(name) + '(?![\\p{L}\\p{N}])', 'giu'),
        () => mark('CANDIDATE_IDENTITY', '[CANDIDATE]'),
      );
    return out;
  }
  function url(value: unknown): string | null {
    const out = text(value);
    if (out === null) return null;
    const at = out.search(/[?#]/);
    return at < 0 ? out : mark('URL_PARAMETERS', out.slice(0, at));
  }
  return { text, url, counts };
}
