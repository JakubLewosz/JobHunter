import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { Readable } from 'node:stream';
import { hash, id, iso, DomainError } from '../util.js';

export function publicIP(address: string): boolean {
  const ip = address.toLowerCase();
  if (isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || b === 2 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  // Only native global unicast. Excludes mapped IPv4, ULA, multicast, loopback and translation/tunnel ranges.
  if (isIP(ip) !== 6 || ip.includes('.')) return false;
  const halves = ip.split('::');
  const left = halves[0] ? halves[0].split(':') : [],
    right = halves[1] ? halves[1].split(':') : [];
  const words = (
    halves.length === 2
      ? [...left, ...Array(8 - left.length - right.length).fill('0'), ...right]
      : left
  ).map((w) => parseInt(w, 16));
  if (words.length !== 8 || words[0] < 0x2000 || words[0] > 0x3fff) return false;
  return !(
    (words[0] === 0x2001 && (words[1] < 0x200 || words[1] === 0xdb8)) ||
    words[0] === 0x2002 ||
    words[0] === 0x3fff
  );
}
export function publicURL(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DomainError('INVALID_URL', 'Nieprawidłowy publiczny URL.', 400);
  }
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && url.port !== (url.protocol === 'https:' ? '443' : '80')) ||
    host === 'localhost' ||
    /\.(localhost|local|internal|invalid)$/.test(host) ||
    (isIP(host) && !publicIP(host)) ||
    (!isIP(host) && !host.includes('.'))
  )
    throw new DomainError(
      'SSRF_BLOCKED',
      'Dozwolone są wyłącznie publiczne strony HTTP/HTTPS na standardowych portach.',
      400,
    );
  url.hash = '';
  return url;
}
export function textFromHTML(html: string): string {
  return html
    .replace(/<(script|style|noscript|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, n: string) => {
      const code = n[0].toLowerCase() === 'x' ? parseInt(n.slice(1), 16) : Number(n);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
    })
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp);/g,
      (_, n: string) => ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[n]!,
    )
    .replace(/\s+/g, ' ')
    .trim();
}
export type Source = {
  id: string;
  original_url: string;
  final_url: string | null;
  title: string;
  fetched_at: string;
  method: string;
  status: string;
  http_status: number | null;
  fragment: string;
  content_hash: string | null;
  text: string;
  error: string | null;
};
export interface SourceReader {
  read(url: string, signal?: AbortSignal): Promise<Source>;
}
type Response = {
  status: number;
  location?: string;
  contentType?: string;
  body: string;
  retryAfter?: string;
};
export class PublicSourceReader implements SourceReader {
  private active = 0;
  private waiting: (() => void)[] = [];
  private backoff = new Map<string, number>();
  constructor(
    private options: {
      timeoutMs?: number;
      maxBytes?: number;
      maxRedirects?: number;
      resolve?: typeof lookup;
      transport?: (url: URL, address: string, signal: AbortSignal) => Promise<Response>;
    } = {},
  ) {}
  async read(input: string, signal?: AbortSignal): Promise<Source> {
    const original = publicURL(input).href;
    const result: Source = {
      id: id(),
      original_url: original,
      final_url: null,
      title: '',
      fetched_at: iso(),
      method: 'PUBLIC_HTTP',
      status: 'UNAVAILABLE',
      http_status: null,
      fragment: '',
      content_hash: null,
      text: '',
      error: null,
    };
    if (this.active >= 2) await new Promise<void>((r) => this.waiting.push(r));
    this.active++;
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 15000);
    const combined = signal ? AbortSignal.any([timeout, signal]) : timeout;
    try {
      let url = new URL(original);
      for (let redirects = 0; ; redirects++) {
        combined.throwIfAborted();
        publicURL(url.href);
        if ((this.backoff.get(url.hostname) ?? 0) > Date.now())
          throw new DomainError('HTTP_429', 'Serwis ograniczył odczyty; spróbuj później.');
        const host = url.hostname.replace(/^\[|\]$/g, '');
        const resolving = isIP(host)
          ? Promise.resolve([{ address: host, family: isIP(host) }])
          : (this.options.resolve ?? lookup)(host, { all: true, verbatim: true });
        const addresses = await abortable(resolving, combined);
        if (!addresses.length || addresses.some((x) => !publicIP(x.address)))
          throw new DomainError('SSRF_BLOCKED', 'DNS wskazuje niepubliczny adres.');
        const response = await (this.options.transport ?? this.download.bind(this))(
          url,
          addresses[0].address,
          combined,
        );
        if (Buffer.byteLength(response.body ?? '') > (this.options.maxBytes ?? 1024 * 1024))
          throw new DomainError('SIZE_LIMIT', 'Limit treści.');
        result.final_url = url.href;
        result.http_status = response.status;
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (redirects >= (this.options.maxRedirects ?? 4))
            throw new DomainError('REDIRECT_LIMIT', 'Zbyt wiele przekierowań.');
          if (!response.location)
            throw new DomainError('BAD_REDIRECT', 'Brak adresu przekierowania.');
          url = publicURL(new URL(response.location, url).href);
          continue;
        }
        if (response.status === 429) {
          const seconds = Number(response.retryAfter);
          this.backoff.set(
            url.hostname,
            Date.now() +
              Math.min(300000, Math.max(30000, Number.isFinite(seconds) ? seconds * 1000 : 60000)),
          );
          throw new DomainError('HTTP_429', 'Serwis ograniczył odczyty; nie ponawiano żądania.');
        }
        if (response.status !== 200) {
          result.status = [401, 403].includes(response.status)
            ? 'ACCESS_BLOCKED'
            : response.status === 404
              ? 'NOT_FOUND'
              : 'HTTP_ERROR';
          break;
        }
        if (
          !/^(text\/html|text\/plain|application\/xhtml\+xml)\b/i.test(response.contentType ?? '')
        )
          throw new DomainError('UNSUPPORTED_CONTENT', 'Odczytujemy tylko strony HTML i tekst.');
        result.title = textFromHTML(
          response.body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '',
        ).slice(0, 300);
        result.text = textFromHTML(response.body).slice(0, 100000);
        if (
          /captcha|verify you are human|just a moment|access denied|checking your browser/i.test(
            result.title + ' ' + result.text.slice(0, 600),
          )
        ) {
          result.status = 'ACCESS_BLOCKED';
          result.text = '';
          break;
        }
        result.status = result.text ? 'READ' : 'EMPTY';
        result.content_hash = hash(response.body);
        result.fragment = result.text.slice(0, 1200);
        break;
      }
    } catch (error) {
      if (signal?.aborted) throw new DomainError('CANCELLED', 'Przerwano odczyt.');
      result.status = timeout.aborted
        ? 'TIMEOUT'
        : error instanceof DomainError
          ? error.code
          : 'FETCH_FAILED';
      result.error = result.status; // Never persist raw errors that may contain credentials or private paths.
    } finally {
      this.active--;
      this.waiting.shift()?.();
    }
    return result;
  }
  private download(url: URL, address: string, signal: AbortSignal): Promise<Response> {
    return new Promise((resolve, reject) => {
      const request = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
        url,
        {
          method: 'GET',
          signal,
          agent: false,
          headers: {
            'User-Agent': 'JobHunter/0.2 public research',
            Accept: 'text/html,text/plain',
            'Accept-Encoding': 'gzip, deflate, br',
          },
          // Pin the checked address. No second DNS lookup, proxies, cookies or credentials.
          lookup: (_host, opts, cb) => {
            if (opts.all) (cb as Function)(null, [{ address, family: isIP(address) }]);
            else cb(null, address, isIP(address));
          },
        },
        (response) => {
          const meta = {
            status: response.statusCode ?? 0,
            location: response.headers.location,
            contentType: response.headers['content-type'],
            retryAfter: response.headers['retry-after'],
          };
          if (meta.status !== 200) {
            response.destroy();
            resolve({ ...meta, body: '' });
            return;
          }
          decodePage(
            response,
            response.headers['content-encoding'],
            this.options.maxBytes ?? 1024 * 1024,
            signal,
          ).then(
            (body) => resolve({ ...meta, body }),
            (error) => {
              request.destroy();
              reject(error);
            },
          );
        },
      );
      request.on('error', reject);
      request.end();
    });
  }
}
async function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

export async function decodePage(
  stream: Readable,
  encoding: string | undefined,
  max: number,
  signal: AbortSignal,
): Promise<string> {
  if (encoding && !['gzip', 'deflate', 'br', 'identity'].includes(encoding)) {
    stream.destroy();
    throw new DomainError('UNSUPPORTED_ENCODING', 'Nieobsługiwane kodowanie.');
  }
  const decoded =
    encoding === 'gzip'
      ? createGunzip()
      : encoding === 'deflate'
        ? createInflate()
        : encoding === 'br'
          ? createBrotliDecompress()
          : stream;
  return new Promise((resolve, reject) => {
    let wire = 0,
      size = 0;
    const chunks: Buffer[] = [];
    const fail = (error: unknown) => {
      stream.destroy();
      if (decoded !== stream) decoded.destroy();
      reject(error);
    };
    const abort = () => fail(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    stream.on('error', fail);
    stream.on('data', (b: Buffer) => {
      wire += b.length;
      if (wire > max) fail(new DomainError('SIZE_LIMIT', 'Limit pobierania.'));
    });
    if (decoded !== stream) stream.pipe(decoded as ReturnType<typeof createGunzip>);
    decoded.on('error', fail);
    decoded.on('data', (b: Buffer) => {
      size += b.length;
      if (size > max) fail(new DomainError('SIZE_LIMIT', 'Limit treści po dekompresji.'));
      else chunks.push(b);
    });
    decoded.on('end', () => {
      signal.removeEventListener('abort', abort);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    decoded.on('close', () => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}
