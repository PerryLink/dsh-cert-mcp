// Pure JSON-RPC core for dsh-cert-mcp. No transport, no side effects beyond
// reading the embedded registry snapshot and optionally refreshing it from
// the public dsh-plugin-certification repository.

import { readFile } from 'node:fs/promises'

const PROTOCOL_VERSION = '2024-11-05'
const SERVER_INFO = { name: 'dsh-cert-mcp', version: '0.1.0' }
const REGISTRY_URL = 'https://raw.githubusercontent.com/PerryLink/dsh-plugin-certification/main/data/certified.json'
const REFRESH_MS = 5 * 60 * 1000

let registry = null
let lastFetch = 0

const SPEC = `dsh-plugin-certification spec v1 evaluates a DSH plugin on five dimensions:

A. manifest — dsh.bundle declaration, license, topics/keywords alignment, multi-language READMEs, engines range.
B. buildHygiene — publish allowlist, peerDependencies, local gate chain (typecheck/test/build/verify/pack), CI green.
C. supplyChain — OpenSSF Scorecard score with per-check evidence.
D. releaseIntegrity — npm publish --provenance via Trusted Publishing.
E. installSmoke — real install of the published package into a sandboxed DSH_HOME.

Grades: A (all five pass), B (E environment-blocked only), C (non-critical dimension failures), D (critical dimension failures), veto overrides everything (severe supply-chain or install defects).`

async function loadRegistry(force = false) {
  if (!registry) {
    const dataUrl = new URL('../data/certified.json', import.meta.url)
    try {
      registry = JSON.parse(await readFile(dataUrl, 'utf8'))
    } catch {
      registry = { specVersion: 'v1', generatedAt: null, entries: [] }
    }
  }
  if (force || Date.now() - lastFetch > REFRESH_MS) {
    try {
      const res = await fetch(REGISTRY_URL, { headers: { 'user-agent': 'dsh-cert-mcp' } })
      if (res.ok) {
        registry = await res.json()
        lastFetch = Date.now()
      }
    } catch {
      // keep the embedded snapshot; the registry repo may be unreachable
    }
  }
  return registry
}

function findEntry(data, owner, repo) {
  const key = `${owner}/${repo}`
  return data.entries.find((entry) => entry.repo.toLowerCase() === key.toLowerCase()) ?? null
}

const TOOLS = [
  {
    name: 'get_certification',
    description: 'Return the dsh-plugin-certification record for one DeepSeek Harness plugin repository (grade, snapshot date, five-dimension evidence).',
    inputSchema: {
      type: 'object',
      properties: {
        owner: { type: 'string', description: 'GitHub owner, e.g. PerryLink' },
        repo: { type: 'string', description: 'GitHub repository name, e.g. dsh-auto-review' },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_certified',
    description: 'List every plugin in the public dsh-plugin-certification registry with repo, grade and snapshot date.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'certification_spec',
    description: 'Explain the dsh-plugin-certification spec v1: the five dimensions, the grade scale and the veto rule.',
    inputSchema: { type: 'object', properties: {} },
  },
]

export async function handleRequest(req) {
  switch (req.method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      }
    case 'notifications/initialized':
      return null
    case 'ping':
      return { jsonrpc: '2.0', id: req.id, result: {} }
    case 'tools/list':
      return { jsonrpc: '2.0', id: req.id, result: { tools: TOOLS } }
    case 'tools/call': {
      const { name, arguments: args } = req.params ?? {}
      const tool = TOOLS.find((candidate) => candidate.name === name)
      if (!tool) {
        return { jsonrpc: '2.0', id: req.id, error: { code: -32602, message: `Unknown tool: ${name}` } }
      }
      try {
        const data = await loadRegistry()
        let text
        if (name === 'get_certification') {
          if (!args || typeof args.owner !== 'string' || typeof args.repo !== 'string') {
            throw new Error('owner and repo are required')
          }
          const entry = findEntry(data, args.owner, args.repo)
          text = entry
            ? JSON.stringify(entry, null, 2)
            : `No certification record for ${args.owner}/${args.repo} in registry snapshot ${data.generatedAt ?? 'unknown'}.`
        } else if (name === 'list_certified') {
          const list = data.entries.map((entry) => ({ repo: entry.repo, grade: entry.grade, snapshot: entry.snapshot }))
          text = JSON.stringify({ specVersion: data.specVersion, generatedAt: data.generatedAt, count: list.length, entries: list }, null, 2)
        } else {
          text = SPEC
        }
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text }] },
        }
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: req.id,
          result: { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true },
        }
      }
    }
    default:
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: `Method not found: ${req.method}` } }
  }
}

export { SERVER_INFO, PROTOCOL_VERSION }
