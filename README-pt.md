# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-cert-mcp
```


Servidor [MCP](https://modelcontextprotocol.io) somente leitura que expõe o registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): graus de certificação, datas de snapshot e evidências em cinco dimensões para plugins do DeepSeek Harness (DSH). Zero dependências de execução, transporte stdio.

## Instalação

```sh
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp
```

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # servidor stdio
```

Você também pode executá-lo direto do pacote npm publicado: `npx dsh-cert-mcp`.

### Registrar em um cliente MCP

Claude Code:

```sh
claude mcp add dsh-cert -- node <path-to-repo>/src/index.js
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dsh-cert": {
      "command": "node",
      "args": ["<path-to-repo>/src/index.js"]
    }
  }
}
```

DSH: adicione-o pelo [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) como servidor stdio, ou use qualquer cliente MCP compatível com `stdio`.

### Instalar como bundle do DSH

O pacote declara `dsh.bundle.patch` → `cordis.patch.yml`, então também é instalável como bundle do DeepSeek Harness:

```sh
# canal git (main mais recente)
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp

# canal npm (versões publicadas)
dsh plugin --profile web add dsh-cert-mcp
```

A linha inserida carrega o pacote pelo contrato padrão de plugins do Cordis: a metade host é um módulo ESM comum que exporta com nome `name`, `inject` e `apply(ctx)`. Este pacote não traz interface de navegador, portanto não há declaração `dsh.client`.

```js
// entrada do bundle (metade host) — o contrato que a linha do patch carrega
export const name = 'dsh-cert-mcp'
export const inject = ['tools'] // a superfície de ferramentas do host, fornecida pelo dsh-tools
export function apply(ctx) {
  // registra a superfície de consulta de certificação somente leitura
  // (get_certification / list_certified / certification_spec)
}
```

**A metade host precisa do serviço `tools`** (fornecido por `@deepseek-ai/dsh-tools`). Um perfil sem ele não perde as ferramentas em silêncio: o Cordis mantém esta linha em `PENDING` até `tools` existir, e isso aparece na lista de plugins do perfil. Nada mais é exigido: nem chaves de configuração, nem credenciais, nem rede durante o carregamento.

**Duas metades, um único caminho de dados.** A linha do bundle e o servidor stdio são entradas separadas sobre o mesmo núcleo `handleRequest`. A metade servidor é um processo independente que qualquer cliente MCP pode iniciar (`node src/index.js`), e **não faz parte do caminho do plugin**: instalar este bundle nunca o inicia e removê-lo nunca o afeta. Na direção oposta, `npx dsh-cert-mcp` não registra nada na superfície de ferramentas do DSH.

Para remover: `dsh plugin --profile web remove dsh-cert-mcp` (ou apague a linha do patch do perfil). O servidor MCP stdio independente continua funcionando para qualquer cliente MCP.

## What is dsh-cert-mcp?

Servidor [MCP](https://modelcontextprotocol.io) somente leitura que expõe o registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): graus de certificação, datas de snapshot e evidências em cinco dimensões para plugins do DeepSeek Harness (DSH). Zero dependências de execução, transporte stdio.

![Diagrama de fluxo de dsh-cert-mcp: instalar → abrir painel → agir.](docs/assets/dsh-cert-mcp-flow.svg)

*Visão geral do fluxo: instalar → abrir painel → agir. Os exemplos abaixo usam a superfície real de comandos.*


*A mesma execução, animada.*

## Ferramentas

| Ferramenta | Entrada | Retorna |
|---|---|---|
| `get_certification` | `owner`, `repo` | O registro completo de certificação (grau, snapshot, cinco dimensões, veto, notas) ou «sem registro» |
| `list_certified` | — | Todas as entradas do registro público: repositório / grau / snapshot |
| `certification_spec` | — | Resumo da especificação v1: cinco dimensões, escala de graus, regra de veto |

O snapshot embutido fica em `data/certified.json` (sincronizado do repositório de certificação) e o servidor o atualiza a partir do registro público no máximo uma vez a cada cinco minutos. Sem escritas, sem segredos, sem execução de código.

## Por que isto existe

O repositório oficial do DeepSeek Harness não opera um registro de plugins e não aceita PRs externos; a descoberta acontece pelo topic `dsh-plugin` do GitHub e por listas da comunidade, e nenhuma delas certifica nada. O `dsh-plugin-certification` transforma «posso instalar este plugin?» em uma verificação reproduzível de cinco dimensões (manifesto, higiene de build, Scorecard de cadeia de suprimentos, procedência da publicação, teste de instalação em sandbox), com registro público e selos para o README. Este servidor MCP é o mesmo dado com uma interface para agentes: um agente pode consultar a certificação de um plugin antes de recomendá-lo ou instalá-lo.

## Registro

Fonte de dados: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, especificação v1.

**O que o registro é, e o que uma resposta curta deste servidor significa.** O registro é um **subconjunto de adesão voluntária**: um repositório só aparece nele depois de ter sido avaliado, então a ausência de registro **não** é prova de que um plugin não seja certificado, e `list_certified` devolver poucas linhas não é prova de que poucos plugins foram avaliados. O snapshot incluído tinha **uma** entrada (nota A, snapshot 2026-09-07) quando isto foi escrito; uma lista de uma entrada não tem significado estatístico — uma nota descreve aquele único repositório, e a comparação ordenável entre plugins só passa a existir quando o registro contém muitos. Toda resposta de `list_certified` traz um objeto `coverage` que diz exatamente isso, para que um agente que leia apenas a saída da ferramenta não confunda a contagem com cobertura do ecossistema. A data do snapshot é um fato **do repositório de certificação**, não uma promessa de atualidade deste servidor: ele é sincronizado byte a byte de `dsh-plugin-certification`, que é o dono do calendário e da verificação.

## Compatibilidade

| Superfície | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (devDependencies and the declared `engines.dsh` range both admit that line; `typecheck` and the 5-test suite are green against `@deepseek-ai/dsh-system-prompt` / `@deepseek-ai/dsh-tools` 0.2.1-alpha.1) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Faixa de host declarada | `engines.dsh`: `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0 \|\| >=0.2.0-0 <0.3.0 \|\| >=0.2.1-0 <0.3.0`, com `dsh.manifestVersion: 1` |
| Peer | `@deepseek-ai/cordis` `^4.0.2`. A metade host precisa ainda do serviço `tools` em tempo de execução; a metade stdio não precisa de nada além do Node. |

## Desenvolvimento

```sh
pnpm install
pnpm run typecheck                            # a única régua de tipos: checkJs sobre a face host publicada
pnpm test                                     # smoke JSON-RPC + suíte de execução com Cordis real
pnpm pack                                     # o tarball publicado
```

A suíte de execução monta os registros REAIS `SystemPrompt`/`ToolRuntime` e verifica que montar este pacote coloca as três ferramentas de certificação em `ctx.tools.schemas()`, que liberar o fiber as remove e que um contexto sem o serviço `tools` deixa o plugin em `PENDING`. O `dsh --dump-config` é deliberadamente evitado como critério de aceitação: ali uma linha montada e um fiber pendente parecem iguais.

Há deliberadamente **uma única** régua de tipos. `@deepseek-ai/*` resolve pelo `node_modules` deste repositório (as devDependencies fixadas, ou seja, a linha publicada) e o pacote não declara nenhum peer de DSH, então uma segunda configuração de `tsc` seria o mesmo comando sobre o mesmo universo de tipos. O script `typecheck:ci` é mantido como a cópia histórica no-op (sua única chave extra é um `paths: {}` vazio) por compatibilidade com referências existentes, não como uma segunda face de tipos. A segunda evidência independente é o portão de montagem em execução acima.

## PerryLink DSH Plugin Family

Este projeto faz parte da família de plugins do DeepSeek Harness da [PerryLink](https://github.com/PerryLink). O registro fica recolhido abaixo para que cada README mantenha uma primeira tela curta; expanda para ver cada linha e seu status.

<details>
<summary>Expandir todos os plugins</summary>

| Plugin | Status |
|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** |  |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** |  |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** |  |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** |  |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** |  |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** |  |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** |  |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** |  |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver o README do repositório |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver o README do repositório |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver o README do repositório |

</details>

## Licença

Apache-2.0. Uma listagem ou um grau é um registro de evidência, não uma garantia de segurança: plugins rodam dentro do seu processo DSH com as suas permissões.

### Exemplos

São os pontos de entrada reais; instale e chame um.

#### Exemplo detalhado

**Comando**

~~~sh
get_certification
~~~

**Entrada**

~~~json
{
  "owner": "PerryLink",
  "repo": "dsh-auto-review"
}
~~~

**Saída**

~~~text
{
  "repo": "PerryLink/dsh-auto-review",
  "grade": "A",
  "snapshot": "2026-09-07",
  "dimensions": {
    "manifest": { "result": "pass" },
    "buildHygiene": { "result": "pass" },
    "supplyChain": { "result": "pass", "score": 5.4 },
    "releaseIntegrity": { "result": "pass" },
    "installSmoke": { "result": "ok" }
  },
  "veto": null
}
~~~

*Observado em `plugins/dsh-cert-mcp/src/server.js:192-199; data in plugins/dsh-cert-mcp/data/certified.json:1-30; smoke test at plugins/dsh-cert-mcp/test/smoke.mjs:29-39`*

#### Exemplos breves

- `list_certified`
- `certification_spec`

