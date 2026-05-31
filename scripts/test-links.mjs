import { existsSync } from 'fs';
import { join } from 'path';
import { toEcoWebHref } from '../lib/eco-href.mjs';

const ROOT = 'c:\\_PROJETOS';

const paths = [
  '../dlogica/README.md',
  '../workbench/CAMINHOS.md',
  '../workbench/Projeto Novo/CODING-DIARIO.md',
  '../workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/README.md',
  '../workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/d00-contexto-sessao.md',
  '../workbench/10-DESCOBERTA-E-MODELAGEM/README.md',
  '../workbench/20-ENTREGA-DE-PRODUTO/README.md',
  '../workbench/50-CORRECAO-RAPIDA/README.md',
  '../workbench/Cursor-Kit/README.md',
  '../workbench/Cursor-Kit/INSTALAR-NO-REPO.bat',
  '../CONSORCIO/README.md',
  '../Recuperacao_Financeira/README.md',
  '../Simulador-Troca-Moto/README.md',
  '../COmniWS/README.md',
  '../geogrowth-sync-api/README.md',
  '../PROMPT/CAMINHOS.md'
];

let miss = 0;
for (const p of paths) {
  const rel = p.replace(/^\.\.\//, '').replace(/\/$/, '');
  const local = join(ROOT, rel);
  const ok = existsSync(local);
  if (!ok) miss++;
  console.log((ok ? 'OK  ' : 'MISS'), toEcoWebHref(p));
}

console.log('--- missing:', miss, 'of', paths.length);
process.exit(miss ? 1 : 0);
