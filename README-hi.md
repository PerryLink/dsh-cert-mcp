# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
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

## PerryLink DSH प्लगइन परिवार

यह प्रोजेक्ट [PerryLink](https://github.com/PerryLink) द्वारा अनुरक्षित [41 DeepSeek Harness प्लगइन्स](https://github.com/PerryLink) में से एक है। अगर यह आपके काम आया, तो बाकी भी आएँगे:

| प्लगइन | एक पंक्ति में |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | स्वीकृति श्रृंखला पर दूसरे मॉडल की स्वतः समीक्षा, डिफ़ॉल्ट रूप से fail-closed |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | मज़बूत/सस्ता मॉडल-टियर स्वतः रूटिंग, नियतात्मक जोखिम गार्ड और `/tier` कमांड के साथ |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | टिकाऊ पृष्ठभूमि चाइल्ड एजेंट, Web UI साइडबार, संदेश और इंटरप्ट के साथ |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | DeepSeek Harness के लिए लागत शासन: बजट, कार्बन और विलंबता एक पैनल में |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | PerryLink परिवार के लिए DSH Desktop Market का मानक कैटलॉग स्रोत |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | सत्र + कार्यक्षेत्र + कॉन्फ़िग के एकीकृत चेकपॉइंट, एक `/rewind` से वापसी |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Claude Code, Codex, OpenCode और Hermes के सत्र, स्मृतियाँ और स्किल्स DSH में लाएँ |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | क्रॉस-प्लेटफ़ॉर्म नेटिव डेस्कटॉप नियंत्रण, Windows पहले |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | वेब कंपोज़र के लिए टर्मिनल-शैली इनपुट इतिहास: तीर कुंजियाँ और Ctrl+R खोज |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | नियतात्मक डेटासेट प्रोफ़ाइलिंग, सफ़ाई और उद्धरण सत्यापन |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | प्रॉम्प्ट-इंजेक्शन, जेलब्रेक और सीक्रेट-लीक से रक्षा |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | इंजीनियरिंग-अनुशासन गार्ड: आवश्यकता पड़ताल, टेस्ट गेट, प्रतिकूल समीक्षा |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | स्थिर छवि निर्माण के लिए एकीकृत रूटिंग |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | केवल-पढ़ने योग्य प्रदर्शन निदान: लोड, स्पिल, कम्पैक्शन और कैश हिट दर |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | चीनी म्यूचुअल-फंड शोध, सीलबंद और ट्रेस करने योग्य स्रोत स्नैपशॉट के साथ |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | GitHub PR/issue/CI एकीकरण, हर लेखन स्वीकृति-गेटेड |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | उद्योग और कंपनी शोध पैक: श्रृंखला मानचित्र, नीति समयरेखा, कंपनी कार्ड |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | एक कमांड में परिवार का मुख्य हिस्सा इंस्टॉल करने वाला स्टार्टर पैक |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | स्थानीय दस्तावेज़ ज्ञानकोश: हाइब्रिड खोज और उद्धरण-सजग इंजेक्शन |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | स्थानीय Ollama मॉडल खोज और कार्य-आधारित रूटिंग, क्लाउड फ़ॉलबैक के साथ |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | LSP निदान, फ़ॉर्मैटिंग, पूर्णता, कोड क्रियाएँ, प्रतीक और नाम बदलना |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | मॉडल सीमा पर PII मास्किंग, host-पक्षीय रिस्टोर तालिका के साथ |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | MCP प्रबंधन कंसोल: `/mcp` कमांड, सेटिंग्स टैब और परीक्षण कॉल |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | स्वीकृति-गेटेड क्रॉस-सेशन मेमोरी प्रोटोकॉल (`ctx.memory` + SQLite) |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | सत्र इवेंट स्ट्रीम से OpenTelemetry और Langfuse टेलीमेट्री निर्यात |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | रनटाइम पर बदलने योग्य मॉडल आउटपुट शैलियाँ |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | घोषणात्मक allow/deny/ask नियम और प्रक्रिया-स्तरीय नेटवर्क नीति |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | समुदाय प्रमाणन रजिस्ट्री, पुनः-सत्यापनीय ग्रेड और बैज के साथ |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | DSH प्लगइन्स के लिए शून्य-निर्भरता स्थिर + सैंडबॉक्स स्मोक डिटेक्टर |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | प्लगइन-विकास ज्ञानकोश, एजेंट स्किल और `dsh-plugin-dev` CLI टूलचेन |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | PerryLink DSH प्लगइन्स के लिए साझा शून्य-रनटाइम निर्भरता टूलकिट |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | शून्य-निर्भरता स्थिर पोर्टल, पूरे परिवार को एक पृष्ठ पर |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | विलय हो चुका `0.1.3-alpha.1` → `0.1.5-rc.1` अपग्रेड कॉरिडोर कार्ड और शून्य-निर्भरता सीम स्कैनर |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | बहु-चैनल स्वीकृति/प्रश्न सेतु: WeChat, Telegram, Feishu + सत्र कंसोल |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | सत्यापनीय शोध रिपोर्ट: साक्ष्य बही, मैनिफ़ेस्ट सील, प्रति-दावा निर्णय |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | बहु-आयामी प्लगइन गुणवत्ता स्कोरिंग, साक्ष्य-आधारित लीडरबोर्ड के साथ |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Web साइडबार में सत्र और कार्यक्षेत्र पिन करें, हर पिन का रंग अलग |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | git-आधारित क्रॉस-डिवाइस सत्र समकालन, दोनों पक्ष रखने वाले मर्ज के साथ |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | सुरक्षा-लेखा परीक्षा स्किल पैक और `plugin_vet` सप्लाई-चेन गेट |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | वाणी-प्रथम सत्र लूप: speech-to-text इनपुट और text-to-speech उत्तर |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | क्रॉस-सेशन टीम रूम: साझा संदेश बस, कार्य बोर्ड और टाइमलाइन |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | पृथक इंस्टॉल-और-स्मोक टेस्ट ड्राइव, पास/फ़ेल मैट्रिक्स के साथ |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | TickTick/Dida365 सेतु: सत्र-हेडर पैनल और ग्यारह एजेंट टूल |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | विक्रेता पैरामीटर अनुवाद और नियतात्मक JSON मरम्मत |
| **[dsh-wechat](https://github.com/pan17/dsh-wechat)** | WeChat ↔ DSH सेतु (Tencent iLink बॉट), [pan17](https://github.com/pan17/dsh-wechat) के साथ विकसित, जो रेपो होस्ट करते हैं |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | टॉप-बार टॉगल वाला व्यक्तिगत निर्देश इंजेक्टर (liucai2026/dsh-personal-directive का फ़ोर्क) |

## लाइसेंस

Apache-2.0. सूची या ग्रेड एक साक्ष्य रिकॉर्ड है, सुरक्षा की गारंटी नहीं: प्लगइन आपके DSH प्रोसेस में आपकी अनुमतियों के साथ चलते हैं।
