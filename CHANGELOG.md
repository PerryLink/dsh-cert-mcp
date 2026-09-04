# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.2] - 2026-09-04

### Fixed

- `serverInfo.version` in the MCP `initialize` response was hard-coded to `0.1.0`; it now matches the package version.
- The registry refresh fetch had no timeout, so a black-holed network could stall the first request; it now aborts after 10 s and falls back to the embedded snapshot.

### Changed

- README install section now points at the published npm package (`npx @perrylink/dsh-cert-mcp`).

## [0.1.1] - 2026-09-04

### Added

- First published release on npm (`@perrylink/dsh-cert-mcp`), MCP Registry baseline.
