# API REST — EcoMaestro

**Base:** `http://127.0.0.1:8771`  
**Persistência padrão:** `data/demands/{uuid}.json`  
**Postgres (opcional):** `DATABASE_URL` no ambiente

## Iniciar

```bash
cd EcoMaestro
npm start
# ou: Iniciar-EcoMaestro-API.bat
```

Abre UI + API: http://127.0.0.1:8771/

---

## Endpoints

### `GET /api/projects`

Lista pastas em `c:\_PROJETOS` com `github_url` detectado via `git remote` (cache 30s).

- `GET /api/projects?refresh=1` — força novo scan

**Body de análise (POST /api/demands):** use `project_folder` (ex. `FREEDOM`) em vez de digitar GitHub; o servidor preenche o remote automaticamente.

### `GET /api/health`

```json
{ "ok": true, "storage": "json", "port": 8771 }
```

### `POST /api/demands`

Cria demanda + triagem (equivalente ao botão **Analisar demanda**).

**Body:**

```json
{
  "github_url": "https://github.com/RivasCode-Ops/FREEDOM",
  "description": "nova funcionalidade — exportar histórico em CSV"
}
```

Aliases: `link`, `desc`.

**Resposta `201`:** demanda completa com `id`, `demand`, `report`, `runs`, `payload_snapshot`.

### `GET /api/demands`

Lista resumida (últimas 20).

### `GET /api/demands/:id`

Demanda completa.

### `PATCH /api/demands/:id`

Atualiza status manualmente.

```json
{ "status": "in_progress" }
```

Valores: `draft` | `triaged` | `in_progress` | `under_review` | `completed` | `archived`

### `PATCH /api/demands/:id/runs/:runId`

Atualiza passagem (`runId` = UUID da run ou `resident`, ex. `workbench`).

```json
{
  "status": "done",
  "output_payload": { "plan": { "workbench_kit": "20-ENTREGA-DE-PRODUTO" } }
}
```

- Mescla `output_payload` no `payload_snapshot` (seções v1: `analysis`, `plan`, `implementation`, `audit`, …)
- Transição automática de status da demanda: dLogica → `triaged`, workbench → `in_progress`, cursor → `under_review`, max + todas runs → `completed`

### `POST /api/projects/scaffold`

Cria pasta do **projeto novo** em `c:\_PROJETOS\{slug}` com `README.md` inicial.

```json
{ "slug": "MeuAppFire", "description": "projeto novo — app FIRE família" }
```

Se a pasta já existir, retorna `200` com `already_existed: true`.

### `GET /api/ecosystem/ports`

Verifica se FREEDOM (`8765`), Max (`3847`), Cortana (`8787`) e geogrowth (`5190`) respondem em localhost.

---

## Exemplo curl

```bash
curl -s -X POST http://127.0.0.1:8771/api/demands ^
  -H "Content-Type: application/json" ^
  -d "{\"github_url\":\"https://github.com/RivasCode-Ops/EcoMaestro\",\"description\":\"nova funcionalidade — API REST\"}"
```

---

## UI (v2)

Com o servidor em `:8771`:

- **Analisar** → `POST /api/demands`
- Lista **Demandas salvas (API)** — clique reabre
- **Passagens (runs)** — *Marcar concluído* → `PATCH …/runs/:resident`
- **Status** (select), **Exportar JSON**, **Copiar id**
- Chips de **portas** no cabeçalho (`GET /api/ecosystem/ports`)

Sem API (`.vbs` ou `:8770`), usa `lib/router.mjs` no navegador (fallback local).

---

## Postgres

```bash
copy .env.example .env
# edite DATABASE_URL
npm install pg
npm start
```

Aplica `db/migrations/001_ecomaestro_core.sql` na primeira gravação.
