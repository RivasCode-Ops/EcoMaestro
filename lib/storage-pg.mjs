/**
 * Postgres — opcional via DATABASE_URL
 * npm install pg (se usar)
 */
import { randomUUID } from 'crypto';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let pool = null;

export async function init() {
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('SELECT 1');
}

async function ensureSchema() {
  const sql = await readFile(join(__dirname, '..', 'db', 'migrations', '001_ecomaestro_core.sql'), 'utf8');
  await pool.query(sql);
}

export async function createDemand(analyzed) {
  if (!pool) throw new Error('Postgres não inicializado');
  await ensureSchema();
  const id = randomUUID();
  const now = new Date();
  analyzed.payload_snapshot.demand_id = id;
  const d = analyzed.demand;

  await pool.query(
    `INSERT INTO demands (id, title, description, source_type, github_url, tipo_demanda, status,
      current_intent, primary_resident, confidence_pct, payload_snapshot, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'draft',$7,$8,$9,$10,$11,$11)`,
    [
      id, d.title, d.description, d.source_type, d.github_url, d.tipo_demanda,
      d.current_intent, d.primary_resident, d.confidence_pct,
      JSON.stringify(analyzed.payload_snapshot), now
    ]
  );

  await pool.query(
    `INSERT INTO demand_reports (demand_id, needs, aplicadores, routing_label)
     VALUES ($1, $2, $3, $4)`,
    [id, JSON.stringify(analyzed.report.needs), JSON.stringify(analyzed.report.aplicadores), analyzed.report.routing_label]
  );

  const runs = analyzed.runs;
  for (const r of runs) {
    await pool.query(
      `INSERT INTO demand_resident_runs (id, demand_id, resident, sequence_order, is_primary, status, workbench_kit, output_payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        randomUUID(), id, r.resident, r.sequence_order, r.is_primary, r.status, r.workbench_kit,
        r.resident === 'ecomaestro' ? JSON.stringify(analyzed.payload_snapshot) : '{}'
      ]
    );
  }

  return getDemand(id);
}

export async function getDemand(id) {
  const dRes = await pool.query('SELECT * FROM demands WHERE id = $1', [id]);
  if (!dRes.rows.length) return null;
  const row = dRes.rows[0];
  const rep = await pool.query('SELECT * FROM demand_reports WHERE demand_id = $1', [id]);
  const runs = await pool.query(
    'SELECT * FROM demand_resident_runs WHERE demand_id = $1 ORDER BY sequence_order',
    [id]
  );
  return {
    id: row.id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    demand: {
      id: row.id,
      title: row.title,
      description: row.description,
      source_type: row.source_type,
      github_url: row.github_url,
      tipo_demanda: row.tipo_demanda,
      status: row.status,
      current_intent: row.current_intent,
      primary_resident: row.primary_resident,
      confidence_pct: row.confidence_pct
    },
    report: rep.rows[0]
      ? {
          needs: rep.rows[0].needs,
          aplicadores: rep.rows[0].aplicadores,
          routing_label: rep.rows[0].routing_label
        }
      : null,
    runs: runs.rows,
    payload_snapshot: row.payload_snapshot
  };
}

export async function listDemands(limit = 20) {
  const res = await pool.query(
    `SELECT id, title, status, current_intent, github_url, created_at
     FROM demands ORDER BY created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function patchDemandStatus(id, status) {
  await pool.query(
    `UPDATE demands SET status = $2::demand_status, updated_at = now() WHERE id = $1`,
    [id, status]
  );
  return getDemand(id);
}

export function storageKind() {
  return 'postgres';
}
