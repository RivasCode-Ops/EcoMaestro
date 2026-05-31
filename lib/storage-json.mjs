import { mkdir, readFile, writeFile, readdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

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

export async function listDemands(limit = 20) {
  await ensureDir();
  let files = [];
  try {
    files = await readdir(DATA_DIR);
  } catch {
    return [];
  }
  const jsonFiles = files.filter((f) => f.endsWith('.json'));
  const items = [];
  for (const f of jsonFiles.slice(0, limit * 2)) {
    try {
      const raw = await readFile(join(DATA_DIR, f), 'utf8');
      const d = JSON.parse(raw);
      items.push({
        id: d.id,
        title: d.demand.title,
        status: d.demand.status,
        current_intent: d.demand.current_intent,
        created_at: d.created_at,
        github_url: d.demand.github_url
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

export function storageKind() {
  return 'json';
}
