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

## PerryLink DSH Plugin Family

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) के DeepSeek Harness प्लगइन परिवार का हिस्सा है। पूरी सूची नीचे संक्षिप्त रखी गई है ताकि हर README की पहली स्क्रीन छोटी रहे; हर पंक्ति और उसकी स्थिति देखने के लिए इसे खोलें।

<details>
<summary>सभी प्लगइन खोलें</summary>

| प्लगइन | स्थिति |
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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 फ़्रोज़न — रिपॉज़िटरी README देखें |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 सेवानिवृत्त — रिपॉज़िटरी README देखें |

</details>

## लाइसेंस

Apache-2.0. सूची या ग्रेड एक साक्ष्य रिकॉर्ड है, सुरक्षा की गारंटी नहीं: प्लगइन आपके DSH प्रोसेस में आपकी अनुमतियों के साथ चलते हैं।
