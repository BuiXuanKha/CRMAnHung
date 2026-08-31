/**
 * Allowlist sanitize for TipTap listing HTML (admin-authored).
 * Strips scripts/handlers; keeps p/headings/lists/links/images.
 */
const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'strong',
  'em',
  'b',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'h2',
  'h3',
  'blockquote',
  'a',
  'img',
]);

function sanitizeUrl(raw: string, kind: 'href' | 'src'): string | null {
  const value = raw.trim();
  if (!value) return null;
  const lower = value.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:text/html')) return null;
  if (kind === 'href') {
    if (
      lower.startsWith('http://') ||
      lower.startsWith('https://') ||
      lower.startsWith('mailto:') ||
      lower.startsWith('tel:') ||
      lower.startsWith('/')
    ) {
      return value;
    }
    return null;
  }
  if (lower.startsWith('https://') || lower.startsWith('http://') || lower.startsWith('data:image/')) {
    return value;
  }
  return null;
}

function sanitizeAttrs(tag: string, attrChunk: string): string {
  const attrs: string[] = [];
  const re = /([a-zA-Z:_][\w:.-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(attrChunk))) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? '';
    if (name.startsWith('on')) continue;
    if (tag === 'a') {
      if (name === 'href') {
        const href = sanitizeUrl(value, 'href');
        if (href) {
          attrs.push(`href="${href.replace(/"/g, '&quot;')}"`);
          attrs.push('rel="noopener noreferrer"');
          attrs.push('target="_blank"');
        }
      }
      continue;
    }
    if (tag === 'img') {
      if (name === 'src') {
        const src = sanitizeUrl(value, 'src');
        if (src) attrs.push(`src="${src.replace(/"/g, '&quot;')}"`);
      } else if (name === 'alt') {
        attrs.push(`alt="${value.replace(/"/g, '&quot;')}"`);
      } else if (name === 'class' && value.includes('pw-editor-img')) {
        attrs.push('class="pw-editor-img"');
      }
    }
  }
  return attrs.length ? ` ${attrs.join(' ')}` : '';
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/** Safe HTML subset for guest SSR of listing / post bodyHtml. */
export function sanitizeListingHtml(
  html: string,
  options?: { defaultImgAlt?: string },
): string {
  if (!html?.trim()) return '';
  let out = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  out = out.replace(/<\/?([a-zA-Z][\w:-]*)\b([^>]*)>/g, (full, rawTag: string, attrs: string) => {
    const tag = rawTag.toLowerCase();
    const closing = full.startsWith('</');
    const selfClosing = /\/>\s*$/.test(full) || tag === 'br' || tag === 'img';
    if (!ALLOWED_TAGS.has(tag)) return '';
    if (closing) return `</${tag}>`;
    if (tag === 'br') return '<br>';
    if (tag === 'img') {
      let safe = sanitizeAttrs(tag, attrs);
      if (!safe.includes('src=')) return '';
      const defaultAlt = options?.defaultImgAlt?.trim();
      if (defaultAlt) {
        const altMatch = safe.match(/\salt="([^"]*)"/i);
        if (!altMatch || !altMatch[1].trim()) {
          safe = safe.replace(/\salt="[^"]*"/i, '').trimEnd();
          safe = `${safe} alt="${escapeAttr(defaultAlt)}"`;
        }
      }
      return `<img${safe}>`;
    }
    if (tag === 'a') {
      const safe = sanitizeAttrs(tag, attrs);
      return safe.includes('href=') ? `<a${safe}>` : '<a>';
    }
    return selfClosing ? `<${tag}>` : `<${tag}>`;
  });

  return out.trim();
}
