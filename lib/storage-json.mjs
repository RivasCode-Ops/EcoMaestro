import { mkdir, readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { mergePayloadSnapshot } from './payload-merge.mjs';
import { nextDemandStatus } from './status-transition.mjs';

const DATA_DIR = join(process.cwd(), 'data', 'demands');

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

function demandPath(id) {
  return join(DATA_DIR, id + '.json');
}

export async function createDemand(analyzed) {
  await ensureDir();
  const id = randomUUID();
  const now = new Date().toISOString();
  analyzed.payload_snapshot.demand_id = id;

  const record = {
    id,
    created_at: now,
    updated_at: now,
    demand: { ...analyzed.demand, id },
    report: analyzed.report,
    runs: [
      {
        id: randomUUID(),
        resident: 'ecomaestro',
        sequence_order: 0,
        is_primary: false,
        status: 'done',
        workbench_kit: null,
        input_payload: {},
        output_payload: analyzed.payload_snapshot,
        finished_at: now
      },
      ...analyzed.runs.map((r) => ({ ...r, id: randomUUID() }))
    ],
    payload_snapshot: analyzed.payload_snapshot
  };

  await writeFile(demandPath(id), JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function getDemand(id) {
  try {
    const raw = await readFile(demandPath(id), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function listDemands(limit = 50, projectFolder = null) {
  await ensureDir();
  let files = [];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const items = [];
  for (const f of jsonFiles) {
    try {
      const raw = await readFile(join(DATA_DIR, f), 'utf8');
      const d = JSON.parse(raw);
      const folder =
        d.demand.project_folder || d.payload_snapshot?.context?.project_folder || null;
      if (projectFolder && folder !== projectFolder) continue;
      const desc = (d.demand.description || '').trim();
      items.push({
        id: d.id,
        title: d.demand.title,
        status: d.demand.status,
        current_intent: d.demand.current_intent,
        created_at: d.created_at,
        updated_at: d.updated_at,
        github_url: d.demand.github_url,
        project_folder: folder,
        description_preview: desc.length > 96 ? desc.slice(0, 93) + '…' : desc
      });
    } catch {
      /* skip */
    }
  }
  items.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  return items.slice(0, limit);
}

export async function patchDemandStatus(id, status) {
  const record = await getDemand(id);
  if (!record) return null;
  record.demand.status = status;
  record.updated_at = new Date().toISOString();
  await writeFile(demandPath(id), JSON.stringify(record, null, 2), 'utf8');
  return record;
}

function findRun(record, runKey) {
  return (record.runs || []).find((r) => r.id === runKey || r.resident === runKey);
}

export async function patchRun(demandId, runKey, patch = {}) {
  const record = await getDemand(demandId);
  if (!record) return null;
  const run = findRun(record, runKey);
  if (!run) return null;

  if (patch.status) run.status = patch.status;
  if (patch.run_notes != null) run.run_notes = patch.run_notes;
  if (patch.output_payload) {
    run.output_payload = { ...(run.output_payload || {}), ...patch.output_payload };
  }
  if (patch.status === 'done') {
    run.finished_at = new Date().toISOString();
    if (run.resident !== 'ecomaestro') {
      record.payload_snapshot = mergePayloadSnapshot(
        record.payload_snapshot,
        run.resident,
        run.output_payload || {}
      );
      record.demand.status = nextDemandStatus(record.demand.status, run.resident, record.runs);
    }
  }
  record.updated_at = new Date().toISOString();
  await writeFile(demandPath(demandId), JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export function storageKind() {
  return 'json';
}
