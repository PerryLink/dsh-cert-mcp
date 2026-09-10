# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
