import { analyzeDemand } from './lib/router.mjs';
import { FALLBACK_PROJECTS } from './lib/projects-fallback.mjs';
import { resolveHrefForUi } from './lib/eco-href.mjs';

const STORAGE = 'ecomaestro_demands_v2';
const STORAGE_PROJECT = 'ecomaestro_last_project';
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

async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) return { error: res.status, data: null };
    return { error: null, data: await res.json() };
  } catch {
    return { error: 'network', data: null };
  }
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
  document.getElementById('tituloProjeto').textContent = d.title + suffix;
  renderSetup(rep.setup, d.description);
  renderEcoOverlaps(rep.eco_overlaps);
  renderCursorKit(rep.cursor_kit);
  document.getElementById('listaPrecisa').innerHTML = (rep.needs || []).map((n) => '<li>' + esc(n) + '</li>').join('');
  document.getElementById('listaAplica').innerHTML = (rep.aplicadores || []).map((a) => {
    const chk = a.link_check;
    let go;
    if (!a.href && (!chk || chk.status === 'ide')) {
      go = '<span class="go" style="opacity:.4;font-size:.7rem" title="Abra no Cursor">Cursor</span>';
    } else if (chk?.status === 'missing') {
      go =
        '<span class="go" style="opacity:.5;background:var(--border);color:var(--warn)" title="Arquivo ausente em _PROJETOS">Indisponível</span>';
    } else if (chk?.status === 'external') {
      go =
        '<a class="go" href="' +
        esc(a.href) +
        '" target="_blank" rel="noopener" title="App local com porta">Abrir app</a>';
    } else if (a.href) {
      go =
        '<a class="go" href="' +
        esc(linkHref(a.href)) +
        '" target="_blank" rel="noopener" title="' +
        esc(chk?.label || 'Abrir') +
        '">Abrir</a>';
    } else {
      go = '<span class="go" style="opacity:.4">—</span>';
    }
    return (
      '<div class="aplicador' +
      (a.principal ? ' principal' : '') +
      '">' +
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
    btn.addEventListener('click', () => completeRun(record.id, btn.dataset.key));
  });
}

async function completeRun(demandId, runKey) {
  const { error, data } = await apiFetch('/demands/' + demandId + '/runs/' + runKey, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'done',
      output_payload: { ui_note: 'Concluído manualmente no EcoMaestro', at: new Date().toISOString() }
    })
  });
  if (error || !data) {
    alert('Não foi possível atualizar a passagem. API em :8771?');
    return;
  }
  renderReport(data, true);
  loadApiDemands();
}

async function patchStatus(status) {
  if (!currentRecord?.id) return;
  const { error, data } = await apiFetch('/demands/' + currentRecord.id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
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
    runs: analyzed.runs
  };
  renderReport(currentRecord, false);
}

async function tryApi(payload) {
  const { error, data } = await apiFetch('/demands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (error || !data) return null;
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
document.getElementById('btnCopiarPasta').addEventListener('click', () => copiarPastaProjeto());
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

renderHist();
loadProjectsCatalog(false).catch(() => applyFallbackProjects('erro ao carregar'));
if (apiOnline()) {
  loadApiDemands();
  loadPorts();
}
