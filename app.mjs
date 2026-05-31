import { analyzeDemand } from './lib/router.mjs';
import { FALLBACK_PROJECTS } from './lib/projects-fallback.mjs';

const STORAGE = 'ecomaestro_demands_v2';
const STORAGE_PROJECT = 'ecomaestro_last_project';
const API_BASE = 'http://127.0.0.1:8771/api';

let currentRecord = null;
let projectsCatalog = [];

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function apiOnline() {
  return location.port === '8771' || location.hostname === '127.0.0.1' && location.port === '8771';
}

function getSelectedProject() {
  const sel = document.getElementById('selProjeto');
  const id = sel?.value || '';
  if (!id || id === '__none__') return null;
  if (id === '__new__') return { id: '__new__', name: '(projeto novo)', github_url: null, folder_path: null, kind: 'novo' };
  return projectsCatalog.find((p) => p.id === id) || null;
}

function fillProjectSelect(projects, root) {
  const sel = document.getElementById('selProjeto');
  const last = localStorage.getItem(STORAGE_PROJECT) || '';
  const prod = projects.filter((p) => p.kind === 'produto');
  const ferr = projects.filter((p) => p.kind === 'ferramenta');
  let html = '<option value="__new__">— Projeto novo (ainda sem pasta) —</option>';
  if (prod.length) {
    html += '<optgroup label="Produtos">';
    html += prod.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.label || p.name) + '</option>').join('');
    html += '</optgroup>';
  }
  if (ferr.length) {
    html += '<optgroup label="Ferramentas ECO">';
    html += ferr.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.label || p.name) + '</option>').join('');
    html += '</optgroup>';
  }
  sel.innerHTML = html;
  if (last && [...sel.options].some((o) => o.value === last)) sel.value = last;
  else if (prod.some((p) => p.id === 'FREEDOM')) sel.value = 'FREEDOM';
  document.getElementById('projMeta').textContent =
    (root ? 'Raiz: ' + root + ' · ' : '') + projects.length + ' pastas · GitHub automático quando houver git';
  onProjectSelectChange();
}

function onProjectSelectChange() {
  const p = getSelectedProject();
  const linkInput = document.getElementById('linkGh');
  const linkView = document.getElementById('linkGhView');
  if (!p || p.id === '__new__') {
    linkInput.value = '';
    linkView.hidden = true;
    if (p?.id === '__new__') localStorage.setItem(STORAGE_PROJECT, '__new__');
    return;
  }
  localStorage.setItem(STORAGE_PROJECT, p.id);
  linkInput.value = p.github_url || '';
  if (p.github_url) {
    linkView.hidden = false;
    linkView.textContent = 'GitHub: ' + p.github_url;
  } else {
    linkView.hidden = false;
    linkView.textContent = 'Sem remote GitHub — roteamento pela pasta ' + p.name;
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
  sel.innerHTML = '<option value="">Carregando…</option>';

  if (apiOnline()) {
    const q = refresh ? '?refresh=1' : '';
    const { error, data } = await apiFetch('/projects' + q);
    if (!error && data?.projects?.length) {
      projectsCatalog = data.projects;
      fillProjectSelect(data.projects, data.root);
      return;
    }
    const hint =
      error === 404
        ? 'API antiga — feche e rode Iniciar-EcoMaestro-API.bat de novo'
        : error
          ? 'erro ' + error + ' no scan'
          : 'resposta vazia';
    applyFallbackProjects(hint);
    return;
  }

  applyFallbackProjects('modo autônomo — inicie API :8771 para listar todas as pastas');
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
        (o.href ? '<a class="go" href="' + esc(o.href) + '" target="_blank" rel="noopener">Abrir</a>' : '') +
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
      return (
        '<a class="go' +
        (start ? ' kit-start' : '') +
        '" href="' +
        esc(l.href) +
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
  document.getElementById('linkTutorial').href = setup.tutorial_href;
  document.getElementById('linkOrquestrador').href = setup.orquestrador_href;
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
    const go = a.href
      ? '<a class="go" href="' + esc(a.href) + '" target="_blank" rel="noopener">Abrir</a>'
      : '<span class="go" style="opacity:.4;font-size:.7rem">IDE</span>';
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
  if (!proj?.id && !desc) return null;
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
    alert('Escolha um projeto (ou "projeto novo") e descreva a demanda.');
    return;
  }

  const apiRecord = await tryApi(payload);
  if (apiRecord) {
    renderReport(apiRecord, true);
    loadApiDemands();
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
document.getElementById('btnAtualizarProjetos').addEventListener('click', () => loadProjectsCatalog(true));
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
      span.innerHTML =
        '<strong>API ativa</strong> — demandas em <code>data/demands/</code> · runs · export JSON · portas do eco';
    } else if (fileMode) {
      span.innerHTML =
        '<strong>Modo autônomo</strong> — tenta API :8771; se offline, análise local no navegador.';
    }
  }
})();

renderHist();
loadProjectsCatalog(false).catch(() => applyFallbackProjects('erro ao carregar'));
if (apiOnline()) {
  loadApiDemands();
  loadPorts();
}
