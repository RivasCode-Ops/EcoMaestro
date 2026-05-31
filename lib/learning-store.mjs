import { mkdir, readFile, writeFile } from 'fs/promises';
import { createHash, randomUUID } from 'crypto';
import { join as pathJoin } from 'path';

const DIR = pathJoin(process.cwd(), 'data', 'learning');
const FILE = pathJoin(DIR, 'cases.json');

function hashDesc(text) {
  return createHash('sha256').update((text || '').trim().toLowerCase()).digest('hex').slice(0, 16);
}

export async function loadCases() {
  try {
    const raw = await readFile(FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { cases: [] };
  }
}

async function saveCases(data) {
  await mkdir(DIR, { recursive: true });
  await writeFile(FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function recordLearningCase({
  tenantId,
  intent,
  description,
  projectFolder,
  outcome,
  moradores
}) {
  const store = await loadCases();
  const descHash = hashDesc(description);
  const caseRow = {
    id: randomUUID(),
    tenant_id: tenantId || 'local',
    intent,
    desc_hash: descHash,
    project_folder: projectFolder || null,
    outcome: outcome || 'adequado',
    moradores: moradores || [],
    created_at: new Date().toISOString()
  };
  store.cases = [caseRow, ...(store.cases || [])].slice(0, 500);
  await saveCases(store);
  return caseRow;
}

export async function findSimilarCases(description, tenantId = 'local', limit = 3) {
  const store = await loadCases();
  const h = hashDesc(description);
  return (store.cases || [])
    .filter((c) => c.tenant_id === tenantId && c.desc_hash === h)
    .slice(0, limit);
}

export async function correctIntentForDemand(record, correctedIntent, tenantId = 'local') {
  const desc = record?.demand?.description || '';
  if (!desc || !correctedIntent) return null;
  const store = await loadCases();
  const h = hashDesc(desc);
  let c = (store.cases || []).find((x) => x.tenant_id === tenantId && x.desc_hash === h);
  if (!c) {
    c = await recordLearningCase({
      tenantId,
      intent: record.demand?.current_intent,
      description: desc,
      projectFolder: record.demand?.project_folder,
      outcome: 'corrigido',
      moradores: (record.runs || []).filter((r) => r.resident !== 'ecomaestro').map((r) => r.resident)
    });
  }
  return feedbackIntent(c.id, correctedIntent, false);
}

export async function feedbackIntent(caseId, correctedIntent, positive = false) {
  const store = await loadCases();
  const c = (store.cases || []).find((x) => x.id === caseId);
  if (!c) return null;
  c.feedback = { corrected_intent: correctedIntent, positive, at: new Date().toISOString() };
  if (!positive && correctedIntent) c.intent = correctedIntent;
  await saveCases(store);
  return c;
}
