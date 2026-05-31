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

Atualiza status.

```json
{ "status": "in_progress" }
```

Valores: `draft` | `triaged` | `in_progress` | `under_review` | `completed` | `archived`

---

## Exemplo curl

```bash
curl -s -X POST http://127.0.0.1:8771/api/demands ^
  -H "Content-Type: application/json" ^
  -d "{\"github_url\":\"https://github.com/RivasCode-Ops/EcoMaestro\",\"description\":\"nova funcionalidade — API REST\"}"
```

---

## UI

Com o servidor em `:8771`, o botão **Analisar** chama `POST /api/demands` e exibe *Salvo na API · id: …*.

Sem API (arquivo `.vbs` ou `:8770`), usa `lib/router.mjs` no navegador (fallback local).

---

## Postgres

```bash
set DATABASE_URL=postgresql://user:pass@localhost:5432/ecomaestro
npm install pg
npm start
```

Aplica `db/migrations/001_ecomaestro_core.sql` na primeira gravação.
