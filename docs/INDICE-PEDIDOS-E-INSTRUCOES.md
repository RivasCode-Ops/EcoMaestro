# Índice enumerado — pedidos, perguntas e instruções do usuário

> Sessão de evolução do ecossistema `_PROJETOS` (EcoMaestro + FREEDOM + workbench).  
> Transcrição: [agent-transcripts](https://cursor.com) · Repo: [RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro)

---

## A. Perguntas (o usuário queria entender)

| # | Pergunta (resumo) | Resposta / entrega |
|---|-------------------|------------------|
| A1 | Repos GitHub, commit/push, apps fora do eco | Mapeamento repos; EcoMaestro como orquestrador central |
| A2 | Modo autônomo vs API, instalador | `EcoMaestro-Autonomo.vbs` + `Iniciar-EcoMaestro-API.bat` + atalhos barra |
| A3 | workbench vs Cursor rules vs apps sobrepostos | Doc `ECO-APPS-E-SOBREPOSICOES.md`; Cursor-Kit genérico |
| A4 | Lista de projetos não carrega / só 3 pastas | Fix `verify-links` sem `fs` no browser; scan API; remoção script emergência |
| A5 | Links brancos em `:8771` | Rotas `/p/` + `eco-href.mjs` |
| A6 | Só “projeto novo” e condomínio — onde estão meus apps? | Seletor produtos primeiro; moradores fora do select principal |
| A7 | Prompt SRE/backup — qual morador do eco? | Intent `infra_resiliencia`; workbench `04-INFRAESTRUTURA` |
| A8 | Abrir guia (XAXA) — Cursor como sabe o projeto? | Eco não injeta no Cursor; pasta + D00 manual; bloco **Projeto ativo** |
| A9 | Barra de tarefas — Eco antes ou depois da pasta? | Recomendado: **Eco → Cursor**; `Abrir-EcoMaestro.bat` |
| A10 | Analisar Eco como gestor de jornada antes de fechar teste | `JORNADA-GESTOR-AUDITORIA.md` |
| A11 | Se questionarem a estrutura — argumento técnico? | `ARGUMENTO-TECNICO-E-ANALISE-SENIOR.md` §1 |
| A12 | Explicar janela workbench README coding diário | D00 primeiro; Eco não executa código |

---

## B. Pedidos de implementação (faça / aplique / sim)

| # | Pedido (resumo) | O que foi feito |
|---|-----------------|-----------------|
| B1 | Criar EcoMaestro que comanda o condomínio (nome + descrição ou link) | Repo `EcoMaestro`, UI 3 blocos, `router.mjs` |
| B2 | UI: link GitHub + descrição + relatório quem aplica | `index.html` + `analyzeDemand` |
| B3 | Modo autônomo sem instalar nada | `EcoMaestro-Autonomo.vbs`, análise offline |
| B4 | Análise funcional detalhada | `docs/ANALISE-FUNCIONAL.md` |
| B5 | API REST + Postgres opcional | `server.mjs` `:8771`, `storage-json` / `storage-pg` |
| B6 | Estados, contratos, fluxos (feedback externo) | `CONTRATOS-MORADORES`, `ESTADOS-E-FLUXOS`, SQL spec |
| B7 | Pasta em `_PROJETOS` sem digitar GitHub; Atualizar lista | `GET /api/projects`, `projetos-scan.mjs`, seletor |
| B8 | Projeto novo — criar pasta / scaffold | `POST /api/projects/scaffold`, botão Criar pasta |
| B9 | Cursor-Kit + workbench nas 4 portas | `cursor-kit.mjs`, bloco na UI |
| B10 | Corrigir lista / links / reiniciar API | Vários fixes; `test-links.mjs` |
| B11 | Orquestrador adequação (pedido vs execução) | `demand-orchestrator.mjs`, gates, UI |
| B12 | Rules/skills continuidade; sem skill SRE extra se eco cobre | `eco-demandas-continuidade.mdc`, `PROMPT-CONTINUIDADE` |
| B13 | Botão Trabalhar; não só selecionar pasta | `btnTrabalhar`, duplo clique, guia 1-2 |
| B14 | Leitura fácil / astigmatismo; botões amarelos | `modo-facil`, `btn-grande` |
| B15 | Projeto ativo visível (XAXA) | Banner + título = pasta |
| B16 | Atalho barra + `?project=` | `Abrir-EcoMaestro.bat`, `Criar-atalho-Barra-de-Tarefas.bat` |
| B17 | Documentar jornada gestor + roteiro teste | `JORNADA-GESTOR-AUDITORIA.md` |
| B18 | Este índice + memória generativa + análise senior | Este arquivo + `MEMORIA-GENERATIVA-ECOSSISTEMA.md` |

---

## C. Instruções / preferências do usuário (como trabalhar)

| # | Instrução | Como o sistema respeita |
|---|----------|-------------------------|
| C1 | Não unificar tudo num app — não perder essência | Eco só roteia; não codifica |
| C2 | Não tela cheia de opções | 4 portas + extras sob demanda |
| C3 | Não digitar repositório GitHub toda vez | Scan `git remote` por pasta |
| C4 | Não commit/push sem pedir | Regra do agente |
| C5 | Trabalhar em app existente vs projeto novo | `__new__` separado; intent `feature_nova` vs `ideia_nova` |
| C6 | Se eco cobre SRE/backup, não criar skill redundante | Intent + workbench infra |
| C7 | Preferência por explicação simples | Docs em PT-BR, UI com guia 1-2 |
| C8 | Independente local quando possível | API local; fallback offline |
| C9 | Eco na barra; gestor de jornada | Atalhos + orquestrador + demandas JSON |

---

## D. Pedidos relacionados (FREEDOM / ecossistema — mesma sessão)

| # | Pedido | Onde ficou |
|---|--------|------------|
| D1 | FREEDOM funcionar local sem Cursor | `FREEDOM/Iniciar-FREEDOM.bat`, servidor `:8765` |
| D2 | Pitch deck + inventário portas HTML | `FREEDOM/pitch-deck.html`, `_PROJETOS/inventario-projetos.html` |
| D3 | Página 4 portas anti-confusão | `_PROJETOS/ecossistema.html`, `ECOSSISTEMA.md` |
| D4 | Max `:3847` erro | Diagnóstico Max (fora do EcoMaestro) |
| D5 | Comparar Max, Cortana, workbench — unificar? | Não unificar; Eco roteia; doc comparativo |

---

## E. Commits GitHub EcoMaestro (referência rápida)

| Commit | Tema |
|--------|------|
| `ee51d54` | API REST + persistência |
| `8c3cb50` | Seletor pastas + GitHub auto |
| `4e48e80` | Links `/p/` |
| `fd34e95` | UI browser + lista completa |
| `ef39138` | Orquestrador adequação |
| `1b7569d` | Gates bloqueio |
| `2f8bf21` | UI acessível + Trabalhar |
| `a86ab4b` | Barra tarefas + `?project=` |
| `346b808` | Auditoria gestor jornada |

---

*Atualizar este índice quando houver nova rodada de pedidos.*
