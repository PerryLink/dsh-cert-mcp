# Changelog

## [0.2.10] - 2026-10-21

### Fixed

- The published README named the wrong host version. It said `dsh-v0.2.1-alpha.1` and listed a six-clause
  `engines.dsh` alternation; the package pins `0.2.1-rc.2` and declares one range, `>=0.2.1-0 <0.3.0`.
  Every language carried the same stale table. Verified rather than re-worded: `tsc -p tsconfig.check.json`
  exits 0 and the 5-test suite passes against the installed 0.2.1-rc.2 host packages.
- `docs/` is in `files`, so `docs/assets/dsh-cert-mcp-flow.svg` - which every README embeds by relative path -
  is actually in the tarball. On 0.2.9 it was a broken image on the npm page.
- Removed "official" from the sentence about the DeepSeek Harness repository: that is a claim about a third
  party, not something this repository can verify.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `release.yml` could never publish to the MCP Registry on a manual dispatch. `publish` carried
  `if: startsWith(github.ref, 'refs/tags/v')`, and a dispatch run's ref is `refs/heads/main`, so `publish`
  was skipped - and `mcp-registry` needs it. The run still reported **success**. Observed 2026-10-20:
  two dispatches, both green, both skipping the only job that publishes.
- The registry publish no longer shares a job with the GitHub Release. On 2026-10-18 npm accepted 0.2.9 at
  08:29:33Z, `Create GitHub Release` failed, and because a failed `needs` skips its dependants,
  `mcp-registry` was skipped: red on the Release step, grey on the registry, and the two surfaces diverged
  for a week.
- `scripts/check-registry-drift.mjs`: the daily cron now passes `--require-published`, so a registry that
  has lost the entry reports drift instead of `in sync`; and an unknown flag is an error rather than being
  silently ignored.

### Added

- `registry-drift.yml` — a daily three-way comparison of package.json, server.json, npm and the registry.
  A post-publish assertion cannot catch this class of failure, because in this class nothing publishes.
- `scripts/check-registry-drift.mjs`, dependency-free, usable from any package directory.

### Changed

- README: the compatibility table now states what `package.json` actually declares. It named
  `0.2.1-alpha.1` and a six-clause `engines.dsh` alternation; the package pins `0.2.1-rc.2` and declares a
  single range, `>=0.2.1-0 <0.3.0`. Both halves of the sentence were re-verified against the installed host
  packages: `typecheck` exits 0 and the 5-test suite passes.
- `docs/` is now in `files`, so the diagram the README embeds is actually in the tarball.

## [0.2.9] - 2026-10-18

### Changed

- Add a 1280×720 hero and a 960×540, 4-second terminal GIF rendered from the test run; `screenshots.json` is an object array and `capture.json` records the command.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
