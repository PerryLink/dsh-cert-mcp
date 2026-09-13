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

export const name = '@perrylink/dsh-cert-mcp'

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

async function callTool(tool, args) {
  const response = await handleRequest({
    method: 'tools/call',
    params: { name: tool, arguments: args ?? {} },
  })
  const text = response?.result?.content?.[0]?.text
  if (response?.result?.isError) throw new Error(text ?? 'certification lookup failed')
  return text ?? JSON.stringify(response?.result ?? null)
}

export function apply(ctx) {
  const tools = ctx.get('tools')
  if (!tools) return
  for (const tool of TOOLS) {
    ctx.effect(() => tools.register({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      output: {
        schema: { type: 'string' },
        render(args, value) {
          return [{ type: 'text', text: String(value) }]
        },
      },
      async execute(args) {
        return callTool(tool.name, args)
      },
    }))
  }
}

export default { name, apply }
