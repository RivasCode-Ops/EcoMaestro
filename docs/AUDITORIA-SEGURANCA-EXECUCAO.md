# Auditoria executada — dependências, auth guard, LGPD cross-tenant

**Data:** 2026-05-30 · **Comando:** `npm run audit:security`

---

## 1. Dependências não utilizadas

| Item | Situação | Ação |
|------|----------|------|
| **npm `pg`** | `optionalDependencies` — só carrega se `DATABASE_URL` + `npm install pg` | **OK** — não instala se não usar Postgres |
| **Dependências obrigatórias** | Nenhuma além do Node 18+ | **OK** — app é zero-dep no dia a dia |
| **`lib/verify-links-node.mjs`** | Não importado por `server.mjs` | **Código morto útil** — usar em CI ou remover; não é pacote npm |

**Veredito:** não há pacotes npm “fantasma” instalados; o risco é **módulo local órfão** (`verify-links-node`), não `node_modules` inchado.

---

## 2. Duas rotas (e mais) sem auth guard — antes da correção

Interpretação **auth guard** (não “alpha”): ausência de autenticação/autorização.

| Rota | Risco | Severidade |
|------|-------|------------|
| **`POST /api/projects/scaffold`** | Cria pasta em `_PROJETOS` sem identidade | **Crítica** se API exposta na rede |
| **`GET /p/*`** | Lê qualquer arquivo do monorepo (incl. `.env` se path conhecido) | **Crítica LGPD** |
| `POST /api/demands` | Grava descrição possivelmente com dados pessoais | Alta |
| `GET /api/demands` / `GET /api/demands/:id` | Lista/lê demandas de **todos** os “inquilinos” | Alta (cross-tenant) |
| `POST /api/orchestrate` | Processa texto sem persistir — ainda vaza conteúdo | Média |

### Correção aplicada

- `lib/api-guard.mjs`: com `ECOMAESTRO_API_KEY`, exige header `X-Eco-Api-Key` nas rotas de escrita e leitura de demandas.
- `/p/`: deny-list (`.env`, `node_modules`, `data`, `.pem`, …).
- `tenant_id` em demandas JSON + filtro `listDemands` / `getDemand`.
- Postgres: migration `002_tenant_lgpd.sql`.

**Modo dev (sem API key):** continua só `127.0.0.1` — aceitável para desktop único.

---

## 3. Vazamento LGPD — cross-tenant

### Como vazava

1. **IDOR:** quem soubesse UUID de demanda lia registro de outro contexto.
2. **Listagem global:** `GET /api/demands` sem filtro de tenant retornava tudo em `data/demands/`.
3. **`/p/`:** servia arquivos de **qualquer** projeto (FREEDOM, XAXA, …) no mesmo host — mistura de contexto.
4. **Postgres compartilhado:** schema sem `tenant_id` + queries sem `WHERE tenant_id`.

### Dados sensíveis típicos nas demandas

- Descrição livre (nomes, CPF, e-mail em texto).
- `github_url`, `folder_path`, snapshots de análise.

### Mitigação atual

| Controle | Status |
|----------|--------|
| `tenant_id` no JSON | Implementado |
| Filtro list/get por tenant | Implementado |
| Header `X-Eco-Tenant` | Implementado |
| RLS Postgres | Documentado na migration 002 — **ativar no Supabase** |
| Criptografia em repouso | **Pendente** enterprise |

Demandas antigas sem `tenant_id` são tratadas como tenant `local`.

---

## 4. Como testar

```powershell
cd c:\_PROJETOS\EcoMaestro
npm run audit:security
node scripts/test-orchestrator.mjs
```

Com API key:

```powershell
$env:ECOMAESTRO_API_KEY="teste-segredo"
node server.mjs
# POST /api/demands sem header → 401
```

---

## 5. Pendências (ainda não bloqueio local)

- UI `app.mjs` não envia `X-Eco-Api-Key` / `X-Eco-Tenant` (só necessário com key).
- `POST /api/orchestrate` ainda aberto se key definida — incluído no guard.
- Auditoria formal LGPD (DPA, base legal, retenção) — processo, não só código.

---

*Relacionado: [ROADMAP-ENTERPRISE-RAG-LLM.md](ROADMAP-ENTERPRISE-RAG-LLM.md)*
