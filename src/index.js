#!/usr/bin/env node
// Stdio transport for dsh-cert-mcp: newline-delimited JSON-RPC on stdin/stdout.

import readline from 'node:readline'
import { handleRequest } from './server.js'

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity })

for await (const line of rl) {
  if (!line.trim()) continue
  let req
  try {
    req = JSON.parse(line)
  } catch {
    continue // ignore malformed frames
  }
  try {
    const res = await handleRequest(req)
    if (res !== null) process.stdout.write(`${JSON.stringify(res)}\n`)
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ jsonrpc: '2.0', id: req.id ?? null, error: { code: -32603, message: String(error?.message ?? error) } })}\n`)
  }
}
