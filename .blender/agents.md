<!-- blender:start — auto-generated, do not hand-edit -->
# Taskcluster — Agent Instructions (Delta)

Project-level guidance lives in [`CLAUDE.md`](../CLAUDE.md). This file adds the
BLEnder-specific context that isn't there, and — importantly — what BLEnder can
and cannot reproduce in its fix environment.

This is `petemoore/taskcluster`, a personal **staging fork** of
`taskcluster/taskcluster` used to shake out BLEnder before the real repo is
onboarded.

## What BLEnder's fix runner can actually do here

The fix workflow (`setup-target` action) sets up **Node and Python only**, runs
`install_command` **with** network, then runs Claude in a **sandbox with no
network, no GitHub token, and no service containers**. Consequences:

- **npm / yarn (JS/TS) updates are reproducible.** Lint (`biome`) and build run
  offline after install. This is where BLEnder is useful on this repo.
- **Postgres is not available.** Most `yarn test` suites need a running Postgres
  (`TEST_DB_URL`) and background services — they cannot run in the sandbox.
- **Go and Rust toolchains are not installed.** `gomod` and `cargo` updates
  cannot be built or tested here. Don't try to install them (no network in the
  sandbox). Fix conservatively from the logs or stop and say so.
- **`uv` is not installed.** `clients/client-py` (uv) updates can't be resolved
  offline either.

## CI logs BLEnder can read (big caveat)

Most PR checks run in **Taskcluster's own CI** (`.taskcluster.yml`,
`reporting: checks-v1`). Like CircleCI, **BLEnder cannot read Taskcluster task
logs** — it only sees pass/fail, not the failure output. BLEnder can read logs
only for the repo's **GitHub Actions** checks:
`codeql`, `staticcheck`, `zizmor`, `browserslist`, `dependabot-automerge`.

Note: on this fork the Taskcluster deployment does not run, so Taskcluster
checks won't appear at all — only the GitHub Actions checks do (enable Actions
on the fork so they run).

## Versions

| Tool     | Version   | Source                          |
|----------|-----------|---------------------------------|
| Node     | `24.17.0` | `.nvmrc`, `package.json engines`|
| Yarn     | `4.14.1`  | `package.json packageManager` (via corepack) |
| Go       | `1.26.4`  | `go.mod`                        |
| Rust     | `1.91.1`  | `rust-toolchain.toml`           |
| Postgres | `15`      | tests / `CLAUDE.md`             |

Yarn 4 is driven by corepack — always `corepack enable` before `yarn`.

## Dependency ecosystems Dependabot touches

From `.github/dependabot.yml`:

| Ecosystem        | Directory              | Lockfile / manifest         |
|------------------|------------------------|-----------------------------|
| npm (yarn)       | `/`                    | root `yarn.lock` (workspaces: `libraries/*`, `services/*`, `db`) |
| npm (yarn)       | `/ui`                  | `ui/yarn.lock`              |
| npm (yarn)       | `/clients/client`      | `clients/client/yarn.lock`  |
| npm (yarn)       | `/clients/client-web`  | `clients/client-web/yarn.lock` |
| cargo            | `/clients/client-rust` | `Cargo.lock`                |
| uv               | `/clients/client-py`   | `uv.lock`                   |
| gomod            | `/`                    | `go.mod` / `go.sum`         |
| github-actions   | `/`                    | `.github/workflows/*.yml`   |

The four npm directories each have their **own** `yarn.lock` and are not part of
the root workspaces — install and build in the directory the PR touches (the
Dependabot PR title names it).

## Commands

Install (root workspaces): the `install_command` above —
`corepack enable && yarn install --immutable`.
For a subdirectory npm PR: `cd <dir> && corepack enable && yarn install --immutable`.

| Purpose        | Command                    | Runnable in sandbox? |
|----------------|----------------------------|----------------------|
| Lint JS/TS     | `yarn lint` (`biome check`)| yes                  |
| Autofix JS/TS  | `yarn lint:fix` (`biome check --write`) | yes     |
| Build          | `yarn build`               | yes                  |
| Lint Go        | `yarn lint:go`             | no (needs Go)        |
| Lint Python    | `yarn lint:py`             | no (needs py tooling)|
| Tests          | `yarn test`                | no (needs Postgres + services) |

## Code generation — do not hand-edit generated output

`yarn generate` regenerates API references, client libraries, and DB schema docs
and **requires Postgres and Go**, so BLEnder cannot run it in the sandbox. If a
dependency bump changes generated output (API/client/db-schema drift), BLEnder
cannot regenerate — leave a note for a human rather than hand-editing generated
files. Output is deterministic; hand edits will be overwritten.

## Don't touch

`.taskcluster.yml`, `.github/workflows/*`, and any generated file. BLEnder's
own guardrails already reject workflow/CI/env changes.
<!-- blender:end -->
