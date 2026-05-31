import { analyzeDemand, descriptionIntentScore } from './router.mjs';
import { ensureRagLoaded, searchRag } from './rag-store.mjs';
import { suggestIntent, ollamaAvailable } from './llm-ollama.mjs';
import { findSimilarCases, recordLearningCase } from './learning-store.mjs';

/**
 * Enriquece análise com RAG + LLM (sugestão) sem remover classificação por regras.
 */
export async function enrichAnalyzed(analyzed, { tenantId = 'local', useLlm = true } = {}) {
  const desc = analyzed.demand?.description || '';
  const folder = analyzed.demand?.project_folder || analyzed.payload_snapshot?.context?.project_folder;

  await ensureRagLoaded();
  const ragHits = searchRag(desc, folder, 5);
  const learning = await findSimilarCases(desc, tenantId, 3);

  let llm = { ok: false, reason: 'disabled' };
  if (useLlm && desc.length > 8) {
    llm = await suggestIntent(desc, ragHits, learning);
  }

  const ruleIntent = analyzed.plan?.intent || analyzed.demand?.current_intent;
  let finalIntent = ruleIntent;
  let intentSource = 'rules';

  if (llm.ok && (llm.confidence || 0) >= 55) {
    const ruleScore = descriptionIntentScore(desc, ruleIntent);
    if ((llm.confidence || 0) > ruleScore + 15) {
      finalIntent = llm.intent;
      intentSource = 'llm';
    }
  }

  if (finalIntent !== ruleIntent) {
    const re = analyzeDemand({
      github_url: analyzed.demand?.github_url || '',
      description: desc,
      project_folder: folder,
      folder_path: analyzed.demand?.local_folder || null,
      _force_intent: finalIntent
    });
    Object.assign(analyzed, {
      plan: re.plan,
      report: re.report,
      runs: re.runs,
      demand: { ...analyzed.demand, ...re.demand },
      payload_snapshot: re.payload_snapshot
    });
  }

  if (ragHits.length) {
    const cite = 'Contexto RAG: ' + ragHits[0].source;
    if (!analyzed.report.needs.some((n) => String(n).includes('RAG'))) {
      analyzed.report.needs.unshift(cite);
    }
  }

  analyzed.enterprise = {
    rag: ragHits,
    llm,
    learning,
    intent_source: intentSource,
    ollama_online: await ollamaAvailable()
  };

  return analyzed;
}

export async function onRunCompletedLearning(record, tenantId) {
  const orch = record.orchestration;
  if (!orch || orch.verdict === 'desalinhado') return null;
  const desc = record.demand?.description || '';
  if (!desc) return null;
  const moradores = (record.runs || []).filter((r) => r.resident !== 'ecomaestro').map((r) => r.resident);
  return recordLearningCase({
    tenantId,
    intent: record.demand?.current_intent,
    description: desc,
    projectFolder: record.demand?.project_folder,
    outcome: orch.verdict || 'adequado',
    moradores
  });
}
