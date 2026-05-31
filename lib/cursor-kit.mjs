/** Links canônicos para coding no Cursor (prompts + rules). Fonte: workbench, não PROMPT. */

export const CURSOR_KIT_LINKS = [
  { id: 'caminhos', label: 'CAMINHOS (workbench)', href: '../workbench/CAMINHOS.md' },
  { id: 'coding', label: 'CODING-DIARIO', href: '../workbench/Projeto Novo/CODING-DIARIO.md' },
  { id: 'd00', label: 'D00 — contexto da sessão', href: '../workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/d00-contexto-sessao.md' },
  { id: 'd01', label: 'D01 — feature', href: '../workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/d01-feature.md' },
  { id: 'd02', label: 'D02 — bugfix', href: '../workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/d02-bugfix.md' },
  { id: 'cheat', label: 'Cheatsheet', href: '../workbench/Projeto Novo/CHEATSHEET.md' },
  { id: 'rules', label: 'Cursor-Kit (rules genéricas)', href: '../workbench/Cursor-Kit/README.md' },
  { id: 'continuidade', label: 'Continuidade de demandas (prompt)', href: '../EcoMaestro/docs/PROMPT-CONTINUIDADE-DEMANDAS.md' },
  { id: 'rules_install', label: 'Instalar rules no repo', href: '../workbench/Cursor-Kit/INSTALAR-NO-REPO.bat' },
  { id: 'rules_geo', label: 'GeoGrowth-Cursor (só geo)', href: '../workbench/GeoGrowth-Cursor/README.md' }
];

const CODING_INTENTS = new Set([
  'feature_nova',
  'correcao_rapida',
  'coding_dev',
  'repo_github',
  'implementar',
  'governanca',
  'infra_resiliencia'
]);

const CODING_KW = [
  'cursor',
  'rules',
  'coding',
  'codar',
  'composer',
  'agent',
  'implementar funcao',
  'implementar função',
  '.cursor',
  'regra'
];

export function shouldShowCursorKit(plan, desc) {
  if (CODING_INTENTS.has(plan.intent) || plan.coding) return true;
  const t = (desc || '').toLowerCase();
  return CODING_KW.some((k) => t.includes(k));
}

export function buildCursorKit(plan) {
  const primary =
    plan.intent === 'correcao_rapida'
      ? 'd02'
      : plan.intent === 'coding_dev'
        ? 'd00'
        : 'd00';
  return {
    title: 'Cursor + workbench — coding e rules',
    intro:
      'O workbench já é o passo 2 das 4 portas (governança). Use os prompts abaixo no Cursor; ' +
      'copie o modelo de .cursor/rules para o repo do app. Pasta PROMPT/ é espelho legado — prefira workbench.',
    links: CURSOR_KIT_LINKS,
    start_with: primary,
    workbench_role: 'Decisão, handoff e kit 00–50 (não substitui Cursor)',
    cursor_role: 'Implementar com D00→D01/D02 e rules no projeto'
  };
}
