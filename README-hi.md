# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=hi)](https://dshfind.com/hi/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-cert-mcp
```


केवल-पढ़ने योग्य [MCP](https://modelcontextprotocol.io) सर्वर, जो [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) रजिस्ट्री उजागर करता है: DeepSeek Harness (DSH) प्लगइन्स के प्रमाणन ग्रेड, स्नैपशॉट तिथियाँ और पाँच-आयामी साक्ष्य। शून्य रनटाइम निर्भरताएँ, stdio ट्रांसपोर्ट।

## इंस्टॉल

```sh
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp
```

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
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp

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

## What is dsh-cert-mcp?

केवल-पढ़ने योग्य [MCP](https://modelcontextprotocol.io) सर्वर, जो [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) रजिस्ट्री उजागर करता है: DeepSeek Harness (DSH) प्लगइन्स के प्रमाणन ग्रेड, स्नैपशॉट तिथियाँ और पाँच-आयामी साक्ष्य। शून्य रनटाइम निर्भरताएँ, stdio ट्रांसपोर्ट।

![dsh-cert-mcp का टर्मिनल डेमो: dsh-cert-mcp — stdio MCP server answering tools/list](https://raw.githubusercontent.com/PerryLink/dsh-cert-mcp/main/docs/assets/dsh-cert-mcp-hero.png)

![Animated terminal demo of dsh-cert-mcp](https://raw.githubusercontent.com/PerryLink/dsh-cert-mcp/main/docs/assets/dsh-cert-mcp-demo.gif)

*वही रन, एनिमेटेड।*

## टूल्स

| टूल | इनपुट | लौटाता है |
|---|---|---|
| `get_certification` | `owner`, `repo` | पूरा प्रमाणन रिकॉर्ड (ग्रेड, स्नैपशॉट, पाँच आयाम, वीटो, टिप्पणियाँ) या «कोई रिकॉर्ड नहीं» |
| `list_certified` | — | सार्वजनिक रजिस्ट्री की हर प्रविष्टि: रिपॉज़िटरी / ग्रेड / स्नैपशॉट |
| `certification_spec` | — | स्पेक v1 सारांश: पाँच आयाम, ग्रेड पैमाना, वीटो नियम |

अंतर्निहित स्नैपशॉट `data/certified.json` में रहता है (प्रमाणन रिपॉज़िटरी से सिंक होता है) और सर्वर उसे सार्वजनिक रजिस्ट्री से अधिकतम हर पाँच मिनट में रीफ़्रेश करता है। कोई लेखन नहीं, कोई सीक्रेट नहीं, कोई कोड निष्पादन नहीं।

## यह क्यों मौजूद है

DeepSeek Harness का आधिकारिक रिपॉज़िटरी न प्लगइन रजिस्ट्री चलाता है और न बाहरी PR स्वीकार करता है; खोज GitHub के `dsh-plugin` टॉपिक और समुदाय की सूचियों से होती है, और उनमें से कोई प्रमाणन नहीं करता। `dsh-plugin-certification` «क्या मैं यह प्लगइन इंस्टॉल कर सकता हूँ?» को पुनरुत्पाद्य पाँच-आयामी जाँच में बदल देता है (मैनिफ़ेस्ट, बिल्ड स्वच्छता, सप्लाई-चेन Scorecard, रिलीज़ प्रोवेनेंस, सैंडबॉक्स इंस्टॉल स्मोक), सार्वजनिक रजिस्ट्री और README बैज के साथ। यह MCP सर्वर वही डेटा है, पर एजेंट-उन्मुख इंटरफ़ेस के साथ: एजेंट किसी प्लगइन की सिफ़ारिश या इंस्टॉल से पहले उसका प्रमाणन देख सकता है।

## रजिस्ट्री

डेटा स्रोत: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, स्पेक v1।

**यह रजिस्ट्री क्या है, और इस सर्वर का छोटा उत्तर क्या बताता है।** रजिस्ट्री एक **ऑप्ट-इन उपसमुच्चय** है: कोई रिपॉज़िटरी उसमें तभी आती है जब उसका मूल्यांकन हो चुका हो, इसलिए रिकॉर्ड न मिलना यह **सबूत नहीं** कि वह प्लगइन प्रमाणित नहीं है, और `list_certified` का कम पंक्तियाँ लौटाना यह सबूत नहीं कि बहुत कम प्लगइनों का मूल्यांकन हुआ। यह लिखे जाने के समय साथ भेजे गए स्नैपशॉट में **एक** प्रविष्टि थी (ग्रेड A, स्नैपशॉट 2026-09-07); एक-प्रविष्टि वाली सूची का कोई सांख्यिकीय अर्थ नहीं होता — एक ग्रेड उस एक रिपॉज़िटरी का वर्णन करता है, और प्लगइनों के बीच क्रम-योग्य तुलना तभी संभव होती है जब रजिस्ट्री में बहुत सी प्रविष्टियाँ हों। हर `list_certified` उत्तर के साथ एक `coverage` ऑब्जेक्ट आता है जो यही बात कहता है, ताकि केवल टूल आउटपुट पढ़ने वाला एजेंट गिनती को इकोसिस्टम कवरेज समझ न ले। स्नैपशॉट की तारीख़ **प्रमाणन रिपॉज़िटरी** का तथ्य है, इस सर्वर की ताज़गी की गारंटी नहीं: यह `dsh-plugin-certification` से बाइट-दर-बाइट सिंक होता है, और समय-सारणी तथा जाँच उसी की है।

## अनुकूलता

| सतह | स्थिति |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (devDependencies and the declared `engines.dsh` range both admit that line; `typecheck` and the 5-test suite are green against `@deepseek-ai/dsh-system-prompt` / `@deepseek-ai/dsh-tools` 0.2.1-alpha.1) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| घोषित host रेंज | `engines.dsh`: `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0 \|\| >=0.2.0-0 <0.3.0 \|\| >=0.2.1-0 <0.3.0`, साथ में `dsh.manifestVersion: 1` |
| peer | `@deepseek-ai/cordis` `^4.0.2`। host आधे को रनटाइम पर `tools` सेवा भी चाहिए; stdio आधे को Node के अलावा कुछ नहीं चाहिए। |

## विकास

```sh
pnpm install
pnpm run typecheck                            # एकमात्र टाइप रूलर: प्रकाशित host सतह पर checkJs
pnpm test                                     # JSON-RPC स्मोक + असली Cordis रनटाइम सूट
pnpm pack                                     # प्रकाशित tarball
```

रनटाइम सूट **असली** `SystemPrompt`/`ToolRuntime` रजिस्ट्रियाँ माउंट करता है और जाँचता है कि यह पैकेज माउंट करने पर तीनों प्रमाणन टूल `ctx.tools.schemas()` में आ जाते हैं, fiber छोड़ने पर हट जाते हैं, और `tools` सेवा के बिना संदर्भ में प्लगइन `PENDING` रहता है। स्वीकृति के लिए `dsh --dump-config` जान-बूझकर नहीं इस्तेमाल किया जाता: वहाँ माउंट हुई पंक्ति और लंबित fiber एक जैसे दिखते हैं।

यहाँ जान-बूझकर **केवल एक** टाइप रूलर है। `@deepseek-ai/*` इस रेपो के अपने `node_modules` (पिन की गई devDependencies, यानी प्रकाशित लाइन) से resolve होता है और पैकेज कोई DSH peer घोषित नहीं करता, इसलिए दूसरा `tsc` कॉन्फ़िग उसी टाइप ब्रह्मांड पर वही कमांड होता। `typecheck:ci` स्क्रिप्ट ऐतिहासिक no-op प्रतिलिपि है (उसका अतिरिक्त मात्र खाली `paths: {}` है) और पुराने संदर्भों के लिए रखी गई है, दूसरी टाइप सतह के रूप में नहीं। स्वतंत्र दूसरा साक्ष्य ऊपर दिया गया रनटाइम माउंट गेट है।

## PerryLink DSH प्लगइन परिवार

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के **87 सक्रिय रूप से अनुरक्षित** DeepSeek Harness प्लगइन में से एक है। पूरा परिवार **95** प्लगइन है — **5 फ़्रोज़न**, **3 सेवानिवृत्त** — और नीचे संक्षिप्त रखा गया है ताकि हर README की पहली स्क्रीन छोटी रहे। हर पंक्ति देखने के लिए इसे खोलें; कारण स्थिति कॉलम में है।

<details>
<summary>सभी 95 प्लगइन खोलें</summary>

| प्लगइन | एक पंक्ति | स्थिति |
|---|---|---|
| **[dsh-aqua-input-check](https://github.com/PerryLink/dsh-aqua-input-check)** | 水产养殖投入品记录核对（按投入品用量、休药期与起捕间隔核对记录自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-archive-check](https://github.com/PerryLink/dsh-archive-check)** | 档案归档完整性与保管期限核对（依据《档案法》及配套规定，仅提示差异，不作出定性结论） |  |
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Second-model auto-review on the approval chain, fail-closed by default |  |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Automatic strong/cheap model-tier routing with deterministic risk guards and a `/tier` command |  |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Durable background child agents with a Web UI sidebar, messaging and interrupt | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-bid-ca-precheck](https://github.com/PerryLink/dsh-bid-ca-precheck)** | 投标文件符合性预检（按招标文件逐条核对响应情况，仅提示差异，不作出定性结论） |  |
| **[dsh-bid-qual-check](https://github.com/PerryLink/dsh-bid-qual-check)** | 投标人资格条件核对（按资格条件与证明材料核对逐条响应，仅提示差异，不作出定性结论） |  |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Cost governance for DeepSeek Harness: budgets, carbon, and latency in one panel. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-cert-mcp](https://github.com/PerryLink/dsh-cert-mcp)** | Read-only MCP server exposing the certification registry: grades, snapshots and five-dimension evidence |  |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Claude Code /rewind-equivalent: snapshots, session forks, one-shot restore |  |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migrate Claude Code sessions, memory, skills and CLAUDE.md into DSH | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Cross-platform native desktop control for DeepSeek Harness — Windows first. |  |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Terminal-style input history for the web composer: arrows, Ctrl+R search |  |
| **[dsh-contract-stance](https://github.com/PerryLink/dsh-contract-stance)** | 合同条款立场台账核对（按立场、风险等级与退让底线核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-customs-doc-check](https://github.com/PerryLink/dsh-customs-doc-check)** | 报关单证一致性核对（按公开的报关单填制规范核对单证间字段一致性，仅提示差异，不作出定性结论） |  |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Dataset quality checks and citation cross-checks (the optional numeric bridge consumed here) |  |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Prompt-injection, jailbreak, and secret-leak defense for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-demurrage-ledger](https://github.com/PerryLink/dsh-demurrage-ledger)** | 滞箱费台账核对（按免箱期与费率核对超期天数与金额的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Engineering-discipline guard: requirements grill, test gates, adversary review |  |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Unified static-image generation routing for DeepSeek Harness. | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-drill-script-check](https://github.com/PerryLink/dsh-drill-script-check)** | 应急演练脚本核对（按阶段、响应分级、指挥与资源要素核对脚本齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-eia-guide-check](https://github.com/PerryLink/dsh-eia-guide-check)** | 环评导则适用性核对（按要素、导则名称与执行标准核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-emergency-plan](https://github.com/PerryLink/dsh-emergency-plan)** | 应急预案要素齐备性与条款级页码定位（依据 GB/T 29639-2020 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-essay-rubric-check](https://github.com/PerryLink/dsh-essay-rubric-check)** | 作文量表评分核对（按评分项、原文定位与分值算术核对评分自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-evidence-check](https://github.com/PerryLink/dsh-evidence-check)** | 证据清单齐备性核对（按待证事实与证据要素核对清单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-export-ctl-check](https://github.com/PerryLink/dsh-export-ctl-check)** | 出口管制物项核对（按管制清单、最终用途与许可证核对台账齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Read-only performance diagnostics for DeepSeek Harness. |  |
| **[dsh-fmea-table-check](https://github.com/PerryLink/dsh-fmea-table-check)** | FMEA 分析表要素齐备性与风险顺序数一致性核对（按公开的 FMEA 方法标准核对表内自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-forecast-penalty](https://github.com/PerryLink/dsh-forecast-penalty)** | 预测准确率考核核对（按准确率、门槛与考核单价核对考核费用的算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Deterministic research reports for Chinese public mutual funds |  |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issues integration for DSH, every write gated by approval |  |
| **[dsh-gongwen-flow-check](https://github.com/PerryLink/dsh-gongwen-flow-check)** | 公文流转与办理时限核对（按公开的公文处理规范核对环节完整性与时限，仅提示差异，不作出定性结论） |  |
| **[dsh-gongwen-word-check](https://github.com/PerryLink/dsh-gongwen-word-check)** | 公文格式要素核对（按公开的党政机关公文格式标准核对版头与主体要素，仅提示差异，不作出定性结论） |  |
| **[dsh-guard-plan-qc](https://github.com/PerryLink/dsh-guard-plan-qc)** | 劳动保护与安全防护用品配置表核对（按公开的配备标准核对品名规格与配置数量，仅提示差异，不作出定性结论） |  |
| **[dsh-hazchem-check](https://github.com/PerryLink/dsh-hazchem-check)** | 危险化学品临界量与重大危险源辨识核对（按储存量与临界量核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-hazplan-check](https://github.com/PerryLink/dsh-hazplan-check)** | HAZOP 分析表要素齐备性与偏差推导一致性核对（依据公开的危险与可操作性分析标准，仅提示差异，不作出定性结论） |  |
| **[dsh-hidden-risk-map](https://github.com/PerryLink/dsh-hidden-risk-map)** | 安全隐患台账→《工贸企业重大事故隐患判定标准》（应急管理部令第10号）条款映射提示（仅提示差异，不作出定性结论） |  |
| **[dsh-hs-classify](https://github.com/PerryLink/dsh-hs-classify)** | 商品归类层级一致性核对（按章、品目、子目与商品编号的层级关系核对自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-icd-rule-check](https://github.com/PerryLink/dsh-icd-rule-check)** | ICD 合并编码与星剑号配对提示（依据 GB/T 14396-2016 与公开的 ICD 使用说明，仅提示差异，不作出定性结论） |  |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Industry research orchestration that seals its deliverables through this plugin's `ctx.researchReport.assemble` |  |
| **[dsh-lawcite-adapter](https://github.com/PerryLink/dsh-lawcite-adapter)** | 法条引用与文书要素核对（按名称、条号、原文与效力状态核对引用可核验性，仅提示差异，不作出定性结论） |  |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools |  |
| **[dsh-lc-doc-check](https://github.com/PerryLink/dsh-lc-doc-check)** | 信用证单据条款核对（按单据种类、份数、期限与不符点核对交单自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-learning-gap-check](https://github.com/PerryLink/dsh-learning-gap-check)** | 能力差距与培养计划核对（按能力等级差、培养措施与完成期限核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Local document knowledge base for DeepSeek Harness. |  |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Local-model (Ollama) integration for DeepSeek Harness. |  |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP diagnostics, formatting, completion, code actions and rename over language servers |  |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | PII masking middleware: anonymize at the model boundary, restore at the display layer |  |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Read-only MCP runtime panel: /mcp command + Settings tab with status, tools and errors |  |
| **[dsh-medrec-qc](https://github.com/PerryLink/dsh-medrec-qc)** | 病案首页形式质控与逻辑矛盾提示（依据国卫办医发〔2016〕24号等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Approval-gated cross-session memory: ctx.memory seam + SQLite + memory tool |  |
| **[dsh-nsfc-form-check](https://github.com/PerryLink/dsh-nsfc-form-check)** | 国家自然科学基金申请书形式审查与匿名化提示（依据《国家自然科学基金条例》与申请人导入的当年指南，仅提示差异，不作出定性结论） |  |
| **[dsh-nurse-record-check](https://github.com/PerryLink/dsh-nurse-record-check)** | 护理记录时限、签名与评估表完整性校验（依据《病历书写基本规范》等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | OpenTelemetry and Langfuse observability exporter for DeepSeek Harness. |  |
| **[dsh-origin-rvc-check](https://github.com/PerryLink/dsh-origin-rvc-check)** | 原产地区域价值成分核对（按 RVC 定义式与门槛核对原产地判定自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-ota-review-check](https://github.com/PerryLink/dsh-ota-review-check)** | 在线点评回复台账核对（按回复时限、问题分类与整改状态核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Claude Code outputStyles-equivalent runtime style switching |  |
| **[dsh-paper-doc-adapter](https://github.com/PerryLink/dsh-paper-doc-adapter)** | 试卷解析结构核对（按题型、答案、分值与 yotta 标识核对试卷结构自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Claude Code-style declarative allow/deny/ask permission rules with audit |  |
| **[dsh-permit-report-check](https://github.com/PerryLink/dsh-permit-report-check)** | 行政许可办理核对（按申请材料、法定时限与决定记录核对台账闭环，仅提示差异，不作出定性结论） |  |
| **[dsh-pipeline-check](https://github.com/PerryLink/dsh-pipeline-check)** | 项目全流程文件链条核对（按环节先后与金额口径核对链条自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-pleading-draft](https://github.com/PerryLink/dsh-pleading-draft)** | 起诉状要素齐备性核对（按诉请、事实、证据、法条四要素核对文书齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Zero-dependency static + sandbox smoke detector for DSH plugins |  |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Plugin-development knowledge base as an on-demand agent skill |  |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Shared zero-runtime-dependency toolkit for the PerryLink DSH plugins |  |
| **[dsh-plugin-upgrade](https://github.com/PerryLink/dsh-plugin-upgrade)** | One-package, one-corridor-index plugin upgrade skill: routes a repository to the matching closed corridor card |  |
| **[dsh-policy-brief-draft](https://github.com/PerryLink/dsh-policy-brief-draft)** | 政策专报要素核对（按观点、依据、出处与建议核对专报齐备，仅提示差异，不作出定性结论） |  |
| **[dsh-power-loss-split](https://github.com/PerryLink/dsh-power-loss-split)** | 线损电量拆分与考核表核对（依据公开的线损计算口径，仅提示差异，不作出定性结论） |  |
| **[dsh-power-ticket-check](https://github.com/PerryLink/dsh-power-ticket-check)** | 电力工作票要素齐备性与签发许可顺序核对（依据现行电力安全工作规程，仅提示差异，不作出定性结论） |  |
| **[dsh-ppap-check](https://github.com/PerryLink/dsh-ppap-check)** | PPAP 提交要素齐备性核对（按公开的 PPAP 手册与提交等级核对要素齐备与版本填写，仅提示差异，不作出定性结论） |  |
| **[dsh-protest-deadline](https://github.com/PerryLink/dsh-protest-deadline)** | 质疑与投诉期限核对（按公开的政府采购质疑投诉规定核对期限与台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-railway-window](https://github.com/PerryLink/dsh-railway-window)** | 铁路施工天窗台账核对（按时间窗、时长算术与命令号核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Multi-channel approval/question bridge: WeChat/Telegram/Feishu, session console | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-repair-order-qc](https://github.com/PerryLink/dsh-repair-order-qc)** | 维修工单结算核对（按项目金额、配件工时合计与结算总额核对算术自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Verifiable research-report engine: content-addressed evidence ledger and sealed versions |  |
| **[dsh-review-reply-check](https://github.com/PerryLink/dsh-review-reply-check)** | 审稿意见逐条回应覆盖核对（按意见与回应一一对应核对覆盖完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-rulefile-check](https://github.com/PerryLink/dsh-rulefile-check)** | 规则库文件自检核对（按条款引用纪律与效力上限核对规则库自身合规，仅提示差异，不作出定性结论） |  |
| **[dsh-safety-brief-check](https://github.com/PerryLink/dsh-safety-brief-check)** | 安全技术交底记录要素齐备性与签字闭环核对（依据公开的安全生产法规与检查标准，仅提示差异，不作出定性结论） |  |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Multi-dimensional quality scoring for DeepSeek Harness plugins. |  |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Pin sessions in the Web sidebar with durable ordering | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Cross-device session sync for DeepSeek Harness — a dedicated git mirror of your session store. |  |
| **[dsh-site-log-check](https://github.com/PerryLink/dsh-site-log-check)** | 监理日志跨日连续性与旁站覆盖提示（依据 GB/T 50319-2013 等公开文件，仅提示差异，不作出定性结论） |  |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Security-audit skill pack: secret scan, dependency and supply-chain review |  |
| **[dsh-soe-decision-check](https://github.com/PerryLink/dsh-soe-decision-check)** | 三重一大决策台账核对（按前置研究、会议审议与决议记录核对程序留痕，仅提示差异，不作出定性结论） |  |
| **[dsh-soilwater-check](https://github.com/PerryLink/dsh-soilwater-check)** | 土壤与地下水监测台账核对（按点位、监测项目、限值与超标判定核对台账自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-sop-sync-check](https://github.com/PerryLink/dsh-sop-sync-check)** | 作业规程与 FMEA／控制计划一致性核对（按编号与版本核对三份文件是否同步，仅提示差异，不作出定性结论） |  |
| **[dsh-spc-gbt-adapter](https://github.com/PerryLink/dsh-spc-gbt-adapter)** | 控制图常数与过程能力指数核对（按 GB/T 4091 的常规控制图常数表核对控制限与 Cp/Cpk 的自洽性，仅提示差异，不作出定性结论） |  |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Voice-first session loop for DeepSeek Harness: talk to it, hear it answer. |  |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Cross-session team rooms: shared message bus, task board and timeline | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-tender-extract](https://github.com/PerryLink/dsh-tender-extract)** | 招标文件条款摘录核对（按出处与原文逐字核对摘录完整性，仅提示差异，不作出定性结论） |  |
| **[dsh-tender-matrix](https://github.com/PerryLink/dsh-tender-matrix)** | 评标因素评分矩阵核对（按分值上限与合计核对矩阵自洽，仅提示差异，不作出定性结论） |  |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Isolated install-and-smoke test drives for DeepSeek Harness plugins. |  |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 task bridge: session-header panel + 11 tools |  |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Vendor parameter translation and deterministic JSON repair for DeepSeek Harness. |  |
| **[dsh-warranty-calc](https://github.com/PerryLink/dsh-warranty-calc)** | 质保期与索赔金额核对（按质保期月数与里程、索赔金额算式核对自洽，仅提示差异，不作出定性结论） |  |

</details>## लाइसेंस

Apache-2.0. सूची या ग्रेड एक साक्ष्य रिकॉर्ड है, सुरक्षा की गारंटी नहीं: प्लगइन आपके DSH प्रोसेस में आपकी अनुमतियों के साथ चलते हैं।
