# Apps do ECO — papéis e sobreposições

> Evitar duplicar função entre pastas em `c:\_PROJETOS`.

## Fluxo principal (4 portas + maestro)

| Ordem | App | Porta | Pergunta |
|-------|-----|-------|----------|
| 0 | **EcoMaestro** | 8771 (API) / autônomo | Quem entrega? |
| 1 | **dLogica** | — | O que precisa virar? |
| 2 | **workbench** | — | O que foi decidido? |
| 3 | **Cursor** | IDE | Como implementar? |
| 4 | **max-coding** (Max) | 3847 | Como está o repo? |

**Extra (fora das 4):** **Cortana** `:8787` — pesquisa web com fontes.

---

## Sobreposição — o que usar

| Pasta | Relação | Recomendação |
|-------|---------|--------------|
| **workbench** | Canônico governança + prompts D00–D12 | **Use sempre** para decisão e coding diário |
| **PROMPT** | Mesmo método que workbench (espelho / hub antigo) | **Não** iniciar projetos novos aqui; migrar leitura para `workbench/CAMINHOS.md` |
| **workbench/Cursor-Kit** | Rules `.cursor` genéricas para qualquer repo | Copiar para o app; ver `INSTALAR-NO-REPO.bat` |
| **workbench/GeoGrowth-Cursor** | Kit + rules **só** GeoGrowth | Usar só no repo geogrowth |
| **EcoMaestro** | Roteador; não codifica | Entrada antes das 4 portas |
| **ecossistema.html** | Índice visual das 4 portas | Depois do EcoMaestro |
| **COmniWS** | Runtime / workspace IA | Complemento; **não** substitui workbench nem Cursor |
| **geogrowth-sync-api** | API do produto | Produto/backend — não é morador do fluxo |
| **PULSO / Quadro-Negro** | Produtos | Entram no plano só se a demanda citar |

---

## Complementos (produtos / dados)

Não são “mais uma porta”, mas o EcoMaestro pode sugerir:

- FREEDOM, CONSORCIO, Recuperação Financeira, Simulador-Troca-Moto, ARBILOCAL, geogrowth…

Ver [MODELO-CONDOMINIO.md](MODELO-CONDOMINIO.md) e [workbench — inspirações ecossistema](https://github.com/RivasCode-Ops/workbench/blob/main/docs/GITHUB-INSPIRACOES-ECOSSISTEMA.md).

---

## Entradas no PC

| Atalho / script | Abre |
|-----------------|------|
| `Abrir-EcoMaestro.bat` | EcoMaestro autônomo |
| `Iniciar-EcoMaestro-API.bat` | EcoMaestro `:8771` |
| `Abrir-Ecossistema.bat` | `ecossistema.html` |
| `inventario-projetos.html` | Lista de pastas |
