# dsh-cert-mcp

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-cert-mcp
```


Read-only [MCP](https://modelcontextprotocol.io) server that exposes the [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) registry: certification grades, snapshot dates and five-dimension evidence for DeepSeek Harness (DSH) plugins. Zero runtime dependencies, stdio transport.


[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads)](https://dshfind.com/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

## Install

```sh
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp
```

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
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp

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

## What is dsh-cert-mcp?

Read-only [MCP](https://modelcontextprotocol.io) server that exposes the [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) registry: certification grades, snapshot dates and five-dimension evidence for DeepSeek Harness (DSH) plugins. Zero runtime dependencies, stdio transport.

![Terminal demo of dsh-cert-mcp: dsh-cert-mcp — stdio MCP server answering tools/list](https://raw.githubusercontent.com/PerryLink/dsh-cert-mcp/main/docs/assets/dsh-cert-mcp-hero.png)

![Animated terminal demo of dsh-cert-mcp](https://raw.githubusercontent.com/PerryLink/dsh-cert-mcp/main/docs/assets/dsh-cert-mcp-demo.gif)

*The same run, animated.*

## Tools

| Tool | Input | Returns |
|---|---|---|
| `get_certification` | `owner`, `repo` | Full certification record (grade, snapshot, five dimensions, veto, notes) or "no record" |
| `list_certified` | — | Every entry in the public registry: repo / grade / snapshot |
| `certification_spec` | — | Spec v1 summary: five dimensions, grade scale, veto rule |

The embedded snapshot lives in `data/certified.json` (synced from the certification repo) and the server refreshes it from the public registry at most once per five minutes. No writes, no secrets, no code execution.

## Why this exists

The official DeepSeek Harness repository does not run a plugin registry and does not accept external PRs; discovery happens through the `dsh-plugin` GitHub topic and community lists, none of which certify anything. `dsh-plugin-certification` turns "can I install this plugin" into a reproducible five-dimension check (manifest, build hygiene, supply-chain Scorecard, release provenance, sandboxed install smoke test) with a public registry and README badges. This MCP server is the same data with an agent-facing interface: agents can look up a plugin's certification before recommending or installing it.

## Registry

Data source: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, spec v1.

**What the registry is, and what a short answer from this server means.** The
registry is an **opt-in subset**: a repository appears in it only after it has
been evaluated, so the absence of a record is *not* evidence that a plugin is
uncertified, and `list_certified` returning few rows is not evidence that few
plugins were assessed. The bundled snapshot held **one** entry (grade A, snapshot
2026-09-07) when this was written; a single-entry list carries no statistical
meaning — a grade describes that one repository, and rankable comparison across
plugins only becomes possible once the registry holds many. Every
`list_certified` reply carries a `coverage` object stating exactly this, so an
agent reading only the tool output cannot mistake the count for ecosystem
coverage. The snapshot's date is **the certification repo's** fact, not a
freshness promise from this server: it is synced byte-for-byte from
`dsh-plugin-certification`, which owns the schedule and the check.

## Compatibility

| Surface | Status |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (devDependencies and the declared `engines.dsh` range both admit that line; `typecheck` and the 5-test suite are green against `@deepseek-ai/dsh-system-prompt` / `@deepseek-ai/dsh-tools` 0.2.1-alpha.1) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Declared host range | `engines.dsh`: `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0 \|\| >=0.2.0-0 <0.3.0 \|\| >=0.2.1-0 <0.3.0`, with `dsh.manifestVersion: 1` |
| Peer | `@deepseek-ai/cordis` `^4.0.2`. The host half additionally needs the `tools` service at runtime; the stdio half needs nothing but Node. |

## Development

```sh
pnpm install
pnpm run typecheck                            # the one type ruler: checkJs over the published host face
pnpm test                                     # JSON-RPC smoke + the real-Cordis runtime suite
pnpm pack                                     # the published tarball
```

The runtime suite mounts the REAL `SystemPrompt`/`ToolRuntime` registries and asserts that mounting this package puts all three certification tools into `ctx.tools.schemas()`, that disposing the fiber removes them again, and that a context without the `tools` service parks the plugin in `PENDING`. `dsh --dump-config` is deliberately not used as acceptance: a mounted row and a pending fiber look the same there.

There is deliberately **one** type ruler. `@deepseek-ai/*` resolves through this repo's own `node_modules` (the pinned devDependencies — the published line) and the package declares no DSH peer, so a second `tsc` configuration would be the same command over the same type universe. The `typecheck:ci` script is kept as the historical no-op duplicate (its only extra key is an empty `paths: {}`) for compatibility with existing references, not as a second face. The independent second piece of evidence is the runtime mount gate above.

## PerryLink DSH Plugin Family

This project is part of the DeepSeek Harness plugin family from [PerryLink](https://github.com/PerryLink). The roster stays collapsed below so every README keeps a short first screen; expand it to see every row and its status.

<details>
<summary>Expand all plugins</summary>

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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 FROZEN — see the repo README |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 FROZEN — see the repo README |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 FROZEN — see the repo README |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 FROZEN — see the repo README |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 FROZEN — see the repo README |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRED — see the repo README |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRED — see the repo README |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRED — see the repo README |

</details>

## License

Apache-2.0. A listing or grade is an evidence record, not a security guarantee: plugins run inside your DSH process with your permissions.
