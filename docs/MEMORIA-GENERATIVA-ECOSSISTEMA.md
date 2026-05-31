# Memória generativa — ecossistema ECO (reutilizar em outros projetos)

> Cole no início de sessões Cursor/Agent ao trabalhar em **qualquer pasta** de `c:\_PROJETOS`.  
> Atualizado: 2026-05-30 · EcoMaestro v1.2

---

## 1. Verdades estáveis (não contradizer)

1. **`c:\_PROJETOS`** é a raiz de produtos e ferramentas; cada subpasta é um repo ou app.
2. **Fluxo canônico:** EcoMaestro → dLogica → workbench → Cursor → Max (+ extras só se o intent pedir).
3. **EcoMaestro** (`:8771` ou `Abrir-EcoMaestro.bat`) **roteia**; **não altera** código de FREEDOM, XAXA, geogrowth, etc.
4. **workbench** é canônico para governança e prompts D00–D12; **PROMPT/** é legado.
5. **Cursor-Kit** (`workbench/Cursor-Kit`) é rules genéricas; **GeoGrowth-Cursor** só no geogrowth.
6. **Demandas** ficam em `EcoMaestro/data/demands/*.json` quando API está ligada.

---

## 2. Entrada recomendada (qualquer dia)

```text
1. Abrir-EcoMaestro.bat [NOME_DA_PASTA]
2. Descrever demanda com palavras do ecossistema (feature, auditar, backup, projeto novo…)
3. Trabalhar neste projeto
4. Copiar pasta → Cursor Open Folder
5. workbench: d00-contexto-sessao.md → colar no chat
6. Voltar ao Eco: Terminei este passo (por morador, em ordem)
```

---

## 3. Padrões técnicos implementados (copiar em novos apps)

| Padrão | Onde ver | Uso |
|--------|----------|-----|
| Orquestrador sem `fs` no browser | `verify-links.mjs` vs `verify-links-node.mjs` | UI importa só módulos browser-safe |
| API + UI mesma origem | `server.mjs` porta 8771 | `fetch('/api/...')` sem CORS |
| Servir monorepo via prefixo | `/p/{caminho}` → `_PROJETOS` | Links relativos funcionam no browser |
| Scan pastas + git remote | `projetos-scan.mjs` | Seletor sem digitar GitHub |
| Payload acumulado v1 | `payload-merge.mjs` | Contratos entre moradores |
| Gates de qualidade | `demand-orchestrator.mjs` | Bloquear pedido vago / completed cedo |
| Intent por keywords | `router.mjs` `KW[]` | Extensível sem LLM |
| Fallback offline | `projects-fallback.mjs` | Lista mínima sem API |

---

## 4. Portas e ferramentas (mapa mental)

| Porta | Pasta | Pergunta |
|-------|-------|----------|
| 8771 | EcoMaestro | Quem entrega? |
| — | dlogica | O que precisa virar? |
| — | workbench | O que foi decidido? |
| IDE | Cursor | Código no repo |
| 3847 | max-coding | Saúde do repo |
| 8787 | Cortana | Pesquisa web |
| 8765 | FREEDOM | FIRE (produto) |

---

## 5. O que NÃO fazer em projetos filhos

- Não fundir dLogica + workbench + Max num único executável.
- Não usar **PROMPT/** para projeto novo — usar **workbench/Projeto Novo/**.
- Não marcar demanda `completed` no Eco sem payload real (hoje bloqueia — correto).
- Não assumir que Eco abre Cursor ou preenche D00 automaticamente.

---

## 6. Extensões futuras (backlog comum)

1. Wizard `output_payload` ao marcar run concluído.
2. Botão “Copiar pacote Cursor” (pasta + D00 + demanda).
3. Painel jornadas abertas (dashboard).
4. LLM opcional só para classificar intent (mantendo gates).

---

## 7. Prompt seed para outro agente

```
Contexto: ecossistema RivasCode-Ops em c:\_PROJETOS.
EcoMaestro é orquestrador (8771), não edita repos de produto.
Antes de codar: confirmar pasta do app, demanda em data/demands, D00 no Cursor.
Docs: EcoMaestro/docs/MEMORIA-GENERATIVA-ECOSSISTEMA.md, ECOSSISTEMA.md, workbench/CAMINHOS.md.
Respeitar gates do orquestrador; não pular ordem dLogica→workbench→Cursor→Max.
```

---

## 8. Arquivos de referência por tema

| Tema | Arquivo |
|------|---------|
| Modelo condomínio | `EcoMaestro/docs/MODELO-CONDOMINIO.md` |
| API | `EcoMaestro/docs/API.md` |
| Orquestrador | `EcoMaestro/docs/ORQUESTRADOR-ADEQUACAO.md` |
| Jornada / teste | `EcoMaestro/docs/JORNADA-GESTOR-AUDITORIA.md` |
| Pedidos do usuário | `EcoMaestro/docs/INDICE-PEDIDOS-E-INSTRUCOES.md` |
| Continuidade Cursor | `EcoMaestro/docs/PROMPT-CONTINUIDADE-DEMANDAS.md` |
| 1 página eco | `ECOSSISTEMA.md` |

---

*Memória viva: após mudanças grandes no EcoMaestro, atualizar §1–§3 e data no topo.*
