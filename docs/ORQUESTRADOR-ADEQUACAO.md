# Orquestrador de adequação — EcoMaestro

Verifica se a **demanda está alinhada ao pedido (propósito)** e se a **execução no condomínio** é adequada aos contratos dos moradores.

## Quando roda

| Momento | Como |
|---------|------|
| Após **Trabalhar / Analisar** | Automático no relatório (bloco azul) |
| A qualquer momento | Botão **Verificar adequação agora** |
| API | `GET /api/demands/{id}/adequacao` |
| Só análise (sem salvar) | `POST /api/orchestrate` com `description`, `project_folder` |

## Vereditos

| Veredito | Significado |
|----------|-------------|
| **adequado** | Pedido coerente; execução OK para o status atual |
| **plano_ok** | Plano bate com o pedido; moradores ainda não executaram (normal após triagem) |
| **parcial** | Lacunas em runs, payload ou status |
| **desalinhado** | Intent ou pedido incoerente — reescrever descrição |

## O que é checado

### Alinhamento ao pedido

- Descrição ou GitHub presentes
- `intent` vs texto (reclassificação local)
- Morador principal vs tipo de pedido (ex. backup → workbench)
- Pasta do projeto citada na descrição
- Checklist "o que precisa" para o intent

### Adequação da execução

- Runs criados e status do morador principal
- `output_payload` quando run = done
- Gates por status: `analysis.*`, `plan.steps`, `implementation.*`, `audit.*`
- Status `completed` só com auditoria sem blockers

## Exemplo API

```http
POST /api/orchestrate
Content-Type: application/json

{
  "project_folder": "XAXA",
  "description": "evoluir monorepo TypeScript — próximo passo no workbench"
}
```

## Tranquilidade em demandas longas

1. Salve sempre via API (`:8771`) — fica em `data/demands/*.json`
2. Após cada morador, **Marcar concluído** ou PATCH com `output_payload` real
3. Clique **Verificar adequação** — score e lista ✓/✗ objetivos
4. No Cursor, use também `docs/PROMPT-CONTINUIDADE-DEMANDAS.md`

Código: `lib/demand-orchestrator.mjs`
