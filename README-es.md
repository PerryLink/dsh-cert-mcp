# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

Servidor [MCP](https://modelcontextprotocol.io) de solo lectura que expone el registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): grados de certificación, fechas de instantánea y evidencia en cinco dimensiones para los plugins de DeepSeek Harness (DSH). Cero dependencias en tiempo de ejecución, transporte stdio.

## Herramientas

| Herramienta | Entrada | Devuelve |
|---|---|---|
| `get_certification` | `owner`, `repo` | El registro de certificación completo (grado, instantánea, cinco dimensiones, veto, notas) o «sin registro» |
| `list_certified` | — | Todas las entradas del registro público: repositorio / grado / instantánea |
| `certification_spec` | — | Resumen de la especificación v1: cinco dimensiones, escala de grados, regla de veto |

La instantánea embebida vive en `data/certified.json` (sincronizada desde el repositorio de certificación) y el servidor la actualiza desde el registro público como máximo una vez cada cinco minutos. Sin escrituras, sin secretos, sin ejecución de código.

## Instalación

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # servidor stdio
```

También puedes ejecutarlo directamente desde el paquete npm publicado: `npx dsh-cert-mcp`.

### Registrarlo en un cliente MCP

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

DSH: añádelo mediante [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) como servidor stdio, o usa cualquier cliente MCP compatible con `stdio`.

### Instalarlo como bundle de DSH

El paquete declara `dsh.bundle.patch` → `cordis.patch.yml`, así que también se instala como bundle de DeepSeek Harness:

```sh
# canal git (último main)
dsh plugin --profile web add "github:PerryLink/dsh-cert-mcp#main"

# canal npm (versiones publicadas)
dsh plugin --profile web add dsh-cert-mcp
```

La fila insertada carga el paquete mediante el contrato estándar de plugins de Cordis: la mitad host es un módulo ESM normal que exporta con nombre `name`, `inject` y `apply(ctx)`. Este paquete no incluye interfaz de navegador, por lo que no hay declaración `dsh.client`.

```js
// entrada del bundle (mitad host) — el contrato que carga la fila del patch
export const name = 'dsh-cert-mcp'
export const inject = ['tools'] // la superficie de herramientas del host, provista por dsh-tools
export function apply(ctx) {
  // registra la superficie de consulta de certificación de solo lectura
  // (get_certification / list_certified / certification_spec)
}
```

**La mitad host necesita el servicio `tools`** (lo provee `@deepseek-ai/dsh-tools`). Un perfil sin él no pierde las herramientas en silencio: Cordis deja esta fila en `PENDING` hasta que `tools` exista, y eso se ve en la lista de plugins del perfil. No hace falta nada más: ni claves de configuración, ni credenciales, ni red durante la carga.

**Dos mitades, una sola ruta de datos.** La fila del bundle y el servidor stdio son dos entradas sobre el mismo núcleo `handleRequest`. La mitad servidor es un proceso independiente que cualquier cliente MCP puede lanzar (`node src/index.js`), y **no forma parte de la ruta del plugin**: instalar este bundle nunca lo arranca y desinstalarlo nunca lo toca. A la inversa, `npx dsh-cert-mcp` no registra nada en la superficie de herramientas de DSH.

Para quitarlo: `dsh plugin --profile web remove dsh-cert-mcp` (o borra la fila del patch del perfil). El servidor MCP stdio independiente sigue funcionando para cualquier cliente MCP.

## Por qué existe

El repositorio oficial de DeepSeek Harness no opera un registro de plugins ni acepta PR externos; el descubrimiento ocurre por el topic `dsh-plugin` de GitHub y listas de la comunidad, y ninguna de ellas certifica nada. `dsh-plugin-certification` convierte «¿puedo instalar este plugin?» en una comprobación reproducible de cinco dimensiones (manifiesto, higiene de build, Scorecard de cadena de suministro, procedencia de la publicación, prueba de instalación en sandbox) con un registro público y distintivos para el README. Este servidor MCP es el mismo dato con una interfaz para agentes: un agente puede consultar la certificación de un plugin antes de recomendarlo o instalarlo.

## Registro

Fuente de datos: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, especificación v1.

## Compatibilidad

- Node `^22.19.0 || >=24.0.0`.
- DSH `>=0.1.2-rc.1 <0.2.0 || >=0.1.5-alpha.1 <0.2.0 || >=0.1.6-0 <0.2.0` (declarado en `engines.dsh`, con `dsh.manifestVersion: 1`).
- Peer: `@deepseek-ai/cordis` `^4.0.2`. La mitad host necesita además el servicio `tools` en tiempo de ejecución; la mitad stdio no necesita nada más que Node.

## Desarrollo

```sh
pnpm install
pnpm run typecheck                            # la única regla de tipos: checkJs sobre la cara host publicada
pnpm test                                     # prueba JSON-RPC + suite de ejecución con Cordis real
pnpm pack                                     # el tarball publicado
```

La suite de ejecución monta los registros REALES `SystemPrompt`/`ToolRuntime` y comprueba que montar este paquete coloca las tres herramientas de certificación en `ctx.tools.schemas()`, que liberar el fiber las elimina y que un contexto sin el servicio `tools` deja el plugin en `PENDING`. Deliberadamente no se usa `dsh --dump-config` como criterio de aceptación: allí una fila montada y un fiber pendiente se ven igual.

Hay deliberadamente **una sola** regla de tipos. `@deepseek-ai/*` se resuelve a través del `node_modules` de este repositorio (las devDependencies fijadas, es decir la línea publicada) y el paquete no declara ningún peer de DSH, así que una segunda configuración de `tsc` sería el mismo comando sobre el mismo universo de tipos. El script `typecheck:ci` se conserva como la copia histórica no-op (su única clave extra es un `paths: {}` vacío) por compatibilidad con referencias existentes, no como una segunda cara de tipos. La segunda evidencia independiente es la puerta de montaje en ejecución de arriba.

## Licencia

Apache-2.0. Una ficha o un grado es un registro de evidencia, no una garantía de seguridad: los plugins se ejecutan dentro de tu proceso DSH con tus permisos.

**Versión de DSH aplicable:** verificada con `dsh-v0.1.7-alpha.1` (la versión del host a la que apunta esta compilación); requiere `>=0.1.7-alpha.1 <0.2.0`.


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
