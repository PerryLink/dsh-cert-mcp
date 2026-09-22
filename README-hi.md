# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

केवल-पढ़ने योग्य [MCP](https://modelcontextprotocol.io) सर्वर, जो [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) रजिस्ट्री उजागर करता है: DeepSeek Harness (DSH) प्लगइन्स के प्रमाणन ग्रेड, स्नैपशॉट तिथियाँ और पाँच-आयामी साक्ष्य। शून्य रनटाइम निर्भरताएँ, stdio ट्रांसपोर्ट।

## टूल्स

| टूल | इनपुट | लौटाता है |
|---|---|---|
| `get_certification` | `owner`, `repo` | पूरा प्रमाणन रिकॉर्ड (ग्रेड, स्नैपशॉट, पाँच आयाम, वीटो, टिप्पणियाँ) या «कोई रिकॉर्ड नहीं» |
| `list_certified` | — | सार्वजनिक रजिस्ट्री की हर प्रविष्टि: रिपॉज़िटरी / ग्रेड / स्नैपशॉट |
| `certification_spec` | — | स्पेक v1 सारांश: पाँच आयाम, ग्रेड पैमाना, वीटो नियम |

अंतर्निहित स्नैपशॉट `data/certified.json` में रहता है (प्रमाणन रिपॉज़िटरी से सिंक होता है) और सर्वर उसे सार्वजनिक रजिस्ट्री से अधिकतम हर पाँच मिनट में रीफ़्रेश करता है। कोई लेखन नहीं, कोई सीक्रेट नहीं, कोई कोड निष्पादन नहीं।

## इंस्टॉल

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # stdio सर्वर
```

प्रकाशित npm पैकेज से सीधे भी चलाया जा सकता है: `npx dsh-cert-mcp`।

### MCP क्लाइंट में रजिस्टर करें

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

DSH: इसे [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) के ज़रिये stdio सर्वर की तरह जोड़ें, या कोई भी `stdio`-समर्थित MCP क्लाइंट इस्तेमाल करें।

### DSH बंडल के रूप में इंस्टॉल करें

यह पैकेज `dsh.bundle.patch` → `cordis.patch.yml` घोषित करता है, इसलिए यह DeepSeek Harness बंडल के रूप में भी इंस्टॉल होता है:

```sh
# git चैनल (नवीनतम main)
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

# npm चैनल (प्रकाशित रिलीज़)
dsh plugin --profile web add dsh-cert-mcp
```

जोड़ी गई पंक्ति पैकेज को मानक Cordis प्लगइन कॉन्ट्रैक्ट से लोड करती है: host आधा एक सामान्य ESM मॉड्यूल है जो `name`, `inject` और `apply(ctx)` को नामित रूप से निर्यात करता है। इस पैकेज में ब्राउज़र UI नहीं है, इसलिए `dsh.client` घोषणा भी नहीं है।

```js
// बंडल प्रवेश (host आधा) — वही कॉन्ट्रैक्ट जो patch पंक्ति लोड करती है
export const name = 'dsh-cert-mcp'
export const inject = ['tools'] // host टूल सतह, जो dsh-tools देता है
export function apply(ctx) {
  // केवल-पढ़ने योग्य प्रमाणन लुकअप सतह रजिस्टर करता है
  // (get_certification / list_certified / certification_spec)
}
```

**host आधे को `tools` सेवा चाहिए** (जो `@deepseek-ai/dsh-tools` देता है)। उसके बिना प्रोफ़ाइल चुपचाप टूल्स नहीं खोती: Cordis इस पंक्ति को `PENDING` में रोक देता है, जो प्रोफ़ाइल की प्लगइन सूची में दिखता है। और कुछ ज़रूरी नहीं — न कॉन्फ़िग कुंजियाँ, न क्रेडेंशियल, न लोड के समय नेटवर्क।

**दो आधे, एक ही डेटा पथ।** बंडल पंक्ति और stdio सर्वर एक ही `handleRequest` कोर के दो प्रवेश हैं। सर्वर आधा एक स्वतंत्र प्रक्रिया है जिसे कोई भी MCP क्लाइंट चला सकता है (`node src/index.js`), और वह **प्लगइन पथ का हिस्सा नहीं है**: यह बंडल इंस्टॉल करने से वह कभी शुरू नहीं होता, और हटाने से वह कभी प्रभावित नहीं होता। इसके विपरीत `npx dsh-cert-mcp` DSH टूल सतह पर कुछ भी रजिस्टर नहीं करता।

हटाने के लिए: `dsh plugin --profile web remove dsh-cert-mcp` (या प्रोफ़ाइल patch से पंक्ति मिटा दें)। अलग खड़ा stdio MCP सर्वर किसी भी MCP क्लाइंट के लिए पहले की तरह काम करता रहता है।

## यह क्यों मौजूद है

DeepSeek Harness का आधिकारिक रिपॉज़िटरी न प्लगइन रजिस्ट्री चलाता है और न बाहरी PR स्वीकार करता है; खोज GitHub के `dsh-plugin` टॉपिक और समुदाय की सूचियों से होती है, और उनमें से कोई प्रमाणन नहीं करता। `dsh-plugin-certification` «क्या मैं यह प्लगइन इंस्टॉल कर सकता हूँ?» को पुनरुत्पाद्य पाँच-आयामी जाँच में बदल देता है (मैनिफ़ेस्ट, बिल्ड स्वच्छता, सप्लाई-चेन Scorecard, रिलीज़ प्रोवेनेंस, सैंडबॉक्स इंस्टॉल स्मोक), सार्वजनिक रजिस्ट्री और README बैज के साथ। यह MCP सर्वर वही डेटा है, पर एजेंट-उन्मुख इंटरफ़ेस के साथ: एजेंट किसी प्लगइन की सिफ़ारिश या इंस्टॉल से पहले उसका प्रमाणन देख सकता है।

## रजिस्ट्री

डेटा स्रोत: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, स्पेक v1।

## अनुकूलता

- Node `^22.19.0 || >=24.0.0`।
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0` (`engines.dsh` में घोषित, साथ में `dsh.manifestVersion: 1`)।
- peer: `@deepseek-ai/cordis` `^4.0.2`। host आधे को रनटाइम पर `tools` सेवा भी चाहिए; stdio आधे को Node के अलावा कुछ नहीं चाहिए।

## विकास

```sh
pnpm install
pnpm run typecheck                            # एकमात्र टाइप रूलर: प्रकाशित host सतह पर checkJs
pnpm test                                     # JSON-RPC स्मोक + असली Cordis रनटाइम सूट
pnpm pack                                     # प्रकाशित tarball
```

रनटाइम सूट **असली** `SystemPrompt`/`ToolRuntime` रजिस्ट्रियाँ माउंट करता है और जाँचता है कि यह पैकेज माउंट करने पर तीनों प्रमाणन टूल `ctx.tools.schemas()` में आ जाते हैं, fiber छोड़ने पर हट जाते हैं, और `tools` सेवा के बिना संदर्भ में प्लगइन `PENDING` रहता है। स्वीकृति के लिए `dsh --dump-config` जान-बूझकर नहीं इस्तेमाल किया जाता: वहाँ माउंट हुई पंक्ति और लंबित fiber एक जैसे दिखते हैं।

यहाँ जान-बूझकर **केवल एक** टाइप रूलर है। `@deepseek-ai/*` इस रेपो के अपने `node_modules` (पिन की गई devDependencies, यानी प्रकाशित लाइन) से resolve होता है और पैकेज कोई DSH peer घोषित नहीं करता, इसलिए दूसरा `tsc` कॉन्फ़िग उसी टाइप ब्रह्मांड पर वही कमांड होता। `typecheck:ci` स्क्रिप्ट ऐतिहासिक no-op प्रतिलिपि है (उसका अतिरिक्त मात्र खाली `paths: {}` है) और पुराने संदर्भों के लिए रखी गई है, दूसरी टाइप सतह के रूप में नहीं। स्वतंत्र दूसरा साक्ष्य ऊपर दिया गया रनटाइम माउंट गेट है।

**लागू DSH संस्करण:** `dsh-v0.1.7-alpha.1` (यह बिल्ड जिस होस्ट रिलीज़ को लक्षित करता है) पर सत्यापित; आवश्यक `>=0.1.7-alpha.1 <0.2.0`।

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


## लाइसेंस

Apache-2.0. सूची या ग्रेड एक साक्ष्य रिकॉर्ड है, सुरक्षा की गारंटी नहीं: प्लगइन आपके DSH प्रोसेस में आपकी अनुमतियों के साथ चलते हैं।
