const OLLAMA_URL = (process.env.OLLAMA_HOST || 'http://127.0.0.1:11434').replace(/\/$/, '');
const MODEL = process.env.ECO_LLM_MODEL || 'llama3.2';

export async function ollamaAvailable() {
  try {
    const res = await fetch(OLLAMA_URL + '/api/tags', { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function suggestIntent(description, ragHints = [], learningHints = []) {
  const available = await ollamaAvailable();
  if (!available) return { ok: false, reason: 'ollama_offline' };

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
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.2, num_predict: 120 }
      }),
      signal: AbortSignal.timeout(45000)
    });
    if (!res.ok) return { ok: false, reason: 'ollama_error' };
    const data = await res.json();
    const raw = (data.response || '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return { ok: false, reason: 'parse_error', raw };
    const parsed = JSON.parse(jsonMatch[0]);
    if (!intents.includes(parsed.intent)) return { ok: false, reason: 'invalid_intent', parsed };
    return { ok: true, intent: parsed.intent, confidence: parsed.confidence || 50, summary: parsed.summary || '' };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}
