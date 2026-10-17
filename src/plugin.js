// src/plugin.js —— DSH bundle host half
//
// Loaded through the `cordis.patch.yml` row (package.json `dsh.bundle.patch`)
// when the package is installed as a DeepSeek Harness bundle:
//
//   dsh plugin --profile web add dsh-cert-mcp
//
// It re-registers the three read-only certification tools on the DSH tool
// surface, 1:1 backed by the same `handleRequest` used by the stdio server
// (bin: src/index.js), which keeps working unchanged for any MCP client.
import { handleRequest, TOOLS as MCP_TOOLS } from './server.js'

/** @typedef {import('@deepseek-ai/cordis').Context} Context */
/** @typedef {import('@deepseek-ai/dsh-tools').ToolDefinition} ToolDefinition */

export const name = 'dsh-cert-mcp'

// The three tools register on the host tool surface, so `tools` is a hard
// dependency: declared here, read through `ctx.tools`. Cordis parks the plugin
// in PENDING until the service exists — a profile without dsh-tools then shows a
// waiting fiber instead of silently contributing nothing.
export const inject = ['tools']

// Single table: the DSH host face is derived from the MCP face, so the two
// descriptions cannot drift again (the 0.2.7 coverage fix reached only MCP).
const TOOLS = MCP_TOOLS.map(({ name, description, inputSchema }) => ({
  name,
  description,
  parameters: inputSchema,
}))

async function callTool(tool, args, signal) {
  const response = await handleRequest(
    {
      method: 'tools/call',
      params: { name: tool, arguments: args ?? {} },
    },
    signal,
  )
  const text = response?.result?.content?.[0]?.text
  if (response?.result?.isError) throw new Error(text ?? 'certification lookup failed')
  return text ?? JSON.stringify(response?.result ?? null)
}

/**
 * Register the read-only certification tools on the host tool surface.
 * @param {Context} ctx - plugin context; `inject` guarantees the `tools` service.
 */
export function apply(ctx) {
  for (const tool of TOOLS) {
    ctx.effect(() => ctx.tools.register(/** @type {ToolDefinition} */ ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      output: {
        schema: { type: 'string' },
        render(args, value) {
          return [{ type: 'text', text: String(value) }]
        },
      },
      async execute(args, exec) {
        return callTool(tool.name, args, exec.signal)
      },
    })))
  }
}
