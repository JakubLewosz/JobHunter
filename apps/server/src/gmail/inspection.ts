import { parseHeaderValue } from 'nodemailer/lib/mime-funcs/index.js';
import { hash } from '../util.js';

// Bounded offline inspection of our MIME subset, not a complete RFC validator.
// Unsupported/incomplete input fails closed; no URLs or attachment content are executed.
export const maxMimeBytes = 12 * 1024 * 1024;
export function decodeSubject(text: string) {
  return text
    .replace(/(\?=)\s+(=\?)/g, '$1$2')
    .replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, (whole, charset, encoding, value) => {
      try {
        const bytes =
          encoding.toLowerCase() === 'b'
            ? Buffer.from(value, 'base64')
            : Buffer.from(
                value
                  .replace(/_/g, ' ')
                  .replace(/=([0-9a-f]{2})/gi, (_: string, n: string) =>
                    String.fromCharCode(parseInt(n, 16)),
                  ),
                'latin1',
              );
        return new TextDecoder(charset, { fatal: true }).decode(bytes);
      } catch {
        return whole;
      }
    });
}
export interface MimePart {
  type: string;
  disposition: string;
  filename: string;
  charset: string;
  encoding: string;
  bytes: Buffer;
  text?: string;
}
export function inspectMime(raw: Buffer) {
  if (!raw.length || raw.length > maxMimeBytes) throw new Error('MIME_SIZE');
  const source = raw.toString('latin1');
  if (/(?<!\r)\n|\r(?!\n)/.test(source)) throw new Error('MIME_REQUIRES_CRLF');
  const parts: MimePart[] = [],
    boundaries: string[] = [];
  let count = 0;
  const visit = (value: string, depth: number): Record<string, string[]> => {
    if (depth > 15 || ++count > 100) throw new Error('MIME_PART_LIMIT');
    const divider = value.indexOf('\r\n\r\n');
    if (divider < 0 || divider > 256 * 1024) throw new Error('MIME_HEADERS');
    const headers: Record<string, string[]> = {};
    for (const line of value
      .slice(0, divider)
      .replace(/\r\n[ \t]+/g, ' ')
      .split('\r\n')) {
      const match = /^([!-9;-~]+):[ \t]*(.*)$/.exec(line);
      if (!match) throw new Error('MIME_HEADER_SYNTAX');
      (headers[match[1].toLowerCase()] ??= []).push(match[2]);
    }
    for (const name of ['content-type', 'content-transfer-encoding', 'content-disposition'])
      if ((headers[name]?.length ?? 0) > 1) throw new Error('MIME_DUPLICATE_HEADER');
    const type = parseHeaderValue(headers['content-type']?.[0] ?? 'text/plain');
    const body = value.slice(divider + 4);
    if (type.value.toLowerCase().startsWith('multipart/')) {
      const boundary = type.params.boundary;
      if (!boundary || /[\r\n]/.test(boundary)) throw new Error('MIME_BOUNDARY');
      boundaries.push(boundary);
      const escaped = boundary.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const delimiters = [
        ...body.matchAll(new RegExp(`(?:^|\\r\\n)--${escaped}(--)?[ \\t]*(?:\\r\\n|$)`, 'g')),
      ];
      if (
        delimiters.length < 2 ||
        !delimiters.at(-1)![1] ||
        delimiters.slice(0, -1).some((m) => m[1])
      )
        throw new Error('MIME_INCOMPLETE_MULTIPART');
      for (let i = 0; i < delimiters.length - 1; i++) {
        const start = delimiters[i].index! + delimiters[i][0].length;
        // The CRLF introducing a boundary belongs to the delimiter, not to the part.
        visit(body.slice(start, delimiters[i + 1].index), depth + 1);
      }
    } else {
      const encoding = (headers['content-transfer-encoding']?.[0] ?? '7bit').toLowerCase();
      let bytes: Buffer;
      if (encoding === 'base64') {
        const encoded = body.replace(/[ \t\r\n]/g, '');
        if (/[^A-Za-z0-9+/=]/.test(encoded) || encoded.length % 4 !== 0)
          throw new Error('MIME_BASE64');
        bytes = Buffer.from(encoded, 'base64');
        if (bytes.toString('base64') !== encoded) throw new Error('MIME_BASE64');
      } else if (encoding === 'quoted-printable') {
        const joined = body.replace(/=\r\n/g, '');
        if (/=(?![0-9a-f]{2})/i.test(joined)) throw new Error('MIME_QUOTED_PRINTABLE');
        bytes = Buffer.from(
          joined.replace(/=([0-9a-f]{2})/gi, (_, n: string) =>
            String.fromCharCode(parseInt(n, 16)),
          ),
          'latin1',
        );
      } else if (['7bit', '8bit', 'binary'].includes(encoding)) bytes = Buffer.from(body, 'latin1');
      else throw new Error('MIME_UNSUPPORTED_ENCODING');
      const disposition = parseHeaderValue(headers['content-disposition']?.[0] ?? '');
      const filename = decodeSubject(disposition.params.filename ?? type.params.name ?? '');
      const charset = (type.params.charset ?? 'us-ascii').toLowerCase();
      const part: MimePart = {
        type: type.value.toLowerCase(),
        disposition: disposition.value.toLowerCase(),
        filename,
        charset,
        encoding,
        bytes,
      };
      if (part.type.startsWith('text/')) {
        if (['ascii', 'us-ascii'].includes(charset) && bytes.some((b) => b > 127))
          throw new Error('MIME_CHARSET');
        part.text = new TextDecoder(charset, { fatal: true, ignoreBOM: true }).decode(bytes);
      }
      parts.push(part);
    }
    return headers;
  };
  const headers = visit(source, 0);
  return { headers, parts, boundaries };
}
export function compareMime(expected: Buffer, actual: Buffer) {
  const a = inspectMime(expected),
    b = inspectMime(actual);
  const compare = (lfOnly: boolean) =>
    a.parts.length === b.parts.length &&
    a.parts.every((p, i) => {
      const q = b.parts[i];
      if (p.type !== q.type || p.filename !== q.filename || p.disposition !== q.disposition)
        return false;
      // Only CRLF -> LF in decoded text. Never trim, collapse whitespace or rewrite HTML.
      if (
        lfOnly &&
        !p.filename &&
        p.disposition !== 'attachment' &&
        p.text !== undefined &&
        q.text !== undefined
      )
        return p.text.replace(/\r\n/g, '\n') === q.text.replace(/\r\n/g, '\n');
      return p.bytes.equals(q.bytes) && p.text === q.text;
    });
  return {
    rawEqual: expected.equals(actual),
    decodedPartsExact: compare(false),
    decodedPartsLF: compare(true),
    expectedParts: a.parts.length,
    actualParts: b.parts.length,
  };
}
export function mimeReport(raw: Buffer, privateDetails = false) {
  const m = inspectMime(raw);
  const source = raw.toString('latin1');
  const headerBlock = source.slice(0, source.indexOf('\r\n\r\n'));
  const body = source.slice(source.indexOf('\r\n\r\n') + 4);
  const dkimBodyHashes = (m.headers['dkim-signature'] ?? []).map((header) => {
    const tags = Object.fromEntries(
      header.split(';').map((tag) => {
        const i = tag.indexOf('=');
        return [tag.slice(0, i).trim(), tag.slice(i + 1).replace(/\s/g, '')];
      }),
    );
    const mode = (tags.c ?? 'simple/simple').split('/')[1] ?? 'simple';
    if (
      !['rsa-sha256', 'ed25519-sha256'].includes(tags.a) ||
      !tags.bh ||
      !['simple', 'relaxed'].includes(mode)
    )
      return { status: 'unsupported' };
    const canonical =
      mode === 'simple'
        ? body.replace(/(?:\r\n)*$/, '') + '\r\n'
        : body
            .split('\r\n')
            .map((line) => line.replace(/[ \t]+/g, ' ').replace(/[ \t]+$/, ''))
            .join('\r\n')
            .replace(/(?:\r\n)*$/, '');
    let bytes = Buffer.from(canonical + (mode === 'relaxed' && canonical ? '\r\n' : ''), 'latin1');
    if (tags.l !== undefined) {
      if (!/^\d+$/.test(tags.l) || Number(tags.l) > bytes.length)
        return { status: 'invalid-length' };
      bytes = bytes.subarray(0, Number(tags.l));
    }
    const calculated = Buffer.from(hash(bytes), 'hex').toString('base64');
    return {
      bodyCanonicalization: mode,
      matches: calculated === tags.bh,
      signatureCryptographicallyVerified: false,
    };
  });
  return {
    bytes: raw.length,
    sha256: hash(raw),
    base64urlRoundTrip: Buffer.from(raw.toString('base64url'), 'base64url').equals(raw),
    fullRFCValidation: false,
    signatureCryptographicallyVerified: false,
    dkimBodyHashes,
    crlf: (source.match(/\r\n/g) ?? []).length,
    maxPhysicalLineBytes: source.split('\r\n').reduce((max, line) => Math.max(max, line.length), 0),
    headers: Object.fromEntries(
      Object.entries(m.headers).map(([name, values]) => [
        name,
        privateDetails ? values : { count: values.length, sha256: values.map(hash) },
      ]),
    ),
    subject: {
      encodedWordLengths: (m.headers.subject ?? []).flatMap((v) =>
        (v.match(/=\?[^?]+\?[bq]\?[^?]*\?=/gi) ?? []).map((w) => w.length),
      ),
      physicalLineLengths: (headerBlock.match(/^Subject:.*(?:\r\n[ \t].*)*/gim) ?? []).flatMap(
        (v) => v.split('\r\n').map((l) => l.length),
      ),
      ...(privateDetails
        ? {
            raw: m.headers.subject,
            rawHeaderLines: headerBlock.match(/^Subject:.*(?:\r\n[ \t].*)*/gim),
            decoded: decodeSubject(m.headers.subject?.[0] ?? ''),
          }
        : {}),
    },
    date: {
      raw: m.headers.date,
      utc: Number.isFinite(Date.parse(m.headers.date?.[0] ?? ''))
        ? new Date(m.headers.date[0]).toISOString()
        : null,
    },
    boundaries: privateDetails ? m.boundaries : m.boundaries.map(hash),
    parts: m.parts.map((p) => ({
      type: p.type,
      disposition: p.disposition,
      charset: p.charset,
      encoding: p.encoding,
      decodedBytes: p.bytes.length,
      sha256: hash(p.bytes),
      filename: privateDetails ? p.filename : hash(p.filename),
      ...(p.text === undefined ? {} : { textSha256LF: hash(p.text.replace(/\r\n/g, '\n')) }),
      ...(privateDetails && p.text !== undefined ? { text: p.text } : {}),
    })),
  };
}
