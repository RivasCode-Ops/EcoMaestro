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

Opcional (servidor `127.0.0.1:8770`):

```text
Iniciar-EcoMaestro.bat
Parar-EcoMaestro.bat
```

## Entrada do ecossistema

Use o EcoMaestro **antes** do fluxo fixo de 4 portas quando a demanda ainda não está classificada.

1. **EcoMaestro** — roteia  
2. **dLogica → workbench → Cursor → Max** — executa (ordem sugerida pelo maestro)  
3. **Extras** — Cortana, FREEDOM, CONSORCIO, etc., só se o plano indicar  

## Documentação

- [docs/ANALISE-FUNCIONAL.md](docs/ANALISE-FUNCIONAL.md) — **análise de funcionalidade completa (teste)**  
- [docs/MODELO-CONDOMINIO.md](docs/MODELO-CONDOMINIO.md) — regras de roteamento  
- Índice GitHub: [workbench — inspirações ecossistema](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md)

## Repositório

[RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro)
