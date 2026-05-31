import { analyzeDemand } from '../lib/router.mjs';

const cases = [
  { name: 'ideia_nova', project_folder: null, description: 'projeto novo — app teste', github_url: '' },
  { name: 'feature FREEDOM', project_folder: 'FREEDOM', description: 'nova funcionalidade — export CSV', github_url: '' },
  { name: 'auditar', project_folder: 'FREEDOM', description: 'auditar o repo', github_url: 'https://github.com/RivasCode-Ops/FREEDOM' },
  { name: 'fire', project_folder: 'FREEDOM', description: 'simulacao FIRE', github_url: '' },
  { name: 'comercial', project_folder: null, description: 'decisao comercial fornecedor', github_url: '' }
];

let bad = 0;
for (const c of cases) {
  const r = analyzeDemand({
    description: c.description,
    github_url: c.github_url,
    project_folder: c.project_folder
  });
  console.log('\n===', c.name, '===');
  for (const a of r.report.aplicadores) {
    const st = a.link_check?.status || '?';
    const mark = st === 'missing' ? 'FAIL' : st === 'ok' || st === 'external' || st === 'ide' ? ' OK ' : ' ?? ';
    console.log(mark, a.name, st, a.href || '(sem link)');
    if (st === 'missing') bad++;
  }
}
console.log('\nTotal links missing:', bad);
process.exit(bad ? 1 : 0);
