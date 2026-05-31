# Análise funcional — EcoMaestro

> **Documento:** especificação para teste e validação de funcionalidade  
> **Versão:** 1.0 · **Data:** 2026-05-30  
> **Repositório:** [RivasCode-Ops/EcoMaestro](https://github.com/RivasCode-Ops/EcoMaestro)  
> **Relacionados:** [MODELO-CONDOMINIO.md](MODELO-CONDOMINIO.md) · [workbench — inspirações ecossistema](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md)

---

## 1. Identificação

| Item | Valor |
|------|--------|
| **Nome do produto** | EcoMaestro |
| **Sigla ECO** | Ecossistema Coordenado de Operações |
| **Tipo** | Aplicação web local (single-page), orquestrador de demandas |
| **Metáfora** | Maestro / síndico de um **condomínio de aplicações inteligentes** — cada app é um “morador” com uma pergunta única |
| **Pasta local** | `c:\_PROJETOS\EcoMaestro` |
| **Porta opcional** | `8770` (modo servidor; **não obrigatório**) |
| **Modo recomendado** | **Autônomo** — abre `index.html` direto no navegador, sem dependências |

### 1.1 Problema que resolve

No ecossistema `_PROJETOS` existem várias ferramentas (dLogica, workbench, Cursor, Max Stack, Cortana, FREEDOM, produtos diversos). Quem não conhece o fluxo:

- não sabe **por onde começar**;
- mistura **definição**, **governança**, **código** e **auditoria** no mesmo passo;
- não sabe **qual app entrega** cada parte da demanda.

O EcoMaestro **não executa** o trabalho dos outros apps. Ele **analisa a demanda** e produz um **relatório**: o que precisa ser feito e **quem do condomínio aplica**, com um responsável destacado (**Comece aqui**).

### 1.2 Objetivo funcional

Permitir que o usuário informe:

1. **Link do GitHub** (repositório existente, opcional); e/ou  
2. **Descrição** da demanda (projeto novo, nova funcionalidade ou outro pedido);

e obtenha, **sem instalar nada além do próprio EcoMaestro**, um plano legível de entrega no condomínio.

### 1.3 Princípios de produto (anti-confusão)

1. **Uma pergunta por ferramenta** — cada morador responde uma coisa só.  
2. **Não unificar apps** — o maestro roteia; não vira monólito.  
3. **Comece aqui** — sempre há um aplicador principal; os demais são “Depois”.  
4. **Autonomia** — análise e relatório funcionam offline no navegador.  
5. **Abrir outros apps é opcional** — links para Max/FREEDOM/etc. só quando o usuário quiser executar.

---

## 2. Contexto do ecossistema

### 2.1 Fluxo canônico (após o maestro)

```text
Passo 0  EcoMaestro     →  Quem entrega esta demanda?
Passo 1  dLogica        →  O que precisa virar?
Passo 2  workbench      →  O que foi decidido / direção oficial?
Passo 3  Cursor         →  Como implementar o escopo aprovado?
Passo 4  Max Stack      →  Como está o código do repositório?
Extra    Cortana         →  Pesquisa na web (só se o plano indicar)
Produtos FREEDOM, geogrowth, CONSORCIO, etc. →  quando o tema for o produto em si
```

### 2.2 Papel do EcoMaestro vs demais ferramentas

| Ferramenta | Executa trabalho? | EcoMaestro |
|------------|-------------------|------------|
| dLogica | Sim (definição) | Indica **quando** usar |
| workbench | Sim (governança) | Indica **kit/etapa** (ex.: 20-ENTREGA, 50-CORRECAO) |
| Cursor | Sim (código) | Indica pasta/repo; não abre a IDE |
| Max | Sim (auditoria) | Monta URL com `?repo=` se houver GitHub |
| Cortana / FREEDOM / complementos | Sim | Aparecem só se a intenção pedir |

---

## 3. Modos de operação

### 3.1 Modo autônomo (padrão para teste)

| Aspecto | Comportamento |
|---------|----------------|
| **Como abrir** | `EcoMaestro-Autonomo.vbs`, `Iniciar-EcoMaestro-Autonomo.bat` ou `c:\_PROJETOS\Abrir-EcoMaestro.bat` |
| **Tecnologia** | Navegador abre `file:///.../EcoMaestro/index.html` |
| **Dependências** | Windows + navegador padrão; **sem** Node, npm, PowerShell servidor, Cursor |
| **Rede** | Análise **offline**; links externos (GitHub, docs) só ao clicar **Abrir** |
| **Indicador UI** | Faixa **Modo autônomo** (ponto verde animado) |

### 3.2 Modo servidor (opcional)

| Aspecto | Comportamento |
|---------|----------------|
| **Como abrir** | `Iniciar-EcoMaestro.bat` |
| **URL** | `http://127.0.0.1:8770/` |
| **Tecnologia** | `Servidor-local.ps1` (HttpListener PowerShell) |
| **Parar** | `Parar-EcoMaestro.bat` ou fechar janela do servidor |
| **Uso** | Útil se `file://` for bloqueado por política do navegador |

---

## 4. Interface — especificação funcional

### 4.1 Estrutura da tela (3 blocos + auxiliares)

#### Bloco A — Entrada (card principal)

| Campo | ID | Obrigatório | Descrição |
|-------|-----|-------------|-----------|
| Link do GitHub | `linkGh` | Não* | URL `github.com/org/repo`; extrai org, repo e URL do Max |
| Descrição da demanda | `desc` | Não* | Texto livre: projeto novo, nova funcionalidade, auditar, FIRE, etc. |

\* Pelo menos **um** dos dois deve estar preenchido; senão alerta e não gera relatório.

**Ações:**

- **Analisar demanda** — dispara roteamento e exibe relatório.  
- **Limpar** — zera campos e oculta relatório.

#### Bloco B — Relatório (card `report`, exibido após análise)

| Seção | ID | Conteúdo |
|-------|-----|----------|
| Título do projeto | `tituloProjeto` | `org/repo` do GitHub, ou pasta do catálogo, ou primeira linha da descrição + sufixo `· projeto novo` / `· nova funcionalidade` |
| **O que precisa** | `listaPrecisa` | Lista `<ul>` de necessidades conforme **intenção** detectada |
| **Quem aplica no condomínio** | `listaAplica` | Cards por aplicador: badge, nome, rótulo humano, texto do que faz, botão **Abrir** |
| Confiança | `confianca` | Percentual heurístico (40–95%) |

**Badge por aplicador:**

- **Comece aqui** — aplicador principal (`plan.primary`).  
- **Depois** — demais na ordem lógica.

#### Bloco C — Histórico (opcional)

| Item | Comportamento |
|------|----------------|
| Armazenamento | `localStorage` chave `ecomaestro_demands_v2`, até 10 itens |
| Exibição | Lista clicável; ao clicar, restaura link + descrição e reexecuta análise |

### 4.2 Mensagens e estados

| Estado | Condição | UI |
|--------|----------|-----|
| Inicial | Página carregada | Relatório oculto; histórico se houver dados |
| Erro entrada | Ambos campos vazios | `alert()` pedindo link e/ou descrição |
| Relatório pronto | Análise OK | Card relatório visível (`#relatorio.on`) |
| Autônomo | `protocol === file:` ou host `127.0.0.1:8770` | Faixa modo autônomo visível |

---

## 5. Processamento — regras de negócio

### 5.1 Pipeline de análise

```text
Entrada (link + descrição)
    → parseGithub(link)        → org, repo, maxUrl
    → detectTipoDemanda(desc)  → novo | feature | null
    → classify(desc, gh)       → intent, moradores[], extras[], primary, wb, cat
    → NEEDS_BY_INTENT[intent]  → lista "O que precisa"
    → buildAplicadores(plan)   → lista "Quem aplica" ordenada
    → saveDemand (localStorage)
    → render na tela
```

### 5.2 Parser de link GitHub

- Regex: `github.com/{org}/{repo}`.  
- Remove sufixo `.git` do nome do repo.  
- Gera `maxUrl`: `http://127.0.0.1:3847/?repo=https://github.com/{org}/{repo}`.

### 5.3 Catálogo de projetos (reconhecimento por nome)

Texto (descrição + slug do repo) é comparado a aliases, por exemplo:

| Aliases | App / pasta |
|---------|-------------|
| freedom, freedom4 | FREEDOM |
| geogrowth | geogrowth |
| max-coding, max stack | Max |
| cortana | Cortana |
| consorcio | CONSORCIO |
| recuperacao | Recuperacao_Financeira |
| arbilocal | ARBILOCAL |
| simulador, moto | Simulador-Troca-Moto |
| workbench, dlogica | respectivos |

### 5.4 Classificação por palavras-chave (PT)

Motor **determinístico** (não é LLM). Cada regra tem `keys[]`, `intent`, opcionalmente `moradores`, `extras`, `wb`, `tipo`.

**Ordem de desempate:** maior pontuação (cada keyword encontrada +2).

**Regras principais:**

| Intenção | Palavras-gatilho (exemplos) | Primary (Comece aqui) | Moradores típicos | Extras |
|----------|----------------------------|------------------------|-------------------|--------|
| `ideia_nova` | projeto novo, do zero, ideia nova | dLogica | dLogica → workbench → Cursor → Max | — |
| `feature_nova` | nova funcionalidade, implementar, melhoria | workbench | workbench → Cursor → Max | — |
| `auditar` | auditar, raio-x, health, antes do pr | Max | Max → workbench | — |
| `correcao_rapida` | bug urgente, hotfix, quebrou | workbench | workbench (50) → Cursor → Max | — |
| `pesquisar` | pesquisar, mercado, concorrentes | Cortana | workbench | cortana |
| `fire` | fire, independência, swr, coast | FREEDOM | — | freedom |
| `financeiro_real` | consórcio, dívida, recuperação | CONSORCIO ou Recuperação | workbench | consorcio / recuperacao |
| `comercial` | fornecedor, revenda, comercial | ARBILOCAL | workbench | arbilocal, cortana |
| `gasto_bem` | moto, troca de moto, veículo | Simulador Moto | — | simMoto, freedom |

**Fallbacks:**

- Sem match forte + link GitHub sem descrição → tende `feature_nova`.  
- Sem match + sem link → `ideia_nova` (fluxo completo 4 moradores).  
- Descrição com “auditar” + link → força `auditar`.

### 5.5 Kits workbench (deep link)

Quando `plan.wb` está definido, link do workbench aponta para:

| Intenção | Pasta workbench |
|----------|-----------------|
| ideia_nova | `10-DESCOBERTA-E-MODELAGEM` |
| feature_nova / produto | `20-ENTREGA-DE-PRODUTO` |
| correcao_rapida | `50-CORRECAO-RAPIDA` |

### 5.6 Lista “O que precisa” por intenção

Exemplos fixos em `NEEDS_BY_INTENT`:

- **ideia_nova:** clareza do que construir, decisão de escopo, implementação, checagem de repo.  
- **feature_nova:** escopo no workbench, implementação Cursor, auditoria Max.  
- **auditar:** relatório de saúde, revisão de aderência.  
- **fire:** simulação FIRE, governança se virar produto.  
- (demais intenções com listas próprias no código)

### 5.7 Confiança do roteamento

Heurística exibida ao usuário:

- Base 40%  
- +25% se houver link GitHub  
- +20% se descrição > 20 caracteres  
- +15% se intent não for genérico sem descrição  
- Teto 95%

**Não bloqueia** a análise; é informativo.

---

## 6. Aplicadores — inventário funcional

### 6.1 Moradores (fluxo principal)

| ID | Nome exibido | Rótulo humano | Link padrão | Ordem |
|----|--------------|---------------|-------------|-------|
| dlogica | dLogica | Definir a demanda | `../dlogica/README.md` | 1 |
| workbench | workbench | Governar o escopo | `../workbench/CAMINHOS.md` ou kit | 2 |
| cursor | Cursor | Implementar | (sem href — IDE) | 3 |
| max | Max Stack | Auditar o repositório | `:3847` ou `?repo=` | 4 |

### 6.2 Extras e complementos

| ID | Nome | Quando entra no plano |
|----|------|------------------------|
| cortana | Cortana | Pesquisa web |
| freedom | FREEDOM | Tema FIRE |
| consorcio | CONSORCIO | Open Finance / consórcio |
| recuperacao | Recuperação Financeira | Dívidas / saúde financeira |
| arbilocal | ARBILOCAL | Decisão comercial |
| simMoto | Simulador Troca Moto | Gasto em bem durável |
| geogrowth | geogrowth | Produto geo (catálogo) |

### 6.3 Dependência ao clicar “Abrir”

| Destino | EcoMaestro precisa que… |
|---------|-------------------------|
| Arquivos `../pasta/` | Pasta `_PROJETOS` exista no mesmo PC (modo autônomo `file://`) |
| `http://127.0.0.1:3847` | Max esteja rodando (`Atualizar-e-Iniciar-Max.bat`) |
| `http://127.0.0.1:8765` | FREEDOM esteja rodando (`Iniciar-FREEDOM.bat`) |
| `http://127.0.0.1:8787` | Cortana esteja rodando |
| GitHub remoto | Apenas navegador com internet |

**Importante:** a **análise** não depende desses serviços; só os **links de execução**.

---

## 7. Fluxos de usuário (casos de uso)

### UC-01 — Nova funcionalidade em repo existente

**Ator:** desenvolvedor  
**Pré-condição:** repositório no GitHub  

1. Abre EcoMaestro (autônomo).  
2. Cola link `https://github.com/RivasCode-Ops/FREEDOM`.  
3. Descreve: “nova funcionalidade — exportar histórico em CSV”.  
4. Clica **Analisar demanda**.  

**Pós-condição:**

- Título: `RivasCode-Ops/FREEDOM · nova funcionalidade`.  
- O que precisa: escopo, implementação, auditoria.  
- Comece aqui: **workbench** (kit 20-ENTREGA).  
- Depois: Cursor, Max (com URL do repo).

### UC-02 — Projeto novo (ideia)

1. Descrição: “projeto novo — app de metas para família”.  
2. Link vazio ou link de repo vazio futuro.  

**Pós-condição:**

- Comece aqui: **dLogica**.  
- Sequência completa até Max quando houver código.

### UC-03 — Auditar antes de PR

1. Link GitHub + “auditar o repo antes de abrir PR”.  

**Pós-condição:**

- Comece aqui: **Max Stack**.  
- Depois: workbench (aderência).

### UC-04 — Tema FIRE (produto)

1. Descrição: “quando posso parar de trabalhar / independência financeira”.  

**Pós-condição:**

- Comece aqui: **FREEDOM**.  
- O que precisa: simulação FIRE, etc.

### UC-05 — Só abrir e explorar (autônomo)

1. Duplo clique no `.vbs`.  
2. Navegador abre sem instalação.  

**Pós-condição:**

- Modo autônomo visível; relatório disponível após preencher campos.

### UC-06 — Reabrir demanda recente

1. Clicar item no histórico.  

**Pós-condição:**

- Campos restaurados; análise reexecutada.

---

## 8. Critérios de aceite (teste funcional)

| # | Critério | Prioridade |
|---|----------|------------|
| A1 | Abrir via `.vbs` sem janela de servidor e sem erro | Alta |
| A2 | Análise funciona com campos vazios de rede (offline) | Alta |
| A3 | Link + “nova funcionalidade” → primary = workbench | Alta |
| A4 | “projeto novo” → primary = dLogica | Alta |
| A5 | “auditar” + link → primary = Max | Alta |
| A6 | Relatório exibe “O que precisa” e “Quem aplica” | Alta |
| A7 | Exatamente um card com badge “Comece aqui” | Alta |
| A8 | Limpar oculta relatório e zera campos | Média |
| A9 | Histórico persiste após recarregar página (mesmo navegador) | Média |
| A10 | Max abre com `?repo=` quando link GitHub válido | Média |
| A11 | Alerta se ambos campos vazios | Alta |
| A12 | Modo autônomo indicado em `file://` | Baixa |

---

## 9. Cenários de teste (Given / When / Then)

### T01 — Entrada mínima inválida

- **Given** EcoMaestro aberto  
- **When** usuário clica Analisar sem link e sem descrição  
- **Then** alerta de validação; relatório não aparece  

### T02 — Feature FREEDOM

- **Given** link `RivasCode-Ops/FREEDOM`  
- **When** descrição contém “nova funcionalidade exportar CSV”  
- **Then** primary = workbench; needs incluem escopo e implementação  

### T03 — FIRE sem link

- **Given** descrição “planejar independência financeira FIRE”  
- **When** analisar  
- **Then** primary = FREEDOM; moradores vazios ou só complemento  

### T04 — GitHub sem descrição

- **Given** só link válido GitHub  
- **When** analisar  
- **Then** intent feature_nova ou similar; não fluxo 4 passos sem necessidade  

### T05 — Histórico

- **Given** análise bem-sucedida  
- **When** recarregar página  
- **Then** histórico lista demanda; clique restaura campos  

### T06 — Links locais workbench

- **Given** modo autônomo em `c:\_PROJETOS\EcoMaestro`  
- **When** abrir workbench do relatório  
- **Then** navegador abre `../workbench/...` se pasta existir  

---

## 10. Limitações conhecidas (para análise honesta)

| Limitação | Impacto no teste |
|-----------|------------------|
| Roteamento por **keywords**, não IA | Frases coloquiais atípicas podem errar |
| Catálogo **incompleto** (PULSO, XAXA, etc.) | Nome do projeto só no texto pode não resolver |
| Links `../` **quebram** se pasta EcoMaestro isolada | Clone só do repo sem `_PROJETOS` |
| Não verifica se Max/FREEDOM **estão online** | “Abrir” pode falhar silenciosamente |
| Cursor sem URL | Usuário precisa saber abrir IDE manualmente |
| Confiança % é **heurística** | Não mede acurácia real |
| Documento `MODELO-CONDOMINIO` em `file://` | Pode abrir como texto no navegador |

---

## 11. Fora de escopo (v1 atual)

- Login, multiusuário, sync em nuvem  
- Execução automática de comandos nos outros apps  
- Integração API com Cortana/LLM para classificar texto livre  
- GitHub Pages como único meio de uso (planejável, não implementado)  
- Substituição do workbench ou do dLogica  
- Tradução para outros idiomas  

---

## 12. Evolução planejada (pós-teste)

| Fase | Entrega |
|------|---------|
| V1.1 | Catálogo completo alinhado ao `inventario-projetos.html` |
| V1.2 | Detecção “serviço offline” antes de link `:porta` |
| V1.3 | Exportar relatório (copiar / imprimir PDF) |
| V2 | Classificação via Cortana/Ollama (opcional), mantendo fallback local |
| V2 | GitHub Pages + paths relativos ajustados para uso sem `_PROJETOS` |

---

## 13. Artefatos e rastreabilidade

| Artefato | Caminho |
|----------|---------|
| App | `index.html` |
| Launcher autônomo | `EcoMaestro-Autonomo.vbs`, `Iniciar-EcoMaestro-Autonomo.bat` |
| Launcher servidor | `Iniciar-EcoMaestro.bat`, `Servidor-local.ps1` |
| Atalho raiz | `c:\_PROJETOS\Abrir-EcoMaestro.bat` |
| Modelo condomínio | `docs/MODELO-CONDOMINIO.md` |
| Entrada ecossistema | `ecossistema.html`, `ECOSSISTEMA.md` |
| Índice inspirações | [GITHUB-INSPIRACOES-ECOSSISTEMA](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md) |

---

## 14. Resumo executivo para analista

O **EcoMaestro** está **apto para teste funcional** no modo autônomo. A ação central é: **transformar (link GitHub + descrição) em relatório estruturado** com duas dimensões — **necessidades** e **responsáveis do condomínio** — sem exigir que o testador conheça dLogica, workbench, Max ou Cursor.

O teste deve validar sobretudo se o **“Comece aqui”** corresponde ao que um membro experiente do ecossistema faria manualmente. Falhas de linguagem natural ou projetos não catalogados são esperadas na v1 e alimentam a V1.1/V2, não invalidam o piloto de funcionalidade.

---

## 15. Checklist rápido do testador (15 min)

- [ ] Abriu pelo `.vbs` sem instalar nada  
- [ ] Viu faixa **Modo autônomo**  
- [ ] Testou FREEDOM + nova funcionalidade → workbench primeiro  
- [ ] Testou auditar + link → Max primeiro  
- [ ] Testou projeto novo sem link → dLogica primeiro  
- [ ] Testou FIRE → FREEDOM primeiro  
- [ ] Histórico gravou e reabriu demanda  
- [ ] Anotou 1 caso em que “Comece aqui” estaria errado  

---

*Documento gerado para análise de funcionalidade do programa EcoMaestro no ecossistema RivasCode-Ops / pasta `_PROJETOS`.*
