# PRD EcoMaestro v1.3 — do síndico de papel ao síndico com painel

**Status:** implementado no código (2026-05-30)  
**Alinhado à constatação do idealizador** (orquestrador v1.2 → jornada fechada + visão CEO).

## Visão

Um portão de entrada (`8771`), circuito humano de retorno via wizard (prioridade **dLogica**), painel CEO com 5 KPIs locais (JSON).

## Entregas mapeadas

| Requisito | Implementação |
|-----------|----------------|
| RF1 entrada única | README, UI v1.3, autônomo = fallback |
| RF2 PATCH guiado dLogica | `run-wizard.mjs` + modal com contexto da demanda |
| RF3 Painel CEO | `GET /api/dashboard`, `painel.html` |
| RNF JSON existente | `listAllDemandsFull`, sem migração destrutiva |
| RNF doc honesta | README — verdade operacional = JSON local |

## Circuito fechado v1.3

Morador prioritário: `dlogica` (`CIRCUIT_CLOSED_RESIDENT`).  
Demais moradores: wizard já existe; fechamento completo em v1.4+.

## KPIs do painel

1. Demandas abertas  
2. Total  
3. Média horas até triagem (criação → run dLogica done)  
4. Média horas até completed  
5. Paradas 7+ dias (abertas sem run recente)  
+ barras por status e por último morador  

## Fora de escopo (mantido)

- APIs automáticas dos moradores  
- Postgres obrigatório  
- ARBILOCAL até existir pasta  

## Próximos

- v1.4 workbench circuito fechado  
- v1.5 Postgres produção  
- v1.6 primeira integração HTTP morador  
