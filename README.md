# EcoMaestro v1.3

**Maestro do condomínio ECO** — *Ecossistema Coordenado de Operações* (`c:\_PROJETOS`).

## Como usar no dia a dia (modo recomendado)

1. **Duplo clique:** `Abrir-EcoMaestro.bat` ou `Iniciar-EcoMaestro-API.bat` → http://127.0.0.1:8771/
2. Escolha **seu projeto** → **Trabalhar neste projeto**
3. **1 — Abrir** o morador (amarelo) → faça o trabalho no app/IDE
4. **2 — Terminei este passo** → preencha o **wizard** (grava `output_payload`)
5. **Verificar adequação** → avance status quando os gates permitirem
6. **Painel CEO:** http://127.0.0.1:8771/painel.html — demandas abertas, status, paradas

Persistência real: `data/demands/*.json` (não é só navegador).

## Fallback offline (contingência)

Sem API — análise local limitada, sem painel nem salvar runs completos:

```text
EcoMaestro-Autonomo.vbs
```

Não use como fluxo principal se você quer jornada e painel.

## Nome e papel

| | |
|---|---|
| **Nome** | **EcoMaestro** |
| **Metáfora** | Síndico/orquestrador — não substitui moradores |
| **Pergunta** | *Quem entrega esta demanda e em que ordem?* |
| **v1.3** | Wizard + painel CEO + circuito dLogica prioritário |

## API local (`8771`)

```text
Iniciar-EcoMaestro-API.bat
```

| Endpoint | Uso |
|----------|-----|
| `POST /api/demands` | Criar demanda + plano |
| `PATCH /api/demands/:id/runs/:key` | Wizard → run done |
| `GET /api/dashboard` | KPIs painel CEO |
| `GET /api/demands/:id/adequacao` | Orquestrador |

Detalhes: [docs/API.md](docs/API.md) · PRD: [docs/PRD-v1.3.md](docs/PRD-v1.3.md)

## Verdade operacional (dados)

| Hoje | Planejado opcional |
|------|---------------------|
| JSON em `data/demands/` | Postgres via `DATABASE_URL` |
| Audit/learning locais | Supabase + RLS |

## Documentação

- [docs/MODELO-CONDOMINIO.md](docs/MODELO-CONDOMINIO.md)
- [docs/PRD-v1.3.md](docs/PRD-v1.3.md)
- [docs/ORQUESTRADOR-ADEQUACAO.md](docs/ORQUESTRADOR-ADEQUACAO.md)

## Repositório

[RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro)
