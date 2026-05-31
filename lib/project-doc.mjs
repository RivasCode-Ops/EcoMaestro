import { existsSync } from 'fs';
import { join } from 'path';
import { PROJETOS_ROOT } from './project-setup.mjs';

/** Ordem de prioridade — igual para qualquer pasta em _PROJETOS */
export const PROJECT_DOC_CANDIDATES = [
  'AGENTS.md',
  'README.md',
  'docs/README.md',
  'docs/contexto-projeto.md',
  'LEIA-ME.txt'
];

export function resolveProjectGuide(projectId) {
  if (!projectId || projectId === '__new__') {
    return { project_id: projectId, rel_path: null, href: null, folder_path: null };
  }
  const folder_path = join(PROJETOS_ROOT, projectId);
  for (const rel of PROJECT_DOC_CANDIDATES) {
    const full = join(folder_path, rel);
    if (existsSync(full)) {
      const href =
        '/p/' +
        encodeURIComponent(projectId) +
        '/' +
        rel.split('/').map((s) => encodeURIComponent(s)).join('/');
      return { project_id: projectId, rel_path: rel, href, folder_path };
    }
  }
  return { project_id: projectId, rel_path: null, href: null, folder_path };
}
