/** Campos mínimos do wizard por morador (contratos payload v1). */

/** v1.3 — circuito fechado prioritário (PATCH guiado humano). */
export const CIRCUIT_CLOSED_RESIDENT = 'dlogica';

export const WIZARD_BY_RESIDENT = {
  dlogica: {
    title: 'dLogica — registrar resultado (circuito v1.3)',
    subtitle: 'Cole do dLogica ou preencha aqui — o Eco grava analysis.* e avança para triaged.',
    fields: [
      { key: 'problem', label: 'Problema (analysis.problem)', required: true, section: 'analysis', path: 'problem' },
      { key: 'objective', label: 'Objetivo (analysis.objective)', required: true, section: 'analysis', path: 'objective' },
      {
        key: 'constraints',
        label: 'Restrições (uma por linha)',
        required: false,
        section: 'analysis',
        path: 'constraints',
        multiline: true,
        asArray: true
      },
      {
        key: 'risks',
        label: 'Riscos (uma por linha)',
        required: false,
        section: 'analysis',
        path: 'risks',
        multiline: true,
        asArray: true
      },
      {
        key: 'opportunities',
        label: 'Oportunidades (uma por linha)',
        required: false,
        section: 'analysis',
        path: 'opportunities',
        multiline: true,
        asArray: true
      }
    ]
  },
  workbench: {
    title: 'workbench — plano',
    fields: [
      {
        key: 'steps',
        label: 'Passos do plano (um por linha)',
        required: true,
        section: 'plan',
        path: 'steps',
        multiline: true,
        asArray: true
      },
      { key: 'workbench_kit', label: 'Kit workbench (opcional)', required: false, section: 'plan', path: 'workbench_kit' }
    ]
  },
  cursor: {
    title: 'Cursor — implementação',
    fields: [
      {
        key: 'tasks',
        label: 'Tarefas feitas ou a fazer (uma por linha)',
        required: true,
        section: 'implementation',
        path: 'tasks',
        multiline: true,
        asArray: true
      }
    ]
  },
  max: {
    title: 'Max — auditoria',
    fields: [
      {
        key: 'checks',
        label: 'Checks da auditoria (um por linha)',
        required: true,
        section: 'audit',
        path: 'checks',
        multiline: true,
        asArray: true
      },
      { key: 'blockers', label: 'Blockers (0 = nenhum)', required: false, section: 'audit', path: 'blockers', number: true }
    ]
  }
};

export function getWizardForResident(resident) {
  return WIZARD_BY_RESIDENT[resident] || {
    title: 'Registrar conclusão',
    fields: [
      { key: 'note', label: 'O que foi feito neste passo?', required: true, section: null, path: 'note' }
    ]
  };
}

export function buildOutputPayloadFromWizard(resident, answers = {}) {
  const spec = getWizardForResident(resident);
  const out = {};
  for (const f of spec.fields) {
    let val = (answers[f.key] || '').trim();
    if (!val && !f.required) continue;
    if (f.asArray) {
      val = val
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.number) {
      val = Number(val) || 0;
    }
    if (f.section) {
      out[f.section] = out[f.section] || {};
      out[f.section][f.path] = val;
    } else {
      out[f.path || f.key] = val;
    }
  }
  out.completed_at = new Date().toISOString();
  out.source = 'eco_wizard';
  return out;
}
