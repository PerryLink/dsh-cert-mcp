# dsh-cert-mcp

Read-only [MCP](https://modelcontextprotocol.io) server that exposes the [dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) registry: certification grades, snapshot dates and five-dimension evidence for DeepSeek Harness (DSH) plugins. Zero runtime dependencies, stdio transport.

## Tools

| Tool | Input | Returns |
|---|---|---|
| `get_certification` | `owner`, `repo` | Full certification record (grade, snapshot, five dimensions, veto, notes) or "no record" |
| `list_certified` | — | Every entry in the public registry: repo / grade / snapshot |
| `certification_spec` | — | Spec v1 summary: five dimensions, grade scale, veto rule |

The embedded snapshot lives in `data/certified.json` (synced from the certification repo) and the server refreshes it from the public registry at most once per five minutes. No writes, no secrets, no code execution.

## Install

```sh
git clone https://github.com/PerryLink/dsh-cert-mcp
cd dsh-cert-mcp
node src/index.js        # stdio server
```

After the npm release you will be able to run it directly: `npx @perrylink/dsh-cert-mcp`.

### Register in an MCP client

Claude Code:

```sh
claude mcp add dsh-cert -- node <path-to-repo>/src/index.js
```

Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "dsh-cert": {
      "command": "node",
      "args": ["<path-to-repo>/src/index.js"]
    }
  }
}
```

DSH: add it through [dsh-mcp-panel](https://github.com/PerryLink/dsh-mcp-panel) as a stdio server, or any MCP client that supports `stdio`.

## Why this exists

The official DeepSeek Harness repository does not run a plugin registry and does not accept external PRs; discovery happens through the `dsh-plugin` GitHub topic and community lists, none of which certify anything. `dsh-plugin-certification` turns "can I install this plugin" into a reproducible five-dimension check (manifest, build hygiene, supply-chain Scorecard, release provenance, sandboxed install smoke test) with a public registry and README badges. This MCP server is the same data with an agent-facing interface: agents can look up a plugin's certification before recommending or installing it.

## Registry

Data source: [PerryLink/dsh-plugin-certification](https://github.com/PerryLink/dsh-plugin-certification) — `data/certified.json`, spec v1.

## Development

```sh
node test/smoke.mjs
```

## License

Apache-2.0. A listing or grade is an evidence record, not a security guarantee: plugins run inside your DSH process with your permissions.
