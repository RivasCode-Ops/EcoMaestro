# Contratos entre moradores — EcoMaestro

> Versão do payload: **1** · Alinhado a `db/migrations/001_ecomaestro_core.sql`

Cada passagem grava `input_payload` e `output_payload` em `demand_resident_runs`. O morador seguinte **lê o payload acumulado** e preenche apenas sua seção.

---

## 1. Shape base (payload acumulado)

```json
{
  "demand_id": "uuid",
  "intent": "feature_nova",
  "context": {
    "source_type": "github",
    "github_url": "https://github.com/RivasCode-Ops/EcoMaestro",
    "localhost_url": null,
    "raw_description": "nova funcionalidade — persistir demandas no Postgres",
    "tipo_demanda": "feature",
    "related_links": [],
    "tags": []
  },
  "analysis": {},
  "plan": {},
  "implementation": {},
  "audit": {},
  "financial": {},
  "commercial": {},
  "meta": {
    "version": 1,
    "generated_by": null,
    "updated_at": "2026-05-31T12:00:00Z"
  }
}
```

| Seção | Morador que preenche |
|-------|----------------------|
| `context` | EcoMaestro (triagem inicial) |
| `analysis` | dLogica |
| `plan` | workbench |
| `implementation` | Cursor |
| `audit` | Max Stack |
| `financial` | FREEDOM, CONSORCIO, Recuperação |
| `commercial` | ARBILOCAL, Cortana (comercial) |

---

## 2. EcoMaestro → primeiro morador

**Entrada (UI):** `github_url`, `description`, classificação local.

**Saída (grava em `demands` + `demand_reports`):**

```json
{
  "context": { "source_type": "github", "github_url": "...", "raw_description": "..." },
  "meta": { "version": 1, "generated_by": "ecomaestro", "routing_label": "Detectado pela descrição" }
}
```

**Campos obrigatórios na demanda:**

| Campo | Obrigatório |
|-------|-------------|
| `title` | Sim (derivado de org/repo ou 1ª linha da descrição) |
| `description` | Se não houver `github_url` |
| `github_url` | Se não houver descrição substantiva |
| `intent_id` | Sim após triagem |
| `primary_resident` | Sim (Comece aqui) |

---

## 3. dLogica

### Entrada mínima

- `context.raw_description`
- `context.github_url` (opcional)
- `intent` (sugestão do maestro)

### Saída obrigatória (`analysis`)

```json
{
  "analysis": {
    "problem": "Problema em uma frase clara",
    "objective": "Resultado esperado mensurável",
    "solution_type": "produto | ferramenta_interna | integracao | pesquisa",
    "constraints": ["prazo", "stack"],
    "risks": ["risco 1"],
    "opportunities": ["oportunidade 1"],
    "out_of_scope": ["o que não fazer"]
  },
  "meta": { "generated_by": "dlogica", "version": 1 }
}
```

### Gate para `demands.status = triaged`

- `analysis.problem` não vazio  
- `analysis.objective` não vazio  

---

## 4. workbench

### Entrada

- Payload completo com `analysis` preenchido.

### Saída obrigatória (`plan` + tarefas)

```json
{
  "plan": {
    "workbench_kit": "20-ENTREGA-DE-PRODUTO",
    "steps": ["Passo 1", "Passo 2"],
    "owner": "dev",
    "deadline": "2026-06-15",
    "handoff_md": "caminho/para/HANDOFF.md opcional"
  },
  "implementation": {
    "repo": "https://github.com/RivasCode-Ops/EcoMaestro",
    "branch": "feat/demands-api",
    "tasks": [
      { "id": "T1", "description": "Migration demands", "status": "todo" }
    ]
  },
  "meta": { "generated_by": "workbench", "version": 1 }
}
```

### Gate para `in_progress`

- `plan.steps` com pelo menos 1 item  
- `implementation.tasks` com pelo menos 1 item  

---

## 5. Cursor

### Entrada

- `plan` + `implementation.tasks` aprovados.

### Saída obrigatória

```json
{
  "implementation": {
    "files": [
      { "path": "db/migrations/001_ecomaestro_core.sql", "status": "created" }
    ],
    "tasks": [
      { "id": "T1", "status": "done" }
    ],
    "commit_sha": "abc123 opcional"
  },
  "meta": { "generated_by": "cursor", "version": 1 }
}
```

---

## 6. Max Stack

### Entrada

- `implementation.repo`, `implementation.files`, branch.

### Saída obrigatória

```json
{
  "audit": {
    "health_score": 78,
    "checks": ["lint_ok", "deps_ok"],
    "issues": [
      { "severity": "medium", "file": "src/x.ts", "description": "..." }
    ],
    "recommendations": ["Criar testes para /demands"],
    "blockers": []
  },
  "meta": { "generated_by": "max", "version": 1 }
}
```

### Gate para `under_review`

- `audit` presente com pelo menos 1 `check`  

### Gate para `completed`

- `audit.blockers` vazio  
- Todas `implementation.tasks` com `status = done`  

---

## 7. Extras — playbooks resumidos

### FREEDOM (`fire`)

```json
{
  "financial": {
    "fire_target_brl": 2400000,
    "monthly_spend_brl": 8000,
    "swr_pct": 4,
    "horizon_years": 12,
    "deliverable": "Simulação Coast/Barista + data FIRE"
  },
  "meta": { "generated_by": "freedom" }
}
```

**Checklist:** patrimônio atual · aporte · IPCA · meta · export JSON.

### CONSORCIO / Recuperação (`financeiro_real`)

```json
{
  "financial": {
    "data_source": "open_finance | manual",
    "deliverable": "Score + fluxo de caixa 90 dias",
    "link_to_fire": true
  }
}
```

### ARBILOCAL (`comercial`)

```json
{
  "commercial": {
    "decision": "fornecedor | revenda | preço",
    "sources": ["url1"],
    "deliverable": "Memorando com 3 opções e recomendação"
  }
}
```

### Cortana (`pesquisar`)

```json
{
  "analysis": {
    "external_summary": "Síntese com fontes",
    "sources": [{ "title": "", "url": "" }]
  },
  "meta": { "generated_by": "cortana" }
}
```

---

## 8. Regras de merge

1. Morador **não apaga** seções de outros; só atualiza a sua.  
2. `meta.generated_by` = último morador que escreveu.  
3. EcoMaestro na triagem **não** preenche `analysis` — só sugere rota.  
4. Extras **não** substituem workbench/Max (reforço do MODELO-CONDOMINIO).

---

## 9. Validação (JSON Schema)

Schema formal: [schemas/payload-v1.schema.json](../schemas/payload-v1.schema.json)
