import { mkdir, access, writeFile } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';
import { PROJETOS_ROOT, suggestProjectSlug } from './project-setup.mjs';

const ROOT = process.env.PROJETOS_ROOT || PROJETOS_ROOT;

export { PROJETOS_ROOT, suggestProjectSlug };

export async function folderExists(folderPath) {
  try {
    await access(folderPath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
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

  const folderPath = join(ROOT, name);
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
