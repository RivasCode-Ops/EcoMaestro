/**
 * Guarda de API (auth) + contexto de tenant (LGPD / isolamento).
 * Local: sem ECOMAESTRO_API_KEY → só 127.0.0.1 (já no listen).
 * Enterprise: defina ECOMAESTRO_API_KEY e opcional ECOMAESTRO_TENANT_ID.
 */

const API_KEY = (process.env.ECOMAESTRO_API_KEY || '').trim();
const DEFAULT_TENANT = (process.env.ECOMAESTRO_TENANT_ID || 'local').trim() || 'local';

/** Rotas de mutação que exigem guarda quando API_KEY está definida. */
export const GUARDED_WRITE_ROUTES = [
  { method: 'POST', path: '/api/demands' },
  { method: 'POST', path: '/api/projects/scaffold' },
  { method: 'POST', path: '/api/rag/reindex' },
  { method: 'POST', path: '/api/learning/feedback' },
  { method: 'PATCH', pathPrefix: '/api/demands/' }
];

/** Rotas de leitura sensível (dados pessoais / demandas). */
export const GUARDED_READ_ROUTES = [
  { method: 'GET', path: '/api/demands' },
  { method: 'GET', pathPrefix: '/api/demands/' }
];

export function getDefaultTenantId() {
  return DEFAULT_TENANT;
}

export function resolveTenantId(req) {
  const header = (req.headers['x-eco-tenant'] || req.headers['x-eco-tenant-id'] || '')
    .toString()
    .trim();
  return header || DEFAULT_TENANT;
}

function matchesGuarded(route, method, pathname) {
  if (route.method !== method) return false;
  if (route.path) return pathname === route.path;
  if (route.pathPrefix) return pathname.startsWith(route.pathPrefix);
  return false;
}

export function isGuardedWrite(method, pathname) {
  return GUARDED_WRITE_ROUTES.some((r) => matchesGuarded(r, method, pathname));
}

export function isGuardedRead(method, pathname) {
  if (pathname === '/api/health' || pathname === '/api/ecosystem/ports') return false;
  if (pathname.startsWith('/api/projects') && method === 'GET') return false;
  return GUARDED_READ_ROUTES.some((r) => matchesGuarded(r, method, pathname));
}

export function apiKeyRequired() {
  return API_KEY.length > 0;
}

export function checkApiKey(req) {
  if (!API_KEY) return { ok: true };
  const provided = (req.headers['x-eco-api-key'] || req.headers['authorization'] || '')
    .toString()
    .replace(/^Bearer\s+/i, '')
    .trim();
  if (provided === API_KEY) return { ok: true };
  return { ok: false, code: 401, message: 'API key inválida ou ausente (header X-Eco-Api-Key)' };
}

export function enforceGuard(req, res, send, { write, read }) {
  const needAuth = (write && isGuardedWrite(req.method, '')) || (read && isGuardedRead(req.method, ''));
  if (!needAuth && !apiKeyRequired()) return { ok: true };
  const keyCheck = checkApiKey(req);
  if (!keyCheck.ok) {
    send(res, keyCheck.code, { error: keyCheck.message, code: 'AUTH_REQUIRED' });
    return { ok: false };
  }
  return { ok: true };
}

/** Uso no server: pathname já conhecido. */
export function guardRequest(req, res, send, pathname) {
  if (!apiKeyRequired()) return { ok: true, tenantId: resolveTenantId(req) };
  const needsKey =
    isGuardedWrite(req.method, pathname) ||
    isGuardedRead(req.method, pathname) ||
    (req.method === 'POST' && pathname === '/api/orchestrate');
  if (!needsKey) return { ok: true, tenantId: resolveTenantId(req) };
  const keyCheck = checkApiKey(req);
  if (!keyCheck.ok) {
    send(res, keyCheck.code, { error: keyCheck.message, code: 'AUTH_REQUIRED' });
    return { ok: false };
  }
  return { ok: true, tenantId: resolveTenantId(req) };
}

export function assertRecordTenant(record, tenantId) {
  const recTenant = record?.tenant_id || record?.payload_snapshot?.context?.tenant_id || DEFAULT_TENANT;
  if (recTenant !== tenantId) {
    return { ok: false, code: 403, message: 'Demanda pertence a outro tenant (LGPD / isolamento)' };
  }
  return { ok: true };
}

/** Bloqueio de vazamento via /p/ — segmentos e extensões sensíveis. */
const DENY_SEGMENTS = new Set([
  '.git',
  'node_modules',
  '.env',
  'data',
  'credentials',
  '.ssh',
  '.aws',
  'secrets'
]);
const DENY_EXT = new Set([
  '.env',
  '.pem',
  '.key',
  '.pfx',
  '.p12',
  '.sqlite',
  '.db',
  '.log'
]);

export function isProjetosPathAllowed(rel) {
  const parts = rel.replace(/\\/g, '/').split('/').filter(Boolean);
  for (const p of parts) {
    const low = p.toLowerCase();
    if (DENY_SEGMENTS.has(low) || low.startsWith('.env')) return false;
  }
  const ext = rel.includes('.') ? rel.slice(rel.lastIndexOf('.')).toLowerCase() : '';
  if (DENY_EXT.has(ext)) return false;
  return true;
}
