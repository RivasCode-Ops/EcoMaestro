import { mkdir, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

export const PROJETOS_ROOT = process.env.PROJETOS_ROOT || 'c:\\_PROJETOS';

/** Nome de pasta sugerido a partir da descrição ou do repo GitHub. */
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

export async function folderExists(folderPath) {
  try {
    await access(folderPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function buildProjectSetup(plan, gh, desc) {
  const isNovo = plan.tipo === 'novo' || plan.intent === 'ideia_nova';
  if (!isNovo) return null;

  const slug = suggestProjectSlug(desc, gh);
  const folderPath = join(PROJETOS_ROOT, slug);

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

function readmeContent(slug, desc) {
  const when = new Date().toISOString().slice(0, 10);
  return `# ${slug}

Projeto criado pelo **EcoMaestro** em ${when}.

## Descrição da demanda

${(desc || '').trim() || '(preencher)'}

## Próximos passos

1. [Trilha projeto novo — workbench](../workbench/Projeto%20Novo/TUTORIAL.md)
2. [000-ORQUESTRADOR](../workbench/Projeto%20Novo/000-ORQUESTRADOR.md)
3. dLogica → workbench → Cursor → Max (ordem no relatório EcoMaestro)

## Pasta

\`c:\\_PROJETOS\\${slug}\`
`;
}

export async function scaffoldProject({ slug, description = '' } = {}) {
  const name = (slug || suggestProjectSlug(description)).trim();
  if (!name || /[<>:"/\\|?*]/.test(name)) {
    const err = new Error('Nome de pasta inválido');
    err.code = 'VALIDATION';
    throw err;
  }

  const folderPath = join(PROJETOS_ROOT, name);
  const exists = await folderExists(folderPath);

  if (!exists) {
    await mkdir(folderPath, { recursive: true });
    await writeFile(join(folderPath, 'README.md'), readmeContent(name, description), 'utf8');
  }

  return {
    ok: true,
    slug: name,
    folder_path: folderPath,
    created: !exists,
    already_existed: exists,
    readme: join(folderPath, 'README.md'),
    explorer_href: 'file:///' + folderPath.replace(/\\/g, '/')
  };
}
