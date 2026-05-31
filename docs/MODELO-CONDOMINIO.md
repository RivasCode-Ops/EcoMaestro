# Modelo do condomínio — EcoMaestro

> **v2.1 / Eco v1.3** — de conceito para especificação operável  
> Ver também: [CONTRATOS-MORADORES.md](CONTRATOS-MORADORES.md) · [ESTADOS-E-FLUXOS.md](ESTADOS-E-FLUXOS.md) · [ANALISE-FUNCIONAL.md](ANALISE-FUNCIONAL.md)

## Moradores (ferramentas fixas)

| Ordem | App | Entrega | Contrato saída |
|-------|-----|---------|----------------|
| 1 | **dLogica** | Definição — o que a demanda precisa virar | `analysis.*` |
| 2 | **workbench** | Governança — decisão, handoff, kit | `plan.*`, `implementation.tasks` |
| 3 | **Cursor** | Implementação — código no escopo | `implementation.files`, tasks `done` |
| 4 | **Max Stack** | Auditoria — saúde do repositório | `audit.*` |

## Extras (só quando o plano pedir)

| App | Quando | Contrato |
|-----|--------|----------|
| **Cortana** | Pesquisa web | `analysis.external_summary`, `sources[]` |
| **FREEDOM** | FIRE | `financial.fire_*` — ver playbook em CONTRATOS §7 |
| **CONSORCIO** | Open Finance | `financial.data_source`, score |
| **Recuperação Financeira** | Dívidas | `financial` + dashboard |
| **ARBILOCAL** | Comercial | `commercial.*` |
| **Simulador Troca Moto** | Gasto em bem | `financial` + simulação |

## Regras do maestro

1. **Uma pergunta por morador** — relatório com **Comece aqui** + Depois.  
2. **Link GitHub** → extrai org/repo; Max com `?repo=`.  
3. **Descrição** classifica intent (keywords v1; LLM v2 opcional).  
4. **Extras** nunca substituem workbench ou Max.  
5. **Payload acumulado** — cada morador merge na sua seção ([CONTRATOS](CONTRATOS-MORADORES.md)).

## Intenções → sequência padrão

| Intenção | Sequência (`intents.default_sequence`) |
|----------|----------------------------------------|
| `ideia_nova` | dLogica → workbench → Cursor → Max |
| `feature_nova` | workbench → Cursor → Max |
| `governanca` | workbench → Cursor → Max |
| `implementar` | workbench → Cursor → Max |
| `auditar` | Max → workbench |
| `pesquisar` | Cortana → workbench |
| `fire` | FREEDOM |
| `financeiro_real` | consorcio / recuperacao → workbench |
| `comercial` | arbilocal, cortana → workbench |
| `correcao_rapida` | workbench `50-CORRECAO-RAPIDA` → Cursor → Max |

Catálogo SQL: `db/migrations/001_ecomaestro_core.sql`

## Estados da demanda

| Estado | Gate |
|--------|------|
| `draft` | Criada (UI ou API) |
| `triaged` | dLogica: `analysis.problem` + `objective` |
| `in_progress` | workbench: `plan.steps` + tasks |
| `under_review` | Cursor entregou; Max iniciou |
| `completed` | tasks done; `audit.blockers` vazio |
| `archived` | Humano encerrou |

Diagrama: [ESTADOS-E-FLUXOS.md](ESTADOS-E-FLUXOS.md)

## Como usar no dia a dia (v1.3)

1. Abrir **http://127.0.0.1:8771/** (`Iniciar-EcoMaestro-API.bat`).
2. **Trabalhar neste projeto** → relatório + guia 1–2.
3. Concluir cada morador com **wizard** (PATCH → `output_payload`).
4. **Painel CEO** (`/painel.html`) — saúde do condomínio em JSON local.
5. Modo `file://` / autônomo = **fallback**, não fluxo principal.

Circuito fechado prioritário: **dLogica** (`analysis.*` → status `triaged`).

## Interface (3 blocos)

1. **Link do GitHub** — repositório existente.  
2. **Descrição** — projeto novo ou nova funcionalidade.  
3. **Relatório** — *O que precisa* + *Quem aplica* + confiança %.

**Modo autônomo:** `EcoMaestro-Autonomo.vbs` — sem servidor.

## Persistência

| Camada | Produção hoje | Upgrade opcional |
|--------|----------------|------------------|
| Demandas | `data/demands/*.json` | Postgres (`001`/`002` SQL) |
| UI | `localStorage` só histórico rápido (10 itens) | — |
| Painel CEO | `GET /api/dashboard` lê JSON | — |

## Exemplo completo

[exemplos/demanda-eco-maestro-v1-persistencia.json](exemplos/demanda-eco-maestro-v1-persistencia.json) — feature “persistir demandas no Postgres” percorrendo workbench → Cursor → Max.
