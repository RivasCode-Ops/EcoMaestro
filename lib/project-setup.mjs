/** Lógica de pasta projeto — seguro no navegador (sem Node fs). */

export const PROJETOS_ROOT = 'c:\\_PROJETOS';

export function suggestProjectSlug(desc, gh = null) {
  if (gh?.repo) {
    return gh.repo.replace(/\.git$/i, '').replace(/[^a-zA-Z0-9-_]/g, '') || 'NovoProjeto';
  }
  let raw = (desc || '').trim();
  raw = raw.replace(/^projeto\s+novo\s*[-—:]\s*/i, '').split('\n')[0].trim();
  if (!raw) return 'NovoProjeto';
  const words = raw
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4);
  if (!words.length) return 'NovoProjeto';
  return words
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

export function buildProjectSetup(plan, gh, desc) {
  const isNovo = plan.tipo === 'novo' || plan.intent === 'ideia_nova';
  if (!isNovo) return null;

  const slug = suggestProjectSlug(desc, gh);
  const folderPath = PROJETOS_ROOT + '\\' + slug;

  return {
    suggested_slug: slug,
    folder_path: folderPath,
    projetos_root: PROJETOS_ROOT,
    tutorial_href: '../workbench/Projeto Novo/TUTORIAL.md',
    orquestrador_href: '../workbench/Projeto Novo/000-ORQUESTRADOR.md',
    bat_href: 'Criar-pasta-em-PROJETOS.bat',
    explorer_href: 'file:///' + folderPath.replace(/\\/g, '/')
  };
}
