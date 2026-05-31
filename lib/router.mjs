/**
 * EcoMaestro — motor de roteamento (compartilhado UI + API)
 */

export const CATALOGO = [
  { keys: ['freedom', 'freedom4'], id: 'freedom', pasta: 'FREEDOM' },
  { keys: ['geogrowth'], id: 'geogrowth', pasta: 'geogrowth' },
  { keys: ['max-coding', 'max stack', 'maxstack'], id: 'max', pasta: 'max-coding' },
  { keys: ['cortana'], id: 'cortana', pasta: 'Cortana' },
  { keys: ['consorcio', 'consórcio'], id: 'consorcio', pasta: 'CONSORCIO' },
  { keys: ['recuperacao', 'recuperação'], id: 'recuperacao', pasta: 'Recuperacao_Financeira' },
  { keys: ['arbilocal'], id: 'arbilocal', pasta: null },
  { keys: ['simulador', 'troca-moto', 'moto'], id: 'simMoto', pasta: 'Simulador-Troca-Moto' },
  { keys: ['workbench'], id: 'workbench', pasta: 'workbench' },
  { keys: ['dlogica', 'dlogica'], id: 'dlogica', pasta: 'dlogica' },
  { keys: ['pulso'], id: null, pasta: 'PULSO' },
  { keys: ['quadro-negro'], id: null, pasta: 'Quadro-Negro' }
];

export const APPS = {
  dlogica: {
    id: 'dlogica', name: 'dLogica', label: 'Definir a demanda',
    faz: 'Transforma ideia confusa em problema, objetivo e tipo de solução.',
    href: '../dlogica/README.md', order: 1, tipo: 'morador', resident: 'dlogica'
  },
  workbench: {
    id: 'workbench', name: 'workbench', label: 'Governar o escopo',
    faz: 'Registra decisão, handoff e kit de método (etapa certa do 00–50).',
    href: '../workbench/CAMINHOS.md', order: 2, tipo: 'morador', resident: 'workbench'
  },
  cursor: {
    id: 'cursor', name: 'Cursor', label: 'Implementar',
    faz: 'Codifica o que foi aprovado no workbench, na pasta do projeto.',
    href: null, order: 3, tipo: 'morador', resident: 'cursor'
  },
  max: {
    id: 'max', name: 'Max Stack', label: 'Auditar o repositório',
    faz: 'Analisa saúde do código, riscos e evolução técnica do repo.',
    href: 'http://127.0.0.1:3847/', order: 4, tipo: 'morador', resident: 'max'
  },
  cortana: {
    id: 'cortana', name: 'Cortana', label: 'Pesquisar na web',
    faz: 'Busca fontes externas (mercado, legislação, concorrentes).',
    href: 'http://127.0.0.1:8787/', order: 10, tipo: 'extra', resident: 'cortana'
  },
  freedom: {
    id: 'freedom', name: 'FREEDOM', label: 'Planejar independência (FIRE)',
    faz: 'Calculadora e simulador FIRE — patrimônio, meta, cenários.',
    href: 'http://127.0.0.1:8765/', order: 5, tipo: 'produto', resident: 'freedom'
  },
  consorcio: {
    id: 'consorcio', name: 'CONSORCIO', label: 'Dados financeiros reais',
    faz: 'Consórcio e Open Finance — complemento ao planejamento.',
    href: '../CONSORCIO/README.md', order: 11, tipo: 'complemento', resident: 'consorcio'
  },
  recuperacao: {
    id: 'recuperacao', name: 'Recuperação Financeira', label: 'Saúde financeira / dívidas',
    faz: 'Dashboard de recuperação e indicadores de caixa.',
    href: '../Recuperacao_Financeira/README.md', order: 12, tipo: 'complemento', resident: 'recuperacao'
  },
  arbilocal: {
    id: 'arbilocal', name: 'ARBILOCAL', label: 'Decisão comercial',
    faz: 'Pesquisa e síntese para fornecedor e revenda.',
    href: 'https://github.com/RivasCode-Ops/ARBILOCAL', order: 13, tipo: 'complemento', resident: 'arbilocal'
  },
  simMoto: {
    id: 'simMoto', name: 'Simulador Troca Moto', label: 'Custo de bem durável',
    faz: 'Simula impacto de troca/parcela em veículo.',
    href: '../Simulador-Troca-Moto/index.html', order: 14, tipo: 'complemento', resident: 'simulador_troca_moto'
  },
  ecomaestro: {
    id: 'ecomaestro', name: 'EcoMaestro', label: 'Triagem',
    faz: 'Classifica intenção e monta plano de entrega.',
    href: null, order: 0, tipo: 'morador', resident: 'ecomaestro'
  },
  geogrowth: {
    id: 'geogrowth', name: 'geogrowth', label: 'Produto geográfico',
    faz: 'App de crescimento/geo já existente em _PROJETOS.',
    href: 'http://127.0.0.1:5190/', order: 15, tipo: 'produto', resident: 'geogrowth'
  }
};

export const NEEDS_BY_INTENT = {
  ideia_nova: [
    'Clareza sobre o que construir (problema e objetivo)',
    'Decisão oficial de escopo e método',
    'Implementação na pasta do projeto',
    'Checagem técnica do repositório quando houver código'
  ],
  feature_nova: [
    'Escopo da funcionalidade no workbench (handoff)',
    'Implementação no Cursor',
    'Auditoria do repo após as mudanças'
  ],
  auditar: [
    'Relatório de saúde do repositório',
    'Revisão de aderência no workbench se houver escopo definido'
  ],
  pesquisar: ['Síntese com fontes na web', 'Definição ou governança se virar produto'],
  fire: ['Simulação FIRE e metas de patrimônio', 'Governança no workbench se virar entrega de produto'],
  correcao_rapida: ['Correção pontual (kit 50 do workbench)', 'Patch no Cursor', 'Validação rápida no Max'],
  financeiro_real: ['Dados reais de finanças (consórcio ou recuperação)', 'Opcional: alinhar com planejamento FIRE'],
  comercial: ['Pesquisa de mercado/fornecedor', 'Decisão registrada no workbench'],
  gasto_bem: ['Simulação do gasto em bem durável', 'Opcional: impacto no plano FIRE'],
  produto_existente: ['Abrir e evoluir o produto na pasta correta', 'Auditoria técnica se houver repo'],
  repo_github: [
    'Escopo da funcionalidade no workbench (handoff)',
    'Implementação no Cursor',
    'Auditoria do repo após as mudanças'
  ]
};

const KW = [
  { keys: ['projeto novo', 'do zero', 'criar app', 'novo produto', 'ideia nova', 'ainda nao existe'], intent: 'ideia_nova', tipo: 'novo' },
  { keys: ['nova funcionalidade', 'nova feature', 'adicionar', 'implementar', 'melhoria', 'evoluir', 'tela nova'], intent: 'feature_nova', tipo: 'feature' },
  { keys: ['auditar', 'auditoria', 'raio-x', 'raio x', 'como esta o codigo', 'health', 'revisar repo', 'antes do pr'], intent: 'auditar', tipo: 'feature' },
  { keys: ['fire', 'independencia', 'independência', 'aposentadoria', '4%', 'swr', 'coast', 'barista', 'patrimonio meta'], intent: 'fire', extras: ['freedom'] },
  { keys: ['pesquis', 'mercado', 'concorr', 'benchmark', 'legisla', 'fontes na web'], intent: 'pesquisar', extras: ['cortana'] },
  { keys: ['bug urgente', 'correcao rapida', 'correção rápida', 'hotfix', 'quebrou agora'], intent: 'correcao_rapida', wb: '50-CORRECAO-RAPIDA' },
  { keys: ['bug', 'erro', 'falha', 'nao funciona', 'não funciona'], intent: 'correcao_rapida' },
  { keys: ['consorcio', 'consórcio', 'open finance'], intent: 'financeiro_real', extras: ['consorcio'] },
  { keys: ['divida', 'dívida', 'recuperacao', 'recuperação', 'inadimpl'], intent: 'financeiro_real', extras: ['recuperacao'] },
  { keys: ['fornecedor', 'revenda', 'comercial', 'arbi'], intent: 'comercial', extras: ['arbilocal', 'cortana'] },
  { keys: ['moto', 'troca de moto', 'veiculo', 'veículo'], intent: 'gasto_bem', extras: ['simMoto', 'freedom'] }
];

export function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

export function parseGithub(link) {
  const t = (link || '').trim();
  const m = t.match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/i);
  if (!m) return null;
  const repo = m[2].replace(/\.git$/, '');
  return {
    org: m[1],
    repo,
    slug: (m[1] + '/' + repo).toLowerCase(),
    url: 'https://github.com/' + m[1] + '/' + repo,
    maxUrl: 'http://127.0.0.1:3847/?repo=' + encodeURIComponent('https://github.com/' + m[1] + '/' + repo)
  };
}

export function matchCatalog(text, gh) {
  const blob = norm(text + ' ' + (gh ? gh.repo + ' ' + gh.slug : ''));
  for (const c of CATALOGO) {
    for (const k of c.keys) {
      if (blob.includes(norm(k))) return c;
    }
  }
  return null;
}

function detectTipoDemanda(text) {
  const t = norm(text);
  if (/\b(projeto novo|do zero|criar app|novo produto|ideia nova)\b/.test(t)) return 'novo';
  if (/\b(nova funcionalidade|nova feature|adicionar funcionalidade|melhoria no)\b/.test(t)) return 'feature';
  if (t.length < 8) return null;
  return 'feature';
}

export function classify(desc, gh) {
  const text = norm(desc);
  let best = { score: 0, rule: null };
  for (const rule of KW) {
    let score = 0;
    for (const k of rule.keys) {
      if (text.includes(norm(k))) score += 2;
    }
    if (score > best.score) best = { score, rule };
  }

  const tipo = detectTipoDemanda(desc) || (best.rule && best.rule.tipo) || (gh ? 'feature' : 'novo');
  let intent = best.rule ? best.rule.intent : null;

  if (!intent) {
    if (tipo === 'novo') intent = 'ideia_nova';
    else if (gh) intent = 'feature_nova';
    else intent = 'ideia_nova';
  }

  if (gh && !desc.trim() && intent === 'ideia_nova') intent = 'feature_nova';
  if (gh && text.includes('auditar')) intent = 'auditar';

  const cat = matchCatalog(desc, gh);
  const extras = (best.rule && best.rule.extras) ? best.rule.extras.slice() : [];

  if (intent === 'fire') {
    return { intent, tipo, moradores: [], extras: ['freedom'], primary: 'freedom', wb: null, cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'pesquisar') {
    return { intent, tipo, moradores: ['workbench'], extras: ['cortana'], primary: 'cortana', wb: null, cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'auditar') {
    return { intent, tipo, moradores: ['max', 'workbench'], extras, primary: 'max', wb: null, cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'correcao_rapida') {
    return { intent, tipo, moradores: ['workbench', 'cursor', 'max'], extras, primary: 'workbench', wb: '50-CORRECAO-RAPIDA', cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'feature_nova') {
    return { intent, tipo, moradores: ['workbench', 'cursor', 'max'], extras, primary: 'workbench', wb: '20-ENTREGA-DE-PRODUTO', cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'ideia_nova') {
    return { intent, tipo, moradores: ['dlogica', 'workbench', 'cursor', 'max'], extras, primary: 'dlogica', wb: '10-DESCOBERTA-E-MODELAGEM', cat, routing_label: 'Detectado pela descrição' };
  }
  if (intent === 'financeiro_real' || intent === 'comercial' || intent === 'gasto_bem') {
    const primary = extras[0] || 'workbench';
    return { intent, tipo, moradores: ['workbench'], extras, primary, wb: null, cat, routing_label: 'Detectado pela descrição' };
  }
  if (cat && cat.id) {
    return { intent: 'produto_existente', tipo, moradores: ['workbench', 'cursor', 'max'], extras: [cat.id], primary: cat.id, wb: '20-ENTREGA-DE-PRODUTO', cat, routing_label: 'Detectado pela descrição' };
  }

  return {
    intent: 'ideia_nova',
    tipo,
    moradores: ['dlogica', 'workbench', 'cursor', 'max'],
    extras,
    primary: 'dlogica',
    wb: '10-DESCOBERTA-E-MODELAGEM',
    cat,
    routing_label: gh ? 'Detectado pelo link' : 'Fluxo padrão'
  };
}

export function buildAplicadores(plan, gh, cat) {
  const list = [];
  const push = (id, principal) => {
    const app = APPS[id];
    if (!app || list.some((x) => x.id === id)) return;
    let href = app.href;
    if (id === 'max' && gh && gh.maxUrl) href = gh.maxUrl;
    if (id === 'workbench' && plan.wb) href = '../workbench/' + plan.wb + '/README.md';
    let note = app.faz;
    if (id === 'cursor' && cat && cat.pasta) note += ' Pasta: c:\\_PROJETOS\\' + cat.pasta;
    if (id === 'cursor' && gh) note += ' Repo: ' + gh.org + '/' + gh.repo;
    list.push({ ...app, href, note, principal: !!principal });
  };

  push(plan.primary, true);
  for (const id of plan.extras || []) push(id, false);
  for (const id of plan.moradores || []) {
    if (id !== plan.primary) push(id, false);
  }

  list.sort((a, b) => {
    if (a.principal !== b.principal) return a.principal ? -1 : 1;
    return (a.order || 99) - (b.order || 99);
  });
  return list;
}

export function titulo(gh, desc, cat) {
  if (gh) return gh.org + '/' + gh.repo;
  if (cat && cat.pasta) return cat.pasta;
  const first = (desc || '').split('\n')[0].trim();
  if (first.length > 60) return first.slice(0, 57) + '…';
  return first || 'Demanda sem nome';
}

export function confidencePct(plan, desc, gh) {
  let n = 40;
  if (gh) n += 25;
  if ((desc || '').trim().length > 20) n += 20;
  if (plan.intent !== 'ideia_nova' || desc.trim()) n += 15;
  return Math.min(n, 95);
}

export function buildRuns(plan, aplicadores) {
  return aplicadores.map((a, i) => ({
    resident: a.resident || a.id,
    sequence_order: i + 1,
    is_primary: a.principal,
    status: i === 0 ? 'pending' : 'pending',
    workbench_kit: a.id === 'workbench' ? plan.wb : null,
    input_payload: {},
    output_payload: {}
  }));
}

/**
 * Analisa demanda (mesmo comportamento do botão na UI)
 */
export function analyzeDemand({ github_url = '', description = '' }) {
  const link = (github_url || '').trim();
  const desc = (description || '').trim();
  if (!link && !desc) {
    const err = new Error('Informe github_url e/ou description');
    err.code = 'VALIDATION';
    throw err;
  }

  const gh = parseGithub(link);
  const plan = classify(desc, gh);
  const cat = plan.cat || matchCatalog(desc, gh);
  const needs = (NEEDS_BY_INTENT[plan.intent] || NEEDS_BY_INTENT.ideia_nova).slice();
  if (plan.tipo === 'novo' && !needs.some((n) => n.includes('Clareza'))) {
    needs.unshift('Validar se a ideia vira produto ou ferramenta interna');
  }
  const aplicadores = buildAplicadores(plan, gh, cat);
  const conf = confidencePct(plan, desc, gh);

  const source_type = gh && desc ? 'mixed' : gh ? 'github' : 'description';

  const payload_snapshot = {
    demand_id: null,
    intent: plan.intent,
    context: {
      source_type,
      github_url: gh ? gh.url : null,
      localhost_url: null,
      raw_description: desc,
      tipo_demanda: plan.tipo
    },
    meta: { version: 1, generated_by: 'ecomaestro', routing_label: plan.routing_label, updated_at: new Date().toISOString() }
  };

  return {
    demand: {
      title: titulo(gh, desc, cat),
      description: desc,
      source_type,
      github_url: gh ? gh.url : null,
      tipo_demanda: plan.tipo,
      status: 'draft',
      current_intent: plan.intent,
      primary_resident: APPS[plan.primary]?.resident || plan.primary,
      confidence_pct: conf
    },
    report: {
      title_suffix: plan.tipo === 'novo' ? ' · projeto novo' : plan.tipo === 'feature' ? ' · nova funcionalidade' : '',
      needs,
      aplicadores: aplicadores.map((a) => ({
        id: a.id,
        name: a.name,
        label: a.label,
        note: a.note,
        href: a.href,
        principal: a.principal,
        badge: a.principal ? 'Comece aqui' : 'Depois'
      })),
      routing_label: plan.routing_label,
      confidence_text: 'Confiança do roteamento: ' + conf + '% — revise se algo parecer fora do esperado.'
    },
    plan,
    runs: buildRuns(plan, aplicadores),
    payload_snapshot
  };
}
