# dsh-cert-mcp

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![DSH plugin](https://img.shields.io/badge/dsh--plugin-✅-green)](https://github.com/topics/dsh-plugin)
[![DSH Market](https://raw.githubusercontent.com/2BingLing/dsh-market/master/assets/readme/badge-listed-en.svg)](https://dsh.market/)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-c71d23?logo=gitee)](https://gitee.com/perrylink/dsh-cert-mcp)
[![Version](https://img.shields.io/github/v/tag/PerryLink/dsh-cert-mcp?label=version)](https://github.com/PerryLink/dsh-cert-mcp/releases)
[![npm version](https://img.shields.io/npm/v/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![npm downloads](https://img.shields.io/npm/dm/dsh-cert-mcp)](https://www.npmjs.com/package/dsh-cert-mcp)
[![dshfind](https://dshfind.com/api/badge/PerryLink/dsh-cert-mcp?metric=downloads&lang=es)](https://dshfind.com/es/plugins/PerryLink/dsh-cert-mcp?ref=badge)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/score.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)
[![dsh-cert-mcp MCP server](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp/badges/card.svg)](https://glama.ai/mcp/servers/PerryLink/dsh-cert-mcp)

[English](README.md) · [简体中文](README-zh.md) · [Español](README-es.md) · [Português](README-pt.md) · [हिन्दी](README-hi.md)

```sh
dsh plugin --profile <name> add dsh-cert-mcp
```


Servidor [MCP](https://modelcontextprotocol.io) de solo lectura que expone el registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): grados de certificación, fechas de instantánea y evidencia en cinco dimensiones para los plugins de DeepSeek Harness (DSH). Cero dependencias en tiempo de ejecución, transporte stdio.

## Instalación

```sh
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp
```

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
dsh plugin --profile web add github:PerryLink/dsh-cert-mcp

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

## What is dsh-cert-mcp?

Servidor [MCP](https://modelcontextprotocol.io) de solo lectura que expone el registro [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification): grados de certificación, fechas de instantánea y evidencia en cinco dimensiones para los plugins de DeepSeek Harness (DSH). Cero dependencias en tiempo de ejecución, transporte stdio.

![Diagrama de flujo de dsh-cert-mcp: instalar → abrir panel → actuar.](docs/assets/dsh-cert-mcp-flow.svg)

*Resumen del flujo: instalar → abrir panel → actuar. Los ejemplos siguientes usan la superficie de comandos real.*


*La misma ejecución, animada.*

## Herramientas

| Herramienta | Entrada | Devuelve |
|---|---|---|
| `get_certification` | `owner`, `repo` | El registro de certificación completo (grado, instantánea, cinco dimensiones, veto, notas) o «sin registro» |
| `list_certified` | — | Todas las entradas del registro público: repositorio / grado / instantánea |
| `certification_spec` | — | Resumen de la especificación v1: cinco dimensiones, escala de grados, regla de veto |

La instantánea embebida vive en `data/certified.json` (sincronizada desde el repositorio de certificación) y el servidor la actualiza desde el registro público como máximo una vez cada cinco minutos. Sin escrituras, sin secretos, sin ejecución de código.

## Por qué existe

El repositorio oficial de DeepSeek Harness no opera un registro de plugins ni acepta PR externos; el descubrimiento ocurre por el topic `dsh-plugin` de GitHub y listas de la comunidad, y ninguna de ellas certifica nada. `dsh-plugin-certification` convierte «¿puedo instalar este plugin?» en una comprobación reproducible de cinco dimensiones (manifiesto, higiene de build, Scorecard de cadena de suministro, procedencia de la publicación, prueba de instalación en sandbox) con un registro público y distintivos para el README. Este servidor MCP es el mismo dato con una interfaz para agentes: un agente puede consultar la certificación de un plugin antes de recomendarlo o instalarlo.

## Registro

Fuente de datos: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, especificación v1.

**Qué es el registro y qué significa una respuesta corta de este servidor.** El registro es un **subconjunto de adhesión voluntaria**: un repositorio aparece en él solo después de haber sido evaluado, así que la ausencia de registro **no** es prueba de que un plugin no esté certificado, y que `list_certified` devuelva pocas filas no es prueba de que se evaluaran pocos plugins. La instantánea incluida tenía **una** entrada (grado A, instantánea 2026-09-07) al escribir esto; una lista de una entrada no tiene significado estadístico: una nota describe ese único repositorio, y la comparación ordenable entre plugins solo es posible cuando el registro contiene muchos. Cada respuesta de `list_certified` lleva un objeto `coverage` que dice exactamente esto, de modo que un agente que solo lea la salida de la herramienta no pueda confundir el recuento con la cobertura del ecosistema. La fecha de la instantánea es un hecho **del repositorio de certificación**, no una promesa de frescura de este servidor: se sincroniza byte a byte desde `dsh-plugin-certification`, que es dueño del calendario y de la comprobación.

## Compatibilidad

| Superficie | Estado |
|---|---|
| Harness | DeepSeek Harness `dsh-v0.2.1-alpha.1` (devDependencies and the declared `engines.dsh` range both admit that line; `typecheck` and the 5-test suite are green against `@deepseek-ai/dsh-system-prompt` / `@deepseek-ai/dsh-tools` 0.2.1-alpha.1) |
| Node | `^22.19.0 \|\| >=24.0.0` |
| Rango de host declarado | `engines.dsh`: `>=0.1.2-rc.1 <0.2.0 \|\| >=0.1.5-alpha.1 <0.2.0 \|\| >=0.1.6-0 <0.2.0 \|\| >=0.1.7-0 <0.2.0 \|\| >=0.2.0-0 <0.3.0 \|\| >=0.2.1-0 <0.3.0`, con `dsh.manifestVersion: 1` |
| Peer | `@deepseek-ai/cordis` `^4.0.2`. La mitad host necesita además el servicio `tools` en tiempo de ejecución; la mitad stdio no necesita nada más que Node. |

## Desarrollo

```sh
pnpm install
pnpm run typecheck                            # la única regla de tipos: checkJs sobre la cara host publicada
pnpm test                                     # prueba JSON-RPC + suite de ejecución con Cordis real
pnpm pack                                     # el tarball publicado
```

La suite de ejecución monta los registros REALES `SystemPrompt`/`ToolRuntime` y comprueba que montar este paquete coloca las tres herramientas de certificación en `ctx.tools.schemas()`, que liberar el fiber las elimina y que un contexto sin el servicio `tools` deja el plugin en `PENDING`. Deliberadamente no se usa `dsh --dump-config` como criterio de aceptación: allí una fila montada y un fiber pendiente se ven igual.

Hay deliberadamente **una sola** regla de tipos. `@deepseek-ai/*` se resuelve a través del `node_modules` de este repositorio (las devDependencies fijadas, es decir la línea publicada) y el paquete no declara ningún peer de DSH, así que una segunda configuración de `tsc` sería el mismo comando sobre el mismo universo de tipos. El script `typecheck:ci` se conserva como la copia histórica no-op (su única clave extra es un `paths: {}` vacío) por compatibilidad con referencias existentes, no como una segunda cara de tipos. La segunda evidencia independiente es la puerta de montaje en ejecución de arriba.

## PerryLink DSH Plugin Family

Este proyecto forma parte de la familia de plugins de DeepSeek Harness de [PerryLink](https://github.com/PerryLink). El registro permanece plegado abajo para que cada README conserve una primera pantalla corta; expándelo para ver cada fila y su estado.

<details>
<summary>Expandir todos los plugins</summary>

| Plugin | Estado |
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
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | 🧊 CONGELADO — ver el README del repositorio |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | 🚫 RETIRADO — ver el README del repositorio |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | 🚫 RETIRADO — ver el README del repositorio |

</details>

## Licencia

Apache-2.0. Una ficha o un grado es un registro de evidencia, no una garantía de seguridad: los plugins se ejecutan dentro de tu proceso DSH con tus permisos.

### Ejemplos

Son los puntos de entrada reales; instala y llama a uno.

#### Ejemplo detallado

**Comando**

~~~sh
get_certification
~~~

**Entrada**

~~~json
{
  "owner": "PerryLink",
  "repo": "dsh-auto-review"
}
~~~

**Salida**

~~~text
{
  "repo": "PerryLink/dsh-auto-review",
  "grade": "A",
  "snapshot": "2026-09-07",
  "dimensions": {
    "manifest": { "result": "pass" },
    "buildHygiene": { "result": "pass" },
    "supplyChain": { "result": "pass", "score": 5.4 },
    "releaseIntegrity": { "result": "pass" },
    "installSmoke": { "result": "ok" }
  },
  "veto": null
}
~~~

*Observado en `plugins/dsh-cert-mcp/src/server.js:192-199; data in plugins/dsh-cert-mcp/data/certified.json:1-30; smoke test at plugins/dsh-cert-mcp/test/smoke.mjs:29-39`*

#### Ejemplos breves

- `list_certified`
- `certification_spec`

