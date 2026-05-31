import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const PROJETOS_ROOT = process.env.PROJETOS_ROOT || 'c:\\_PROJETOS';

const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  '$RECYCLE.BIN',
  'System Volume Information',
  'distribuicao'
]);

/** Pastas que existem mas não entram no seletor de trabalho */
const SKIP_PICKER = new Set(['EcoTesteScaffold']);

/** Ferramentas do fluxo ECO — aparecem no fim da lista */
const FERRAMENTAS = new Set([
  'EcoMaestro',
  'dlogica',
  'workbench',
  'max-coding',
  'Cortana',
  'COmniWS',
  'PROMPT'
]);

let cache = null;
let cacheAt = 0;
const CACHE_MS = 30_000;

function normalizeGithubRemote(raw) {
  let url = (raw || '').trim();
  if (!url) return null;
  if (url.startsWith('git@github.com:')) {
    url = 'https://github.com/' + url.slice(15);
  }
  url = url.replace(/\.git$/i, '');
  return /github\.com\//i.test(url) ? url : null;
}

async function gitHubFromFolder(folderPath) {
  try {
    const { stdout } = await execFileAsync(
      'git',
      ['-C', folderPath, 'remote', 'get-url', 'origin'],
      { timeout: 2500, windowsHide: true }
    );
    return normalizeGithubRemote(stdout);
  } catch {
    try {
      const cfg = await readFile(join(folderPath, '.git', 'config'), 'utf8');
      const m = cfg.match(/url\s*=\s*(.+github\.com[^\s]+)/i);
      return m ? normalizeGithubRemote(m[1]) : null;
    } catch {
      return null;
    }
  }
}

async function scanEntry(name) {
  const folder_path = join(PROJETOS_ROOT, name);
  const github_url = await gitHubFromFolder(folder_path);
  const kind = FERRAMENTAS.has(name) ? 'ferramenta' : 'produto';
  return {
    id: name,
    name,
    folder_path,
    github_url,
    kind,
    label: name + (github_url ? ' · GitHub' : ' · só local')
  };
}

export async function scanProjetos(force = false) {
  const now = Date.now();
  if (!force && cache && now - cacheAt < CACHE_MS) return cache;

  let names = [];
  try {
    const entries = await readdir(PROJETOS_ROOT, { withFileTypes: true });
    names = entries
      .filter(
        (e) =>
          e.isDirectory() &&
          !e.name.startsWith('.') &&
          !SKIP_DIRS.has(e.name) &&
          !SKIP_PICKER.has(e.name)
      )
      .map((e) => e.name);
  } catch (e) {
    return { root: PROJETOS_ROOT, scanned_at: new Date().toISOString(), projects: [], error: e.message };
  }

  const projects = await Promise.all(names.map((n) => scanEntry(n)));
  projects.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'ferramenta' ? 1 : -1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });

  const result = {
    root: PROJETOS_ROOT,
    scanned_at: new Date().toISOString(),
    projects
  };
  cache = result;
  cacheAt = now;
  return result;
}

export async function resolveProject(folderId) {
  if (!folderId || folderId === '__new__') return null;
  const { projects } = await scanProjetos();
  return projects.find((p) => p.id === folderId || p.name === folderId) || null;
}
