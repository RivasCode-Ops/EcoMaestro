import { analyzeDemand } from './lib/router.mjs';

const STORAGE = 'ecomaestro_demands_v2';
const API_BASE = 'http://127.0.0.1:8771/api';

let currentRecord = null;

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function apiOnline() {
  return location.port === '8771' || location.hostname === '127.0.0.1' && location.port === '8771';
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
      cursor_kit: analyzed.report.cursor_kit
    },
    runs: analyzed.runs
  };
  renderReport(currentRecord, false);
}

async function tryApi(link, desc) {
  const { error, data } = await apiFetch('/demands', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ github_url: link, description: desc })
  });
  if (error || !data) return null;
  return data;
}

async function loadDemandById(id) {
  const { error, data } = await apiFetch('/demands/' + id);
  if (!error && data) {
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

async function analisar() {
  const link = document.getElementById('linkGh').value.trim();
  const desc = document.getElementById('desc').value.trim();
  if (!link && !desc) {
    alert('Informe o link do GitHub e/ou a descrição da demanda.');
    return;
  }

  const apiRecord = await tryApi(link, desc);
  if (apiRecord) {
    renderReport(apiRecord, true);
    loadApiDemands();
  } else {
    try {
      const analyzed = analyzeDemand({ github_url: link, description: desc });
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
    list.unshift({ ts: Date.now(), link, desc });
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
        '">' +
        esc((d.link || d.desc || '').slice(0, 50)) +
        ' · ' +
        when +
        '</div>'
      );
    })
    .join('');
  el.querySelectorAll('.hist-item').forEach((node) => {
    node.addEventListener('click', () => {
      document.getElementById('linkGh').value = node.dataset.link || '';
      document.getElementById('desc').value = node.dataset.desc || '';
      analisar();
    });
  });
}

document.getElementById('btnAnalisar').addEventListener('click', analisar);
document.getElementById('btnLimpar').addEventListener('click', () => {
  document.getElementById('linkGh').value = '';
  document.getElementById('desc').value = '';
  document.getElementById('relatorio').classList.remove('on');
  document.getElementById('setupBox').hidden = true;
  document.getElementById('cursorKitBox').hidden = true;
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
if (apiOnline()) {
  loadApiDemands();
  loadPorts();
}
