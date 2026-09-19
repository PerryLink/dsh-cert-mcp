// test/plugin.spec.mjs — gate suite for the DSH host half of dsh-cert-mcp.
//
// Everything here runs against the REAL Cordis Context, the REAL
// SystemPrompt/ToolRuntime registries and the REAL Loader unwrap path, because
// the defect this suite locks down (a default export swallowing `inject`) is
// invisible to a test that hands `apply()` a hand-written mock context.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Context } from '@deepseek-ai/cordis'
import Loader from '@deepseek-ai/cordis-plugin-loader'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import * as plugin from '../src/plugin.js'

const TOOL_NAMES = ['get_certification', 'list_certified', 'certification_spec']
// `FiberState` is a type-only enum in cordis (`fiber.d.ts`: PENDING = 0), so the
// ordinal is what a runtime test can read.
const FIBER_PENDING = 0

/** Mount the real registries, then this plugin. */
async function mount() {
  const ctx = new Context()
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  const fiber = await ctx.plugin(plugin)
  return { ctx, fiber }
}

test('the entry carries no default export and survives the Loader unwrap', () => {
  assert.equal('default' in plugin, false)
  const loader = Object.create(Loader.prototype)
  const unwrapped = loader.unwrapExports(plugin)
  // A default export would make unwrapExports return `{ name, apply }` and the
  // inject declaration would never reach the loader.
  assert.equal(unwrapped, plugin)
  assert.equal(unwrapped.name, 'dsh-cert-mcp')
  assert.deepEqual(unwrapped.inject, ['tools'])
  assert.equal(typeof unwrapped.apply, 'function')
})

test('mounting on a real ToolRuntime registers the three certification tools', async () => {
  const { ctx } = await mount()
  const schemas = ctx.tools.schemas()
  assert.deepEqual(schemas.map(schema => schema.name).sort(), [...TOOL_NAMES].sort())
  for (const schema of schemas) {
    assert.equal(typeof schema.description, 'string')
    assert.ok(schema.description.length > 0, `${schema.name} needs a model-facing description`)
    assert.equal(typeof schema.parameters, 'object')
  }
  const lookup = schemas.find(schema => schema.name === 'get_certification')
  assert.deepEqual(Object.keys(lookup.parameters.properties ?? {}), ['owner', 'repo'])
  assert.deepEqual(lookup.parameters.required ?? [], ['owner', 'repo'])
})

test('disposing the fiber removes every tool it registered', async () => {
  const { ctx, fiber } = await mount()
  assert.ok(ctx.tools.get('get_certification') !== undefined)
  await fiber.dispose()
  assert.deepEqual(ctx.tools.schemas(), [])
  assert.equal(ctx.tools.get('get_certification'), undefined)
})

test('a context without the tools service parks the plugin in PENDING', () => {
  const ctx = new Context()
  const fiber = ctx.plugin(plugin)
  // Declaring `inject` is what turns a tools-less profile into a visible pending
  // fiber; the old `ctx.get('tools')` early return applied silently instead.
  assert.equal(fiber.state, FIBER_PENDING)
  return fiber.dispose()
})

test('execute forwards the caller abort signal into the registry fetch', async () => {
  const { ctx } = await mount()
  const definition = ctx.tools.get('get_certification')
  assert.ok(definition !== undefined)

  const realFetch = globalThis.fetch
  let seen
  globalThis.fetch = (url, init) => new Promise((resolve, reject) => {
    seen = init?.signal
    if (init?.signal?.aborted) reject(new Error('aborted before dispatch'))
    else init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
  })
  try {
    const controller = new AbortController()
    const pending = definition.execute(
      { owner: 'PerryLink', repo: 'dsh-auto-review' },
      { signal: controller.signal },
    )
    controller.abort()
    const text = await pending
    assert.ok(seen instanceof AbortSignal, 'the fetch must receive an AbortSignal')
    assert.equal(seen.aborted, true, 'the caller abort must reach the fetch')
    // An aborted refresh keeps the embedded snapshot: the lookup still answers.
    assert.match(text, /dsh-auto-review/)
  } finally {
    globalThis.fetch = realFetch
  }
})
