# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=pt)](https://dshfind.com/pt/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

Servidor [MCP](https://modelcontextprotocol.io) somente leitura que expõe o registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): graus de certificação, datas de snapshot e evidências em cinco dimensões para plugins do DeepSeek Harness (DSH). Zero dependências de execução, transporte stdio.

## Ferramentas

| Ferramenta | Entrada | Retorna |
|---|---|---|
| `get_certification` | `owner`, `repo` | O registro completo de certificação (grau, snapshot, cinco dimensões, veto, notas) ou «sem registro» |
| `list_certified` | — | Todas as entradas do registro público: repositório / grau / snapshot |
| `certification_spec` | — | Resumo da especificação v1: cinco dimensões, escala de graus, regra de veto |

O snapshot embutido fica em `data/certified.json` (sincronizado do repositório de certificação) e o servidor o atualiza a partir do registro público no máximo uma vez a cada cinco minutos. Sem escritas, sem segredos, sem execução de código.

## Instalação

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
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

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

## Por que isto existe

O repositório oficial do DeepSeek Harness não opera um registro de plugins e não aceita PRs externos; a descoberta acontece pelo topic `dsh-plugin` do GitHub e por listas da comunidade, e nenhuma delas certifica nada. O `dsh-plugin-certification` transforma «posso instalar este plugin?» em uma verificação reproduzível de cinco dimensões (manifesto, higiene de build, Scorecard de cadeia de suprimentos, procedência da publicação, teste de instalação em sandbox), com registro público e selos para o README. Este servidor MCP é o mesmo dado com uma interface para agentes: um agente pode consultar a certificação de um plugin antes de recomendá-lo ou instalá-lo.

## Registro

Fonte de dados: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, especificação v1.

## Compatibilidade

- Node `^22.19.0 || >=24.0.0`.
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0` (declarado em `engines.dsh`, com `dsh.manifestVersion: 1`).
- Peer: `@deepseek-ai/cordis` `^4.0.2`. A metade host precisa ainda do serviço `tools` em tempo de execução; a metade stdio não precisa de nada além do Node.

## Desenvolvimento

```sh
pnpm install
pnpm run typecheck                            # a única régua de tipos: checkJs sobre a face host publicada
pnpm test                                     # smoke JSON-RPC + suíte de execução com Cordis real
pnpm pack                                     # o tarball publicado
```

A suíte de execução monta os registros REAIS `SystemPrompt`/`ToolRuntime` e verifica que montar este pacote coloca as três ferramentas de certificação em `ctx.tools.schemas()`, que liberar o fiber as remove e que um contexto sem o serviço `tools` deixa o plugin em `PENDING`. O `dsh --dump-config` é deliberadamente evitado como critério de aceitação: ali uma linha montada e um fiber pendente parecem iguais.

Há deliberadamente **uma única** régua de tipos. `@deepseek-ai/*` resolve pelo `node_modules` deste repositório (as devDependencies fixadas, ou seja, a linha publicada) e o pacote não declara nenhum peer de DSH, então uma segunda configuração de `tsc` seria o mesmo comando sobre o mesmo universo de tipos. O script `typecheck:ci` é mantido como a cópia histórica no-op (sua única chave extra é um `paths: {}` vazio) por compatibilidade com referências existentes, não como uma segunda face de tipos. A segunda evidência independente é o portão de montagem em execução acima.

## Licença

Apache-2.0. Uma listagem ou um grau é um registro de evidência, não uma garantia de segurança: plugins rodam dentro do seu processo DSH com as suas permissões.

**Versão do DSH aplicável:** verificada com `dsh-v0.1.7-alpha.1` (a versão do host que esta compilação visa); requer `>=0.1.7-alpha.1 <0.2.0`.


## PerryLink DSH Plugin Family

This project is one of the **45 DeepSeek Harness plugins** maintained by [PerryLink](https://github.com/PerryLink). If this one helps you, the others likely will too:

| Plugin | One-liner |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default | |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command | |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | DSH Desktop Market standard catalog source for the PerryLink family | |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence | |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore | |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. | |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search | |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) | |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review | |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. | |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds | |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval | |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` | |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. | |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. | |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers | |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer | |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors | |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool | |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. | |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching | |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit | |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Community certification registry with repro-checkable grades and badges | |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins | |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill | |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Merged `0.1.3-alpha.1` → `0.1.5-rc.1` upgrade corridor card plus a zero-dependency seam scanner | |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions | |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. | |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. | |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review | |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. | |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. | |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools | |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. | |
