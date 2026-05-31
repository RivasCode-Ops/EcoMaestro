/** Apps em _PROJETOS que se sobrepõem ou confundem com o fluxo ECO. */

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

const OVERLAPS = [
  {
    id: 'prompt',
    keys: ['prompt method', 'prompt hub', 'pasta prompt', '/prompt/'],
    label: 'PROMPT',
    role: 'Espelho legado do workbench (mesmos kits 00–50)',
    action: 'Use workbench/CAMINHOS.md como canônico',
    href: '../workbench/CAMINHOS.md',
    canonical: 'workbench'
  },
  {
    id: 'omniws',
    keys: ['omniws', 'comniws'],
    label: 'COmniWS',
    role: 'Runtime IA — fora das 4 portas',
    action: 'Só se a demanda for runtime/agente; governança continua no workbench',
    href: '../COmniWS/',
    canonical: null
  },
  {
    id: 'geogrowth_cursor',
    keys: ['geogrowth-cursor', 'geogrowth cursor kit'],
    label: 'GeoGrowth-Cursor',
    role: 'Kit Cursor específico do GeoGrowth',
    action: 'Para outros apps use workbench/Cursor-Kit',
    href: '../workbench/GeoGrowth-Cursor/README.md',
    canonical: 'workbench/Cursor-Kit'
  },
  {
    id: 'sync_api',
    keys: ['geogrowth-sync', 'sync-api'],
    label: 'geogrowth-sync-api',
    role: 'API do produto — não é morador do eco',
    action: 'Tratar como backend do geogrowth, não como orquestrador',
    href: '../geogrowth-sync-api/',
    canonical: null
  }
];

export function detectEcoOverlaps(desc, link = '') {
  const blob = norm(desc + ' ' + link);
  const found = [];
  for (const o of OVERLAPS) {
    if (o.keys.some((k) => blob.includes(norm(k)))) found.push(o);
  }
  return found.length ? found : null;
}
