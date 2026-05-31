/**
 * Verificação de links — seguro no navegador (sem fs).
 * Checagem em disco: verify-links-node.mjs (API/servidor).
 */
import { toEcoWebHref } from './eco-href.mjs';

export function checkMoradorLink(href) {
  if (!href) {
    return { status: 'ide', label: 'IDE / Cursor', href: null };
  }
  if (/^https?:\/\//i.test(href)) {
    return { status: 'external', label: 'App com porta', href };
  }
  const web = href.startsWith('/p/') ? href : toEcoWebHref(href);
  return { status: 'ok', label: 'Arquivo local', href: web };
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
