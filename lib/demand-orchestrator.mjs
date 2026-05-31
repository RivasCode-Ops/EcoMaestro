/**
 * Orquestrador de adequação — alinhamento ao pedido (propósito) e execução no condomínio.
 */
import { classify, parseGithub, NEEDS_BY_INTENT, norm } from './router.mjs';
import { moradorRunsDone } from './status-transition.mjs';

const INTENT_PRIMARY = {
  ideia_nova: 'dlogica',
  feature_nova: 'workbench',
  infra_resiliencia: 'workbench',
  auditar: 'max',
  pesquisar: 'cortana',
  fire: 'freedom',
  correcao_rapida: 'workbench',
  financeiro_real: 'workbench',
  comercial: 'workbench',
  gasto_bem: 'workbench',
  produto_existente: 'workbench',
  repo_github: 'workbench',
  coding_dev: 'workbench'
};

const STATUS_MIN_FOR = {
  triaged: ['analysis.problem', 'analysis.objective'],
  in_progress: ['plan.steps'],
  under_review: ['implementation.files'],
  completed: ['audit.checks']
};

function hasPath(obj, path) {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return false;
    cur = cur[p];
  }
  if (cur == null) return false;
  if (Array.isArray(cur)) return cur.length > 0;
  if (typeof cur === 'string') return cur.trim().length > 0;
  if (typeof cur === 'object') return Object.keys(cur).length > 0;
  return true;
}

function push(checks, id, ok, label, detail, severity = null) {
  checks.push({
    id,
    ok,
    label,
    detail,
    severity: severity || (ok ? 'ok' : 'fail')
  });
}

function scoreFromChecks(checks) {
  const scored = checks.filter((c) => c.severity !== 'info');
  if (!scored.length) return 100;
  const ok = scored.filter((c) => c.ok).length;
  return Math.round((ok / scored.length) * 100);
}

function checkPedidoAlinhado(demand, snapshot, plan) {
  const checks = [];
  const desc = (demand.description || snapshot?.context?.raw_description || '').trim();
  const gh = parseGithub(demand.github_url || snapshot?.context?.github_url);
  const intent = demand.current_intent || snapshot?.intent || plan?.intent;
  const folder = demand.project_folder || snapshot?.context?.project_folder;

  push(checks, 'pedido_presente', !!(desc || gh), 'Pedido registrado', desc || gh ? 'Descrição e/ou GitHub presentes' : 'Falta descrição e link');

  if (desc && intent) {
    const recl = classify(desc, gh);
    const match = recl.intent === intent;
    push(
      checks,
      'intent_coerente',
      match,
      'Propósito (intent) coerente com o texto',
      match
        ? 'Intent "' + intent + '" alinhado à descrição'
        : 'Classificado como "' + intent + '" mas o texto sugere "' + recl.intent + '"'
    );
    if (!match && recl.routing_label) {
      checks[checks.length - 1].detail += ' — ' + recl.routing_label;
    }
  }

  const primary = demand.primary_resident || plan?.primary;
  const expected = INTENT_PRIMARY[intent];
  if (expected && primary) {
    const ok = primary === expected || (intent === 'ideia_nova' && primary === 'dlogica');
    push(
      checks,
      'morador_principal',
      ok,
      'Morador "Comece aqui" adequado ao tipo de pedido',
      ok
        ? 'Principal: ' + primary
        : 'Esperado ~' + expected + ', obtido ' + primary + ' para intent ' + intent
    );
  }

  if (folder && desc) {
    const inDesc = norm(desc).includes(norm(folder));
    push(
      checks,
      'pasta_no_pedido',
      inDesc,
      'Pasta do projeto citada na demanda',
      inDesc ? 'Projeto ' + folder : 'Selecionou ' + folder + ' mas a descrição não menciona o app'
    );
  }

  const needs = NEEDS_BY_INTENT[intent] || [];
  push(
    checks,
    'plano_needs',
    needs.length > 0,
    'Plano "o que precisa" definido',
    needs.length ? needs.length + ' itens para intent ' + intent : 'Intent sem checklist',
    'info'
  );

  return { checks, score: scoreFromChecks(checks) };
}

function checkExecucaoAdequada(demand, runs, snapshot) {
  const checks = [];
  const status = demand.status || 'draft';
  const moradores = (runs || []).filter((r) => r.resident && r.resident !== 'ecomaestro');
  const primaryRun = moradores.find((r) => r.is_primary);
  const doneCount = moradores.filter((r) => r.status === 'done').length;
  const pendingPrimary = primaryRun && primaryRun.status === 'pending';

  push(
    checks,
    'runs_existem',
    moradores.length > 0,
    'Passagens (runs) do condomínio criadas',
    moradores.length ? moradores.length + ' morador(es) no plano' : 'Sem runs — só triagem',
    moradores.length ? 'ok' : 'info'
  );

  if (pendingPrimary && status === 'draft') {
    push(
      checks,
      'execucao_iniciada',
      false,
      'Execução iniciada',
      'Plano gerado; morador principal ainda pendente (normal após Analisar)',
      'info'
    );
  } else if (pendingPrimary) {
    push(checks, 'execucao_iniciada', false, 'Execução iniciada', 'Morador principal ainda não concluiu', 'warn');
  } else {
    push(checks, 'execucao_iniciada', true, 'Execução iniciada', doneCount + ' passagem(ns) concluída(s)');
  }

  for (const run of moradores) {
    if (run.status === 'done') {
      const out = run.output_payload && Object.keys(run.output_payload).length;
      push(
        checks,
        'output_' + run.resident,
        !!out,
        'Saída registrada: ' + run.resident,
        out ? 'output_payload preenchido' : 'Marcado done sem output_payload (contrato incompleto)',
        out ? 'ok' : 'warn'
      );
    }
  }

  const snap = snapshot || {};
  if (status === 'triaged' || rankStatus(status) >= rankStatus('triaged')) {
    const ok = hasPath(snap, 'analysis.problem') && hasPath(snap, 'analysis.objective');
    push(checks, 'gate_triaged', ok, 'Gate dLogica (triaged)', ok ? 'analysis.problem + objective' : 'Falta analysis no payload', ok ? 'ok' : 'warn');
  }
  if (rankStatus(status) >= rankStatus('in_progress')) {
    const ok = hasPath(snap, 'plan.steps');
    push(checks, 'gate_in_progress', ok, 'Gate workbench (in_progress)', ok ? 'plan.steps presente' : 'Falta plan.steps', ok ? 'ok' : 'warn');
  }
  if (rankStatus(status) >= rankStatus('under_review')) {
    const ok = hasPath(snap, 'implementation.files') || hasPath(snap, 'implementation.tasks');
    push(
      checks,
      'gate_under_review',
      ok,
      'Gate Cursor (under_review)',
      ok ? 'implementation registrada' : 'Falta implementation no payload',
      ok ? 'ok' : 'warn'
    );
  }
  if (status === 'completed') {
    const blockers = snap.audit?.blockers;
    const ok = Array.isArray(blockers) && blockers.length === 0 && hasPath(snap, 'audit.checks');
    push(checks, 'gate_completed', ok, 'Gate Max (completed)', ok ? 'Auditoria sem blockers' : 'Blockers ou audit incompleto', ok ? 'ok' : 'fail');
  }

  if (moradorRunsDone(runs) && status !== 'completed' && status !== 'archived') {
    push(
      checks,
      'status_pos_runs',
      false,
      'Status da demanda após runs',
      'Todos moradores done mas status ainda ' + status + ' — atualize para completed',
      'warn'
    );
  }

  return { checks, score: scoreFromChecks(checks) };
}

function rankStatus(s) {
  const order = ['draft', 'triaged', 'in_progress', 'under_review', 'completed', 'archived'];
  const i = order.indexOf(s);
  return i < 0 ? 0 : i;
}

function buildVerdict(alignScore, execScore, checks) {
  const fails = checks.filter((c) => !c.ok && c.severity === 'fail');
  const warns = checks.filter((c) => !c.ok && c.severity === 'warn');
  const overall = Math.round(alignScore * 0.55 + execScore * 0.45);

  let verdict = 'parcial';
  let summary = '';

  if (fails.some((c) => c.id === 'intent_coerente' || c.id === 'pedido_presente')) {
    verdict = 'desalinhado';
    summary = 'O pedido ou o propósito (intent) não está coerente — revise a descrição antes de executar.';
  } else if (overall >= 80 && fails.length === 0) {
    verdict = 'adequado';
    summary = 'Pedido e plano alinhados; execução dentro do esperado para o status atual.';
  } else if (execScore < 40 && alignScore >= 70) {
    verdict = 'plano_ok';
    summary = 'Plano adequado ao pedido; execução ainda não começou ou está incompleta (normal logo após Analisar).';
  } else if (warns.length > 0) {
    verdict = 'parcial';
    summary = 'Há lacunas na execução ou nos contratos dos moradores — veja recomendações.';
  } else {
    verdict = 'parcial';
    summary = 'Revise os itens marcados antes de considerar a demanda encerrada.';
  }

  return { verdict, summary, score_pct: overall };
}

function buildRecommendations(verdict, alignChecks, execChecks, demand) {
  const rec = [];
  const fail = (id) => alignChecks.find((c) => c.id === id && !c.ok) || execChecks.find((c) => c.id === id && !c.ok);

  if (fail('intent_coerente')) {
    rec.push('Reescreva a descrição com verbos claros (auditar, backup, nova feature, projeto novo) e Analise de novo.');
  }
  if (fail('pasta_no_pedido')) {
    rec.push('Mencione o nome da pasta do app na descrição ou confirme o projeto certo na lista.');
  }
  if (fail('execucao_iniciada')) {
    rec.push('Abra o morador "Comece aqui" no relatório e registre a saída (ou PATCH run com output_payload).');
  }
  if (fail('gate_triaged')) {
    rec.push('Preencha analysis.problem e analysis.objective (dLogica) antes de workbench.');
  }
  if (fail('gate_in_progress')) {
    rec.push('Registre plan.steps no workbench (handoff) antes do Cursor.');
  }
  if (fail('gate_completed')) {
    rec.push('Rode Max Stack e zere audit.blockers antes de marcar completed.');
  }
  if (verdict === 'plano_ok') {
    rec.push('Próximo passo: executar o morador principal e voltar aqui em Verificar adequação.');
  }
  if (!rec.length) {
    rec.push('Mantenha runs atualizados; exporte JSON se precisar de evidência externa.');
  }
  return rec.slice(0, 6);
}

/**
 * @param {object} record — demanda salva ou resultado de analyzeDemand
 */
export function orchestrateRecord(record) {
  const demand = record.demand || {};
  const report = record.report || {};
  const runs = record.runs || [];
  const snapshot = record.payload_snapshot || {};
  const plan = record.plan || { intent: snapshot.intent, primary: demand.primary_resident };

  const align = checkPedidoAlinhado(demand, snapshot, plan);
  const exec = checkExecucaoAdequada(demand, runs, snapshot);
  const allChecks = [...align.checks, ...exec.checks];
  const { verdict, summary, score_pct } = buildVerdict(align.score, exec.score, allChecks);

  return {
    orchestrator: 'ecomaestro-adequacao-v1',
    evaluated_at: new Date().toISOString(),
    verdict,
    summary,
    score_pct,
    alignment: { score_pct: align.score, label: 'Alinhamento ao pedido (propósito)', checks: align.checks },
    execution: { score_pct: exec.score, label: 'Adequação da execução (condomínio)', checks: exec.checks },
    demand_status: demand.status,
    intent: demand.current_intent || snapshot.intent,
    primary_resident: demand.primary_resident,
    recommendations: buildRecommendations(verdict, align.checks, exec.checks, demand),
    next_actions: (report.aplicadores || [])
      .filter((a) => a.principal)
      .map((a) => ({ morador: a.name, acao: a.label, href: a.href }))
      .slice(0, 3)
  };
}

export function orchestrateAnalyzed(analyzed) {
  return orchestrateRecord({
    demand: analyzed.demand,
    report: analyzed.report,
    runs: analyzed.runs,
    payload_snapshot: analyzed.payload_snapshot,
    plan: analyzed.plan
  });
}
