import { parseDocument } from 'htmlparser2';

export const parserVersion = 1;
const emailPattern = /[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/giu;
const emails = (text: string) => [...text.matchAll(emailPattern)].map((m) => m[0].toLowerCase());
type Node = ReturnType<typeof parseDocument>['children'][number];
const ignored = new Set(['script', 'style', 'noscript', 'svg', 'template']);
const blocks = new Set([
  'div',
  'section',
  'article',
  'address',
  'header',
  'footer',
  'main',
  'nav',
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'table',
  'tr',
  'td',
  'th',
  'dl',
  'dt',
  'dd',
  'blockquote',
]);
const groups = new Set(['section', 'article', 'address', 'tr', 'li']);
const normalize = (text: string) =>
  text
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
export type AddressContext = { email: string; text: string };

// Plain-text sources and multi-address containers keep the preceding label until the previous address.
export function addressContexts(text: string): AddressContext[] {
  const lines = text.split(/\n|;|(?<=[.!?])\s+/u);
  const result: AddressContext[] = [];
  for (let i = 0; i < lines.length; i++) {
    const found = emails(lines[i]);
    if (!found.length) continue;
    let first = i;
    while (
      first > 0 &&
      i - first < 3 &&
      lines[first - 1].trim() &&
      lines[first - 1].length <= 180 &&
      !emails(lines[first - 1]).length
    )
      first--;
    for (const email of found)
      result.push({
        email,
        text: lines
          .slice(first, i + 1)
          .join('\n')
          .slice(0, 2000),
      });
  }
  return result;
}
export function parsePublicHTML(html: string) {
  const dom = parseDocument(html),
    texts = new WeakMap<object, string>(),
    occurrences: { node: Node; email: string }[] = [];
  const render = (node: Node, depth = 0): string => {
    if (depth > 128) return '';
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/g, ' ');
      for (const email of emails(text)) occurrences.push({ node, email });
      texts.set(node, text);
      return text;
    }
    if (!('children' in node) || ('name' in node && ignored.has(node.name))) return '';
    if ('name' in node && node.name === 'br') return '\n';
    const value = node.children.map((child) => render(child, depth + 1)).join('');
    const text = 'name' in node && blocks.has(node.name) ? '\n' + value + '\n' : value;
    texts.set(node, text);
    return text;
  };
  const rendered = dom.children.map((node) => render(node)).join('');
  texts.set(dom, rendered);
  const text = normalize(rendered).slice(0, 100000);
  const summaries = new WeakMap<object, { value: string; distinct: number }>();
  const contexts: AddressContext[] = [];
  for (const occurrence of occurrences.slice(0, 2000)) {
    let parent = occurrence.node.parent,
      chosen = texts.get(occurrence.node) ?? '',
      depth = 0;
    while (parent && depth++ < 128) {
      let summary = summaries.get(parent);
      if (!summary) {
        const value = normalize(texts.get(parent) ?? '');
        summary = { value, distinct: new Set(emails(value)).size };
        summaries.set(parent, summary);
      }
      const { value, distinct } = summary;
      if ('name' in parent) {
        if (groups.has(parent.name)) {
          chosen = value;
          break;
        }
        if (distinct > 1 || ['body', 'html', 'footer', 'main'].includes(parent.name)) {
          chosen = value;
          break;
        }
        if (blocks.has(parent.name)) chosen = value;
      } else if (parent.type === 'root' && chosen === (texts.get(occurrence.node) ?? ''))
        chosen = value;
      parent = parent.parent;
    }
    if (!chosen.replace(emailPattern, '').trim()) {
      let container = occurrence.node.parent,
        levels = 0;
      while (container && levels++ < 16) {
        let previous = container.prev;
        while (
          previous &&
          (previous.type === 'comment' || (previous.type === 'text' && !previous.data.trim()))
        )
          previous = previous.prev;
        if (previous && 'name' in previous && /^(?:h[1-6]|dt)$/.test(previous.name)) {
          chosen = (texts.get(previous) ?? '') + '\n' + chosen;
          break;
        }
        container = container.parent;
      }
    }
    const matches = addressContexts(chosen.replace(/\n+/g, '\n')).filter(
      (c) => c.email === occurrence.email,
    );
    for (const context of matches)
      if (!contexts.some((c) => c.email === context.email && c.text === context.text))
        contexts.push(context);
  }
  return {
    text,
    contexts: contexts.filter((c) => text.toLowerCase().includes(c.email)),
    parserVersion,
  };
}
