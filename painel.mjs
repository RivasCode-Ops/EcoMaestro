const API = location.origin + '/api';

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

async function load() {
  const errBox = document.getElementById('errBox');
  try {
    const res = await fetch(API + '/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.status);
    errBox.hidden = true;
    render(data);
  } catch (e) {
    errBox.hidden = false;
    errBox.textContent =
      location.port === '8771'
        ? 'Erro ao carregar painel: ' + e.message
        : 'Abra via http://127.0.0.1:8771/painel.html (Iniciar-EcoMaestro-API.bat)';
  }
}

function render(d) {
  document.getElementById('kpiGrid').innerHTML =
    '<div class="kpi"><div class="n">' +
    d.open_count +
    '</div><div class="l">Abertas</div></div>' +
    '<div class="kpi"><div class="n">' +
    d.total_demands +
    '</div><div class="l">Total</div></div>' +
    '<div class="kpi"><div class="n">' +
    (d.avg_hours_to_triaged != null ? d.avg_hours_to_triaged + 'h' : '—') +
    '</div><div class="l">Média até triagem</div></div>' +
    '<div class="kpi"><div class="n">' +
    (d.avg_hours_to_completed != null ? d.avg_hours_to_completed + 'h' : '—') +
    '</div><div class="l">Média até completed</div></div>' +
    '<div class="kpi"><div class="n">' +
    d.stale_demands.length +
    '</div><div class="l">Paradas 7d+</div></div>';

  const maxS = Math.max(1, ...Object.values(d.by_status || {}));
  document.getElementById('statusBars').innerHTML = Object.entries(d.by_status || {})
    .map(([st, n]) => {
      const pct = Math.round((n / maxS) * 100);
      return (
        '<div class="bar-row"><span style="width:6.5rem">' +
        esc(st) +
        '</span><div class="bar"><i style="width:' +
        pct +
        '%"></i></div><strong>' +
        n +
        '</strong></div>'
      );
    })
    .join('');

  const maxR = Math.max(1, ...Object.values(d.by_last_resident || {}));
  document.getElementById('residentBars').innerHTML = Object.entries(d.by_last_resident || {})
    .map(([r, n]) => {
      const pct = Math.round((n / maxR) * 100);
      return (
        '<div class="bar-row"><span style="width:5.5rem">' +
        esc(r) +
        '</span><div class="bar"><i style="width:' +
        pct +
        '%"></i></div><strong>' +
        n +
        '</strong></div>'
      );
    })
    .join('');

  const stale = document.getElementById('staleList');
  stale.innerHTML = d.stale_demands.length
    ? d.stale_demands
        .map(
          (s) =>
            '<a href="/?demand=' +
            encodeURIComponent(s.id) +
            '">' +
            esc(s.title || s.id.slice(0, 8)) +
            ' · ' +
            esc(s.status) +
            ' · ' +
            s.days_inactive +
            'd parada</a>'
        )
        .join('')
    : '<p class="hint" style="color:var(--muted)">Nenhuma demanda aberta parada.</p>';

  document.getElementById('statusLinks').innerHTML = Object.entries(d.by_status || {})
    .filter(([, n]) => n > 0)
    .map(
      ([st, n]) =>
        '<a href="/?status=' + encodeURIComponent(st) + '">' + esc(st) + ' (' + n + ')</a>'
    )
    .join('');
}

document.getElementById('linkRefresh')?.addEventListener('click', (e) => {
  e.preventDefault();
  load();
});

load();
