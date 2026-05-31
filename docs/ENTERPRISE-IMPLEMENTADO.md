# EcoMaestro Enterprise — implementado

## O que foi entregue

| Recurso | Onde | Uso |
|---------|------|-----|
| Auth + tenant | `lib/api-guard.mjs`, UI settings | API key + `X-Eco-Tenant` |
| Wizard contratos | `lib/run-wizard.mjs`, dialog UI | “Terminei este passo” preenche gates |
| RAG local | `lib/rag-store.mjs`, `data/rag/index.json` | 124+ chunks workbench/docs |
| LLM Ollama | `lib/llm-ollama.mjs` | Sugere intent se online |
| Learning loop | `lib/learning-store.mjs` | Casos após run `done` |
| Audit log | `data/audit.log.jsonl` | create/done/reindex |
| Copiar pacote Cursor | botão na UI | pasta + demanda + D00 |

## Comandos

```powershell
cd c:\_PROJETOS\EcoMaestro
Iniciar-EcoMaestro-API.bat
npm run index:rag
npm run audit:security
```

## Ollama (opcional)

1. Instale [Ollama](https://ollama.com)
2. `ollama pull llama3.2`
3. Reinicie a API — chip “Ollama on” no topo

## API key (rede / VPS)

`.env`:

```
ECOMAESTRO_API_KEY=sua-chave
ECOMAESTRO_TENANT_ID=seu-tenant
```

Na UI: Enterprise → salvar mesma chave.

## Fluxo diário

1. `Abrir-EcoMaestro.bat` → projeto → **Trabalhar**
2. Leia bloco **Inteligência local** (RAG)
3. **1 — Abrir** morador → Cursor com **Copiar pacote**
4. **2 — Terminei** → wizard (campos por morador)
5. **Verificar adequação** → `completed` quando gates OK
