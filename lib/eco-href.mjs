import { PROJETOS_ROOT } from './project-setup.mjs';

/** `../dlogica/README.md` → `/p/dlogica/README.md` (servidor :8771) */
export function toEcoWebHref(href) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href) || href.startsWith('/p/')) return href;
  if (href.startsWith('../')) {
    const rel = href.replace(/^\.\.\//, '').replace(/\\/g, '/');
    return '/p/' + rel.split('/').map((s) => encodeURIComponent(s)).join('/');
  }
  return href;
}

/** Para modo file:// — abre pasta real em _PROJETOS */
export function toFileHref(href) {
  if (!href) return href;
  if (/^https?:\/\//i.test(href)) return href;
  if (href.startsWith('../')) {
    const rel = href.replace(/^\.\.\//, '').replace(/\//g, '/');
    const base = PROJETOS_ROOT.replace(/\\/g, '/');
    return 'file:///' + base + '/' + rel.split('/').map((s) => encodeURIComponent(s)).join('/');
  }
  return href;
}

export function resolveHrefForUi(href, fileMode = false) {
  if (!href) return href;
  return fileMode ? toFileHref(href) : toEcoWebHref(href);
}
