import { analyzeDemand } from './lib/router.mjs';

const STORAGE = 'ecomaestro_demands_v2';
const API_BASE = 'http://127.0.0.1:8771/api';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function renderReport(record, fromApi = false) {
  const d = record.demand;
  const rep = record.report;
  const suffix = rep.title_suffix || '';
  document.getElementById('tituloProjeto').textContent = d.title + suffix;
  document.getElementById('listaPrecisa').innerHTML = (rep.needs || []).map((n) => '<li>' + esc(n) + '</li>').join('');
  document.getElementById('listaAplica').innerHTML = (rep.aplicadores || []).map((a) => {
    const go = a.href
      ? '<a class="go" href="' + esc(a.href) + '" target="_blank" rel="noopener">Abrir</a>'
      : '<span class="go" style="opacity:.4;font-size:.7rem">IDE</span>';
    return '<div class="aplicador' + (a.principal ? ' principal' : '') + '">' +
      '<span class="' + (a.principal ? 'badge' : 'badge depois') + '">' + esc(a.badge || (a.principal ? 'Comece aqui' : 'Depois')) + '</span>' +
      '<div><h3>' + esc(a.name) + ' — ' + esc(a.label) + '</h3><p>' + esc(a.note) + '</p></div>' +
      go + '</div>';
  }).join('');
  let conf = rep.confidence_text || '';
  if (fromApi && record.id) {
    conf += (conf ? ' · ' : '') + 'Salvo na API · id: ' + record.id.slice(0, 8) + '…';
  }
  document.getElementById('confianca').textContent = conf;
  document.getElementById('relatorio').classList.add('on');
}

function renderLocal(analyzed) {
  renderReport({
    demand: analyzed.demand,
    report: {
      ...analyzed.report,
      title_suffix: analyzed.report.title_suffix
    }
  }, false);
}

async function tryApi(link, desc) {
  try {
    const res = await fetch(API_BASE + '/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ github_url: link, description: desc })
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
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
  } else {
    try {
      const analyzed = analyzeDemand({ github_url: link, description: desc });
      renderLocal(analyzed);
      document.getElementById('confianca').textContent +=
        (document.getElementById('confianca').textContent ? ' · ' : '') +
        'Modo local (API em :8771 offline)';
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
});

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
        '<strong>API ativa</strong> — demandas salvas em <code>data/demands/</code>. POST /api/demands';
    } else if (fileMode) {
      span.innerHTML =
        '<strong>Modo autônomo</strong> — tenta API :8771; se offline, análise local no navegador.';
    }
  }
})();

renderHist();
