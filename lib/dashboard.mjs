/** Painel CEO — KPIs locais a partir de demandas completas (JSON). */

const OPEN_STATUSES = new Set(['draft', 'triaged', 'in_progress', 'under_review']);
const MORADORES = ['dlogica', 'workbench', 'cursor', 'max'];
const STALE_DAYS = 7;

function daysAgo(iso) {
  if (!iso) return Infinity;
  return (Date.now() - new Date(iso).getTime()) / (86400 * 1000);
}

function lastMoradorRun(record) {
  const runs = (record.runs || []).filter((r) => r.resident !== 'ecomaestro' && r.status === 'done');
  if (!runs.length) return null;
  runs.sort((a, b) => (b.finished_at || '').localeCompare(a.finished_at || ''));
  return runs[0];
}

function lastActivityAt(record) {
  const r = lastMoradorRun(record);
  if (r?.finished_at) return r.finished_at;
  return record.updated_at || record.created_at;
}

export function buildCeoDashboard(records = [], { staleDays = STALE_DAYS } = {}) {
  const byStatus = {
    draft: 0,
    triaged: 0,
    in_progress: 0,
    under_review: 0,
    completed: 0,
    archived: 0
  };
  const byLastResident = Object.fromEntries(MORADORES.map((m) => [m, 0]));
  const stale = [];
  const triageHours = [];
  const completeHours = [];

  let openCount = 0;

  for (const rec of records) {
    const st = rec.demand?.status || 'draft';
    if (byStatus[st] !== undefined) byStatus[st]++;
    else byStatus.draft++;

    if (OPEN_STATUSES.has(st)) openCount++;

    const last = lastMoradorRun(rec);
    if (last?.resident && byLastResident[last.resident] !== undefined) {
      byLastResident[last.resident]++;
    }

    const inactive = daysAgo(lastActivityAt(rec));
    if (OPEN_STATUSES.has(st) && inactive >= staleDays) {
      stale.push({
        id: rec.id,
        title: rec.demand?.title,
        status: st,
        project_folder: rec.demand?.project_folder,
        days_inactive: Math.floor(inactive)
      });
    }

    const created = rec.created_at ? new Date(rec.created_at).getTime() : null;
    const dRun = (rec.runs || []).find((r) => r.resident === 'dlogica' && r.status === 'done');
    if (created && dRun?.finished_at) {
      triageHours.push((new Date(dRun.finished_at).getTime() - created) / 3600000);
    }
    if (created && st === 'completed' && rec.updated_at) {
      completeHours.push((new Date(rec.updated_at).getTime() - created) / 3600000);
    }
  }

  const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);

  stale.sort((a, b) => b.days_inactive - a.days_inactive);

  return {
    version: '1.3',
    generated_at: new Date().toISOString(),
    total_demands: records.length,
    open_count: openCount,
    by_status: byStatus,
    by_last_resident: byLastResident,
    stale_days: staleDays,
    stale_demands: stale.slice(0, 20),
    avg_hours_to_triaged: avg(triageHours),
    avg_hours_to_completed: avg(completeHours),
    samples: {
      triaged_n: triageHours.length,
      completed_n: completeHours.length
    }
  };
}
