// Three-way version gate: package.json ↔ server.json ↔ npm ↔ official MCP Registry.
//
// Exists because a silent failure is the default. Between v0.2.6 (2026-10-10)
// and v0.2.9 the registry stopped receiving versions while npm kept publishing:
// release.yml's `publish` job carried `if: startsWith(github.ref, 'refs/tags/v')`,
// so every workflow_dispatch run skipped `publish`, and `mcp-registry` needs it.
// The run was green, the registry was stale, and nothing said so. Downstream
// indexes (Glama and friends) read the registry, so they served 0.2.6 for a week.
//
// Two different failures are worth separating, because they have different fixes:
//   * npm behind  -> the release never landed; re-run the tag workflow.
//   * registry behind -> npm landed but publish-mcp never ran; dispatch it.
//
// Registry read side notes, both observed on the live service:
//   * GET /v0/servers/<name>/versions/latest returns HTTP 500 ("Failed to get
//     server details") - it is not usable as an assertion source, so this script
//     lists /versions and picks the entry flagged isLatest.
//   * GET /v0/servers/<name>/versions/<absent-version> returns 404 with the body
//     "Server not found", which reads like a missing server but means a missing
//     version. A 404 therefore never proves the server is unregistered; only the
//     list endpoint can tell those apart.
//
// Usage:
//   node scripts/check-registry-drift.mjs [packageDir] [--json] [--quiet]
// Exit codes: 0 in sync, 1 drift, 2 could not check (network / bad manifest).
import { readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const REGISTRY = 'https://registry.modelcontextprotocol.io/v0'
const NPM = 'https://registry.npmjs.org'

const argv = process.argv.slice(2)
const flags = new Set(argv.filter(a => a.startsWith('--')))
const positional = argv.filter(a => !a.startsWith('--'))
const json = flags.has('--json')
const quiet = flags.has('--quiet')

const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    // A missing manifest is a usage error, not drift; reporting it as drift
    // would send whoever reads the CI log after the wrong problem.
    console.error(`cannot read ${file}: ${error.message}`)
    process.exit(2)
  }
}

const get = async (url, { timeoutMs = 20000 } = {}) => {
  const abort = AbortSignal.timeout(timeoutMs)
  const res = await fetch(url, { signal: abort, headers: { accept: 'application/json' } })
  const body = await res.text()
  let parsed
  try {
    parsed = JSON.parse(body)
  } catch {
    parsed = undefined
  }
  return { status: res.status, ok: res.ok, body: parsed, raw: body }
}

// The registry flags exactly one version per server as isLatest, but the flag
// lives under a reverse-DNS _meta key that has moved before; fall back to the
// newest publishedAt so a meta rename degrades to "still correct" rather than
// "always failing".
const latestOf = (entries) => {
  if (entries.length === 0) return undefined
  const official = (entry) => {
    const meta = entry._meta ?? entry.meta ?? {}
    return meta['io.modelcontextprotocol.registry/official'] ?? {}
  }
  const flagged = entries.find(entry => official(entry).isLatest === true)
  if (flagged !== undefined) return flagged
  return [...entries].sort((a, b) =>
    String(official(b).publishedAt ?? '').localeCompare(String(official(a).publishedAt ?? '')))[0]
}

const main = async () => {
  // fileURLToPath, not .pathname: on Windows the latter yields "/D:/..." and
  // resolves to the wrong drive root.
  const here = path.dirname(fileURLToPath(import.meta.url))
  const root = positional[0] === undefined ? path.dirname(here) : path.resolve(positional[0])
  const pkg = readJson(path.join(root, 'package.json'))
  const server = readJson(path.join(root, 'server.json'))

  const name = pkg.name
  const version = pkg.version
  const mcpName = pkg.mcpName
  const serverName = server.name
  const serverVersion = server.version
  const packageVersions = (server.packages ?? []).map(entry => entry.version)
  const identifiers = (server.packages ?? []).map(entry => entry.identifier).filter(Boolean)

  const problems = []
  const notes = []

  // Local consistency first: a mismatch here means the publish would be rejected
  // by the registry anyway, and the network calls below would be noise.
  if (typeof mcpName !== 'string' || mcpName === '') {
    problems.push('package.json#mcpName is missing; the registry identifies npm ownership through it')
  } else if (mcpName !== serverName) {
    problems.push(`package.json#mcpName (${mcpName}) must equal server.json#name (${serverName})`)
  }
  if (serverVersion !== version) {
    problems.push(`server.json#version (${serverVersion}) must equal package.json#version (${version})`)
  }
  for (const [index, value] of packageVersions.entries()) {
    if (value !== version) {
      problems.push(`server.json#packages[${index}].version (${value}) must equal package.json#version (${version})`)
    }
  }
  if (packageVersions.length === 0) problems.push('server.json#packages is empty')

  // Publishing under a name other than the one being checked would make every
  // assertion below vacuous.
  if (identifiers.length > 0 && !identifiers.includes(name)) {
    problems.push(`server.json#packages[].identifier (${identifiers.join(', ')}) does not include package.json#name (${name})`)
  }

  // Network side. A network failure must not be reported as drift: "could not
  // check" and "out of sync" need different responses from whoever reads this.
  let npmVersion
  try {
    const res = await get(`${NPM}/${encodeURIComponent(name)}/latest`)
    if (res.status === 404) {
      notes.push(`${name} is not on npm yet`)
      npmVersion = undefined
    } else if (!res.ok || typeof res.body?.version !== 'string') {
      throw new Error(`npm answered HTTP ${res.status}`)
    } else {
      npmVersion = res.body.version
    }
  } catch (error) {
    console.error(`could not query npm: ${error.message}`)
    return 2
  }

  let registryLatest
  let registryVersions = []
  try {
    const res = await get(`${REGISTRY}/servers/${encodeURIComponent(serverName)}/versions`)
    if (res.status === 404) {
      notes.push(`${serverName} is not on the MCP Registry yet`)
    } else if (!res.ok) {
      throw new Error(`registry answered HTTP ${res.status}: ${String(res.raw).slice(0, 120)}`)
    } else {
      const entries = res.body?.servers ?? []
      registryVersions = entries.map(entry => entry.server?.version).filter(Boolean)
      registryLatest = latestOf(entries)?.server?.version
    }
  } catch (error) {
    console.error(`could not query the MCP Registry: ${error.message}`)
    return 2
  }

  // npm and the registry are separate transports with separate failure modes:
  // saying which one is behind is the whole point of this check.
  if (npmVersion !== undefined && npmVersion !== version) {
    problems.push(`npm latest is ${npmVersion}, package.json is ${version} - the release did not land`)
  }
  if (registryLatest !== undefined && registryLatest !== version) {
    problems.push(`MCP Registry latest is ${registryLatest}, package.json is ${version} - publish-mcp did not run or failed`)
  }

  const report = {
    name,
    mcpName,
    version,
    npm: npmVersion ?? null,
    registry: registryLatest ?? null,
    registryVersions,
    inSync: problems.length === 0,
    problems,
    notes,
  }

  if (json) {
    console.log(JSON.stringify(report, null, 2))
  } else if (!quiet) {
    console.log(`${name}`)
    console.log(`  package.json      ${version}`)
    console.log(`  server.json       ${serverVersion}${packageVersions.length > 0 ? ` (packages[].version ${packageVersions.join(', ')})` : ''}`)
    console.log(`  npm latest        ${npmVersion ?? 'not published'}`)
    console.log(`  registry latest   ${registryLatest ?? 'not registered'}${registryVersions.length > 0 ? ` (of ${registryVersions.length} versions)` : ''}`)
    for (const note of notes) console.log(`  note              ${note}`)
    if (problems.length === 0) {
      console.log('  verdict           in sync')
    } else {
      console.log('  verdict           DRIFT')
      for (const problem of problems) console.log(`    - ${problem}`)
    }
  }

  if (problems.length > 0) {
    if (!json && !quiet) {
      console.log('')
      console.log('Remediation:')
      console.log('  * server.json disagrees with package.json -> fix server.json, commit, then re-publish')
      console.log('  * npm behind -> git tag v<version> && git push origin v<version>')
      console.log('  * registry behind -> gh workflow run publish-mcp.yml (it reads the version from server.json)')
    }
    return 1
  }
  return 0
}

process.exitCode = await main()
