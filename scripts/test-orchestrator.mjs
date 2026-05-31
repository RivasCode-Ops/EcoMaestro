import { analyzeDemand } from '../lib/router.mjs';
import { orchestrateAnalyzed } from '../lib/demand-orchestrator.mjs';

const cases = [
  {
    name: 'feature alinhada',
    project_folder: 'FREEDOM',
    description: 'nova funcionalidade — exportar CSV no FREEDOM'
  },
  {
    name: 'intent conflito',
    project_folder: 'XAXA',
    description: 'auditoria SRE backup postgres disaster recovery'
  }
];

for (const c of cases) {
  const a = analyzeDemand({
    github_url: '',
    description: c.description,
    project_folder: c.project_folder
  });
  const o = orchestrateAnalyzed(a);
  console.log('\n---', c.name, '---');
  console.log('intent:', a.demand.current_intent, 'verdict:', o.verdict, 'score:', o.score_pct);
  console.log('summary:', o.summary);
  o.alignment.checks.filter((x) => !x.ok).forEach((x) => console.log('  align:', x.label, '—', x.detail));
}

console.log('\nOK');
