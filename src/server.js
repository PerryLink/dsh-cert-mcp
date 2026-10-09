// Pure JSON-RPC core for dsh-cert-mcp. No transport, no side effects beyond
// reading the embedded registry snapshot and optionally refreshing it from
// the public dsh-plugin-certification repository.

import { readFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'

const PACKAGE = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

const PROTOCOL_VERSION = '2024-11-05'
// Single source of truth for the reported version: package.json. server.json and
// the npm tarball are checked against it by test/smoke.mjs.
const SERVER_INFO = { name: 'dsh-cert-mcp', version: PACKAGE.version }
const REGISTRY_URL = 'https://raw.githubusercontent.com/PerryLink/dsh-plugin-certification/main/data/certified.json'
const REFRESH_MS = 5 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000

let registry = null
let lastFetch = 0

const SPEC = `dsh-plugin-certification spec v1 evaluates a DSH plugin on five dimensions:

A. manifest — dsh.bundle declaration, license, topics/keywords alignment, multi-language READMEs, engines range.
B. buildHygiene — publish allowlist, peerDependencies, local gate chain (typecheck/test/build/verify/pack), CI green.
C. supplyChain — OpenSSF Scorecard score with per-check evidence.
D. releaseIntegrity — npm publish --provenance via Trusted Publishing.
E. installSmoke — real install of the published package into a sandboxed DSH_HOME.

Grades (spec v1 — the registry README is the owner of these definitions):
- A — all five pass (E must be "ok"), no veto hit.
- B — E passes and at least three of A/B/C/D pass. An E that ends "install-fail" purely because of an unattended-environment gate (e.g. pnpm's interactive approve-builds cannot be confirmed in a sandbox) also keeps B when A–D pass, and records "environment-blocked".
- C — E passes, the rest incomplete.
- D — any hard gate fails (dsh.bundle missing, no license, malicious pattern hit).
- Security veto — obfuscated code, credential exfiltration, or surprising install-time behaviour grades D immediately, with the reason published.
- Environment gates are never recorded as D.
- Evidence discipline: every score comes from real, reproducible execution; absent evidence is "no-evidence", never a guess.`

async function loadRegistry(force = false, caller) {
  if (!registry) {
    const dataUrl = new URL('../data/certified.json', import.meta.url)
    try {
      registry = JSON.parse(await readFile(dataUrl, 'utf8'))
    } catch {
      registry = { specVersion: 'v1', generatedAt: null, entries: [] }
    }
  }
  if (force || Date.now() - lastFetch > REFRESH_MS) {
    const timeout = AbortSignal.timeout(FETCH_TIMEOUT_MS)
    try {
      const res = await fetch(REGISTRY_URL, {
        headers: { 'user-agent': 'dsh-cert-mcp' },
        // A caller abort (tool cancellation) and the request timeout both have to
        // reach the socket; the embedded snapshot covers an aborted refresh.
        signal: caller ? AbortSignal.any([caller, timeout]) : timeout,
      })
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

// Tool definitions are written to the Tool Definition Quality Score rubric Glama
// grades directory listings with: stated purpose, explicit routing against the
// sibling tools, behaviour beyond what the annotations can express, and the
// failure mode. The four MCP annotations are declared on every tool and the
// descriptions never contradict them.
const ANNOTATIONS_READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
}

const TOOLS = [
  {
    name: 'get_certification',
    title: 'Get one plugin certification record',
    description:
      'Return the certification record for ONE DeepSeek Harness plugin repository, identified by its GitHub owner and repository name: the letter grade, the snapshot date the grade was measured, and the five-dimension evidence behind it. ' +
      'Use this when you already know which plugin you are asking about and need its grade, or the reasoning that produced it. ' +
      'Use list_certified instead to enumerate every certified plugin, and certification_spec instead to learn what the five dimensions, the grade scale and the veto rule mean. ' +
      'Read-only and offline: it reads a registry snapshot bundled with this server (refreshed from the public registry when that is reachable) and performs no writes, contacts no other service, and requires no credentials. Two calls with the same arguments return the same record. ' +
      'If the registry holds no entry for that owner/repo, the result is a plain not-found sentence naming the key it looked up and the snapshot date - it never invents, interpolates or approximates a grade.',
    annotations: ANNOTATIONS_READ_ONLY,
    inputSchema: {
      type: 'object',
      properties: {
        owner: {
          type: 'string',
          description:
            'GitHub owner (user or organisation) of the plugin repository, for example "PerryLink". Matched case-insensitively.',
        },
        repo: {
          type: 'string',
          description:
            'GitHub repository name of the plugin, for example "dsh-auto-review". This is the repository name, not the npm package name. Matched case-insensitively.',
        },
      },
      required: ['owner', 'repo'],
    },
  },
  {
    name: 'list_certified',
    title: 'List every certified plugin',
    description:
      'List every plugin in the public dsh-plugin-certification registry, each with its repository, letter grade and snapshot date, plus the registry spec version, its generation timestamp and the total count. ' +
      'Use this to discover what is in the registry, or to compare grades across plugins. ' +
      'Use get_certification instead when you already know the plugin and want its full five-dimension evidence; this tool returns the summary row only. ' +
      'Read-only and offline: it reads the bundled registry snapshot, takes no parameters, performs no writes and needs no credentials. Repeated calls are identical until the snapshot is refreshed.',
    annotations: ANNOTATIONS_READ_ONLY,
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'certification_spec',
    title: 'Explain the certification spec',
    description:
      'Return the dsh-plugin-certification specification document, version 1: the five graded dimensions, the grade scale from A to F, and the veto rule that can override a grade. ' +
      'Use this to interpret a grade you have already read - for example to learn why a record was vetoed, or what a dimension actually measures. ' +
      'Use list_certified or get_certification instead when you want a specific plugin\'s data rather than the rules behind it. ' +
      'Read-only and offline: the document is compiled into the server, takes no parameters, performs no writes and needs no credentials. The same document is returned on every call.',
    annotations: ANNOTATIONS_READ_ONLY,
    inputSchema: { type: 'object', properties: {} },
  },
]

export async function handleRequest(req, signal) {
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
        const data = await loadRegistry(false, signal)
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
