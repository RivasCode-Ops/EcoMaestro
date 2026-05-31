/**
 * Verificação de links com fs — só Node (servidor, scripts).
 */
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { PROJETOS_ROOT } from './project-setup.mjs';
import { toEcoWebHref } from './eco-href.mjs';

function hrefToRel(href) {
  if (!href) return '';
  if (href.startsWith('/p/')) return decodeURIComponent(href.slice(3));
  return href.replace(/^\.\.\//, '').replace(/\\/g, '/').replace(/\/$/, '');
}

function resolveLocalPath(href) {
  if (!href || /^https?:\/\//i.test(href)) return null;
  const rel = hrefToRel(href);
  const direct = join(PROJETOS_ROOT, rel);
  if (existsSync(direct)) return { path: direct, rel };

  const tries = ['README.md', 'README', 'index.html', 'CAMINHOS.md'];
  for (const t of tries) {
    const p = join(PROJETOS_ROOT, rel, t);
    if (existsSync(p)) return { path: p, rel: rel + '/' + t };
  }
  try {
    const dir = join(PROJETOS_ROOT, rel);
    const files = readdirSync(dir);
    const html = files.find((f) => f.endsWith('.html'));
    if (html) return { path: join(dir, html), rel: rel + '/' + html };
  } catch {
    /* not a dir */
  }
  return null;
}

export function checkMoradorLink(href) {
  if (!href) {
    return { status: 'ide', label: 'IDE / Cursor', href: null };
  }
  if (/^https?:\/\//i.test(href)) {
    return { status: 'external', label: 'App com porta', href };
  }
  const resolved = resolveLocalPath(href);
  const web = resolved
    ? '/p/' + resolved.rel.split('/').map((s) => encodeURIComponent(s)).join('/')
    : href.startsWith('/p/')
      ? href
      : toEcoWebHref(href);
  if (resolved) {
    return { status: 'ok', label: 'Arquivo local', href: web };
  }
  return { status: 'missing', label: 'Arquivo não encontrado', href: web };
}

export function verifyAplicadores(aplicadores = []) {
  return aplicadores.map((a) => {
    const check = checkMoradorLink(a.href);
    return { ...a, href: check.href ?? a.href, link_check: check };
  });
}

export function verifyOverlapLinks(overlaps = []) {
  return overlaps.map((o) => {
    const check = checkMoradorLink(o.href);
    return { ...o, href: check.href ?? o.href, link_check: check };
  });
}

export function verifyKitLinks(links = []) {
  return links.map((l) => {
    const check = checkMoradorLink(l.href);
    return { ...l, href: check.href ?? l.href, link_check: check };
  });
}
