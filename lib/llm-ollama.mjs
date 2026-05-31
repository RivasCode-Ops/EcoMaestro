const OLLAMA_URL = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const PREFERRED = (process.env.ECO_LLM_MODEL || 'llama3.2').trim();

let cachedModel = null;

function fetchTimeout(ms) {
  if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) {
    return AbortSignal.timeout(ms);
  }
  const ac = new AbortController();
  setTimeout(() => ac.abort(), ms);
  return ac.signal;
}

export async function listOllamaModels() {
  const res = await fetch(OLLAMA_URL + '/api/tags', { signal: fetchTimeout(8000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.models || []).map((m) => m.name || m.model).filter(Boolean);
}

export async function resolveOllamaModel() {
  if (cachedModel) return cachedModel;
  const models = await listOllamaModels();
  if (!models.length) return null;
  if (models.includes(PREFERRED)) {
    cachedModel = PREFERRED;
    return cachedModel;
  }
  const partial = models.find((m) => m.startsWith(PREFERRED.split(':')[0]));
  cachedModel = partial || models[0];
  return cachedModel;
}

export async function ollamaAvailable() {
  try {
    const models = await listOllamaModels();
    return models.length > 0;
  } catch {
    return false;
  }
}

export async function ollamaStatus() {
  try {
    const models = await listOllamaModels();
    const model = await resolveOllamaModel();
    return {
      online: models.length > 0,
      models,
      model_used: model,
      host: OLLAMA_URL
    };
  } catch (e) {
    return { online: false, models: [], model_used: null, host: OLLAMA_URL, error: e.message };
  }
}

export async function suggestIntent(description, ragHints = [], learningHints = []) {
  const status = await ollamaStatus();
  if (!status.online) return { ok: false, reason: 'ollama_offline', status };

  const model = status.model_used;
  if (!model) return { ok: false, reason: 'no_model', status };

  const intents = [
    'ideia_nova', 'feature_nova', 'governanca', 'implementar', 'auditar', 'pesquisar',
    'fire', 'financeiro_real', 'comercial', 'correcao_rapida', 'infra_resiliencia', 'repo_github'
  ];

  const prompt = `Você classifica demandas de desenvolvimento. Responda APENAS JSON: {"intent":"...","confidence":0-100,"summary":"uma frase"}
Intents válidos: ${intents.join(', ')}
Descrição: ${description.slice(0, 1500)}
${ragHints.length ? 'Contexto:\n' + ragHints.map((h) => '- ' + h.text).join('\n').slice(0, 800) : ''}
${learningHints.length ? 'Casos similares: ' + learningHints.map((c) => c.intent).join(', ') : ''}`;

  try {
    const res = await fetch(OLLAMA_URL + '/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 120 }
      }),
      signal: fetchTimeout(60000)
    });
    if (!res.ok) return { ok: false, reason: 'ollama_error', model };
    const data = await res.json();
    const raw = (data.response || '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, reason: 'parse_error', raw, model };
    const parsed = JSON.parse(jsonMatch[0]);
    if (!intents.includes(parsed.intent)) return { ok: false, reason: 'invalid_intent', parsed, model };
    return {
      ok: true,
      intent: parsed.intent,
      confidence: parsed.confidence || 50,
      summary: parsed.summary || '',
      model
    };
  } catch (e) {
    return { ok: false, reason: e.message, model };
  }
}
