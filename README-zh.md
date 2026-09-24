# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=zh)](https://dshfind.com/zh/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

只读 [MCP](https://modelcontextprotocol.io) 服务器，对外暴露 [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) 注册表：DeepSeek Harness（DSH）插件的认证等级、快照日期与五维证据。零运行时依赖，stdio 传输。

## 工具

| 工具 | 输入 | 返回 |
|---|---|---|
| `get_certification` | `owner`、`repo` | 完整认证记录（等级、快照、五个维度、否决项、备注）或「无记录」 |
| `list_certified` | — | 公开注册表的全部条目：仓库 / 等级 / 快照 |
| `certification_spec` | — | 规范 v1 摘要：五个维度、等级刻度、否决规则 |

内嵌快照位于 `data/certified.json`（由认证仓同步而来），服务器最多每五分钟从公开注册表刷新一次。不写入、不涉及密钥、不执行代码。

## 安装

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # stdio 服务器
```

也可以直接从已发布的 npm 包运行：`npx dsh-cert-mcp`。

### 在 MCP 客户端中注册

Claude Code：

```sh
claude mcp add dsh-cert -- node <path-to-repo>/src/index.js
```

Claude Desktop（`claude_desktop_config.json`）：

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

DSH：通过 [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) 以 stdio 服务器方式添加，或使用任何支持 `stdio` 的 MCP 客户端。

### 作为 DSH bundle 安装

本包声明了 `dsh.bundle.patch` → `cordis.patch.yml`，因此也可作为 DeepSeek Harness bundle 安装：

```sh
# git 通道（main 最新）
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

# npm 通道（已发布版本）
dsh plugin --profile web add dsh-cert-mcp
```

插入的 row 通过标准 Cordis 插件契约加载本包：host 半边是普通 ESM 模块，具名导出 `name`、`inject` 与 `apply(ctx)`。本包不含浏览器 UI，因此没有 `dsh.client` 声明。

```js
// bundle 入口（host 半边）—— patch row 加载的契约
export const name = 'dsh-cert-mcp'
export const inject = ['tools'] // 宿主工具面，由 dsh-tools 提供
export function apply(ctx) {
  // 注册只读认证查询面
  // （get_certification / list_certified / certification_spec）
}
```

**host 半边需要 `tools` 服务**（由 `@deepseek-ai/dsh-tools` 提供）。缺少该服务的 profile 不会静默丢失工具：Cordis 会把这个 row 停在 `PENDING`，在 profile 的插件列表里看得见。除此之外不需要任何东西——没有配置键、没有凭据，加载期也不联网。

**两个半边，同一条数据路径。** bundle row 与 stdio 服务器是同一份 `handleRequest` 核心的两个入口。server 半边是独立进程，任何 MCP 客户端都能拉起（`node src/index.js`），它**不在插件路径上**：安装本 bundle 不会启动它，卸载本 bundle 也不会碰它；反过来 `npx dsh-cert-mcp` 不会在 DSH 工具面上注册任何东西。

卸载：`dsh plugin --profile web remove dsh-cert-mcp`（或从 profile patch 里删掉该 row）。上面的独立 stdio MCP 服务器对任何 MCP 客户端照旧可用。

## 为什么需要它

DeepSeek Harness 官方仓不运营插件注册表，也不接受外部 PR；发现渠道是 `dsh-plugin` GitHub topic 与社区列表，而它们都不做认证。`dsh-plugin-certification` 把「这个插件我能不能装」变成可复现的五维检查（清单、构建卫生、供应链 Scorecard、发布溯源、沙箱安装冒烟），并给出公开注册表与 README 徽章。本 MCP 服务器是同一份数据的 agent 界面：agent 在推荐或安装某个插件之前，可以先查它的认证记录。

## 注册表

数据源：[PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) —— `data/certified.json`，规范 v1。

## 兼容性

- Node `^22.19.0 || >=24.0.0`。
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0 || >=0.1.7-0 <0.2.0`（声明在 `engines.dsh`，并带 `dsh.manifestVersion: 1`）。
- peer：`@deepseek-ai/cordis` `^4.0.2`。host 半边运行时另需 `tools` 服务；stdio 半边除 Node 外什么都不需要。

## 开发

```sh
pnpm install
pnpm run typecheck                            # 已发布尺子：对已安装 host 面做 checkJs
pnpm run typecheck:checkout                   # 检出尺子：同一文件集改对本地 harness 检出的已构建类型编译
pnpm test                                     # JSON-RPC 冒烟 + 真 Cordis 运行时套件
pnpm pack                                     # 发布用 tarball
```

运行时套件挂载**真实**的 `SystemPrompt`/`ToolRuntime` 注册表，断言：挂载本包会把三个认证工具放进 `ctx.tools.schemas()`；释放 fiber 后它们消失；缺少 `tools` 服务的上下文会让插件停在 `PENDING`。验收**刻意不用** `dsh --dump-config`：在那里，已挂载的 row 与 pending 的 fiber 看起来一模一样。

本仓现在有**两把**类型尺子，且都在同一条宿主线上：`typecheck` 经本仓自己的 `node_modules`（钉住的 devDependencies，即已发布的 `0.1.7-rc.1` 线）解析 `@deepseek-ai/*`，本包不声明任何 DSH peer，因此量的是已发布面；`typecheck:checkout` 用 `tsconfig.checkout.json` 的 `paths` 把同一文件集改为对本地 harness 检出的已构建类型面编译（检出位于上四级目录），因此被已发布包掩盖的破坏仍会在这里失败。`typecheck:ci` 脚本作为历史 no-op 副本保留（其唯一额外键是空 `paths: {}`），只为兼容既有引用，不是第三个类型面。独立的第二份证据是上面的运行时挂载门。

**适用的 DSH 版本：** 已在 `dsh-v0.1.7-rc.1`（本构建所针对的宿主版本）上验证；要求 `>=0.1.7-alpha.1 <0.2.0`。

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


## 许可证

Apache-2.0。列表或等级是证据记录，不是安全保证：插件以你的权限运行在你的 DSH 进程内。
