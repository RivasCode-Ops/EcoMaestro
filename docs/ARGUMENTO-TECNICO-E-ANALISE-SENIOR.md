# Argumento técnico + análise senior do EcoMaestro

> Para defender a arquitetura perante terceiros e para revisão de código.  
> Linguagem simples + rigor técnico.

---

## Parte 1 — Por que esta estrutura faz sentido

### 1.1 Problema que resolve (objetivo de negócio)

Em `c:\_PROJETOS` existem **dezenas de ferramentas** (IDE, governança, auditoria, produtos). Sem orquestração:

- pessoas misturam **definir**, **decidir**, **codar** e **auditar** no mesmo passo;
- ninguém sabe **por onde começar**;
- repetem trabalho e perdem histórico da demanda.

### 1.2 Tese arquitetural (uma frase)

**Orquestração separada de execução** — padrão conhecido como *control plane vs data plane*, *workflow engine vs workers*, ou *triage vs implementation*.

| Camada | No ECO | Analogia |
|--------|--------|----------|
| **Control plane** | EcoMaestro | Síndico: quem entra, em que ordem |
| **Workers** | dLogica, workbench, Cursor, Max | Moradores que executam |
| **Artifacts** | `data/demands/`, payload v1 | Ata de reunião / contrato |

### 1.3 Por que NÃO unificar num só app

| Unificar | Consequência |
|----------|--------------|
| Um “super-app” com 40 botões | Perde essência; usuário perdido (você pediu explicitamente para evitar isso) |
| Eco gerar código | Duplica Cursor; dois lugares de verdade |
| Eco substituir workbench | Perde kits 00–50 e trilhas maduras |

**Argumento:** o Eco **reduz entropia na entrada** sem **absorver** as especializações já existentes.

### 1.4 Por que 4 portas (e não 2 ou 10)

Ordem fixa **dLogica → workbench → Cursor → Max** espelha cadeia real de entrega de software:

1. Entender problema  
2. Decidir escopo/método  
3. Implementar  
4. Verificar saúde técnica  

Extras (Cortana, FREEDOM) entram **só por intent** — evita tela cheia.

### 1.5 Por que API local + JSON (e não só “IA no chat”)

| Decisão | Motivo |
|---------|--------|
| `127.0.0.1:8771` | Zero deploy; dados no PC |
| Persistência JSON | Auditável, diffável, backup simples |
| Classificação por regras | Previsível, testável (`test-orchestrator.mjs`) |
| Gates 422 | Impede jornada inválida (pedido vago, ordem errada) |

LLM pode ser camada futura; **não é requisito** para o MVP do gestor de jornada.

### 1.6 Resposta a objeções comuns

| Objeção | Resposta |
|---------|----------|
| “Mais um app para aprender” | Um único ponto de entrada (`Abrir-EcoMaestro.bat`); resto é link |
| “Cursor já faz tudo” | Cursor executa; não guarda contrato multi-ferramenta nem ordem do condomínio |
| “Planilha resolve” | Planilha não abre workbench/D00 nem valida gates |
| “É só if/else” | Sim — **workflow explícito** é feature, não defeito, em v1 |
| “Não integra com Git” | Integração é no **Cursor**; Eco aponta pasta + remote detectado |

---

## Parte 2 — Análise senior do código (objetiva)

### 2.1 Arquitetura de módulos (nota: **B+**)

```text
server.mjs          → HTTP, CORS, rotas /api e /p/
app.mjs             → UI (só browser-safe)
lib/router.mjs        → classificação + relatório (núcleo de negócio)
lib/demand-orchestrator.mjs → adequação + gates
lib/projetos-scan.mjs → inventário _PROJETOS
lib/storage-json.mjs  → persistência demandas
lib/verify-links.mjs  → sem fs (correto para browser)
lib/verify-links-node.mjs → fs no servidor (opcional futuro)
```

**Ponto forte:** separação UI / API / domínio / persistência.  
**Ponto fraco:** `app.mjs` grande (~1000 linhas) — candidato a split UI/presenter.

### 2.2 Fluxo de dados (nota: **A-**)

```text
POST /api/demands
  → analyzeDemand()
  → validateDemandSave()  [bloqueia desalinhado]
  → createDemand() → data/demands/{uuid}.json
  → resposta inclui report + runs + orchestration
```

Coerente e testável.

### 2.3 Bugs / bloqueios conhecidos (honestidade técnica)

| ID | Severidade | Problema | Efeito | Correção sugerida |
|----|------------|----------|--------|-------------------|
| P0 | Alta | `Marcar concluído` grava só `ui_note` | Gates `analysis.*`, `plan.*` nunca preenchem; `completed` bloqueado forever | Mini-form por morador ao concluir run |
| P1 | Média | Docs/README citam porta 8770 em alguns trechos | Confusão operador | Alinhar docs para 8771 |
| P1 | Média | Eco não passa contexto ao Cursor | UX esperava automação | Botão “Copiar pacote Cursor” |
| P2 | Baixa | `storage-pg` parcial vs JSON | Postgres incompleto em filtros | Paridade API ou desabilitar PG até pronto |
| P2 | Baixa | Classificação só keywords | Frases atípicas falham | Opcional LLM + manter gates |
| P2 | Baixa | Scan git lento (N pastas × git) | Primeira carga ~15s | Cache já existe 30s; OK |

**Nenhum P0 de segurança** identificado (path traversal mitigado em `/p/` e scaffold).

### 2.4 Segurança (nota: **B**)

- `/p/` normaliza e bloqueia `..`  
- API só local por padrão  
- Sem secrets no repo  
- `force: true` na API para bypass — documentar como perigo operacional  

### 2.5 Testes (nota: **B-**)

| Script | Cobre |
|--------|--------|
| `test-links.mjs` | 16 links moradores |
| `test-orchestrator.mjs` | save + completed gate |
| `test-all-moradores.mjs` | intents amostra |

**Falta:** testes automatizados HTTP (supertest) e E2E UI — aceitável para v1 local.

### 2.6 Manutenibilidade (nota: **B+**)

- Contratos documentados (`CONTRATOS-MORADORES.md`)  
- Intents extensíveis em `KW[]`  
- Commits atômicos no GitHub  
- Memória generativa para outros agentes  

---

## Parte 3 — Explicação simples (para não técnico)

**EcoMaestro é a recepção do condomínio de programas.**

Você diz qual apartamento (XAXA, FREEDOM) e o que quer fazer. A recepção entrega uma **lista ordenada**: primeiro workbench, depois Cursor, etc. Ela **não entra no apartamento a mexer nas coisas** — só anota o que foi combinado e se você seguiu o combinado.

---

## Parte 4 — Correções prioritárias (se continuar desenvolvimento)

1. **Wizard de conclusão de run** — desbloqueia jornada real até `completed`.  
2. **Copiar para Cursor** — pasta + trecho D00 + demanda em um clique.  
3. **Unificar documentação** — porta 8771, fluxo Eco→Cursor.  
4. **Teste HTTP** — `POST /demands` → 422 quando descrição vaga.  

---

## Parte 5 — Veredito senior

| Critério | Nota | Comentário |
|----------|------|------------|
| Adequação ao problema | **9/10** | Resolve triagem e jornada melhor que planilha solta |
| Arquitetura | **8/10** | Separação correta; falta worker forms |
| Código UI | **7/10** | Funcional; `app.mjs` monolítico |
| Código API | **8/10** | Claro, extensível |
| UX gestor jornada | **7/10** | Melhorou muito com Trabalhar + amarelo + projeto ativo |
| Pronto produção | **6/10** | Pronto **teste operacional local**; não SaaS |

**Conclusão:** estrutura **defensável e correta** como gestor de jornada v1. Limitações são **de automação entre ferramentas**, não de modelo errado.

---

*Ver também: [INDICE-PEDIDOS-E-INSTRUCOES.md](INDICE-PEDIDOS-E-INSTRUCOES.md) · [MEMORIA-GENERATIVA-ECOSSISTEMA.md](MEMORIA-GENERATIVA-ECOSSISTEMA.md)*
