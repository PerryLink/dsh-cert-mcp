// Smoke test for the pure JSON-RPC core. Run: node test/smoke.mjs
// Covers: initialize, tools/list, tools/call (hit and miss), notifications,
// unknown method.

import { strict as assert } from 'node:assert'
import { handleRequest } from '../src/server.js'

const init = await handleRequest({ jsonrpc: '2.0', id: 1, method: 'initialize' })
assert.equal(init.result.protocolVersion, '2024-11-05')
assert.equal(init.result.serverInfo.name, 'dsh-cert-mcp')
assert.ok(init.result.capabilities.tools)

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
assert.match(hitText, /"grade": "B"/)
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

const spec = await handleRequest({ jsonrpc: '2.0', id: 6, method: 'tools/call', params: { name: 'certification_spec', arguments: {} } })
assert.match(spec.result.content[0].text, /five dimensions/)

const notif = await handleRequest({ jsonrpc: '2.0', method: 'notifications/initialized' })
assert.equal(notif, null)

const unknown = await handleRequest({ jsonrpc: '2.0', id: 7, method: 'bogus/method' })
assert.equal(unknown.error.code, -32601)

console.log('smoke ok: initialize / tools/list / tools/call(hit|miss|list|spec) / notification / unknown-method')
