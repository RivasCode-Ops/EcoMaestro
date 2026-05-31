const ORDER = ['draft', 'triaged', 'in_progress', 'under_review', 'completed', 'archived'];

const AFTER_RESIDENT = {
  dlogica: 'triaged',
  workbench: 'in_progress',
  cursor: 'under_review',
  max: 'under_review'
};

function rank(s) {
  const i = ORDER.indexOf(s);
  return i < 0 ? 0 : i;
}

export function moradorRunsDone(runs) {
  return (runs || [])
    .filter((r) => r.resident && r.resident !== 'ecomaestro')
    .every((r) => r.status === 'done' || r.status === 'skipped');
}

export function nextDemandStatus(current, resident, runs) {
  let next = AFTER_RESIDENT[resident] || current;
  if (resident === 'max' && moradorRunsDone(runs)) {
    next = 'completed';
  }
  return rank(next) > rank(current) ? next : current;
}

export const VALID_STATUSES = ORDER.filter((s) => s !== 'archived').concat(['archived']);
