# EcoMaestro

**Maestro do condomínio ECO** — *Ecossistema Coordenado de Operações* (`c:\_PROJETOS`).

Você informa:

1. **Link do GitHub** (repositório existente)  
2. **Descrição** — projeto novo ou nova funcionalidade  

O **relatório** responde **o que precisa** e **quem do condomínio aplica** (com destaque *Comece aqui*).

## Nome e papel

| | |
|---|---|
| **Nome** | **EcoMaestro** |
| **Metáfora** | Síndico/orquestrador do condomínio — não substitui os moradores (cada app mantém sua essência) |
| **Pergunta** | *Quem entrega esta demanda e em que ordem?* |
| **Não é** | Um monólito com todas as funções; não unifica telas |

## Uso local (autônomo — recomendado)

Não precisa de servidor, PowerShell, Node, Cursor nem outro app para **abrir e analisar**:

```text
Duplo clique:  EcoMaestro-Autonomo.vbs
ou:            Iniciar-EcoMaestro-Autonomo.bat
ou na raiz:    c:\_PROJETOS\Abrir-EcoMaestro.bat
```

Funciona **offline** (`file://`). O relatório roda só no navegador.

Opcional (servidor estático `127.0.0.1:8770`):

```text
Iniciar-EcoMaestro.bat
Parar-EcoMaestro.bat
```

## API + persistência (recomendado para salvar demandas)

```text
Iniciar-EcoMaestro-API.bat    →  http://127.0.0.1:8771/
ou:  npm start
Parar-EcoMaestro-API.bat
```

- `POST /api/demands` — mesmo motor de análise da UI (`github_url`, `description`)
- Persistência em `data/demands/` (JSON); Postgres opcional com `DATABASE_URL`
- Detalhes: [docs/API.md](docs/API.md)

A UI em `:8771` tenta a API primeiro; no modo autônomo (`file://`) usa análise local se a API estiver offline.

## Entrada do ecossistema

Use o EcoMaestro **antes** do fluxo fixo de 4 portas quando a demanda ainda não está classificada.

1. **EcoMaestro** — roteia  
2. **dLogica → workbench → Cursor → Max** — executa (ordem sugerida pelo maestro)  
3. **Extras** — Cortana, FREEDOM, CONSORCIO, etc., só se o plano indicar  

## Documentação

- [docs/ANALISE-FUNCIONAL.md](docs/ANALISE-FUNCIONAL.md) — análise de funcionalidade (teste)  
- [docs/MODELO-CONDOMINIO.md](docs/MODELO-CONDOMINIO.md) — modelo do condomínio (v2)  
- [docs/CONTRATOS-MORADORES.md](docs/CONTRATOS-MORADORES.md) — JSON entrada/saída por morador  
- [docs/ESTADOS-E-FLUXOS.md](docs/ESTADOS-E-FLUXOS.md) — estados + jornada UI/API  
- [docs/API.md](docs/API.md) — REST (`/api/demands`, health, PATCH status)  
- [docs/exemplos/demanda-eco-maestro-v1-persistencia.json](docs/exemplos/demanda-eco-maestro-v1-persistencia.json) — exemplo completo  
- [db/migrations/001_ecomaestro_core.sql](db/migrations/001_ecomaestro_core.sql) — schema Postgres  
- Índice GitHub: [workbench — inspirações ecossistema](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md)

## Repositório

[RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro)
