// src/plugin.js —— DSH bundle host half
//
// Loaded through the `cordis.patch.yml` row (package.json `dsh.bundle.patch`)
// when the package is installed as a DeepSeek Harness bundle:
//
//   dsh plugin --profile web add @perrylink/dsh-cert-mcp
//
// It re-registers the three read-only certification tools on the DSH tool
// surface, 1:1 backed by the same `handleRequest` used by the stdio server
// (bin: src/index.js), which keeps working unchanged for any MCP client.
import { handleRequest } from './server.js'

/** @typedef {import('@deepseek-ai/cordis').Context} Context */
/** @typedef {import('@deepseek-ai/dsh-tools').ToolDefinition} ToolDefinition */

export const name = '@perrylink/dsh-cert-mcp'

// The three tools register on the host tool surface, so `tools` is a hard
// dependency: declared here, read through `ctx.tools`. Cordis parks the plugin
// in PENDING until the service exists — a profile without dsh-tools then shows a
// waiting fiber instead of silently contributing nothing.
export const inject = ['tools']

const TOOLS = [
  {
    name: 'get_certification',
    description: 'Full certification record (grade, snapshot, five dimensions) for owner/repo',
    parameters: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner of the plugin repository' },
        repo: { type: 'string', description: 'GitHub repository name' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_certified',
    description: 'Every entry in the public certification registry',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'certification_spec',
    description: 'Spec v1 summary: five dimensions, grade scale, veto rule',
    parameters: { type: 'object', properties: {} },
  },
]

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
