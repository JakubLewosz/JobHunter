import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { createBrotliDecompress, createGunzip, createInflate } from 'node:zlib';
import { Readable } from 'node:stream';
import { hash, id, iso, DomainError } from '../util.js';
import { parsePublicHTML, parserVersion, addressContexts, relevantPageLinks } from './html.js';

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
  return parsePublicHTML(html).text;
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
  parser_version?: number;
  address_contexts?: string;
  completeness?: string;
  outbound_links?: string;
  metrics?: {
    httpRequests: number;
    redirects: number;
    wireBytes: number;
    decodedBytes: number;
    elapsedMs?: number;
    httpMs?: number;
  };
};
export interface SourceReader {
  read(url: string, signal?: AbortSignal): Promise<Source>;
  relatedURLs?(url: string): string[];
  recover?(urls?: string[], signal?: AbortSignal): Promise<{ ok: boolean; statuses: string[] }>;
}
type Response = {
  status: number;
  location?: string;
  contentType?: string;
  body: string;
  retryAfter?: string;
  wireBytes?: number;
  decodedBytes?: number;
};
export type ReadFailure = {
  category: 'TLS' | 'DNS' | 'TIMEOUT' | 'HTTP' | 'LIMIT' | 'CANCELLED' | 'NETWORK' | 'POLICY';
  code: string;
  stage: string;
  retryable: boolean;
  size?: { limiter: string; limitBytes: number; wireBytes?: number; decodedBytes?: number };
};
export function readFailure(source: Source): ReadFailure | null {
  try {
    const v = JSON.parse(source.error ?? 'null');
    return v?.category ? v : null;
  } catch {
    return null;
  }
}
export function retryableRead(source: Source) {
  const failure = readFailure(source);
  return failure ? failure.retryable : ['TIMEOUT', 'FETCH_FAILED'].includes(source.status);
}
const tlsCodes = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'CERT_HAS_EXPIRED',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'ERR_TLS_CERT_ALTNAME_INVALID',
]);
export class PublicSourceReader implements SourceReader {
  private commonFailures = new Map<string, Set<string>>();
  private environmentFailure: string | null = null;
  private recovering = false;
  async recover(
    urls = ['https://nodejs.org/', 'https://example.com/', 'https://www.wikipedia.org/'],
    signal?: AbortSignal,
  ) {
    if (
      this.recovering ||
      urls.length < 2 ||
      urls.length > 3 ||
      new Set(urls.map((value) => publicURL(value).hostname)).size !== urls.length
    )
      throw new DomainError(
        'READER_PROBE_INVALID',
        'Probe wymaga dwóch lub trzech niezależnych źródeł.',
      );
    this.recovering = true;
    const previous = this.environmentFailure;
    const combined = AbortSignal.any([AbortSignal.timeout(45000), ...(signal ? [signal] : [])]);
    try {
      const sources: Source[] = [];
      for (const url of urls) {
        combined.throwIfAborted();
        sources.push(await this.performRead(url, combined, true));
      }
      const ok =
        sources.filter((s) => s.status === 'READ' && s.completeness === 'COMPLETE').length >= 2;
      if (ok) {
        this.environmentFailure = null;
        this.commonFailures.clear();
      } else this.environmentFailure = previous ?? this.environmentFailure ?? 'PROBE_FAILED';
      return { ok, statuses: sources.map((s) => s.status) };
    } finally {
      this.recovering = false;
    }
  }
  async preflight(
    urls = ['https://nodejs.org/', 'https://example.com/', 'https://www.wikipedia.org/'],
  ) {
    const sources: Source[] = [];
    for (const url of urls) sources.push(await this.read(url));
    return {
      ok: sources.filter((s) => s.status === 'READ').length >= 2 && !this.environmentFailure,
      environmentFailure: this.environmentFailure,
      node: process.version,
      systemCA:
        process.execArgv.includes('--use-system-ca') || process.env.NODE_USE_SYSTEM_CA === '1',
      sources,
    };
  }
  private navigation = new Map<string, string[]>();
  relatedURLs(url: string) {
    return this.navigation.get(url) ?? [];
  }
  private active = 0;
  private waiting: (() => void)[] = [];
  private backoff = new Map<string, number>();
  constructor(
    private options: {
      timeoutMs?: number;
      maxBytes?: number;
      maxRedirects?: number;
      beforeRequest?: (url: string) => void;
      onHTML?: (url: string, html: string) => void;
      resolve?: typeof lookup;
      transport?: (url: URL, address: string, signal: AbortSignal) => Promise<Response>;
    } = {},
  ) {}
  async read(input: string, signal?: AbortSignal): Promise<Source> {
    return this.performRead(input, signal, false);
  }
  private async performRead(
    input: string,
    signal?: AbortSignal,
    recovery = false,
  ): Promise<Source> {
    const started = performance.now();
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
      metrics: { httpRequests: 0, redirects: 0, wireBytes: 0, decodedBytes: 0 },
    };
    if (this.active >= 2) await new Promise<void>((r) => this.waiting.push(r));
    this.active++;
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 15000);
    const combined = signal ? AbortSignal.any([timeout, signal]) : timeout;
    let stage = 'POLICY';
    let failedHost = new URL(original).hostname;
    try {
      if (this.environmentFailure && !recovery)
        throw new DomainError(
          'READER_ENVIRONMENT',
          'Podejrzenie wspólnej awarii czytnika; seria wstrzymana.',
        );
      let url = new URL(original);
      for (let redirects = 0; ; redirects++) {
        combined.throwIfAborted();
        publicURL(url.href);
        if ((this.backoff.get(url.hostname) ?? 0) > Date.now())
          throw new DomainError('HTTP_429', 'Serwis ograniczył odczyty; spróbuj później.');
        stage = 'DNS';
        failedHost = url.hostname;
        const host = url.hostname.replace(/^\[|\]$/g, '');
        const resolving = isIP(host)
          ? Promise.resolve([{ address: host, family: isIP(host) }])
          : (this.options.resolve ?? lookup)(host, { all: true, verbatim: true });
        const addresses = await abortable(resolving, combined);
        if (!addresses.length || addresses.some((x) => !publicIP(x.address)))
          throw new DomainError('SSRF_BLOCKED', 'DNS wskazuje niepubliczny adres.');
        stage = 'BUDGET';
        this.options.beforeRequest?.(url.href);
        stage = 'HTTP';
        result.metrics!.httpRequests++;
        const httpStarted = performance.now();
        const response = await (this.options.transport ?? this.download.bind(this))(
          url,
          addresses[0].address,
          combined,
        );
        result.metrics!.httpMs = (result.metrics!.httpMs ?? 0) + performance.now() - httpStarted;
        result.metrics!.wireBytes += response.wireBytes ?? Buffer.byteLength(response.body ?? '');
        result.metrics!.decodedBytes +=
          response.decodedBytes ?? Buffer.byteLength(response.body ?? '');
        if (Buffer.byteLength(response.body ?? '') > (this.options.maxBytes ?? 1024 * 1024))
          throw new DomainError('SIZE_LIMIT', 'Limit treści.', 409, {
            limiter: 'BODY',
            limitBytes: this.options.maxBytes ?? 1024 * 1024,
            decodedBytes: Buffer.byteLength(response.body),
          });
        result.final_url = url.href;
        result.http_status = response.status;
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (redirects >= (this.options.maxRedirects ?? 4))
            throw new DomainError('REDIRECT_LIMIT', 'Zbyt wiele przekierowań.');
          if (!response.location)
            throw new DomainError('BAD_REDIRECT', 'Brak adresu przekierowania.');
          url = publicURL(new URL(response.location, url).href);
          result.metrics!.redirects++;
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
          result.error = JSON.stringify({
            category: 'HTTP',
            code: `HTTP_${response.status}`,
            stage,
            retryable: [408, 502, 503, 504].includes(response.status),
          });
          break;
        }
        stage = 'PARSE';
        if (
          !/^(text\/html|text\/plain|application\/xhtml\+xml)\b/i.test(response.contentType ?? '')
        )
          throw new DomainError('UNSUPPORTED_CONTENT', 'Odczytujemy tylko strony HTML i tekst.');
        result.title = textFromHTML(
          response.body.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '',
        ).slice(0, 300);
        const parsed = /^text\/plain\b/i.test(response.contentType ?? '')
          ? {
              text: response.body.slice(0, 100000),
              contexts: addressContexts(response.body),
              completeness: response.body.length > 100000 ? 'TEXT_LIMIT' : 'COMPLETE',
              outboundLinks: [],
            }
          : parsePublicHTML(response.body);
        result.text = parsed.text;
        result.parser_version = parserVersion;
        result.address_contexts = JSON.stringify(parsed.contexts);
        result.completeness = parsed.completeness;
        if (parsed.contexts.some((c) => c.complete === false))
          result.completeness = 'CONTEXT_LIMIT';
        result.outbound_links = JSON.stringify(parsed.outboundLinks);
        if (
          /captcha|verify you are human|just a moment|access denied|checking your browser/i.test(
            result.title + ' ' + result.text.slice(0, 600),
          )
        ) {
          result.status = 'ACCESS_BLOCKED';
          result.text = '';
          break;
        }
        result.status =
          result.completeness !== 'COMPLETE' ? 'INCOMPLETE' : result.text ? 'READ' : 'EMPTY';
        if (result.status === 'READ') this.commonFailures.clear();
        if (result.status === 'READ') {
          if (this.navigation.size >= 128)
            this.navigation.delete(this.navigation.keys().next().value!);
          this.navigation.set(url.href, relevantPageLinks(response.body, url.href));
          this.options.onHTML?.(url.href, response.body);
        }
        result.content_hash = hash(JSON.stringify({ parserVersion, body: response.body }));
        result.fragment = result.text.slice(0, 1200);
        break;
      }
    } catch (error) {
      if (signal?.aborted) throw new DomainError('CANCELLED', 'Przerwano odczyt.');
      const rawCode =
        error instanceof DomainError ? error.code : (error as { code?: string })?.code;
      const code = timeout.aborted
        ? 'TIMEOUT'
        : /^[A-Z][A-Z0-9_]{0,70}$/.test(rawCode ?? '')
          ? rawCode!
          : 'FETCH_FAILED';
      const category: ReadFailure['category'] = tlsCodes.has(code)
        ? 'TLS'
        : ['ENOTFOUND', 'EAI_AGAIN', 'EAI_FAIL'].includes(code)
          ? 'DNS'
          : code === 'TIMEOUT'
            ? 'TIMEOUT'
            : code.startsWith('HTTP_')
              ? 'HTTP'
              : /LIMIT|BUDGET/.test(code)
                ? 'LIMIT'
                : code === 'CANCELLED'
                  ? 'CANCELLED'
                  : error instanceof DomainError
                    ? 'POLICY'
                    : 'NETWORK';
      result.status =
        category === 'TLS' ? 'TLS_UNTRUSTED' : category === 'DNS' ? 'DNS_FAILED' : code;
      const size =
        error instanceof DomainError && code === 'SIZE_LIMIT' && error.details
          ? {
              limiter: String(error.details.limiter),
              limitBytes: Number(error.details.limitBytes),
              wireBytes: Number(error.details.wireBytes ?? 0),
              decodedBytes: Number(error.details.decodedBytes ?? 0),
            }
          : null;
      if (size && size.limiter !== 'BODY') {
        result.metrics!.wireBytes += size.wireBytes;
        result.metrics!.decodedBytes += size.decodedBytes;
      }
      result.error = JSON.stringify({
        category,
        code,
        stage,
        retryable: ['TIMEOUT', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE'].includes(code),
        ...(size ? { size } : {}),
      } satisfies ReadFailure);
      // Independent sites with the same failure suggest an environment problem, never a firm refusal.
      if (['TLS', 'DNS', 'TIMEOUT', 'NETWORK'].includes(category)) {
        const key = category + ':' + code;
        const hosts = this.commonFailures.get(key) ?? new Set<string>();
        hosts.add(failedHost.replace(/^www\./, ''));
        this.commonFailures.set(key, hosts);
        if (hosts.size >= 3) this.environmentFailure = key;
      }
    } finally {
      result.metrics!.elapsedMs = performance.now() - started;
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
            (wireBytes, decodedBytes) => {
              Object.assign(meta, { wireBytes, decodedBytes });
            },
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
  metrics?: (wireBytes: number, decodedBytes: number) => void,
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
      if (wire > max)
        fail(
          new DomainError('SIZE_LIMIT', 'Limit pobierania.', 409, {
            limiter: 'WIRE',
            limitBytes: max,
            wireBytes: wire,
            decodedBytes: size,
          }),
        );
    });
    if (decoded !== stream) stream.pipe(decoded as ReturnType<typeof createGunzip>);
    decoded.on('error', fail);
    decoded.on('data', (b: Buffer) => {
      size += b.length;
      if (size > max)
        fail(
          new DomainError('SIZE_LIMIT', 'Limit treści po dekompresji.', 409, {
            limiter: 'DECOMPRESSED',
            limitBytes: max,
            wireBytes: wire,
            decodedBytes: size,
          }),
        );
      else chunks.push(b);
    });
    decoded.on('end', () => {
      metrics?.(wire, size);
      signal.removeEventListener('abort', abort);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    decoded.on('close', () => signal.removeEventListener('abort', abort));
    if (signal.aborted) abort();
  });
}
