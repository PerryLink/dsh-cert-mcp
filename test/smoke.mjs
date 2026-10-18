// Smoke test for the pure JSON-RPC core. Run: node test/smoke.mjs
// Covers: initialize, tools/list, tools/call (hit and miss), notifications,
// unknown method, and the version single source (package.json -> serverInfo /
// server.json).

import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { handleRequest, SERVER_INFO } from '../src/server.js'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const serverJson = JSON.parse(readFileSync(new URL('../server.json', import.meta.url), 'utf8'))

const init = await handleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' })
assert.equal(init.result.protocolVersion, '2024-11-05')
assert.equal(init.result.serverInfo.name, 'dsh-cert-mcp')
assert.ok(init.result.capabilities.tools)

// Version single source: package.json owns it; the MCP registry manifest and the
// published-server identity are asserted against it here instead of drifting.
assert.equal(SERVER_INFO.version, pkg.version)
assert.equal(init.result.serverInfo.version, pkg.version)
assert.equal(serverJson.version, pkg.version)
assert.equal(serverJson.packages[0].version, pkg.version)
assert.equal(serverJson.packages[0].identifier, pkg.name)

const list = await handleRequest({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
const names = list.result.tools.map((tool) => tool.name)
assert.deepEqual(names, ['get_certification', 'list_certified', 'certification_spec'])

const hit = await handleRequest({
  jsonrpc: '2.0',
  id: 3,
  method: 'tools/call',
  params: { name: 'get_certification', arguments: { owner: 'PerryLink', repo: 'dsh-auto-review' } },
})
assert.equal(hit.result.isError, undefined)
const hitText = hit.result.content[0].text
assert.match(hitText, /"grade": "A"/)
assert.match(hitText, /dsh-auto-review/)

const miss = await handleRequest({
  jsonrpc: '2.0',
  id: 4,
  method: 'tools/call',
  params: { name: 'get_certification', arguments: { owner: 'nobody', repo: 'nothing' } },
})
assert.match(miss.result.content[0].text, /No certification record/)

const all = await handleRequest({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'list_certified', arguments: {} } })
const parsed = JSON.parse(all.result.content[0].text)
assert.ok(parsed.count >= 1)

// Coverage honesty gate. The registry is an opt-in subset, so `count` alone
// reads as ecosystem coverage ("the ecosystem has N certified plugins") which
// the data cannot support — the bundled snapshot holds one entry. Every reply
// must therefore carry the non-representative claim next to the count, on the
// tool-output surface an agent actually reads.
assert.ok(parsed.coverage, 'list_certified must disclose coverage next to the count')
assert.equal(parsed.coverage.certified, parsed.count)
assert.match(parsed.coverage.subset, /subset/)
assert.match(parsed.coverage.scope, /not a census of published DSH plugins/)
assert.match(parsed.coverage.representative, /no statistical meaning/)
assert.equal(parsed.coverage.registry, 'https://raw.githubusercontent.com/PerryLink/dsh-plugin-certification/main/data/certified.json')
// The description is model-facing prose: it has to say the same thing, because
// an agent may pick the tool from the description alone.
const listTool = list.result.tools.find((tool) => tool.name === 'list_certified')
assert.match(listTool.description, /coverage/)
assert.match(listTool.description, /opt-in subset/)

const spec = await handleRequest({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'certification_spec', arguments: {} } })
assert.match(spec.result.content[0].text, /five dimensions/)

const notif = await handleRequest({ jsonrpc: '2.0', method: 'notifications/initialized' })
assert.equal(notif, null)

const unknown = await handleRequest({ jsonrpc: '2.0', id: 7, method: 'bogus/method' })
assert.equal(unknown.error.code, -32601)

console.log('smoke ok: initialize / tools/list / tools/call(hit|miss|list|spec) / notification / unknown-method / version-single-source')
