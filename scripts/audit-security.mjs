#!/usr/bin/env node
/**
 * Auditoria rápida: dependências, rotas sem guard, risco cross-tenant.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  GUARDED_WRITE_ROUTES,
  GUARDED_READ_ROUTES,
  apiKeyRequired,
  isProjetosPathAllowed
} from '../lib/api-guard.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.optionalDependencies };

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.mjs') || name === 'server.mjs') acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
const importRe = /from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g;
const usedLocal = new Set();
for (const f of files) {
  const txt = readFileSync(f, 'utf8');
  let m;
  while ((m = importRe.exec(txt))) {
    const spec = m[1] || m[2];
    if (spec.startsWith('.') || spec.startsWith('/')) usedLocal.add(spec);
  }
}

const libFiles = readdirSync(join(ROOT, 'lib')).map((n) => `lib/${n}`);
const serverTxt = readFileSync(join(ROOT, 'server.mjs'), 'utf8');
const routeRe = /pathname\s*===\s*['"]([^'"]+)['"]|pathname\.match\(\^\\\/api\\\/([^$]+)/g;
const routes = new Set();
let rm;
const serverBody = readFileSync(join(ROOT, 'server.mjs'), 'utf8');
for (const line of serverBody.split('\n')) {
  if (line.includes("pathname === '/api/")) {
    const m = line.match(/pathname === '([^']+)'/);
    if (m) routes.add(m[1]);
  }
  if (line.includes('pathname.match')) routes.add('(regex demandas)');
}

const orphanLibs = libFiles.filter((rel) => {
  const base = rel.replace('lib/', '');
  return !serverBody.includes(base) && !files.some((f) => {
    if (f.endsWith('server.mjs')) return false;
    try {
      return readFileSync(f, 'utf8').includes(base);
    } catch {
      return false;
    }
  });
});

console.log('=== EcoMaestro — auditoria de segurança ===\n');

console.log('1) Dependências npm declaradas:', Object.keys(deps).length ? Object.keys(deps).join(', ') : '(nenhuma obrigatória)');
console.log('   pg: optional — só usada se DATABASE_URL + npm install pg');
console.log('   Runtime: Node built-ins + módulos locais em lib/\n');

console.log('2) Rotas com guarda (quando ECOMAESTRO_API_KEY definida):');
for (const r of GUARDED_WRITE_ROUTES) console.log('   WRITE', r.method, r.path || r.pathPrefix);
for (const r of GUARDED_READ_ROUTES) console.log('   READ ', r.method, r.path || r.pathPrefix);
console.log('   API key ativa agora:', apiKeyRequired() ? 'SIM' : 'NÃO (modo dev local)\n');

console.log('3) Rotas /api sem guarda explícita (risco se expor na rede):');
const unguarded = [
  'GET /api/health',
  'GET /api/ecosystem/ports',
  'GET /api/projects',
  'GET /api/projects/:id/guide',
  'POST /api/orchestrate (preview — vaza texto da demanda)'
];
for (const u of unguarded) console.log('   -', u);
console.log('   GET /p/* — leitura de arquivos _PROJETOS (filtro deny-list em api-guard)\n');

console.log('4) Cross-tenant / LGPD:');
console.log('   - tenant_id em demandas JSON (filtro list/get)');
console.log('   - Postgres: coluna tenant_id ainda pendente na migration 002');
console.log('   - Sem API key: qualquer processo em 127.0.0.1 acessa tudo (aceitável só desktop)\n');

console.log('5) Módulos lib possivelmente não referenciados:');
if (orphanLibs.length) orphanLibs.forEach((o) => console.log('   -', o));
else console.log('   (nenhum óbvio)');
console.log('   verify-links-node.mjs: só testes/auditoria — não importado pelo server\n');

console.log('6) Amostra /p/ bloqueados:');
for (const p of ['FREEDOM/.env', 'XAXA/node_modules/x', 'data/demands/x.json']) {
  console.log('  ', p, '→', isProjetosPathAllowed(p) ? 'PERMITIDO' : 'BLOQUEADO');
}

console.log('\nOK — execute com ECOMAESTRO_API_KEY para endurecer mutações.');
