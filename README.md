# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

Read-only [MCP](https://modelcontextprotocol.io) server that exposes the [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) registry: certification grades, snapshot dates and five-dimension evidence for DeepSeek Harness (DSH) plugins. Zero runtime dependencies, stdio transport.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `get_certification` | `owner`, `repo` | Full certification record (grade, snapshot, five dimensions, veto, notes) or "no record" |
| `list_certified` | — | Every entry in the public registry: repo / grade / snapshot |
| `certification_spec` | — | Spec v1 summary: five dimensions, grade scale, veto rule |

The embedded snapshot lives in `data/certified.json` (synced from the certification repo) and the server refreshes it from the public registry at most once per five minutes. No writes, no secrets, no code execution.

## Install

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # stdio server
```

Run it directly from the published npm package: `npx dsh-cert-mcp`.

### Register in an MCP client

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

DSH: add it through [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) as a stdio server, or any MCP client that supports `stdio`.

### Install as a DSH bundle

The package declares `dsh.bundle.patch` → `cordis.patch.yml`, so it also installs as a DeepSeek Harness bundle:

```sh
# git channel (latest main)
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

# npm channel (published releases)
dsh plugin --profile web add dsh-cert-mcp
```

The inserted row loads the package through the standard Cordis plugin contract: the host half is a plain ESM module exporting `name`, `inject` and `apply(ctx)`. This package ships no browser UI, so there is no `dsh.client` declaration.

```js
// bundle entry (host half) — the contract the patch row loads
export const name = 'dsh-cert-mcp'
export const inject = ['tools'] // the host tool surface, provided by dsh-tools
export function apply(ctx) {
  // registers the read-only certification lookup surface
  // (get_certification / list_certified / certification_spec)
}
```

**The host half needs the `tools` service** (shipped by `@deepseek-ai/dsh-tools`). A profile without it does not lose the tools silently: Cordis holds this row in `PENDING` until `tools` exists, which is visible in the profile's plugin list. Nothing else is required — no config keys, no credentials, and no network access at load time.

**Two halves, one data path.** The bundle row and the stdio server are separate entry points over the same `handleRequest` core. The server half is an independent process any MCP client can spawn (`node src/index.js`), and it is *not* part of the plugin path: installing this bundle never starts it, and removing the bundle never touches it. Conversely `npx dsh-cert-mcp` registers nothing on the DSH tool surface.

Remove the bundle with `dsh plugin --profile web remove dsh-cert-mcp` (or delete the row from the profile patch). The standalone stdio MCP server above keeps working for any MCP client.

## Why this exists

The official DeepSeek Harness repository does not run a plugin registry and does not accept external PRs; discovery happens through the `dsh-plugin` GitHub topic and community lists, none of which certify anything. `dsh-plugin-certification` turns "can I install this plugin" into a reproducible five-dimension check (manifest, build hygiene, supply-chain Scorecard, release provenance, sandboxed install smoke test) with a public registry and README badges. This MCP server is the same data with an agent-facing interface: agents can look up a plugin's certification before recommending or installing it.

## Registry

Data source: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, spec v1.

## Compatibility

- Node `^22.19.0 || >=24.0.0`.
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0` (declared in `engines.dsh`, with `dsh.manifestVersion: 1`).
- Peer: `@deepseek-ai/cordis` `^4.0.2`. The host half additionally needs the `tools` service at runtime; the stdio half needs nothing but Node.

## Development

```sh
pnpm install
pnpm run typecheck                            # the one type ruler: checkJs over the published host face
pnpm test                                     # JSON-RPC smoke + the real-Cordis runtime suite
pnpm pack                                     # the published tarball
```

The runtime suite mounts the REAL `SystemPrompt`/`ToolRuntime` registries and asserts that mounting this package puts all three certification tools into `ctx.tools.schemas()`, that disposing the fiber removes them again, and that a context without the `tools` service parks the plugin in `PENDING`. `dsh --dump-config` is deliberately not used as acceptance: a mounted row and a pending fiber look the same there.

There is deliberately **one** type ruler. `@deepseek-ai/*` resolves through this repo's own `node_modules` (the pinned devDependencies — the published line) and the package declares no DSH peer, so a second `tsc` configuration would be the same command over the same type universe. The `typecheck:ci` script is kept as the historical no-op duplicate (its only extra key is an empty `paths: {}`) for compatibility with existing references, not as a second face. The independent second piece of evidence is the runtime mount gate above.

**Applicable DSH version:** verified against `dsh-v0.1.7-alpha.1` (the host release this build targets); requires `>=0.1.7-alpha.1 <0.2.0`.

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


## License

Apache-2.0. A listing or grade is an evidence record, not a security guarantee: plugins run inside your DSH process with your permissions.
