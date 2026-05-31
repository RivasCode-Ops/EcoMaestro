#!/usr/bin/env node
/**
 * EcoMaestro API — porta 8771 (estático + /api)
 * Persistência: data/demands/*.json (padrão) ou DATABASE_URL (Postgres)
 */
import http from 'http';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { analyzeDemand } from './lib/router.mjs';
import { scaffoldProject } from './lib/project-scaffold.mjs';
import { checkEcosystemPorts } from './lib/ports.mjs';
import { VALID_STATUSES } from './lib/status-transition.mjs';
import * as jsonStore from './lib/storage-json.mjs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = Number(process.env.ECOMAESTRO_PORT || 8771);
const ROOT = __dirname;

let store = jsonStore;
let pgStore = null;

async function initStore() {
  if (process.env.DATABASE_URL) {
    try {
      pgStore = await import('./lib/storage-pg.mjs');
      await pgStore.init();
      store = pgStore;
      console.log('Persistência: Postgres');
      return;
    } catch (e) {
      console.warn('Postgres indisponível, usando JSON:', e.message);
    }
  }
  console.log('Persistência: JSON em data/demands/');
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res, status, body, type = 'application/json; charset=utf-8') {
  const headers = {
    'Content-Type': type,
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
  res.writeHead(status, headers);
  if (Buffer.isBuffer(body)) {
    res.end(body);
  } else if (typeof body === 'string') {
    res.end(body);
  } else {
    res.end(JSON.stringify(body));
  }
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function serveStatic(pathname) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  rel = rel.replace(/\.\./g, '');
  const file = join(ROOT, rel);
  if (!file.startsWith(ROOT)) return null;
  try {
    const buf = await readFile(file);
    const ext = extname(file).toLowerCase();
    return { buf, type: MIME[ext] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

async function handleApi(req, res, pathname) {
  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return true;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    send(res, 200, { ok: true, storage: store.storageKind(), port: PORT });
    return true;
  }

  if (pathname === '/api/ecosystem/ports' && req.method === 'GET') {
    const ports = await checkEcosystemPorts();
    send(res, 200, ports);
    return true;
  }

  if (pathname === '/api/demands' && req.method === 'GET') {
    const list = await store.listDemands(20);
    send(res, 200, { demands: list });
    return true;
  }

  if (pathname === '/api/projects/scaffold' && req.method === 'POST') {
    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'JSON inválido' });
      return true;
    }
    try {
      const result = await scaffoldProject({
        slug: body.slug || body.name,
        description: body.description || ''
      });
      send(res, result.created ? 201 : 200, result);
    } catch (e) {
      const code = e.code === 'VALIDATION' ? 400 : 500;
      send(res, code, { error: e.message });
    }
    return true;
  }

  if (pathname === '/api/demands' && req.method === 'POST') {
    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'JSON inválido' });
      return true;
    }
    try {
      const analyzed = analyzeDemand({
        github_url: body.github_url || body.link || '',
        description: body.description || body.desc || ''
      });
      const record = await store.createDemand(analyzed);
      send(res, 201, record);
    } catch (e) {
      const code = e.code === 'VALIDATION' ? 400 : 500;
      send(res, code, { error: e.message });
    }
    return true;
  }

  const runMatch = pathname.match(/^\/api\/demands\/([^/]+)\/runs\/([^/]+)$/);
  if (runMatch && req.method === 'PATCH') {
    const [, id, runKey] = runMatch;
    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'JSON inválido' });
      return true;
    }
    if (!body?.status && !body?.output_payload) {
      send(res, 400, { error: 'Informe status e/ou output_payload' });
      return true;
    }
    if (!store.patchRun) {
      send(res, 501, { error: 'patchRun não disponível neste storage' });
      return true;
    }
    const record = await store.patchRun(id, runKey, body);
    if (!record) send(res, 404, { error: 'Demanda ou passagem não encontrada' });
    else send(res, 200, record);
    return true;
  }

  const match = pathname.match(/^\/api\/demands\/([^/]+)$/);
  if (match) {
    const id = match[1];
    if (req.method === 'GET') {
      const record = await store.getDemand(id);
      if (!record) send(res, 404, { error: 'Demanda não encontrada' });
      else send(res, 200, record);
      return true;
    }
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      if (!body?.status) {
        send(res, 400, { error: 'Campo status obrigatório' });
        return true;
      }
      if (!VALID_STATUSES.includes(body.status)) {
        send(res, 400, { error: 'Status inválido', allowed: VALID_STATUSES });
        return true;
      }
      const record = await store.patchDemandStatus(id, body.status);
      if (!record) send(res, 404, { error: 'Demanda não encontrada' });
      else send(res, 200, record);
      return true;
    }
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api/')) {
      const ok = await handleApi(req, res, pathname);
      if (ok) return;
      send(res, 404, { error: 'Rota não encontrada' });
      return;
    }

    const stat = await serveStatic(pathname);
    if (stat) {
      send(res, 200, stat.buf, stat.type);
      return;
    }

    send(res, 404, { error: 'Not found' });
  } catch (e) {
    console.error(e);
    send(res, 500, { error: e.message });
  }
});

await initStore();

server.listen(PORT, '127.0.0.1', () => {
  console.log('EcoMaestro API + UI: http://127.0.0.1:' + PORT + '/');
  console.log('POST http://127.0.0.1:' + PORT + '/api/demands');
});
