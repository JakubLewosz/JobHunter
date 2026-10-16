import { Parser } from 'htmlparser2';
import { inspectMime, decodeSubject } from '../gmail/inspection.js';
import { hash } from '../util.js';

// Browser composer owns the transmitted MIME. This checks that payload separately;
// it NEVER relaxes API reconciliation or changes old frozen MIME/versions.
export function browserReceiptMatches(reference: Buffer, received?: Buffer) {
  if (!received) return false;
  try {
    const a = inspectMime(reference),
      b = inspectMime(received);
    const text = (p: typeof a) => p.parts.filter((x) => x.type === 'text/plain' && !x.filename);
    const tokens = (s: string) => JSON.stringify(s.replace(/\r\n/g, '\n').trim().split(/\s+/u));
    if (
      text(a).length !== 1 ||
      text(b).length !== 1 ||
      tokens(text(a)[0].text!) !== tokens(text(b)[0].text!)
    )
      return false;
    if (decodeSubject(a.headers.subject[0]) !== decodeSubject(b.headers.subject[0])) return false;
    const files = (p: typeof a) =>
      p.parts
        .filter((x) => x.filename)
        .map((x) => ({ type: x.type, name: x.filename, hash: hash(x.bytes) }));
    if (JSON.stringify(files(a)) !== JSON.stringify(files(b))) return false;
    const html = b.parts.filter((x) => x.type === 'text/html' && !x.filename);
    if (html.length !== 1) return false;
    const links = (value: string) => {
      const hrefs: string[] = [];
      let unsafe = false;
      let content = '';
      const block = new Set([
        'br',
        'div',
        'p',
        'li',
        'ul',
        'ol',
        'blockquote',
        'section',
        'article',
        'header',
        'footer',
        'nav',
        'h1',
        'h2',
        'h3',
        'table',
        'tr',
        'td',
      ]);
      const parser = new Parser({
        onopentag(name, attrs) {
          if (
            ['img', 'script', 'iframe', 'form', 'style', 'object', 'embed', 'input'].includes(name)
          )
            unsafe = true;
          if (
            'hidden' in attrs ||
            /display\s*:\s*none|visibility\s*:\s*hidden|font-size\s*:\s*0(?:px|pt|em|;|$)/iu.test(
              attrs.style ?? '',
            )
          )
            unsafe = true;
          if (block.has(name)) content += '\n';
          if (name === 'a' && attrs.href) hrefs.push(attrs.href);
        },
        ontext(value) {
          content += value;
        },
        onclosetag(name) {
          if (block.has(name)) content += '\n';
        },
      });
      parser.end(value);
      return { hrefs: hrefs.sort(), unsafe, content };
    };
    const x = links(a.parts.find((x) => x.type === 'text/html')?.text ?? ''),
      y = links(html[0].text!);
    return (
      !y.unsafe &&
      tokens(y.content) === tokens(text(b)[0].text!) &&
      JSON.stringify(x.hrefs) === JSON.stringify(y.hrefs)
    );
  } catch {
    return false;
  }
}
