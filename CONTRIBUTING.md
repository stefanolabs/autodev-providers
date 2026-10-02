# Contributing a provider

Thank you for teaching AutoDev a new CLI. This page is the short version; the guide at
https://autodev.stefanolabs.com/docs/write-a-provider walks through each step.

## The folder

Each provider is one folder under `providers/`, named exactly like the provider's `name`:

| Path | What it is |
|---|---|
| `src/index.ts` | The source. Imports only `@stefanolabs/autodev-provider-kit/provider`. |
| `captures/` | Real calls to the CLI, recorded with `autodev providers capture`. The contract replays them. |
| `test/*.test.ts` | Your own tests. Required. |
| `meta.json` | `description`, `author`, `homepage`. |
| `provider.mjs` | The built file, the only file anyone installs. Never edit it by hand. |

## Two kinds of test, both required

1. **The contract**, the same twelve clauses for every provider, replayed from your captures:
   failure is never reported as success, the session id resumes, a limit is read only where the
   CLI reports it, and so on. Because it runs on real captures, it tests what your CLI really
   prints, not what you remember it printing.
2. **Your own tests** in `test/`, covering **at least 80% of the lines in `src/`**. A rule that only
   asked for a test file would be met by `expect(true)`; 80% line coverage can only be reached by
   running your code: the argv it builds, the output it parses, the failure paths.

A missing `test/` folder, a failing test or coverage under 80% fails the pull request.

## Steps

1. Copy `providers/template-codex` to `providers/<your-name>` and rename `name` in `src/index.ts`.
2. Record your CLI: `autodev providers capture <your-name>` (see the guide), into `captures/`.
3. Build: `npx autodev-provider-kit build providers/<your-name>/src/index.ts -o providers/<your-name>/provider.mjs`
4. Check: `npx autodev-provider-kit check providers/<your-name>/provider.mjs --captures providers/<your-name>/captures`
5. Test: `npx vitest run providers/<your-name>/test --coverage.enabled --coverage.provider=v8 --coverage.include="providers/<your-name>/src/**" --coverage.thresholds.lines=80`
6. `npm run index`, then open a pull request with the checklist filled in.

## What gets a provider accepted

- The contract is green on captures from the real CLI, and CI rebuilds `provider.mjs` from your
  `src/` byte for byte. What is reviewed is what people install.
- One real AutoDev thread turn by the provider (a screenshot or the `thread.jsonl` line). Captures
  prove the parsing; a turn proves the thread tools reach the agent.
- A reviewer reads the argv your provider builds, in full.

## The rules a provider file follows, and why

- **No imports, no network, no `process`.** Everything a provider needs is handed to it. A file
  that cannot reach the network cannot leak a prompt or a repository, whoever wrote it.
- **Only its own CLI, only through the runner.** The runner closes stdin, applies the timeout and
  resolves the program on Windows, the same way for every provider.
- **Never replace the person's MCP servers.** Add AutoDev's server alongside theirs. A flag that
  makes the CLI read only AutoDev's configuration silently deletes the person's own tools.
- **`model` and `effort` pass through verbatim.** Never validate them or keep a list of models: a
  list is wrong the morning a new model ships.
- **Capabilities are declared from captures.** `false` means "not verified". Claim a capability
  only when a capture shows the CLI doing it; the contract checks each claim.
