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

## Familia de plugins DSH de PerryLink

Este proyecto es uno de los [42 plugins de DeepSeek Harness](https://github.com/PerryLink) mantenidos por [PerryLink](https://github.com/PerryLink). Si este te ayuda, probablemente los demás también:

| Plugin | En una línea |
|---|---|
| **[dsh-auto-review](https://github.com/PerryLink/dsh-auto-review)** | Autorevisión con un segundo modelo en la cadena de aprobación, cerrada por defecto |
| **[dsh-autotier](https://github.com/PerryLink/dsh-autotier)** | Enrutado automático entre modelo fuerte y barato, con guardas de riesgo deterministas y comando `/tier` |
| **[dsh-background-agents](https://github.com/PerryLink/dsh-background-agents)** | Subagentes de fondo duraderos con barra lateral en la interfaz web, mensajería e interrupción |
| **[dsh-budget](https://github.com/PerryLink/dsh-budget)** | Gobernanza de costes para DeepSeek Harness: presupuestos, carbono y latencia en un panel |
| **[dsh-catalog](https://github.com/PerryLink/dsh-catalog)** | Fuente de catálogo estándar de DSH Desktop Market para la familia PerryLink |
| **[dsh-checkpoint-rewind](https://github.com/PerryLink/dsh-checkpoint-rewind)** | Puntos de control unificados de sesión + espacio de trabajo + configuración con un solo `/rewind` |
| **[dsh-claude-move](https://github.com/PerryLink/dsh-claude-move)** | Migra sesiones, memorias y skills de Claude Code, Codex, OpenCode y Hermes a DSH |
| **[dsh-click](https://github.com/PerryLink/dsh-click)** | Control nativo de escritorio multiplataforma para DeepSeek Harness, con Windows primero |
| **[dsh-composer-history](https://github.com/PerryLink/dsh-composer-history)** | Historial de entrada estilo terminal para el compositor web: flechas y búsqueda Ctrl+R |
| **[dsh-data-quality](https://github.com/PerryLink/dsh-data-quality)** | Perfilado, limpieza y verificación de citas de datasets, determinista |
| **[dsh-defend](https://github.com/PerryLink/dsh-defend)** | Defensa contra inyección de prompts, jailbreak y fuga de secretos |
| **[dsh-doublecheck](https://github.com/PerryLink/dsh-doublecheck)** | Guardián de disciplina de ingeniería: interrogatorio de requisitos, puertas de test, revisión adversaria |
| **[dsh-draw](https://github.com/PerryLink/dsh-draw)** | Enrutado unificado de generación de imágenes estáticas |
| **[dsh-fast](https://github.com/PerryLink/dsh-fast)** | Diagnóstico de rendimiento de solo lectura: carga, spill, compactación y aciertos de caché |
| **[dsh-fund-research](https://github.com/PerryLink/dsh-fund-research)** | Investigación de fondos mutuos chinos con instantáneas de fuentes selladas y trazables |
| **[dsh-github](https://github.com/PerryLink/dsh-github)** | Integración con PR/issue/CI de GitHub, con toda escritura bajo aprobación |
| **[dsh-industry-research](https://github.com/PerryLink/dsh-industry-research)** | Pack de investigación sectorial y de empresas: mapa de cadena, cronología de políticas, fichas |
| **[dsh-kit](https://github.com/PerryLink/dsh-kit)** | Pack de inicio que instala el núcleo de la familia con un solo comando |
| **[dsh-library](https://github.com/PerryLink/dsh-library)** | Base de conocimiento local de documentos con búsqueda híbrida e inyección con citas |
| **[dsh-local-ai](https://github.com/PerryLink/dsh-local-ai)** | Descubrimiento de modelos Ollama locales y enrutado por tarea con respaldo en la nube |
| **[dsh-lsp-actions](https://github.com/PerryLink/dsh-lsp-actions)** | Diagnósticos LSP, formato, autocompletado, acciones de código, símbolos y renombrado |
| **[dsh-mask](https://github.com/PerryLink/dsh-mask)** | Enmascaramiento de PII en el límite del modelo con tabla de restauración en el host |
| **[dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel)** | Consola de gestión MCP: comando `/mcp`, pestaña de ajustes y llamadas de prueba |
| **[dsh-memento](https://github.com/PerryLink/dsh-memento)** | Protocolo de memoria entre sesiones con aprobación (`ctx.memory` + SQLite) |
| **[dsh-observe](https://github.com/PerryLink/dsh-observe)** | Exportación de telemetría OpenTelemetry y Langfuse desde el flujo de eventos |
| **[dsh-output-styles](https://github.com/PerryLink/dsh-output-styles)** | Estilos de salida del modelo conmutables en caliente |
| **[dsh-permission-rules](https://github.com/PerryLink/dsh-permission-rules)** | Reglas declarativas allow/deny/ask y política de red a nivel de proceso |
| **[dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification)** | Registro comunitario de certificación con grados y distintivos reproducibles |
| **[dsh-plugin-doctor](https://github.com/PerryLink/dsh-plugin-doctor)** | Detector estático y de humo en sandbox, sin dependencias, para plugins DSH |
| **[dsh-plugin-guide](https://github.com/PerryLink/dsh-plugin-guide)** | Base de conocimiento de desarrollo de plugins, skill de agente y CLI `dsh-plugin-dev` |
| **[dsh-plugin-kit](https://github.com/PerryLink/dsh-plugin-kit)** | Caja de herramientas compartida sin dependencias de ejecución para los plugins PerryLink |
| **[dsh-plugin-portal](https://github.com/PerryLink/dsh-plugin-portal)** | Portal estático sin dependencias que renderiza toda la familia en una página |
| **[dsh-plugin-upgrade-015](https://github.com/PerryLink/dsh-plugin-upgrade-015)** | Tarjeta de corredor `0.1.3-alpha.1` → `0.1.5-rc.1` ya fusionada y escáner de costuras |
| **[dsh-reach](https://github.com/PerryLink/dsh-reach)** | Puente multicanal de aprobaciones y preguntas: WeChat, Telegram, Feishu + consola |
| **[dsh-research-report](https://github.com/PerryLink/dsh-research-report)** | Informes de investigación verificables: libro de evidencia, sello de manifiesto, veredictos |
| **[dsh-score](https://github.com/PerryLink/dsh-score)** | Puntuación de calidad multidimensional con clasificación respaldada por evidencia |
| **[dsh-session-pin](https://github.com/PerryLink/dsh-session-pin)** | Fija sesiones y espacios de trabajo en la barra lateral web, con color por fijación |
| **[dsh-session-sync](https://github.com/PerryLink/dsh-session-sync)** | Sincronización de sesiones entre dispositivos con git y fusión conservando ambos lados |
| **[dsh-skill-pack-security](https://github.com/PerryLink/dsh-skill-pack-security)** | Pack de skills de auditoría de seguridad y puerta de cadena de suministro `plugin_vet` |
| **[dsh-talk](https://github.com/PerryLink/dsh-talk)** | Bucle de sesión por voz: entrada de voz a texto y respuestas de texto a voz |
| **[dsh-team-rooms](https://github.com/PerryLink/dsh-team-rooms)** | Salas de equipo entre sesiones: bus de mensajes, tablero de tareas y línea temporal |
| **[dsh-test-drive](https://github.com/PerryLink/dsh-test-drive)** | Pruebas de instalación y humo aisladas con matriz de aprobado/fallo |
| **[dsh-ticktick](https://github.com/PerryLink/dsh-ticktick)** | Puente con TickTick/Dida365: panel en la cabecera de sesión y once herramientas |
| **[dsh-translate](https://github.com/PerryLink/dsh-translate)** | Traducción de parámetros entre proveedores y reparación determinista de JSON |
| **[dsh-wechat](https://github.com/pan17/dsh-wechat)** | Puente WeChat ↔ DSH (bot iLink de Tencent), desarrollado con [pan17](https://github.com/pan17/dsh-wechat), que aloja el repositorio |
| **[dsh-personal-directive](https://github.com/PerryLink/dsh-personal-directive)** | Inyector de directivas personales con interruptor en la barra superior (fork de liucai2026/dsh-personal-directive) |
| **[dsh-laya](https://github.com/PerryLink/dsh-laya)** | Laya typed decisions (`noul`/`choice`/`score`) as a first-class Cordis service and model-visible tools | |

## Licencia

Apache-2.0. Una ficha o un grado es un registro de evidencia, no una garantía de seguridad: los plugins se ejecutan dentro de tu proceso DSH con tus permisos.
