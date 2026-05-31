# Modelo do condomínio — EcoMaestro

## Moradores (ferramentas fixas)

| Ordem | App | Entrega |
|-------|-----|---------|
| 1 | **dLogica** | Definição — o que a demanda precisa virar |
| 2 | **workbench** | Governança — decisão, handoff, kit de método |
| 3 | **Cursor** | Implementação — código no escopo aprovado |
| 4 | **Max Stack** | Auditoria — saúde do repositório |

## Extras (só quando o plano pedir)

| App | Quando acionar |
|-----|----------------|
| **Cortana** | Pesquisa web, mercado, fontes externas |
| **FREEDOM** | FIRE, independência financeira, patrimônio meta |
| **CONSORCIO** | Consórcio, Open Finance, score |
| **Recuperação Financeira** | Dívida, dashboard de saúde financeira |
| **ARBILOCAL** | Fornecedor, revenda, decisão comercial |
| **Simulador Troca Moto** | Custo de gasto em bem durável |

## Regras do maestro

1. **Uma pergunta por morador** — o plano lista passos, não mistura telas.  
2. **Link GitHub** → quase sempre inclui **Max**; se ideia nova, começa em **dLogica**.  
3. **Link `localhost:PORT`** → abre o morador daquela porta.  
4. **Só descrição** → classificação por palavras-chave (PT) + fluxo padrão 1→2→3→4.  
5. **Complementos** nunca substituem workbench ou Max — só apoiam o tema (finanças, mercado, etc.).

## Intenções detectadas

| Intenção | Sequência típica |
|----------|------------------|
| `ideia_nova` | dLogica → workbench → Cursor → Max |
| `governanca` | workbench → (Cursor se escopo) → Max |
| `implementar` | workbench (kit) → Cursor → Max |
| `auditar` | Max → workbench (revisão) |
| `pesquisar` | Cortana → dLogica ou workbench |
| `fire` | FREEDOM (+ workbench se virar produto) |
| `financeiro_real` | CONSORCIO ou Recuperação (+ FREEDOM opcional) |
| `comercial` | ARBILOCAL ou Cortana → workbench |
| `correcao_rapida` | workbench `50-CORRECAO-RAPIDA` → Cursor |

## Interface (3 blocos)

1. **Link do GitHub** — repositório existente (opcional se ainda não houver código).
2. **Descrição** — projeto novo ou nova funcionalidade (e outros pedidos).
3. **Relatório** — *O que precisa* + *Quem aplica no condomínio* (com **Comece aqui**).

## Persistência

Demandas salvas em `localStorage` (`ecomaestro_demands_v2`) — só no seu navegador.
