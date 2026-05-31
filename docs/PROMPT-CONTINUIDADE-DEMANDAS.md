# Prompt — continuidade de demandas (cole no Cursor)

Use quando a mesma demanda já teve várias rodadas e você precisa de **tranquilidade** (nada regredindo, histórico visível).

---

## Prompt

```
Atue como guardião de continuidade do ecossistema ECO (EcoMaestro + workbench + este repo).

Projeto em foco: [NOME_DA_PASTA em c:\_PROJETOS]
Demanda atual: [descreva em 1–3 linhas]

Antes de editar qualquer arquivo:

1. Leia a documentação canônica deste repo (AGENTS.md ou README.md ou docs/).
2. Se existir EcoMaestro em :8771, consulte demandas anteriores do mesmo projeto:
   GET /api/demands?project=[NOME_DA_PASTA]
   ou arquivos em EcoMaestro/data/demands/*.json com project_folder igual.
3. Liste em bullets: o que já foi feito, o que ainda falha, o que NÃO deve ser desfeito.
4. Proponha um plano de 3 passos máximo, com verificação objetiva em cada passo.

Regras:
- Tratar UI do Eco de forma genérica (todos os apps em _PROJETOS), sem hardcode de um produto só.
- Não remover funcionalidade que já funcionava sem explicar por quê.
- Ao terminar: resumo + como o usuário valida + se deve clicar "Trabalhar neste projeto" no :8771.

Não invente commits ou arquivos — cite caminhos reais que você leu.
```

---

## Onde isso vive no PC

| Recurso | Caminho |
|---------|---------|
| Rule Cursor (todos os repos com Cursor-Kit) | `workbench/Cursor-Kit/kit-para-copiar/.cursor/rules/eco-demandas-continuidade.mdc` |
| Rule só no EcoMaestro | `.cursor/rules/ecomaestro-continuidade.mdc` |
| Demandas salvas | `EcoMaestro/data/demands/*.json` |

Instalar a rule no app: `workbench\Cursor-Kit\INSTALAR-NO-REPO.bat c:\_PROJETOS\SeuApp`
