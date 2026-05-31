# Índice enumerado — pedidos, perguntas e instruções do usuário

> Registro vivo do que você pediu ao agente sobre o ecossistema `_PROJETOS`.  
> **Última atualização:** 2026-05-30 · Repo: [RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro) · commit `230d423`

---

## Como usar este arquivo

| Seção | Conteúdo |
|-------|----------|
| **A** | Perguntas (“como funciona?”, “por quê?”) |
| **B** | Pedidos de fazer / implementar |
| **C** | Preferências e regras de trabalho |
| **D** | Pedidos em outros repos (FREEDOM, etc.) |
| **E** | Commits GitHub (rastreio) |
| **F** | Rodada enterprise + segurança (maio/2026) |

---

## A. Perguntas (o usuário queria entender)

| # | Pergunta (resumo) | Resposta / entrega |
|---|-------------------|------------------|
| A1 | Repos GitHub, commit/push, apps fora do eco | Mapeamento repos; EcoMaestro como orquestrador central |
| A2 | Modo autônomo vs API, instalador | `EcoMaestro-Autonomo.vbs` + `Iniciar-EcoMaestro-API.bat` + atalhos barra |
| A3 | workbench vs Cursor rules vs apps sobrepostos | `docs/ECO-APPS-E-SOBREPOSICOES.md`; Cursor-Kit genérico |
| A4 | Lista de projetos não carrega / só 3 pastas | Fix `verify-links` sem `fs` no browser; scan API |
| A5 | Links brancos em `:8771` | Rotas `/p/` + `eco-href.mjs` |
| A6 | Só “projeto novo” — onde estão meus apps? | Seletor produtos primeiro; moradores fora do select |
| A7 | Prompt SRE/backup — qual morador? | Intent `infra_resiliencia`; workbench infra |
| A8 | Cursor como sabe o projeto (XAXA)? | Eco não injeta no IDE; banner **Projeto ativo** + pasta + D00 |
| A9 | Eco na barra — antes ou depois da pasta? | **Eco → Cursor**; `Abrir-EcoMaestro.bat` |
| A10 | Eco como gestor de jornada | `JORNADA-GESTOR-AUDITORIA.md` |
| A11 | Argumento se questionarem a estrutura | `ARGUMENTO-TECNICO-E-ANALISE-SENIOR.md` |
| A12 | Tela workbench README vs app certo | D00 no workbench; Eco só orquestra |
| A13 | O que será RAG/LLM/enterprise **no Eco**? | Explicação: síndico + portaria + memória local; `ENTERPRISE-IMPLEMENTADO.md` |
| A14 | Dependências não usadas, rotas sem guard, LGPD cross-tenant | `AUDITORIA-SEGURANCA-EXECUCAO.md` + `api-guard.mjs` |
| A15 | Como ficaria Eco enterprise + RAG + loop aprendizado | `ROADMAP-ENTERPRISE-RAG-LLM.md` (fases E0–E4) |

---

## B. Pedidos de implementação (faça / aplique / sim)

| # | Pedido (resumo) | Status | O que foi feito |
|---|-----------------|--------|-----------------|
| B1 | EcoMaestro comanda condomínio (nome + descrição ou link) | ✅ | Repo, UI, `router.mjs` |
| B2 | UI: GitHub + descrição + quem aplica | ✅ | `index.html`, relatório 3 blocos |
| B3 | Modo autônomo sem instalar | ✅ | `.vbs` + fallback offline |
| B4 | Análise funcional detalhada | ✅ | `ANALISE-FUNCIONAL.md` |
| B5 | API REST + Postgres opcional | ✅ | `:8771`, JSON + `storage-pg` |
| B6 | Estados, contratos, fluxos | ✅ | `CONTRATOS-MORADORES`, SQL `001` |
| B7 | Lista pastas sem digitar GitHub | ✅ | `projetos-scan`, seletor, Atualizar |
| B8 | Criar pasta projeto novo | ✅ | `POST /api/projects/scaffold` |
| B9 | Cursor-Kit + workbench nas 4 portas | ✅ | `cursor-kit.mjs`, UI |
| B10 | Corrigir lista / links | ✅ | `test-links.mjs` 16/16 |
| B11 | Orquestrador adequação + gates | ✅ | `demand-orchestrator.mjs` |
| B12 | Rules continuidade; sem skill SRE duplicada | ✅ | `eco-demandas-continuidade.mdc` |
| B13 | Botão **Trabalhar neste projeto** | ✅ | Não só selecionar pasta |
| B14 | Leitura fácil / botões amarelos | ✅ | `modo-facil`, guia 1–2 |
| B15 | Projeto ativo visível (ex. XAXA) | ✅ | Banner + caminho completo |
| B16 | Atalho barra + `?project=` | ✅ | `.bat` atalho |
| B17 | Jornada gestor + roteiro teste | ✅ | `JORNADA-GESTOR-AUDITORIA.md` |
| B18 | Índice pedidos + memória + análise senior | ✅ | Este arquivo + docs § |
| B19 | Executar auditoria: deps, auth guard, LGPD | ✅ | `audit-security.mjs`, `api-guard`, tenant |
| B20 | **Faça tudo** enterprise (RAG + LLM + wizard) | ✅ | Pacote completo abaixo |
| B21 | Commit + push GitHub | ✅ | `230d423` em `main` |
| B22 | Feedback “corrigir classificação” na UI | ✅ | Select intent + `POST /api/learning/feedback` |
| B23 | Atualizar arquivo de demandas | ✅ | Esta revisão (2026-05-30) |

### Detalhe do pacote enterprise (B20)

| Item | Arquivo / rota |
|------|----------------|
| Auth + tenant | `lib/api-guard.mjs`, `.env.example`, painel Enterprise na UI |
| Wizard gates | `lib/run-wizard.mjs`, dialog `#ecoWizardModal` |
| RAG local | `lib/rag-store.mjs`, `data/rag/index.json`, `npm run index:rag` |
| LLM Ollama | `lib/llm-ollama.mjs`, enrich em `POST /api/demands` |
| Loop aprendizado | `lib/learning-store.mjs`, `data/learning/` (local) |
| Audit log | `lib/audit-log.mjs`, `data/audit.log.jsonl` |
| Copiar pacote Cursor | Botão **Copiar pacote Cursor** |
| Doc uso | `ENTERPRISE-IMPLEMENTADO.md` |

---

## C. Instruções / preferências do usuário (como trabalhar)

| # | Instrução | Como o sistema respeita |
|---|----------|-------------------------|
| C1 | Não unificar tudo num app | Eco só roteia; moradores mantêm essência |
| C2 | Não tela cheia de opções | 4 portas + extras por intent |
| C3 | Não digitar GitHub toda vez | Scan `git remote` |
| C4 | Não commit/push sem pedir | Só após você dizer **sim** (ex. `230d423`) |
| C5 | App existente vs projeto novo | `__new__` · `feature_nova` vs `ideia_nova` |
| C6 | SRE/backup via eco, sem skill extra | `infra_resiliencia` |
| C7 | Explicação simples | PT-BR, guia 1–2, docs curtos |
| C8 | Funcionar local sem nuvem | `127.0.0.1`, RAG/LLM opcionais locais |
| C9 | Eco na barra = gestor de jornada | Atalho + demandas JSON + wizard |
| C10 | LGPD / não misturar “clientes” | `tenant_id` + filtro list/get |
| C11 | Gates honestos até `completed` | Wizard exige `output_payload` real |

---

## D. Pedidos relacionados (FREEDOM / ecossistema — mesma sessão)

| # | Pedido | Onde ficou |
|---|--------|------------|
| D1 | FREEDOM local sem Cursor | `FREEDOM/Iniciar-FREEDOM.bat` `:8765` |
| D2 | Pitch + inventário HTML | `pitch-deck.html`, `inventario-projetos.html` |
| D3 | Página 4 portas | `ecossistema.html`, `ECOSSISTEMA.md` |
| D4 | Max `:3847` erro | Diagnóstico separado (Max) |
| D5 | Unificar Max/Cortana/workbench? | Não; Eco roteia |

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
| **`230d423`** | **Enterprise: RAG, LLM, wizard, auth/tenant, docs, feedback intent** |

---

## F. Rodada enterprise + segurança (resumo executivo)

### Você pediu (texto livre → ação)

1. *“Execute e analise: dependências não utilizadas, 2 rotas sem auth guard, vazamento LGPD cross-tenant”*  
   → Auditoria + correções: `api-guard`, tenant, deny-list `/p/`, doc `AUDITORIA-SEGURANCA-EXECUCAO.md`

2. *“Como seria Eco enterprise com RAG local e LLM com loop de aprendizado”*  
   → Roadmap `ROADMAP-ENTERPRISE-RAG-LLM.md` + implementação E0/E1 em código

3. *“O que isso vai ser no Eco”*  
   → Resposta produto: recepção + portaria + memória; sem substituir Cursor

4. *“Faça tudo”*  
   → RAG (124 chunks), Ollama hook, wizard, audit, learning, UI enterprise

5. *“Sim”* (commit + feedback)  
   → Push `230d423` + UI **Corrigir classificação**

6. *“Atualize o meu arquivo de demandas”*  
   → Este arquivo (seção F + B19–B23)

### Pendências conscientes (não bloqueiam PC único)

| Item | Nota |
|------|------|
| UI não envia API key sozinha | Preencher painel Enterprise se `ECOMAESTRO_API_KEY` no servidor |
| Ollama offline | Intent só por regras + RAG; `ollama pull llama3.2` opcional |
| RLS Postgres | Migration `002` pronta; ativar no Supabase se multi-tenant SaaS |
| Re-analisar após corrigir intent | Hoje só grava aprendizado; reabrir demanda ou nova análise manual |

---

## Documentos irmãos (memória para outros projetos)

| Arquivo | Uso |
|---------|-----|
| [MEMORIA-GENERATIVA-ECOSSISTEMA.md](MEMORIA-GENERATIVA-ECOSSISTEMA.md) | Colar no início de sessões Cursor |
| [ARGUMENTO-TECNICO-E-ANALISE-SENIOR.md](ARGUMENTO-TECNICO-E-ANALISE-SENIOR.md) | Defender arquitetura |
| [ENTERPRISE-IMPLEMENTADO.md](ENTERPRISE-IMPLEMENTADO.md) | Como usar RAG/LLM/wizard hoje |
| [JORNADA-GESTOR-AUDITORIA.md](JORNADA-GESTOR-AUDITORIA.md) | Teste da jornada |

---

*Próxima atualização: acrescentar linha em B/E/F quando houver novo pedido seu.*
