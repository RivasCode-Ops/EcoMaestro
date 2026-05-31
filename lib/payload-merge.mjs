/** Mescla output_payload do morador no snapshot acumulado (payload v1). */
const SECTION_BY_RESIDENT = {
  dlogica: 'analysis',
  workbench: 'plan',
  cursor: 'implementation',
  max: 'audit',
  freedom: 'financial',
  consorcio: 'financial',
  recuperacao: 'financial',
  cortana: 'commercial',
  arbilocal: 'commercial',
  simulador_troca_moto: 'commercial'
};

export function mergePayloadSnapshot(snapshot, resident, outputPayload = {}) {
  const base = { ...snapshot };
  const section = SECTION_BY_RESIDENT[resident];
  if (section) {
    base[section] = { ...(base[section] || {}), ...outputPayload };
  } else if (outputPayload && Object.keys(outputPayload).length) {
    Object.assign(base, outputPayload);
  }
  base.meta = {
    ...(base.meta || {}),
    version: 1,
    generated_by: resident,
    updated_at: new Date().toISOString()
  };
  return base;
}
