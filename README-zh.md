# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-zh.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
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
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0`（声明在 `engines.dsh`，并带 `dsh.manifestVersion: 1`）。
- peer：`@deepseek-ai/cordis` `^4.0.2`。host 半边运行时另需 `tools` 服务；stdio 半边除 Node 外什么都不需要。

## 开发

```sh
pnpm install
pnpm run typecheck                            # 唯一类型尺子：对已发布 host 面做 checkJs
pnpm test                                     # JSON-RPC 冒烟 + 真 Cordis 运行时套件
pnpm pack                                     # 发布用 tarball
```

运行时套件挂载**真实**的 `SystemPrompt`/`ToolRuntime` 注册表，断言：挂载本包会把三个认证工具放进 `ctx.tools.schemas()`；释放 fiber 后它们消失；缺少 `tools` 服务的上下文会让插件停在 `PENDING`。验收**刻意不用** `dsh --dump-config`：在那里，已挂载的 row 与 pending 的 fiber 看起来一模一样。

本仓**刻意只有一把类型尺子**：`@deepseek-ai/*` 经本仓自己的 `node_modules`（钉住的 devDependencies，即已发布线）解析，且本包不声明任何 DSH peer，因此第二份 `tsc` 配置只会是量同一类型宇宙的同一条命令。`typecheck:ci` 脚本作为历史 no-op 副本保留（它唯一的额外键是空 `paths: {}`），只为兼容既有引用，不是第二个类型面。独立的第二份证据是上面的运行时挂载门。

## PerryLink DSH 插件家族

本项目是 [PerryLink](https://github.com/PerryLink) 维护的 [42 个 DeepSeek Harness 插件](https://github.com/PerryLink)之一。如果它帮到了你，其它插件大概也会：

| 插件 | 一句话 |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | 审批链上的第二模型自动复核，默认失败关闭 |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | 强/廉模型自动分层路由，带确定性风险护栏与 `/tier` 命令 |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 可持久化的后台子代理，带 Web UI 侧栏、消息与中断 |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | DeepSeek Harness 的成本治理：预算、碳排与延迟集中在一个面板 |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | PerryLink 家族的 DSH Desktop Market 标准目录源 |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | 会话 + 工作区 + 配置的统一检查点，一条 `/rewind` 回退 |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 把 Claude Code、Codex、OpenCode、Hermes 的会话/记忆/技能迁入 DSH |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | 跨平台原生桌面控制，Windows 优先 |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Web 输入框的终端式历史：方向键与 Ctrl+R 搜索 |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | 确定性的数据集剖析、清洗与引用核验 |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 面向 DeepSeek Harness 的提示注入、越狱与密钥外泄防御 |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | 工程纪律护栏：需求拷问、测试门、对抗式复核 |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | DeepSeek Harness 的统一静态图像生成路由 |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | 只读性能诊断：负载、溢写、压缩与缓存命中率 |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | 中国公募基金研究，带封存可追溯的来源快照 |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issue/CI 集成，所有写操作都过审批门 |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | 行业与公司研究包：产业链图、政策时间线、公司卡片 |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | 一条命令装齐核心家族成员的起步包 |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | 本地文档知识库：混合检索与带引用的注入 |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | 本地 Ollama 模型发现与按任务路由，可回落云端 |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP 诊断、格式化、补全、代码操作、符号与重命名 |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | 模型边界上的 PII 遮罩，host 侧保留还原表 |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | MCP 管理控制台：`/mcp` 命令、设置页与试调用 |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | 过审批门的跨会话记忆协议（`ctx.memory` + SQLite） |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | 从会话事件流导出 OpenTelemetry 与 Langfuse 遥测 |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | 运行期可切换的模型输出风格 |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | 声明式 allow/deny/ask 规则与进程级网络策略 |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | 社区认证注册表：可复现核验的等级与徽章 |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | 面向 DSH 插件的零依赖静态 + 沙箱冒烟检测器 |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | 插件开发知识库、agent 技能与 `dsh-plugin-dev` CLI 工具链 |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | PerryLink DSH 插件共享的零运行时依赖工具箱 |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | 零依赖静态门户，把整个插件家族渲染成一页 |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 多通道审批/提问桥：微信、Telegram、飞书 + 会话控制台 |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | 可验证研究报告：证据账本、清单封存、逐条结论判定 |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | 多维插件质量评分与有证据支撑的排行榜 |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 在 Web 侧栏置顶会话与工作区，每钉一色 |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | 基于 git 的跨设备会话同步，冲突保留双方 |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | 安全审计技能包与 `plugin_vet` 供应链门 |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | 语音优先的会话回路：语音转文字输入、文字转语音回复 |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 跨会话团队房间：共享消息总线、任务板与时间线 |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | 隔离的安装并冒烟试驾，带通过/失败矩阵 |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/滴答清单桥：会话头部面板 + 十一个 agent 工具 |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | 厂商参数翻译与确定性 JSON 修复 |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card | |

## 许可证

Apache-2.0。列表或等级是证据记录，不是安全保证：插件以你的权限运行在你的 DSH 进程内。
