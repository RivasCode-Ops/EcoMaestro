import { mkdir, readFile, writeFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { existsSync } from 'fs';
import { PROJETOS_ROOT } from './project-setup.mjs';

const RAG_DIR = join(process.cwd(), 'data', 'rag');
const INDEX_FILE = join(RAG_DIR, 'index.json');

const INDEX_ROOTS = [
  { rel: 'EcoMaestro/docs', maxFiles: 80 },
  { rel: 'workbench', maxFiles: 120, globDirs: ['00-ROTEAMENTO', '10-DESCOBERTA-E-MODELAGEM', '20-ENTREGA-DE-PRODUTO', 'Projeto Novo', 'Cursor-Kit'] },
  { rel: 'ECOSSISTEMA.md', file: true }
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'dist', 'build', '.cursor']);

function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function tokenize(text) {
  return norm(text)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function chunkText(text, source, href, maxLen = 600) {
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 40);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + p).length > maxLen && buf) {
      chunks.push({ text: buf.trim(), source, href });
      buf = p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
  }
  if (buf.trim()) chunks.push({ text: buf.trim(), source, href });
  return chunks;
}

async function walkMd(dir, acc, limit) {
  if (acc.length >= limit || !existsSync(dir)) return;
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (acc.length >= limit) break;
    if (e.name.startsWith('.') && e.name !== '.md') continue;
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      await walkMd(full, acc, limit);
    } else if (/\.(md|txt)$/i.test(e.name)) {
      try {
        const text = await readFile(full, 'utf8');
        const rel = relative(PROJETOS_ROOT, full).replace(/\\/g, '/');
        const href = '/p/' + rel.split('/').map(encodeURIComponent).join('/');
        acc.push(...chunkText(text.slice(0, 12000), rel, href));
      } catch {
        /* skip */
      }
    }
  }
}

export async function buildRagIndex() {
  await mkdir(RAG_DIR, { recursive: true });
  const chunks = [];
  const root = PROJETOS_ROOT;

  for (const spec of INDEX_ROOTS) {
    if (spec.file) {
      const full = join(root, spec.rel);
      if (existsSync(full)) {
        const text = await readFile(full, 'utf8');
        const href = '/p/' + encodeURIComponent(spec.rel);
        chunks.push(...chunkText(text, spec.rel, href));
      }
      continue;
    }
    const base = join(root, spec.rel);
    if (spec.globDirs) {
      for (const d of spec.globDirs) {
        await walkMd(join(base, d), chunks, spec.maxFiles);
      }
    } else {
      await walkMd(base, chunks, spec.maxFiles);
    }
  }

  const index = {
    version: 1,
    built_at: new Date().toISOString(),
    chunk_count: chunks.length,
    chunks: chunks.map((c, i) => ({
      id: 'c' + i,
      ...c,
      tokens: tokenize(c.text)
    }))
  };
  await writeFile(INDEX_FILE, JSON.stringify(index, null, 0), 'utf8');
  return { chunk_count: chunks.length, path: INDEX_FILE };
}

export async function loadRagIndex() {
  try {
    const raw = await readFile(INDEX_FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { chunks: [], chunk_count: 0 };
  }
}

export function searchRag(query, projectFolder = null, limit = 5) {
  const index = globalThis.__ecoRagCache || { chunks: [] };
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];

  const scored = index.chunks.map((c) => {
    let score = 0;
    const text = norm(c.text);
    const src = norm(c.source);
    for (const t of qTokens) {
      if (text.includes(t)) score += 2;
      if (src.includes(t)) score += 1;
    }
    if (projectFolder && src.includes(norm(projectFolder))) score += 3;
    return { ...c, score };
  });

  return scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ id, text, source, href, score }) => ({ id, text: text.slice(0, 320), source, href, score }));
}

export async function ensureRagLoaded() {
  const idx = await loadRagIndex();
  globalThis.__ecoRagCache = idx;
  return idx;
}
