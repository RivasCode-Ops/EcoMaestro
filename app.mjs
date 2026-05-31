import { analyzeDemand } from './lib/router.mjs';
import { FALLBACK_PROJECTS } from './lib/projects-fallback.mjs';
import { resolveHrefForUi } from './lib/eco-href.mjs';
import {
  orchestrateAnalyzed,
  orchestrateRecord,
  validateDemandSave
} from './lib/demand-orchestrator.mjs';

const STORAGE = 'ecomaestro_demands_v2';
const STORAGE_PROJECT = 'ecomaestro_last_project';
const STORAGE_API_KEY = 'ecomaestro_api_key';
const STORAGE_TENANT = 'ecomaestro_tenant_id';
const API_BASE =
  typeof location !== 'undefined' && location.host
    ? location.origin + '/api'
    : 'http://127.0.0.1:8771/api';

let currentRecord = null;
let projectsCatalog = [];
let projectsRoot = 'c:\\_PROJETOS';

/** Moradores do eco não são pasta de trabalho do app — só no relatório após Analisar */
const FERRAMENTAS_IDS = new Set([
  'EcoMaestro',
  'dlogica',
  'workbench',
  'max-coding',
  'Cortana',
  'COmniWS',
  'PROMPT'
]);

function projectKind(p) {
  if (p.kind === 'produto' || p.kind === 'ferramenta') return p.kind;
  return FERRAMENTAS_IDS.has(p.id) ? 'ferramenta' : 'produto';
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function linkHref(href) {
  return resolveHrefForUi(href, isFileMode());
}

function apiOnline() {
  return location.port === '8771';
}

function isFileMode() {
  return location.protocol === 'file:';
}

function getSelectedProject() {
  const sel = document.getElementById('selProjeto');
  const id = sel?.value || '';
  if (!id || id === '__none__') return null;
  if (id === '__new__') return { id: '__new__', name: '(projeto novo)', github_url: null, folder_path: null, kind: 'novo' };
  return projectsCatalog.find((p) => p.id === id) || null;
}

function sortProdutos(prod, lastId) {
  const pin = [lastId, 'FREEDOM'].filter(Boolean);
  return [...prod].sort((a, b) => {
    const ai = pin.indexOf(a.id);
    const bi = pin.indexOf(b.id);
    if (ai >= 0 && bi >= 0) return ai - bi;
    if (ai >= 0) return -1;
    if (bi >= 0) return 1;
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

function fillProjectSelect(projects, root) {
  const sel = document.getElementById('selProjeto');
  const last = localStorage.getItem(STORAGE_PROJECT) || '';
  const filter = (document.getElementById('filtroProjeto')?.value || '').trim().toLowerCase();
  const normalized = projects.map((p) => ({ ...p, kind: projectKind(p) }));
  let prod = sortProdutos(
    normalized.filter((p) => p.kind === 'produto'),
    last && last !== '__new__' ? last : ''
  );
  let ferr = normalized.filter((p) => p.kind === 'ferramenta');
  if (filter) {
    const match = (p) =>
      p.name.toLowerCase().includes(filter) || (p.label || '').toLowerCase().includes(filter);
    prod = prod.filter(match);
    ferr = ferr.filter(match);
  }

  let html = '';
  if (prod.length) {
    html += '<optgroup label="Seus projetos — trabalhe aqui">';
    html += prod
      .map((p) => '<option value="' + esc(p.id) + '">' + esc(p.label || p.name) + '</option>')
      .join('');
    html += '</optgroup>';
  }
  html += '<option value="__new__">+ Criar projeto novo (ainda sem pasta)</option>';
  if (!prod.length && !ferr.length) {
    html = '<option value="">Nenhuma pasta encontrada</option>';
  }
  sel.innerHTML = html;

  const pick =
    last && last !== '__new__' && prod.some((p) => p.id === last)
      ? last
      : prod[0]?.id || '__new__';
  sel.value = [...sel.options].some((o) => o.value === pick) ? pick : prod[0]?.id || '__new__';

  const nProd = normalized.filter((p) => p.kind === 'produto').length;
  document.getElementById('projMeta').textContent =
    (root ? 'Raiz: ' + root + ' · ' : '') +
    nProd +
    ' apps para trabalhar' +
    (filter ? ' (filtro ativo)' : '') +
    ' · dLogica/workbench aparecem no relatório após Analisar';
  onProjectSelectChange();
  window.__ecoMaestroProjectsReady = true;
}

function projectFolderPath(p) {
  return p?.folder_path || (p?.id ? projectsRoot + '\\' + p.id : '');
}

async function loadProjectGuide(p) {
  const linkDoc = document.getElementById('linkProjDoc');
  if (!linkDoc || !p?.id || p.id === '__new__') {
    if (linkDoc) linkDoc.hidden = true;
    return;
  }
  linkDoc.hidden = true;
  linkDoc.textContent = 'Abrir documentação';
  linkDoc.title = 'Carregando…';
  const { error, data } = await apiFetch('/projects/' + encodeURIComponent(p.id) + '/guide');
  if (error || !data?.href) {
    linkDoc.title = 'Nenhum AGENTS.md ou README nesta pasta';
    return;
  }
  linkDoc.href = linkHref(data.href);
  linkDoc.hidden = false;
  linkDoc.title = (data.rel_path || 'documentação') + ' — ' + projectFolderPath(p);
}

async function loadProjectDemands(projectId) {
  const box = document.getElementById('projDemandBox');
  const list = document.getElementById('projDemandList');
  const hint = document.getElementById('projDemandHint');
  if (!box || !list) return;
  if (!apiOnline() || !projectId || projectId === '__new__') {
    box.hidden = true;
    return;
  }
  const { error, data } = await apiFetch('/demands?project=' + encodeURIComponent(projectId));
  if (error || !data?.demands?.length) {
    box.hidden = false;
    if (hint) hint.textContent = 'Nenhuma demanda salva ainda para esta pasta — use Trabalhar neste projeto.';
    list.innerHTML = '';
    return;
  }
  box.hidden = false;
  if (hint) {
    hint.textContent =
      data.demands.length +
      ' demanda(s) registrada(s). Clique para reabrir o plano — evita repetir o que já foi feito.';
  }
  list.innerHTML = data.demands
    .map((d) => {
      const when = d.created_at
        ? new Date(d.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '';
      return (
        '<div class="api-item" data-id="' +
        esc(d.id) +
        '"><strong>' +
        esc(d.status || 'draft') +
        '</strong> · ' +
        esc(d.description_preview || d.title || '(sem título)') +
        (when ? ' · ' + when : '') +
        '</div>'
      );
    })
    .join('');
  list.querySelectorAll('.api-item').forEach((node) => {
    node.addEventListener('click', () => loadDemandById(node.dataset.id));
  });
}

function updateProjectActions(p) {
  const box = document.getElementById('projActions');
  const btn = document.getElementById('btnTrabalhar');
  const hint = document.getElementById('projAcaoHint');
  const ok = p?.id && p.id !== '__new__';
  if (box) box.hidden = !ok;
  if (btn) btn.disabled = !ok;
  if (hint) {
    hint.innerHTML = ok
      ? 'Próximo passo: <strong>Trabalhar neste projeto</strong> (ou duplo clique na lista). Documentação e histórico abaixo valem para <strong>qualquer</strong> app selecionado.'
      : 'Para projeto novo, use <strong>+ Criar projeto novo</strong> e depois <strong>Analisar demanda</strong>.';
  }
  if (ok) {
    loadProjectGuide(p);
    loadProjectDemands(p.id);
  } else {
    const linkDoc = document.getElementById('linkProjDoc');
    if (linkDoc) linkDoc.hidden = true;
    const demandBox = document.getElementById('projDemandBox');
    if (demandBox) demandBox.hidden = true;
  }
}

function onProjectSelectChange() {
  const p = getSelectedProject();
  const linkInput = document.getElementById('linkGh');
  const linkView = document.getElementById('linkGhView');
  updateProjectActions(p);
  if (!p || p.id === '__new__') {
    linkInput.value = '';
    linkView.hidden = true;
    if (p?.id === '__new__') localStorage.setItem(STORAGE_PROJECT, '__new__');
    return;
  }
  localStorage.setItem(STORAGE_PROJECT, p.id);
  linkInput.value = p.github_url || '';
  const pasta = projectFolderPath(p);
  if (p.github_url) {
    linkView.hidden = false;
    linkView.textContent = 'GitHub: ' + p.github_url + (pasta ? ' · Pasta: ' + pasta : '');
  } else {
    linkView.hidden = false;
    linkView.textContent = 'Pasta de trabalho: ' + pasta + ' — abra no Cursor (File → Open Folder)';
  }
}

async function trabalharProjeto() {
  const proj = getSelectedProject();
  if (!proj?.id || proj.id === '__new__') {
    alert('Escolha um app na lista (qualquer pasta em _PROJETOS), não "criar projeto novo".');
    return;
  }
  const descEl = document.getElementById('desc');
  if (!descEl.value.trim()) {
    descEl.value =
      'Evoluir o projeto ' +
      proj.name +
      ' — revisar estado atual, próximo passo no workbench e implementação no Cursor.';
  }
  const payload = buildAnalyzePayload();
  if (payload) {
    const pre = await preflightOrchestrate(payload);
    if (pre.gates && !pre.gates.allow_save_demand) {
      handleOrchestrationBlock({ error: pre.summary, orchestration: pre });
      return;
    }
    if (pre.verdict === 'plano_ok' || pre.verdict === 'adequado') {
      showEcoGateBanner(pre, 'Plano validado — pode seguir o condomínio.', 'ok');
    }
  }
  await analisar();
  const rel = document.getElementById('relatorio');
  if (rel?.classList.contains('on')) rel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copiarPastaProjeto() {
  const proj = getSelectedProject();
  const path = projectFolderPath(proj);
  if (!path) return;
  try {
    await navigator.clipboard.writeText(path);
    const meta = document.getElementById('projMeta');
    const prev = meta.textContent;
    meta.textContent = 'Caminho copiado: ' + path + ' — cole no Cursor (Open Folder)';
    setTimeout(() => {
      if (meta.textContent.startsWith('Caminho copiado')) meta.textContent = prev;
    }, 4000);
  } catch {
    prompt('Copie o caminho da pasta:', path);
  }
}

function applyFallbackProjects(extraHint = '') {
  projectsCatalog = FALLBACK_PROJECTS.map((p) => ({
    ...p,
    folder_path: 'c:\\_PROJETOS\\' + p.id
  }));
  fillProjectSelect(projectsCatalog, 'c:\\_PROJETOS');
  const meta = document.getElementById('projMeta');
  meta.textContent =
    projectsCatalog.length +
    ' projetos (lista fixa)' +
    (extraHint ? ' · ' + extraHint : '') +
    ' · use Atualizar após reiniciar a API';
}

async function loadProjectsCatalog(refresh = false) {
  const sel = document.getElementById('selProjeto');
  if (!sel) return;
  sel.innerHTML = '<option value="">Carregando pastas (pode levar ~15s)…</option>';

  const q = refresh ? '?refresh=1' : '';
  const { error, data } = await apiFetch('/projects' + q);
  if (!error && data?.projects?.length) {
      projectsCatalog = data.projects;
      projectsRoot = data.root || projectsRoot;
      fillProjectSelect(data.projects, projectsRoot);
      return;
    }

  let hint = 'lista fixa';
  if (isFileMode()) {
    hint = 'modo arquivo local — rode Iniciar-EcoMaestro-API.bat para as 31 pastas';
  } else if (error === 404) {
    hint = 'API antiga — reinicie Iniciar-EcoMaestro-API.bat';
  } else if (error === 'network') {
    hint = 'API parada — Iniciar-EcoMaestro-API.bat';
  } else if (error) {
    hint = 'erro ' + error;
  }
  applyFallbackProjects(hint);
}

function apiHeaders(extra = {}) {
  const h = { ...extra };
  const key = localStorage.getItem(STORAGE_API_KEY) || '';
  const tenant = localStorage.getItem(STORAGE_TENANT) || 'local';
  if (key) h['X-Eco-Api-Key'] = key;
  if (tenant) h['X-Eco-Tenant'] = tenant;
  return h;
}

async function apiFetch(path, opts = {}) {
  try {
    opts.headers = apiHeaders(opts.headers || {});
    const res = await fetch(API_BASE + path, opts);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) return { error: res.status, data };
    return { error: null, data };
  } catch {
    return { error: 'network', data: null };
  }
}

function showEcoGateBanner(orchestration, message, mode = 'block') {
  const el = document.getElementById('ecoGateBanner');
  if (!el) return;
  if (!orchestration && !message) {
    el.classList.remove('on', 'ok');
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.classList.add('on');
  el.classList.toggle('ok', mode === 'ok');
  const g = orchestration?.gates;
  const arch = g ? (g.architecture_ok ? 'arquitetura OK' : 'arquitetura com falha') : '';
  const exec = g ? (g.execution_ok ? 'execução OK' : 'execução incompleta') : '';
  el.innerHTML =
    (mode === 'ok' ? '<strong>✓ Eco</strong> — ' : '<strong>⛔ Eco bloqueou</strong> — ') +
    esc(message || orchestration?.summary || '') +
    (arch || exec ? '<br><span class="hint">' + esc([arch, exec].filter(Boolean).join(' · ')) + '</span>' : '');
}

async function preflightOrchestrate(payload) {
  if (apiOnline()) {
    const { error, data } = await apiFetch('/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!error && data?.verdict) return data;
  }
  const analyzed = analyzeDemand(payload);
  return orchestrateAnalyzed(analyzed);
}

function handleOrchestrationBlock(errData) {
  if (!errData) return false;
  const msg = errData.error || errData.message;
  const orch = errData.orchestration;
  if (orch) {
    showEcoGateBanner(orch, msg);
    renderOrchestration(orch);
    document.getElementById('orchestrationBox').hidden = false;
    document.getElementById('relatorio').classList.add('on');
  }
  if (msg) alert(msg);
  return true;
}

function renderEcoOverlaps(list) {
  const box = document.getElementById('overlapsBox');
  const el = document.getElementById('overlapsList');
  if (!list?.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  el.innerHTML = list
    .map(
      (o) =>
        '<p style="margin:.35rem 0;font-size:.82rem"><strong>' +
        esc(o.label) +
        '</strong> — ' +
        esc(o.role) +
        '<br><span class="hint">' +
        esc(o.action) +
        '</span> ' +
        (o.link_check?.status === 'missing'
          ? '<span class="go" style="opacity:.5;color:var(--warn)">Indisponível</span>'
          : o.href
            ? '<a class="go" href="' + esc(linkHref(o.href)) + '" target="_blank" rel="noopener">Abrir</a>'
            : '') +
        '</p>'
    )
    .join('');
}

function renderCursorKit(kit) {
  const box = document.getElementById('cursorKitBox');
  if (!kit) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  document.getElementById('cursorKitTitle').textContent = kit.title;
  document.getElementById('cursorKitIntro').textContent = kit.intro;
  document.getElementById('cursorKitLinks').innerHTML = (kit.links || [])
    .map((l) => {
      const start = l.id === kit.start_with;
      const miss = l.link_check?.status === 'missing';
      if (miss) {
        return (
          '<span class="go" style="opacity:.5;color:var(--warn)" title="Arquivo ausente">' +
          esc(l.label) +
          ' ✗</span>'
        );
      }
      return (
        '<a class="go' +
        (start ? ' kit-start' : '') +
        '" href="' +
        esc(linkHref(l.href)) +
        '" target="_blank" rel="noopener">' +
        esc(l.label) +
        (start ? ' ★' : '') +
        '</a>'
      );
    })
    .join('');
}

function renderSetup(setup, description) {
  const box = document.getElementById('setupBox');
  const msg = document.getElementById('setupMsg');
  const pathEl = document.getElementById('setupPath');
  const linkPasta = document.getElementById('linkAbrirPasta');
  if (!setup) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  pathEl.textContent =
    'Pasta sugerida: ' + setup.folder_path + ' — edite o nome no botão se precisar de outro slug.';
  document.getElementById('linkTutorial').href = linkHref(setup.tutorial_href);
  document.getElementById('linkOrquestrador').href = linkHref(setup.orquestrador_href);
  linkPasta.href = setup.explorer_href;
  linkPasta.hidden = false;
  msg.textContent = '';
  const btn = document.getElementById('btnCriarPasta');
  btn.dataset.slug = setup.suggested_slug;
  btn.dataset.desc = description || '';
  btn.onclick = () => criarPasta(setup.suggested_slug, description);
}

async function criarPasta(slug, description) {
  const nome = prompt('Nome da pasta em c:\\_PROJETOS:', slug || 'NovoProjeto');
  if (!nome) return;
  const msg = document.getElementById('setupMsg');
  if (apiOnline()) {
    const { error, data } = await apiFetch('/projects/scaffold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: nome, description })
    });
    if (error || !data?.ok) {
      msg.textContent = 'Erro ao criar pasta. Tente Criar-pasta-em-PROJETOS.bat ' + nome;
      return;
    }
    msg.textContent = data.created
      ? 'Pasta criada com README.md.'
      : 'Pasta já existia — README mantido se já houver.';
    document.getElementById('linkAbrirPasta').href = data.explorer_href;
    window.open(data.explorer_href, '_blank');
    return;
  }
  msg.textContent =
    'Modo offline: execute Criar-pasta-em-PROJETOS.bat "' +
    nome +
    '" ou crie manualmente em c:\\_PROJETOS\\' +
    nome;
  window.open('file:///C:/_PROJETOS/', '_blank');
}

function renderReport(record, fromApi = false) {
  currentRecord = record;
  const d = record.demand;
  const rep = record.report;
  const suffix = rep.title_suffix || '';
  const folder = d.project_folder || record.payload_snapshot?.context?.project_folder || '';
  const pasta = d.local_folder || record.payload_snapshot?.context?.localhost_url || (folder ? projectsRoot + '\\' + folder : '');
  document.getElementById('tituloProjeto').textContent = folder
    ? folder + (suffix || '')
    : d.title + suffix;
  const banner = document.getElementById('projetoAtivoBanner');
  if (banner) {
    if (folder) {
      banner.hidden = false;
      document.getElementById('projetoAtivoTitulo').textContent = 'Projeto ativo: ' + folder;
      document.getElementById('projetoAtivoPasta').textContent =
        'Pasta no PC: ' + pasta + ' — no Cursor: File → Open Folder → cole este caminho';
    } else {
      banner.hidden = true;
    }
  }
  renderSetup(rep.setup, d.description);
  renderEcoOverlaps(rep.eco_overlaps);
  renderCursorKit(rep.cursor_kit);
  document.getElementById('listaPrecisa').innerHTML = (rep.needs || []).map((n) => '<li>' + esc(n) + '</li>').join('');
  let stepNum = 0;
  document.getElementById('listaAplica').innerHTML = (rep.aplicadores || []).map((a) => {
    if (a.id !== 'ecomaestro') stepNum += 1;
    const chk = a.link_check;
    const labelAbrir = 'ABRIR — ' + a.name;
    let go;
    if (!a.href && (!chk || chk.status === 'ide')) {
      go = '<span class="go go-btn" title="Use o Cursor na pasta do projeto">Abrir no Cursor</span>';
    } else if (chk?.status === 'missing') {
      go = '<span class="go go-btn" title="Arquivo ausente">Indisponível</span>';
    } else if (chk?.status === 'external') {
      go =
        '<a class="go go-btn" href="' +
        esc(a.href) +
        '" target="_blank" rel="noopener">' +
        esc(labelAbrir) +
        '</a>';
    } else if (a.href) {
      go =
        '<a class="go go-btn" href="' +
        esc(linkHref(a.href)) +
        '" target="_blank" rel="noopener">' +
        esc(labelAbrir) +
        '</a>';
    } else {
      go = '<span class="go go-btn">—</span>';
    }
    return (
      '<div class="aplicador' +
      (a.principal ? ' principal' : '') +
      '">' +
      '<span class="step-num" aria-hidden="true">' +
      (stepNum || '·') +
      '</span>' +
      '<span class="' +
      (a.principal ? 'badge' : 'badge depois') +
      '">' +
      esc(a.badge || (a.principal ? 'Comece aqui' : 'Depois')) +
      '</span>' +
      '<div><h3>' +
      esc(a.name) +
      ' — ' +
      esc(a.label) +
      '</h3><p>' +
      esc(a.note) +
      '</p></div>' +
      go +
      '</div>'
    );
  }).join('');

  const guia = document.getElementById('guiaPassos');
  const guiaTxt = document.getElementById('guiaTexto');
  const prim = (rep.aplicadores || []).find((a) => a.principal);
  if (guia) {
    guia.hidden = false;
    if (guiaTxt && prim) {
      guiaTxt.innerHTML =
        'Próximo passo: <strong>' +
        esc(prim.name) +
        '</strong> — ' +
        esc(prim.label) +
        '. Clique no botão <strong>1</strong> (amarelo). O Eco não executa as 3 ações sozinho.';
    }
  }
  updateGuiaPassoButtons();

  let conf = rep.confidence_text || '';
  if (fromApi && record.id) {
    conf += (conf ? ' · ' : '') + 'Salvo na API · id: ' + record.id.slice(0, 8) + '…';
    if (d.status) conf += ' · status: ' + d.status;
  }
  document.getElementById('confianca').textContent = conf;
  document.getElementById('relatorio').classList.add('on');

  const toolbar = document.getElementById('reportToolbar');
  const statusSel = document.getElementById('statusSelect');
  if (record.id && apiOnline()) {
    toolbar.hidden = false;
    statusSel.value = d.status || 'draft';
  } else {
    toolbar.hidden = true;
  }

  renderRuns(record);
  const orch = record.orchestration || orchestrateRecord(record);
  renderOrchestration(orch);
  if (orch.gates?.allow_save_demand === false) {
    showEcoGateBanner(orch, orch.summary);
  } else if (orch.verdict === 'adequado' || orch.verdict === 'plano_ok') {
    showEcoGateBanner(orch, orch.summary, 'ok');
  } else if (orch.verdict === 'parcial') {
    showEcoGateBanner(orch, 'Atenção: ' + orch.summary);
  }
  renderEnterprise(record.enterprise);
}

const VERDICT_LABEL = {
  adequado: 'Adequado — pedido e execução coerentes',
  parcial: 'Parcial — ajustes recomendados',
  plano_ok: 'Plano OK — execução ainda pendente',
  desalinhado: 'Desalinhado — revise o pedido ou o intent'
};

function renderOrchestration(orch) {
  const box = document.getElementById('orchestrationBox');
  if (!orch || !box) return;
  box.hidden = false;
  const vEl = document.getElementById('orchVerdict');
  const cls = 'orch-' + (orch.verdict || 'parcial');
  vEl.className = cls;
  vEl.textContent = VERDICT_LABEL[orch.verdict] || orch.verdict;
  document.getElementById('orchSummary').textContent = orch.summary || '';
  document.getElementById('orchScores').textContent =
    'Pontuação geral: ' +
    (orch.score_pct ?? '—') +
    '% · Alinhamento ao pedido: ' +
    (orch.alignment?.score_pct ?? '—') +
    '% · Execução: ' +
    (orch.execution?.score_pct ?? '—') +
    '%';
  const all = [...(orch.alignment?.checks || []), ...(orch.execution?.checks || [])];
  document.getElementById('orchChecks').innerHTML = all
    .map((c) => {
      const icon = c.ok ? '✓' : c.severity === 'info' ? '○' : '✗';
      const col = c.ok ? 'var(--accent2)' : c.severity === 'warn' ? 'var(--warn)' : '#f08080';
      return (
        '<li style="color:' +
        col +
        '"><strong>' +
        icon +
        ' ' +
        esc(c.label) +
        '</strong> — ' +
        esc(c.detail) +
        '</li>'
      );
    })
    .join('');
  document.getElementById('orchRecs').innerHTML = (orch.recommendations || [])
    .map((r) => '<li>' + esc(r) + '</li>')
    .join('');
}

async function refreshOrchestration() {
  if (!currentRecord) return;
  if (currentRecord.id && apiOnline()) {
    const { error, data } = await apiFetch('/demands/' + currentRecord.id + '/adequacao');
    if (!error && data) {
      currentRecord.orchestration = data;
      renderOrchestration(data);
      return;
    }
  }
  renderOrchestration(currentRecord.orchestration || orchestrateRecord(currentRecord));
}

function renderRuns(record) {
  const box = document.getElementById('runsBox');
  const list = document.getElementById('runsList');
  const runs = (record.runs || []).filter((r) => r.resident !== 'ecomaestro');
  if (!runs.length || !record.id) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const canPatch = apiOnline();
  list.innerHTML = runs
    .map((r) => {
      const key = r.id || r.resident;
      const btn =
        canPatch && r.status === 'pending'
          ? '<button type="button" class="ghost run-done" data-key="' +
            esc(key) +
            '">Marcar concluído</button>'
          : '';
      return (
        '<div class="run-row">' +
        '<span class="run-status ' +
        esc(r.status) +
        '">' +
        esc(r.status) +
        '</span>' +
        '<strong>' +
        esc(r.resident) +
        '</strong>' +
        (r.is_primary ? ' <span class="hint">(Comece aqui)</span>' : '') +
        btn +
        '</div>'
      );
    })
    .join('');

  list.querySelectorAll('.run-done').forEach((btn) => {
    btn.addEventListener('click', () => openRunWizard(record.id, btn.dataset.key));
  });
}

function getRunByKey(record, runKey) {
  return (record?.runs || []).find((r) => r.id === runKey || r.resident === runKey);
}

async function openRunWizard(demandId, runKey) {
  const run = getRunByKey(currentRecord, runKey);
  if (!run) return;
  const dlg = document.getElementById('ecoWizardModal');
  const form = document.getElementById('ecoWizardForm');
  const title = document.getElementById('ecoWizardTitle');
  if (!dlg || !form) {
    await completeRun(demandId, runKey, null);
    return;
  }
  const { error, data } = await apiFetch('/wizard/' + encodeURIComponent(run.resident));
  const spec = !error && data ? data : { title: 'Concluir passo', fields: [{ key: 'note', label: 'O que foi feito?', required: true }] };
  title.textContent = spec.title || 'Registrar passo';
  form.innerHTML = (spec.fields || [])
    .map(
      (f) =>
        '<label style="display:block;margin:.75rem 0 .35rem;font-size:.78rem;font-weight:700;color:var(--muted)">' +
        esc(f.label) +
        (f.required ? ' *' : '') +
        '</label>' +
        (f.multiline
          ? '<textarea data-key="' + esc(f.key) + '" rows="4" style="width:100%"></textarea>'
          : '<input data-key="' + esc(f.key) + '" type="' + (f.number ? 'number' : 'text') + '" style="width:100%" />')
    )
    .join('');
  dlg.dataset.demandId = demandId;
  dlg.dataset.runKey = runKey;
  dlg.showModal();
}

async function completeRun(demandId, runKey, wizardAnswers) {
  const body = { status: 'done' };
  if (wizardAnswers) body.wizard_answers = wizardAnswers;
  else {
    body.output_payload = { ui_note: 'Concluído manualmente no EcoMaestro', at: new Date().toISOString() };
  }
  const { error, data } = await apiFetch('/demands/' + demandId + '/runs/' + runKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (error === 422 && handleOrchestrationBlock(data)) {
    return;
  }
  if (error || !data) {
    alert('Não foi possível atualizar a passagem. API em :8771?');
    return;
  }
  document.getElementById('ecoWizardModal')?.close();
  renderReport(data, true);
  loadApiDemands();
  updateGuiaPassoButtons();
}

function submitRunWizard() {
  const dlg = document.getElementById('ecoWizardModal');
  const demandId = dlg?.dataset.demandId;
  const runKey = dlg?.dataset.runKey;
  if (!demandId || !runKey) return;
  const answers = {};
  dlg.querySelectorAll('[data-key]').forEach((el) => {
    answers[el.dataset.key] = el.value;
  });
  completeRun(demandId, runKey, answers);
}

async function patchStatus(status) {
  if (!currentRecord?.id) return;
  const { error, data } = await apiFetch('/demands/' + currentRecord.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  if (error === 422 && handleOrchestrationBlock(data)) {
    const sel = document.getElementById('statusSelect');
    if (sel && currentRecord?.demand?.status) sel.value = currentRecord.demand.status;
    return;
  }
  if (!error && data) {
    renderReport(data, true);
    loadApiDemands();
  }
}

function exportJson() {
  if (!currentRecord) return;
  const blob = new Blob([JSON.stringify(currentRecord, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ecomaestro-' + (currentRecord.id || 'local').slice(0, 8) + '.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function copyId() {
  if (!currentRecord?.id) return;
  navigator.clipboard.writeText(currentRecord.id).catch(() => {
    prompt('ID da demanda:', currentRecord.id);
  });
}

function renderLocal(analyzed) {
  currentRecord = {
    demand: analyzed.demand,
    report: {
      ...analyzed.report,
      title_suffix: analyzed.report.title_suffix,
      setup: analyzed.report.setup,
      cursor_kit: analyzed.report.cursor_kit,
      eco_overlaps: analyzed.report.eco_overlaps
    },
    runs: analyzed.runs,
    payload_snapshot: analyzed.payload_snapshot,
    plan: analyzed.plan,
    orchestration: orchestrateAnalyzed(analyzed)
  };
  renderReport(currentRecord, false);
}

async function tryApi(payload) {
  const { error, data } = await apiFetch('/demands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (error === 422 && handleOrchestrationBlock(data)) return null;
  if (error || !data?.demand) return null;
  return data;
}

async function loadDemandById(id) {
  const { error, data } = await apiFetch('/demands/' + id);
  if (!error && data) {
    const folder = data.demand.project_folder || data.payload_snapshot?.context?.project_folder;
    if (folder) {
      const sel = document.getElementById('selProjeto');
      if ([...sel.options].some((o) => o.value === folder)) sel.value = folder;
      onProjectSelectChange();
    }
    document.getElementById('linkGh').value = data.demand.github_url || '';
    document.getElementById('desc').value = data.demand.description || '';
    renderReport(data, true);
  }
}

async function loadApiDemands() {
  const box = document.getElementById('apiBox');
  const el = document.getElementById('apiList');
  if (!apiOnline()) {
    box.hidden = true;
    return;
  }
  const { error, data } = await apiFetch('/demands');
  if (error || !data?.demands?.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  el.innerHTML = data.demands
    .map((d) => {
      const when = d.created_at
        ? new Date(d.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
        : '';
      return (
        '<div class="api-item" data-id="' +
        esc(d.id) +
        '"><strong>' +
        esc(d.title) +
        '</strong> · ' +
        esc(d.status || 'draft') +
        (when ? ' · ' + when : '') +
        '</div>'
      );
    })
    .join('');
  el.querySelectorAll('.api-item').forEach((node) => {
    node.addEventListener('click', () => loadDemandById(node.dataset.id));
  });
}

async function loadPorts() {
  const box = document.getElementById('portsBox');
  if (!apiOnline()) return;
  const { error, data } = await apiFetch('/ecosystem/ports');
  if (error || !data?.services) return;
  box.hidden = false;
  box.innerHTML = data.services
    .map((s) => '<span class="port-chip ' + (s.online ? 'on' : 'off') + '" title="' + esc(s.url) + '">' + esc(s.name) + (s.online ? ' ●' : ' ○') + '</span>')
    .join('');
}

function buildAnalyzePayload() {
  const proj = getSelectedProject();
  const desc = document.getElementById('desc').value.trim();
  const link = document.getElementById('linkGh').value.trim();
  if (!proj?.id) return null;
  if (proj.id === '__new__' && !desc) return null;
  if (proj.kind === 'ferramenta' && !desc) return null;
  if (!desc && !link) return null;
  return {
    github_url: link,
    description: desc,
    project_folder: proj?.id && proj.id !== '__new__' ? proj.id : null,
    folder_path: proj?.folder_path || null
  };
}

async function analisar() {
  const payload = buildAnalyzePayload();
  if (!payload) {
    const p = getSelectedProject();
    if (p?.kind === 'ferramenta') {
      alert('Para morador do condomínio (workbench, dLogica…), descreva a demanda.\nPara trabalhar em um app, escolha uma pasta em "Seus projetos".');
    } else {
      alert('Escolha um projeto em "Seus projetos" e descreva o que quer fazer (ou use Trabalhar neste projeto).');
    }
    return;
  }

  const apiRecord = await tryApi(payload);
  if (apiRecord) {
    renderReport(apiRecord, true);
    loadApiDemands();
    const pf = payload.project_folder;
    if (pf) loadProjectDemands(pf);
  } else {
    try {
      const analyzed = analyzeDemand(payload);
      const saveCheck = validateDemandSave(analyzed, false);
      if (!saveCheck.ok) {
        handleOrchestrationBlock({ error: saveCheck.message, orchestration: saveCheck.orchestration });
        return;
      }
      analyzed.orchestration = saveCheck.orchestration;
      renderLocal(analyzed);
      const conf = document.getElementById('confianca');
      conf.textContent +=
        (conf.textContent ? ' · ' : '') + 'Modo local (API em :8771 offline)';
    } catch (e) {
      alert(e.message);
      return;
    }
  }

  try {
    let list = JSON.parse(localStorage.getItem(STORAGE) || '[]');
    const proj = getSelectedProject();
    list.unshift({
      ts: Date.now(),
      link: payload.github_url,
      desc: payload.description,
      folder: proj?.id || ''
    });
    localStorage.setItem(STORAGE, JSON.stringify(list.slice(0, 10)));
    renderHist();
  } catch (_) {}
}

function renderHist() {
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem(STORAGE) || '[]');
  } catch (_) {}
  const box = document.getElementById('histBox');
  const el = document.getElementById('histList');
  if (!list.length) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  el.innerHTML = list
    .map((d) => {
      const when = new Date(d.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
      return (
        '<div class="hist-item" data-link="' +
        esc(d.link) +
        '" data-desc="' +
        esc(d.desc) +
        '" data-folder="' +
        esc(d.folder || '') +
        '">' +
        esc((d.folder ? d.folder + ' · ' : '') + (d.desc || d.link || '').slice(0, 48)) +
        ' · ' +
        when +
        '</div>'
      );
    })
    .join('');
  el.querySelectorAll('.hist-item').forEach((node) => {
    node.addEventListener('click', () => {
      if (node.dataset.folder) {
        const sel = document.getElementById('selProjeto');
        if ([...sel.options].some((o) => o.value === node.dataset.folder)) {
          sel.value = node.dataset.folder;
          onProjectSelectChange();
        }
      }
      document.getElementById('linkGh').value = node.dataset.link || '';
      document.getElementById('desc').value = node.dataset.desc || '';
      analisar();
    });
  });
}

document.getElementById('btnAnalisar').addEventListener('click', analisar);
document.getElementById('btnTrabalhar').addEventListener('click', () => trabalharProjeto());
document.getElementById('btnVerificarAdequacao')?.addEventListener('click', () => refreshOrchestration());

function getPrimaryAplicador() {
  return currentRecord?.report?.aplicadores?.find((a) => a.principal);
}

function getNextPendingRun() {
  return (currentRecord?.runs || []).find((r) => r.resident !== 'ecomaestro' && r.status === 'pending');
}

function updateGuiaPassoButtons() {
  const prim = getPrimaryAplicador();
  const b1 = document.getElementById('btnAbrirPassoAgora');
  if (b1 && prim) {
    b1.textContent = '1 — Abrir: ' + prim.name + ' (' + (prim.label || 'guia') + ')';
  }
  const run = getNextPendingRun();
  const b2 = document.getElementById('btnConcluirPassoEco');
  if (b2) {
    b2.textContent = run
      ? '2 — Terminei: ' + (run.resident || 'passo') + ' (registrar)'
      : '2 — Nenhum passo pendente no Eco';
    b2.disabled = !run || !currentRecord?.id;
  }
}

function abrirPassoAgora() {
  const prim = getPrimaryAplicador();
  if (!prim) {
    alert('Gere o relatório primeiro: Trabalhar neste projeto.');
    return;
  }
  if (!prim.href) {
    alert('Este passo é no Cursor.\n\n1) Copiar caminho da pasta\n2) File → Open Folder\n3) Cole o prompt do workbench no chat.');
    copiarPastaProjeto();
    return;
  }
  window.open(linkHref(prim.href), '_blank');
}

function concluirPassoNoEco() {
  const run = getNextPendingRun();
  if (!currentRecord?.id || !run) {
    alert('Nada a registrar agora — ou use "Marcar concluído" em Passagens (runs).');
    return;
  }
  openRunWizard(currentRecord.id, run.id || run.resident);
}

function renderEnterprise(ent) {
  const box = document.getElementById('enterpriseBox');
  const list = document.getElementById('enterpriseRagList');
  if (!box || !ent) {
    if (box) box.hidden = true;
    return;
  }
  box.hidden = false;
  const src = ent.intent_source || 'rules';
  const llm = ent.llm?.ok ? ent.llm.intent + ' (' + (ent.llm.confidence || '?') + '%)' : ent.llm?.reason || 'offline';
  document.getElementById('enterpriseMeta').textContent =
    'Intent: ' + src + ' · LLM: ' + llm + ' · Ollama: ' + (ent.ollama_online ? 'online' : 'offline');
  if (!list) return;
  const hits = ent.rag || [];
  list.innerHTML = hits.length
    ? hits
        .map(
          (h) =>
            '<li><a class="go" href="' +
            esc(linkHref(h.href)) +
            '" target="_blank" rel="noopener">' +
            esc(h.source) +
            '</a> — ' +
            esc(h.text.slice(0, 120)) +
            '…</li>'
        )
        .join('')
    : '<li class="hint">Sem trechos RAG — rode npm run index:rag</li>';
  const fb = document.getElementById('intentFeedbackBox');
  const sel = document.getElementById('intentCorrect');
  if (fb && sel && currentRecord?.id && apiOnline()) {
    fb.hidden = false;
    const cur = currentRecord.demand?.current_intent;
    if (cur && [...sel.options].some((o) => o.value === cur)) sel.value = cur;
  } else if (fb) fb.hidden = true;
}

async function submitIntentFeedback() {
  if (!currentRecord?.id) return;
  const intent = document.getElementById('intentCorrect')?.value;
  if (!intent) return;
  const { error, data } = await apiFetch('/learning/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ demand_id: currentRecord.id, corrected_intent: intent })
  });
  if (error) {
    alert('Não foi possível registrar correção. API em :8771?');
    return;
  }
  alert(data?.message || 'Correção registrada. Próximas demandas similares tendem a usar este intent.');
}

async function copiarPacoteCursor() {
  const proj = getSelectedProject();
  const folder = proj?.folder_path || (proj?.id && proj.id !== '__new__' ? projectsRoot + '\\' + proj.id : '');
  const desc = document.getElementById('desc')?.value?.trim() || currentRecord?.demand?.description || '';
  const d00 = projectsRoot.replace(/\\/g, '/') + '/workbench/20-ENTREGA-DE-PRODUTO/04-coding-diario/d00-contexto-sessao.md';
  const pack =
    '# Pacote EcoMaestro → Cursor\n\n' +
    '## Pasta do projeto\n' +
    folder +
    '\n\n## Demanda\n' +
    desc +
    '\n\n## Primeiro passo\nAbra o D00 no workbench e cole no chat do Cursor:\n' +
    d00 +
    '\n\n## ID demanda\n' +
    (currentRecord?.id || '(gere com Trabalhar neste projeto)');
  try {
    await navigator.clipboard.writeText(pack);
    alert('Pacote copiado — cole no Cursor após Open Folder na pasta do projeto.');
  } catch {
    prompt('Copie:', pack);
  }
}

async function loadEnterpriseStatus() {
  if (!apiOnline()) return;
  const { data } = await apiFetch('/enterprise/status');
  const el = document.getElementById('enterpriseStatusChip');
  if (!el || !data) return;
  el.hidden = false;
  el.textContent =
    'Enterprise: RAG ' + (data.rag_chunks || 0) + ' · Ollama ' + (data.ollama_online ? 'on' : 'off');
}

function saveEnterpriseSettings() {
  const key = document.getElementById('ecoApiKey')?.value?.trim() || '';
  const tenant = document.getElementById('ecoTenantId')?.value?.trim() || 'local';
  if (key) localStorage.setItem(STORAGE_API_KEY, key);
  else localStorage.removeItem(STORAGE_API_KEY);
  localStorage.setItem(STORAGE_TENANT, tenant);
  alert('Configuração salva. Reinicie a página se a API exigir chave.');
}

async function reindexRag() {
  const { error, data } = await apiFetch('/rag/reindex', { method: 'POST' });
  if (error) alert('Falha ao reindexar RAG');
  else alert('RAG atualizado: ' + (data?.chunk_count || 0) + ' trechos');
  loadEnterpriseStatus();
}

function toggleModoFacil() {
  const on = document.body.classList.toggle('modo-facil');
  localStorage.setItem('ecomaestro_modo_facil', on ? '1' : '0');
  const btn = document.getElementById('btnModoFacil');
  if (btn) btn.textContent = on ? 'Leitura fácil: LIGADO' : 'Leitura fácil — texto e botões maiores';
}

document.getElementById('btnAbrirPassoAgora')?.addEventListener('click', abrirPassoAgora);
document.getElementById('btnConcluirPassoEco')?.addEventListener('click', concluirPassoNoEco);
document.getElementById('btnModoFacil')?.addEventListener('click', toggleModoFacil);
if (localStorage.getItem('ecomaestro_modo_facil') === '1') {
  document.body.classList.add('modo-facil');
  const btn = document.getElementById('btnModoFacil');
  if (btn) btn.textContent = 'Leitura fácil: LIGADO';
}
document.getElementById('btnCopiarPasta')?.addEventListener('click', () => copiarPastaProjeto());
document.getElementById('btnCopiarPacote')?.addEventListener('click', () => copiarPacoteCursor());
document.getElementById('btnWizardSubmit')?.addEventListener('click', () => submitRunWizard());
document.getElementById('btnWizardCancel')?.addEventListener('click', () => document.getElementById('ecoWizardModal')?.close());
document.getElementById('btnSaveEnterprise')?.addEventListener('click', () => saveEnterpriseSettings());
document.getElementById('btnReindexRag')?.addEventListener('click', () => reindexRag());
document.getElementById('btnIntentFeedback')?.addEventListener('click', () => submitIntentFeedback());
const ecoTenantEl = document.getElementById('ecoTenantId');
const ecoKeyEl = document.getElementById('ecoApiKey');
if (ecoTenantEl) ecoTenantEl.value = localStorage.getItem(STORAGE_TENANT) || 'local';
if (ecoKeyEl) ecoKeyEl.value = localStorage.getItem(STORAGE_API_KEY) || '';
document.getElementById('selProjeto').addEventListener('dblclick', () => trabalharProjeto());
document.getElementById('btnAtualizarProjetos').addEventListener('click', () => loadProjectsCatalog(true));
document.getElementById('filtroProjeto')?.addEventListener('input', () => {
  if (projectsCatalog.length) fillProjectSelect(projectsCatalog, projectsRoot);
});
document.getElementById('selProjeto').addEventListener('change', onProjectSelectChange);
document.getElementById('btnLimpar').addEventListener('click', () => {
  document.getElementById('desc').value = '';
  const last = localStorage.getItem(STORAGE_PROJECT);
  if (last) document.getElementById('selProjeto').value = last;
  onProjectSelectChange();
  document.getElementById('relatorio').classList.remove('on');
  document.getElementById('setupBox').hidden = true;
  document.getElementById('cursorKitBox').hidden = true;
  document.getElementById('overlapsBox').hidden = true;
  currentRecord = null;
});
document.getElementById('btnExport').addEventListener('click', exportJson);
document.getElementById('btnCopyId').addEventListener('click', copyId);
document.getElementById('statusSelect').addEventListener('change', (e) => patchStatus(e.target.value));

(function showAutonomo() {
  const el = document.getElementById('modoAutonomo');
  if (!el) return;
  const onApi = location.port === '8771';
  const fileMode = location.protocol === 'file:';
  if (fileMode || onApi || location.port === '8770') {
    el.hidden = false;
    const span = el.querySelector('span:last-child');
    if (onApi) {
      el.classList.remove('autonomo');
      span.innerHTML =
        '<strong>API ativa (:8771)</strong> — lista completa de pastas em <code>_PROJETOS</code> · demandas salvas em <code>data/demands/</code>';
    } else if (fileMode) {
      span.innerHTML =
        '<strong>Modo autônomo</strong> — lista principal abaixo. Para <strong>todas</strong> as pastas: ' +
        '<a href="http://127.0.0.1:8771/" style="color:var(--accent2)">Iniciar-EcoMaestro-API.bat</a> e abra :8771';
    }
  }
})();

function applyProjectFromUrl() {
  const params = new URLSearchParams(location.search);
  const id = (params.get('project') || params.get('pasta') || '').trim();
  if (!id) return;
  const sel = document.getElementById('selProjeto');
  if (!sel) return;
  const trySelect = () => {
    if ([...sel.options].some((o) => o.value === id)) {
      sel.value = id;
      onProjectSelectChange();
      return true;
    }
    return false;
  };
  if (!trySelect()) {
    const t = setInterval(() => {
      if (trySelect()) clearInterval(t);
    }, 400);
    setTimeout(() => clearInterval(t), 15000);
  }
}

renderHist();
loadProjectsCatalog(false)
  .then(() => applyProjectFromUrl())
  .catch(() => applyFallbackProjects('erro ao carregar'));
if (apiOnline()) {
  loadApiDemands();
  loadPorts();
  loadEnterpriseStatus();
}
