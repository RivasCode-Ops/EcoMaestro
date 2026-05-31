#!/usr/bin/env node
/**
 * EcoMaestro API — porta 8771 (estático + /api)
 * Persistência: data/demands/*.json (padrão) ou DATABASE_URL (Postgres)
 */
import http from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, extname, normalize } from 'path';
import { PROJETOS_ROOT } from './lib/project-setup.mjs';
import { fileURLToPath } from 'url';
import { analyzeDemand } from './lib/router.mjs';
import {
  orchestrateAnalyzed,
  orchestrateRecord,
  validateDemandSave,
  validateRunComplete,
  validateStatusPatch
} from './lib/demand-orchestrator.mjs';
import { scaffoldProject } from './lib/project-scaffold.mjs';
import { scanProjetos, resolveProject } from './lib/projetos-scan.mjs';
import { resolveProjectGuide } from './lib/project-doc.mjs';
import { checkEcosystemPorts } from './lib/ports.mjs';
import { VALID_STATUSES } from './lib/status-transition.mjs';
import * as jsonStore from './lib/storage-json.mjs';
import { guardRequest, assertRecordTenant, isProjetosPathAllowed, apiKeyRequired, getDefaultTenantId } from './lib/api-guard.mjs';
import { enrichAnalyzed, onRunCompletedLearning } from './lib/enterprise-analyze.mjs';
import { ensureRagLoaded, buildRagIndex, searchRag, loadRagIndex } from './lib/rag-store.mjs';
import { ollamaAvailable } from './lib/llm-ollama.mjs';
import { auditLog } from './lib/audit-log.mjs';
import { getWizardForResident, buildOutputPayloadFromWizard } from './lib/run-wizard.mjs';
import { feedbackIntent, correctIntentForDemand } from './lib/learning-store.mjs';

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
  '.txt': 'text/plain; charset=utf-8',
  '.bat': 'text/plain; charset=utf-8'
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

function resolveProjetosFile(rel) {
  const root = normalize(PROJETOS_ROOT);
  const direct = normalize(join(root, rel));
  if (!direct.toLowerCase().startsWith(root.toLowerCase())) return null;
  if (existsSync(direct)) return direct;
  const base = rel.replace(/\/$/, '');
  for (const name of ['README.md', 'README', 'index.html', 'CAMINHOS.md']) {
    const candidate = normalize(join(root, base, name));
    if (candidate.toLowerCase().startsWith(root.toLowerCase()) && existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

/** Arquivos do ecossistema em c:\_PROJETOS — ex. /p/dlogica/README.md */
async function serveProjetosFile(pathname) {
  if (!pathname.startsWith('/p/')) return null;
  const rel = decodeURIComponent(pathname.slice(3)).replace(/\.\./g, '');
  if (!isProjetosPathAllowed(rel)) return null;
  const file = resolveProjetosFile(rel);
  if (!file) return null;
  try {
    const buf = await readFile(file);
    const ext = extname(file).toLowerCase();
    return { buf, type: MIME[ext] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

async function handleApi(req, res, pathname) {
  const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');

  const guard = guardRequest(req, res, send, pathname);
  if (!guard.ok) return true;
  const tenantId = guard.tenantId;

  if (req.method === 'OPTIONS') {
    send(res, 204, '');
    return true;
  }

  if (pathname === '/api/health' && req.method === 'GET') {
    const rag = await loadRagIndex();
    send(res, 200, {
      ok: true,
      storage: store.storageKind(),
      port: PORT,
      enterprise: {
        api_key_required: apiKeyRequired(),
        tenant_default: getDefaultTenantId(),
        rag_chunks: rag.chunk_count || 0,
        ollama: await ollamaAvailable()
      }
    });
    return true;
  }

  if (pathname === '/api/enterprise/status' && req.method === 'GET') {
    const rag = await loadRagIndex();
    send(res, 200, {
      api_key_required: apiKeyRequired(),
      tenant_id: tenantId,
      rag_chunks: rag.chunk_count || 0,
      ollama_online: await ollamaAvailable(),
      llm_model: process.env.ECO_LLM_MODEL || 'llama3.2'
    });
    return true;
  }

  if (pathname === '/api/rag/reindex' && req.method === 'POST') {
    const built = await buildRagIndex();
    await ensureRagLoaded();
    await auditLog({ action: 'rag_reindex', tenant_id: tenantId, chunk_count: built.chunk_count });
    send(res, 200, built);
    return true;
  }

  if (pathname === '/api/rag/search' && req.method === 'GET') {
    await ensureRagLoaded();
    const q = reqUrl.searchParams.get('q') || '';
    const project = reqUrl.searchParams.get('project') || null;
    send(res, 200, { hits: searchRag(q, project, 8) });
    return true;
  }

  const wizardMatch = pathname.match(/^\/api\/wizard\/([^/]+)$/);
  if (wizardMatch && req.method === 'GET') {
    send(res, 200, getWizardForResident(decodeURIComponent(wizardMatch[1])));
    return true;
  }

  if (pathname === '/api/learning/feedback' && req.method === 'POST') {
    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'JSON inválido' });
      return true;
    }
    if (body.demand_id && body.corrected_intent) {
      const record = await store.getDemand(body.demand_id, tenantId);
      if (!record) {
        send(res, 404, { error: 'Demanda não encontrada' });
        return true;
      }
      const updated = await correctIntentForDemand(record, body.corrected_intent, tenantId);
      send(res, 200, { ok: true, case: updated, message: 'Intent corrigido para o loop de aprendizado' });
      return true;
    }
    const updated = await feedbackIntent(body.case_id, body.corrected_intent, body.positive === true);
    if (!updated) send(res, 404, { error: 'Caso não encontrado' });
    else send(res, 200, { ok: true, case: updated });
    return true;
  }

  if (pathname === '/api/ecosystem/ports' && req.method === 'GET') {
    const ports = await checkEcosystemPorts();
    send(res, 200, ports);
    return true;
  }

  if (pathname === '/api/demands' && req.method === 'GET') {
    const project = reqUrl.searchParams.get('project') || null;
    const list = await store.listDemands(50, project, tenantId);
    send(res, 200, { demands: list, project_filter: project });
    return true;
  }

  const guideMatch = pathname.match(/^\/api\/projects\/([^/]+)\/guide$/);
  if (guideMatch && req.method === 'GET') {
    const id = decodeURIComponent(guideMatch[1]);
    const guide = resolveProjectGuide(id);
    send(res, 200, guide);
    return true;
  }

  if (pathname === '/api/projects' && req.method === 'GET') {
    const force = reqUrl.searchParams.get('refresh') === '1';
    const data = await scanProjetos(force);
    send(res, 200, data);
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
      let github_url = body.github_url || body.link || '';
      const project_folder = body.project_folder || body.folder || null;
      let folder_path = body.folder_path || null;
      if (project_folder && project_folder !== '__new__') {
        const resolved = await resolveProject(project_folder);
        if (resolved) {
          folder_path = resolved.folder_path;
          if (!github_url && resolved.github_url) github_url = resolved.github_url;
        }
      }
      let analyzed = analyzeDemand({
        github_url,
        description: body.description || body.desc || '',
        project_folder,
        folder_path
      });
      analyzed = await enrichAnalyzed(analyzed, { tenantId, useLlm: body.use_llm !== false });
      const saveCheck = validateDemandSave(analyzed, body.force === true);
      if (!saveCheck.ok) {
        send(res, 422, {
          error: saveCheck.message,
          code: saveCheck.code,
          orchestration: saveCheck.orchestration
        });
        return true;
      }
      analyzed.orchestration = saveCheck.orchestration;
      const record = await store.createDemand(analyzed, tenantId);
      if (!record.orchestration) record.orchestration = saveCheck.orchestration;
      await auditLog({ action: 'demand_create', tenant_id: tenantId, demand_id: record.id, intent: record.demand?.current_intent });
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
    const existing = await store.getDemand(id, tenantId);
    if (!existing) {
      send(res, 404, { error: 'Demanda não encontrada' });
      return true;
    }
    if (body.status === 'done') {
      const seq = validateRunComplete(existing, runKey);
      if (!seq.ok && body.force !== true) {
        send(res, 422, { error: seq.message, code: seq.code });
        return true;
      }
    }
    const run = (existing.runs || []).find((r) => r.id === runKey || r.resident === runKey);
    if (body.wizard_answers && run && body.status === 'done') {
      body.output_payload = buildOutputPayloadFromWizard(run.resident, body.wizard_answers);
      delete body.wizard_answers;
    }
    const record = await store.patchRun(id, runKey, body, tenantId);
    if (!record) send(res, 404, { error: 'Demanda ou passagem não encontrada' });
    else {
      record.orchestration = orchestrateRecord(record);
      if (body.status === 'done') {
        await onRunCompletedLearning(record, tenantId);
        await auditLog({ action: 'run_done', tenant_id: tenantId, demand_id: id, resident: run?.resident });
      }
      send(res, 200, record);
    }
    return true;
  }

  if (pathname === '/api/orchestrate' && req.method === 'POST') {
    const body = await readBody(req);
    if (body === null) {
      send(res, 400, { error: 'JSON inválido' });
      return true;
    }
    try {
      let analyzed = analyzeDemand({
        github_url: body.github_url || body.link || '',
        description: body.description || body.desc || '',
        project_folder: body.project_folder || body.folder || null,
        folder_path: body.folder_path || null
      });
      analyzed = await enrichAnalyzed(analyzed, { tenantId, useLlm: body.use_llm !== false });
      send(res, 200, { ...orchestrateAnalyzed(analyzed), demand_preview: analyzed.demand, enterprise: analyzed.enterprise });
    } catch (e) {
      const code = e.code === 'VALIDATION' ? 400 : 500;
      send(res, code, { error: e.message });
    }
    return true;
  }

  const adequacaoMatch = pathname.match(/^\/api\/demands\/([^/]+)\/adequacao$/);
  if (adequacaoMatch && req.method === 'GET') {
    const record = await store.getDemand(adequacaoMatch[1], tenantId);
    if (!record) send(res, 404, { error: 'Demanda não encontrada' });
    else send(res, 200, orchestrateRecord(record));
    return true;
  }

  const match = pathname.match(/^\/api\/demands\/([^/]+)$/);
  if (match) {
    const id = match[1];
    if (req.method === 'GET') {
      const record = await store.getDemand(id, tenantId);
      if (!record) send(res, 404, { error: 'Demanda não encontrada' });
      else {
        if (!record.orchestration) record.orchestration = orchestrateRecord(record);
        send(res, 200, record);
      }
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
      const existing = await store.getDemand(id, tenantId);
      if (!existing) {
        send(res, 404, { error: 'Demanda não encontrada' });
        return true;
      }
      const tenantCheck = assertRecordTenant(existing, tenantId);
      if (!tenantCheck.ok) {
        send(res, tenantCheck.code, { error: tenantCheck.message, code: 'TENANT_FORBIDDEN' });
        return true;
      }
      const statusCheck = validateStatusPatch(existing, body.status, body.force === true);
      if (!statusCheck.ok) {
        send(res, 422, {
          error: statusCheck.message,
          code: statusCheck.code,
          orchestration: statusCheck.orchestration,
          failed_gates: statusCheck.failed_gates
        });
        return true;
      }
      const record = await store.patchDemandStatus(id, body.status, tenantId);
      if (!record) send(res, 404, { error: 'Demanda não encontrada' });
      else {
        record.orchestration = orchestrateRecord(record);
        send(res, 200, record);
      }
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

    const ecoFile = await serveProjetosFile(pathname);
    if (ecoFile) {
      send(res, 200, ecoFile.buf, ecoFile.type);
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

try {
  const rag = await loadRagIndex();
  if (!rag.chunk_count) {
    const built = await buildRagIndex();
    console.log('RAG: índice inicial', built.chunk_count, 'chunks');
  } else {
    await ensureRagLoaded();
    console.log('RAG:', rag.chunk_count, 'chunks');
  }
} catch (e) {
  console.warn('RAG:', e.message);
}

server.listen(PORT, '127.0.0.1', () => {
  console.log('EcoMaestro API + UI: http://127.0.0.1:' + PORT + '/');
  console.log('POST http://127.0.0.1:' + PORT + '/api/demands');
});
