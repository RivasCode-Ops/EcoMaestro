/** Verifica moradores com URL local conhecida. */
const TARGETS = [
  { id: 'freedom', name: 'FREEDOM', url: 'http://127.0.0.1:8765/' },
  { id: 'max', name: 'Max Stack', url: 'http://127.0.0.1:3847/' },
  { id: 'cortana', name: 'Cortana', url: 'http://127.0.0.1:8787/' },
  { id: 'geogrowth', name: 'geogrowth', url: 'http://127.0.0.1:5190/' }
];

async function probe(url, ms = 800) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal, method: 'GET' });
    return res.ok || res.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function checkEcosystemPorts() {
  const out = await Promise.all(
    TARGETS.map(async (t) => ({
      id: t.id,
      name: t.name,
      url: t.url,
      online: await probe(t.url)
    }))
  );
  return { checked_at: new Date().toISOString(), services: out };
}
