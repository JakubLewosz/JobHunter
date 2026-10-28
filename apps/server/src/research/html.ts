import { parseDocument } from 'htmlparser2';

export const parserVersion = 4;
const emailPattern =
  /(?<![\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-])[\p{L}\p{N}.!#$%&'*+/=?^_`{|}~-]{1,64}@[a-z0-9.-]+\.[a-z]{2,}/giu;
const emails = (text: string) =>
  text.includes('@') ? [...text.matchAll(emailPattern)].map((m) => m[0].toLowerCase()) : [];
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
// Neutral labels (Kontakt/Pomoc/Email) do not establish a separate department.
const hasPurpose = (text: string) =>
  /faktur|rozlicze|billing|invoice|sprzeda|sales|privacy|rodo|dpo|security|bezpieczeń|rekrut|career|recruit|\bhr\b|kontakt ogólny|general contact/iu.test(
    text.replace(emailPattern, ''),
  );
const normalize = (text: string) =>
  text
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
export type AddressContext = { email: string; text: string; complete?: boolean };

// Plain-text sources and multi-address containers keep the preceding label until the previous address.
export function addressContexts(text: string): AddressContext[] {
  // In a single-address row/card the label may follow the mailbox. Keeping only
  // preceding lines silently loses billing/privacy restrictions.
  const distinct = [...new Set(emails(text))];
  if (distinct.length === 1) {
    const value = normalize(text);
    return [{ email: distinct[0], text: value.slice(0, 2000), complete: value.length <= 2000 }];
  }
  const lines = text.split(/\n|;|(?<=[.!?])\s+/u);
  const nonempty = lines
    .map((line, index) => ({ line, index }))
    .filter((x) => x.line.trim())
    .map((value, position) => ({ ...value, position }));
  const addressed = nonempty.filter((x) => emails(x.line).length);
  const labelPair = (label: string, email: string) =>
    (/kontakt(?: ogólny)?|contact|general/iu.test(label) &&
      !/faktur|rozlicze|sprzeda|sales|privacy|security/iu.test(label)) ||
    [
      [/sprzeda|sales/iu, /^(sales|sprzedaz)@/i],
      [/faktur|rozlicze|billing|invoice/iu, /^(faktur\w*|billing|invoice)@/i],
      [/rekrut|career|recruit/iu, /^(hr|jobs|career\w*|rekrut\w*)@/i],
      [/privacy|rodo|dpo/iu, /^(privacy|rodo|dpo|iod)@/i],
      [/security|bezpieczeń/iu, /^security@/i],
    ].some(([purpose, mailbox]) => purpose.test(label) && mailbox.test(email));
  // Keep clearly paired label/address BR lists separate. In an ambiguous flat
  // container, retain following labels conservatively instead of dropping them.
  const precedingPairs =
    addressed.length > 1 &&
    nonempty.at(-1)?.index === addressed.at(-1)?.index &&
    addressed.every((x) => {
      const previous = nonempty[x.position - 1];
      const found = emails(x.line);
      return (
        found.length === 1 &&
        previous &&
        !emails(previous.line).length &&
        labelPair(previous.line, found[0])
      );
    });
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
    let last = i + 1;
    while (
      !precedingPairs &&
      last < lines.length &&
      last - i <= 2 &&
      lines[last].trim() &&
      lines[last].length <= 180 &&
      !emails(lines[last]).length
    )
      last++;
    const value = lines.slice(first, last).join('\n');
    for (const email of found)
      result.push({
        email,
        text: value.slice(0, 2000),
        complete: value.length <= 2000,
      });
  }
  return result;
}
export function parsePublicHTML(html: string) {
  const dom = parseDocument(html),
    texts = new WeakMap<object, string>(),
    occurrences: { node: Node; email: string }[] = [];
  let depthLimited = false;
  const render = (node: Node, depth = 0): string => {
    if (depth > 128) {
      depthLimited = true;
      return '';
    }
    if (node.type === 'text') {
      const text = node.data.replace(/\s+/g, ' ');
      for (const email of emails(text)) occurrences.push({ node, email });
      texts.set(node, text);
      return text;
    }
    if (!('children' in node) || ('name' in node && ignored.has(node.name))) return '';
    if ('name' in node && node.name === 'br') return '\n';
    const value = node.children.map((child) => render(child, depth + 1)).join('');
    // Inline labels and visible mailboxes remain separate literal tokens, even in minified HTML.
    const text =
      'name' in node && blocks.has(node.name)
        ? '\n' + value + '\n'
        : 'name' in node && emails(value).length
          ? ' ' + value + ' '
          : value;
    texts.set(node, text);
    return text;
  };
  const rendered = dom.children.map((node) => render(node)).join('');
  texts.set(dom, rendered);
  const fullText = normalize(rendered),
    text = fullText.slice(0, 100000);
  const summaries = new WeakMap<object, { value: string; distinct: number; headings?: Node[] }>();
  const contexts: AddressContext[] = [];
  const groupedContexts = new Map<string, Map<string, AddressContext[]>>();
  const unlabeled = new Map<string, boolean>(),
    seenContexts = new Map<string, Set<string>>();
  for (const occurrence of occurrences.slice(0, 2000)) {
    let parent = occurrence.node.parent,
      chosen = texts.get(occurrence.node) ?? '',
      sharedLabel = '',
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
        // A labelled cell/card inside a multi-address structure has its own
        // purpose. Do not leak an unrelated sibling's label into it.
        if (distinct > 1 && hasPurpose(chosen)) break;
        if (distinct > 1 && 'children' in parent) {
          // The DOM is immutable here. A large shared container needs one scan,
          // rather than scanning all its children again for every address.
          const headings = (summary.headings ??= parent.children.filter(
            (child) => 'name' in child && /^(?:h[1-6]|dt|th)$/.test(child.name),
          ));
          if (headings.length === 1) {
            chosen = (texts.get(headings[0]) ?? '') + '\n' + chosen;
            break;
          }
        }
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
    let needsLabel = unlabeled.get(chosen);
    if (needsLabel === undefined) {
      needsLabel = !hasPurpose(chosen);
      unlabeled.set(chosen, needsLabel);
    }
    if (needsLabel) {
      let container = occurrence.node.parent,
        levels = 0;
      while (container && levels++ < 16) {
        let previous = container.prev;
        while (
          previous &&
          (previous.type === 'comment' || (previous.type === 'text' && !previous.data.trim()))
        )
          previous = previous.prev;
        let siblings = 0;
        while (previous && siblings++ < 16) {
          const previousText = normalize(texts.get(previous) ?? '');
          const heading =
            'name' in previous &&
            (/^(?:h[1-6]|dt)$/.test(previous.name) ||
              (previous.name === 'tr' &&
                'children' in previous &&
                previous.children.some((child) => 'name' in child && child.name === 'th') &&
                !emails(previousText).length));
          if (heading) {
            sharedLabel = previousText;
            chosen = sharedLabel + '\n' + chosen;
            break;
          }
          if (hasPurpose(previousText)) break;
          previous = previous.prev;
        }
        if (sharedLabel) break;
        container = container.parent;
      }
    }
    let indexed = groupedContexts.get(chosen);
    if (!indexed) {
      indexed = new Map();
      for (const context of addressContexts(chosen.replace(/\n+/g, '\n'))) {
        const list = indexed.get(context.email) ?? [];
        list.push(context);
        indexed.set(context.email, list);
      }
      groupedContexts.set(chosen, indexed);
    }
    const matches = indexed.get(occurrence.email) ?? [];
    for (const originalContext of matches) {
      const context =
        sharedLabel && !originalContext.text.includes(sharedLabel)
          ? {
              ...originalContext,
              text: (sharedLabel + '\n' + originalContext.text).slice(0, 2000),
              complete:
                originalContext.complete !== false &&
                sharedLabel.length + originalContext.text.length + 1 <= 2000,
            }
          : originalContext;
      const known = seenContexts.get(context.email) ?? new Set<string>();
      if (!known.has(context.text)) {
        known.add(context.text);
        contexts.push(context);
      }
      seenContexts.set(context.email, known);
    }
  }
  const literalText = text.toLowerCase();
  const limitation =
    fullText.length > 100000
      ? 'TEXT_LIMIT'
      : depthLimited
        ? 'DEPTH_LIMIT'
        : occurrences.length > 2000
          ? 'ADDRESS_LIMIT'
          : contexts.some((c) => c.complete === false)
            ? 'CONTEXT_LIMIT'
            : 'COMPLETE';
  const outboundLinks: { url: string; context: string }[] = [];
  const anchorCount = (node: Node, depth = 0): number =>
    depth > 128
      ? 2
      : 'name' in node && node.name === 'a'
        ? 1
        : 'children' in node
          ? node.children.reduce((n, child) => Math.min(2, n + anchorCount(child, depth + 1)), 0)
          : 0;
  const visitLinks = (node: Node, depth = 0) => {
    if (depth > 128 || ('name' in node && ignored.has(node.name))) return;
    if ('name' in node && node.name === 'a' && 'attribs' in node && node.attribs?.href) {
      const parent = node.parent;
      const local =
        parent &&
        'name' in parent &&
        ['p', 'li', 'td', 'dd', 'span', 'label'].includes(parent.name);
      const owner = local && anchorCount(parent) === 1 ? parent : node;
      const context = normalize(texts.get(owner) ?? '');
      if (outboundLinks.length < 2000)
        outboundLinks.push({
          url: node.attribs.href.slice(0, 2000),
          context: context.slice(0, 2000),
        });
    }
    if ('children' in node) for (const child of node.children) visitLinks(child, depth + 1);
  };
  for (const node of dom.children) visitLinks(node);
  return {
    text,
    contexts: contexts.filter((c) => literalText.includes(c.email)),
    parserVersion,
    completeness: limitation,
    outboundLinks,
  };
}

// Follow only literal same-site navigation, never invented mailbox or guessed page paths.
export function relevantPageLinks(html: string, base: string): string[] {
  const root = parseDocument(html),
    matches: { url: string; score: number }[] = [];
  const text = (node: any): string =>
    node.type === 'text' ? node.data : (node.children ?? []).map(text).join(' ');
  const visit = (node: any, depth = 0) => {
    if (depth > 128 || ['script', 'style', 'noscript', 'template'].includes(node.name)) return;
    if (node.name === 'a' && node.attribs?.href) {
      try {
        const url = new URL(node.attribs.href, base);
        url.hash = '';
        const label = (text(node) + ' ' + url.pathname).toLowerCase();
        if (
          url.origin === new URL(base).origin &&
          !url.search &&
          !/privacy|cookie|polityk|regulamin|terms|login|sign.?in/.test(label)
        ) {
          const score = /career|karier|rekrut|join-us|jobs/.test(label)
            ? 5
            : /contact|kontakt/.test(label)
              ? 4
              : /services|usługi|offer|oferta|products|produkt/.test(label)
                ? 3
                : /about|o-nas|case-stud|realizac/.test(label)
                  ? 2
                  : 0;
          if (score && !/\.(pdf|png|jpg|zip)$/i.test(url.pathname))
            matches.push({ url: url.href, score });
        }
      } catch {}
    }
    for (const child of node.children ?? []) visit(child, depth + 1);
  };
  visit(root);
  return [...new Set(matches.sort((a, b) => b.score - a.score).map((v) => v.url))].slice(0, 12);
}
