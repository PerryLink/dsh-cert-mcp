# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2026-09-19

### Changed

- The one-off bootstrap publish workflow is gone: the package now exists on the registry, so every release publishes through **trusted publishing (OIDC)** like the rest of the family.

## [0.2.0] - 2026-09-19

### Changed

- The package moved from the scoped `@perrylink/dsh-cert-mcp` to **`dsh-cert-mcp`**. The prepared 0.1.8 release was never published under the old name, so its changes (the npm trusted-publishing switch and the `check:lockfile` gate) ship here as part of 0.2.0. The scoped name stays on the registry as a deprecated pointer; `server.json` keeps the MCP server identifier `io.github.perrylink/dsh-cert` and repoints its npm `identifier` at the new name.
### Added

- `pnpm run check:lockfile` (`scripts/check-lockfile-drift.mjs`) fails fast when `package.json` and `pnpm-lock.yaml` disagree; the probe is read-only and the documented checks chain runs it alongside the other gates.

### Changed

- The release workflow now publishes through **npm trusted publishing** (OIDC) instead of the long-lived `NPM_TOKEN` secret: `setup-node` no longer sets `registry-url` (its empty `_authToken` line made the registry answer 404 on PUT), npm is upgraded to >= 11.5.1 before publishing, and the "NPM_TOKEN is not set -> skip" guard is gone so a missing publisher cannot turn a release into a silent no-op.
## [0.1.7] - 2026-09-18

### Fixed

- **The DSH tool surface was never registered.** The bundle entry exported a default object (`export default { name, apply }`) while declaring `inject` nowhere, so the Loader's `unwrapExports` (`exports.default ?? exports`) handed the host a plugin without its dependency declaration, and every installation silently contributed zero tools. The entry now exports `name`, `inject` and `apply` as named exports, reads the service through `ctx.tools`, and no longer returns early when the service is absent: a profile without `dsh-tools` parks the row in `PENDING` where it can be seen.
- `serverInfo.version` was hard-coded (`0.1.5`) and `server.json` still said `0.1.4`, so MCP clients were told a version this package never published. `package.json#version` is now the single source: the server derives `SERVER_INFO` from it and `test/smoke.mjs` asserts `serverInfo` plus both `server.json` version fields against it.
- An aborted tool call kept its registry refresh alive until the 10 s deadline. `execute` now forwards `exec.signal` into `handleRequest`, which fuses it with the request timeout; an aborted refresh still answers from the embedded snapshot.

### Added

- `dsh.manifestVersion: 1`, `engines.dsh` (the family's three-clause range) and `engines.node` `^22.19.0 || >=24.0.0`; peer `@deepseek-ai/cordis` `^4.0.2`.
- `test/plugin.spec.mjs` — runtime gate over the REAL Cordis `Context`, `SystemPrompt` and `ToolRuntime`: no default export, the Loader unwrap keeps `inject`, mounting registers `get_certification` / `list_certified` / `certification_spec` with their model-facing schemas, disposing the fiber removes them, a tools-less context stays `PENDING`, and an aborted call still answers from the embedded snapshot.
- `.github/workflows/compat.yml` — monthly + per-PR compatibility probe: bare tarball import of the plugin half, a stdio `initialize`/`tools/list` round-trip that proves the server half answers on its own, a scratch-profile install with the row-mount assertion and a keyless headless smoke, and a reversible uninstall.
- `pnpm-workspace.yaml` (own workspace root, `minimumReleaseAge: 0`) and five-language READMEs.

### Changed

- `pnpm test` runs the JSON-RPC smoke suite and the new runtime suite; the CI and release workflows install the devDependencies first, because the runtime suite mounts the real runtimes.
- **Type-ruler honesty.** This repo has exactly one `tsc` ruler: `pnpm run typecheck` resolves `@deepseek-ai/*` through the repo's own pinned `node_modules` (the published line) because `tsconfig.check.json` declares no `paths`. `typecheck:ci` / `tsconfig.check.ci.json` were added as a second face but differ only by an empty `paths: {}`, so they run the same command over the same type universe; both are kept for compatibility with existing references and are documented as a no-op duplicate rather than a second ruler. The independent second piece of evidence is the runtime mount gate in `test/plugin.spec.mjs` — the REAL `ToolRuntime` with all three tools in `ctx.tools.schemas()` — not a second `tsc` invocation.
- **Embedded registry resynced.** `data/certified.json` (shipped in the tarball, and served whenever the remote fetch is unavailable) is now byte-identical to `dsh-plugin-certification` at that repository's `57519f5`, which rewrote the auto-review entry's peer-range and npx-pin evidence as dated historical snapshots. The certification repository's `check-freshness` gate asserts this parity, so the two copies can no longer drift apart silently.

## [0.1.5] - 2026-09-10

### Fixed

- `certification_spec` relayed grades B and D with wording that does not match spec v1 as the registry publishes it — B was "E environment-blocked only" and D was "critical dimension failures". The tool now relays the registry's own definitions: B is "E passes and at least three of A/B/C/D pass" (an E that ends `install-fail` purely because of an unattended-environment gate also keeps B when A–D pass, and records `environment-blocked`), and D is "any hard gate fails" (`dsh.bundle` missing, no license, malicious pattern hit). The registry README owns these definitions; this tool only relays them.
- The relayed spec text now also states the two rules that were missing: environment gates are never recorded as D, and every score comes from real, reproducible execution — absent evidence is `no-evidence`, never a guess.

### Docs

- Added the security-veto line to the relayed grade scale (obfuscated code, credential exfiltration, or surprising install-time behaviour grades D immediately, with the reason published).


## [0.1.4] - 2026-09-07

### Docs

- Fix the DSH plugin badge URL: shields.io rejects the four-segment static badge form with "404 badge not found"; the label now uses the documented double-dash form (`dsh--plugin`), rendering identically; no behavior change.


## [0.1.3] - 2026-09-07

### Docs

- Refresh the README badge block (standard shields.io set + Glama directory score) and add the `Dockerfile`/`glama.json` used by the Glama directory release checks; no behavior change.


## [0.1.2] - 2026-09-04

### Fixed

- `serverInfo.version` in the MCP `initialize` response was hard-coded to `0.1.0`; it now matches the package version.
- The registry refresh fetch had no timeout, so a black-holed network could stall the first request; it now aborts after 10 s and falls back to the embedded snapshot.

### Changed

- README install section now points at the published npm package (`npx @perrylink/dsh-cert-mcp`).

## [0.1.1] - 2026-09-04

### Added

- First published release on npm (`@perrylink/dsh-cert-mcp`), MCP Registry baseline.
